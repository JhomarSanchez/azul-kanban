import { Injectable, computed, inject, signal } from "@angular/core";
import { BoardView, TaskView } from "@azul/contracts";
import { Api, ApiError } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { Realtime } from "@core/realtime/realtime";
import { ShellState } from "@core/shell/shell-state";
import { ActivityStore } from "@features/activity";
import { MetricsStore } from "@features/metrics";
import { PendingMove, projectMove } from "./movement";

@Injectable({ providedIn: "root" })
export class BoardStore {
  private api = inject(Api);
  private notices = inject(Notifications);
  private ui = inject(ShellState);
  private metrics = inject(MetricsStore);
  private activity = inject(ActivityStore);
  readonly realtime = inject(Realtime);
  readonly confirmed = signal<BoardView | null>(null);
  readonly pendingMove = signal<PendingMove | null>(null);
  readonly board = computed(() => {
    const board = this.confirmed();
    return board ? projectMove(board, this.pendingMove()) : null;
  });
  readonly loading = signal(false);
  readonly refreshing = signal(false);
  readonly writing = signal(false);
  readonly pending = computed(
    () => this.writing() || this.pendingMove() !== null,
  );
  readonly canEdit = computed(
    () => !!this.board() && this.board()!.project.role !== "VIEWER",
  );
  readonly isOwner = computed(() => this.board()?.project.role === "OWNER");
  readonly counts = computed(() => {
    const b = this.board();
    return {
      total: b?.tasks.length ?? 0,
      done:
        b?.tasks.filter(
          (task) =>
            b.columns.find((column) => column.id === task.columnId)
              ?.category === "DONE",
        ).length ?? 0,
    };
  });
  private epoch = 0;
  private activeId = "";
  private refreshWork?: Promise<void>;
  private queued = false;
  private dragging = false;
  private deferred?: BoardView;

  context() {
    const id = this.activeId,
      epoch = this.epoch;
    return { id, current: () => id === this.activeId && epoch === this.epoch };
  }

  reset() {
    this.epoch++;
    this.activeId = "";
    this.realtime.disconnect();
    this.confirmed.set(null);
    this.pendingMove.set(null);
    this.metrics.metrics.set(null);
    this.activity.activity.set([]);
    this.refreshWork = undefined;
    this.queued = false;
    this.refreshing.set(false);
    this.writing.set(false);
    this.dragging = false;
    this.deferred = undefined;
    this.ui.close();
  }

  async open(id: string) {
    this.reset();
    const epoch = this.epoch;
    this.activeId = id;
    this.loading.set(true);
    try {
      const b = await this.api.request<BoardView>(`/projects/${id}/board`);
      if (epoch !== this.epoch) return;
      this.confirmed.set(b);
      history.replaceState({}, "", `/?project=${id}`);
      this.realtime.connect(id, {
        changed: (version) => {
          if (
            epoch === this.epoch &&
            version > (this.confirmed()?.project.version ?? -1)
          )
            void this.refresh(false);
        },
        connected: () => {
          if (epoch === this.epoch) void this.refresh(false);
        },
        revoked: () => {
          if (epoch === this.epoch) this.revoke();
        },
      });
      await this.refreshExtras(id, epoch);
    } catch (error) {
      if (epoch === this.epoch) this.handle(error);
    } finally {
      if (epoch === this.epoch) this.loading.set(false);
    }
  }

  private revoke() {
    this.reset();
    this.notices.show(
      "Tu acceso al proyecto cambió. Elige otro proyecto o inicia una nueva demo.",
      true,
    );
  }

  private handle(error: unknown) {
    if (
      error instanceof ApiError &&
      (error.code === "DEMO_EXPIRED" ||
        error.code === "PROJECT_ACCESS" ||
        error.status === 401)
    )
      this.revoke();
    else this.notices.error(error);
  }

  private apply(result: BoardView) {
    if (
      result.project.id !== this.activeId ||
      result.project.version < (this.confirmed()?.project.version ?? -1)
    )
      return;
    if (this.dragging) {
      if (
        !this.deferred ||
        result.project.version >= this.deferred.project.version
      )
        this.deferred = result;
      return;
    }
    this.confirmed.set(result);
    const move = this.pendingMove();
    if (
      move &&
      ((move.acknowledgedVersion !== undefined &&
        result.project.version >= move.acknowledgedVersion) ||
        move.uncertain)
    )
      this.pendingMove.set(null);
  }

  startDrag() {
    this.dragging = true;
  }
  endDrag() {
    this.dragging = false;
    if (this.deferred) {
      const result = this.deferred;
      this.deferred = undefined;
      this.apply(result);
    }
  }

  async refresh(show = true) {
    if (!this.activeId || !this.confirmed()) return;
    if (this.refreshWork) {
      if (!show) this.queued = true;
      return this.refreshWork;
    }
    const id = this.activeId,
      epoch = this.epoch;
    this.refreshing.set(true);
    const work = (async () => {
      try {
        do {
          this.queued = false;
          const result = await this.api.request<BoardView>(
            `/projects/${id}/board`,
          );
          if (epoch !== this.epoch) return;
          this.apply(result);
          await this.refreshExtras(id, epoch);
        } while (this.queued && epoch === this.epoch);
        if (show && epoch === this.epoch)
          this.notices.show("Tablero actualizado.");
      } catch (error) {
        if (epoch === this.epoch) this.handle(error);
      } finally {
        if (epoch === this.epoch) {
          this.refreshing.set(false);
          this.refreshWork = undefined;
        }
      }
    })();
    this.refreshWork = work;
    return work;
  }

  private async refreshExtras(id: string, epoch: number) {
    const current = () => epoch === this.epoch && this.activeId === id;
    await Promise.all([
      this.metrics.load(id, current),
      this.activity.load(id, current),
    ]);
  }

  async action(work: () => Promise<void>) {
    if (this.pending()) return false;
    const epoch = this.epoch;
    this.writing.set(true);
    try {
      await work();
      return epoch === this.epoch;
    } catch (error) {
      if (epoch === this.epoch) {
        this.handle(error);
        if (error instanceof ApiError && error.status === 409)
          await this.refresh(false);
      }
      return false;
    } finally {
      if (epoch === this.epoch) this.writing.set(false);
    }
  }

  async move(task: TaskView, columnId: string, position?: number) {
    const b = this.confirmed();
    if (
      !b ||
      this.pending() ||
      !this.canEdit() ||
      (columnId === task.columnId && position === undefined)
    )
      return;
    const epoch = this.epoch;
    const move: PendingMove = {
      projectId: b.project.id,
      taskId: task.id,
      columnId,
      position:
        position ??
        b.tasks.filter(
          (item) => item.columnId === columnId && item.id !== task.id,
        ).length,
      expectedVersion: b.project.version,
    };
    this.pendingMove.set(move);
    try {
      const result = await this.api.request<{ version: number }>(
        `/projects/${b.project.id}/tasks/${task.id}/move`,
        "POST",
        {
          expectedVersion: move.expectedVersion,
          columnId,
          position: move.position,
        },
      );
      if (epoch !== this.epoch) return;
      this.pendingMove.set({ ...move, acknowledgedVersion: result.version });
      // A socket invalidation can reach REST before the command's HTTP response.
      if ((this.confirmed()?.project.version ?? -1) >= result.version)
        this.pendingMove.set(null);
      await this.refresh(false);
      if (epoch === this.epoch && !this.pendingMove())
        this.notices.show("Tarea movida.");
    } catch (error) {
      if (epoch !== this.epoch) return;
      if (error instanceof ApiError && error.status === 0) {
        this.pendingMove.set({ ...move, uncertain: true });
        this.notices.show(
          "El movimiento está pendiente de confirmar. Actualiza el tablero cuando recuperes la conexión.",
          true,
        );
      } else {
        this.pendingMove.set(null);
        this.handle(error);
        await this.refresh(false);
      }
    }
  }

  countFor(columnId: string) {
    return (
      this.board()?.tasks.filter((task) => task.columnId === columnId).length ??
      0
    );
  }
}
