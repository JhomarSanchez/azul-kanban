import { Injectable, inject } from "@angular/core";
import { ColumnView } from "@azul/contracts";
import { Api, ApiError } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { ShellState } from "@core/shell/shell-state";
import { BoardStore } from "./board-store";
import { DraftBase, draftVersion, sameColumnFields } from "./draft-version";
@Injectable({ providedIn: "root" })
export class ColumnStore {
  private api = inject(Api);
  readonly boardStore = inject(BoardStore);
  private notices = inject(Notifications);
  private ui = inject(ShellState);
  columnName = "";
  columnCategory: "TODO" | "ACTIVE" | "DONE" = "TODO";
  columnLimit: number | null = null;
  editingColumnId = "";
  private base?: DraftBase<ColumnView>;
  editColumn(id = "") {
    const column = this.boardStore.board()?.columns.find((c) => c.id === id);
    this.editingColumnId = id;
    this.rebase(id);
    this.columnName = column?.name ?? "";
    this.columnCategory = column?.category ?? "TODO";
    this.columnLimit = column?.wipLimit ?? null;
    this.ui.panel.set("column");
  }
  async saveColumn() {
    let conflict = false;
    const editing = this.editingColumnId;
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      try {
        await this.api.request(
          `/projects/${this.boardStore.board()!.project.id}/columns${editing ? "/" + editing : ""}`,
          editing ? "PATCH" : "POST",
          {
            expectedVersion: this.expectedVersion(editing),
            name: this.columnName,
            category: this.columnCategory,
            wipLimit: this.columnLimit || null,
          },
        );
      } catch (error) {
        conflict = error instanceof ApiError && error.status === 409;
        throw error;
      }
      if (!context.current()) return;
      this.ui.panel.set(null);
      if (!context.current()) return;
      await this.boardStore.refresh(false);
      this.notices.show("Columna guardada.");
    });
    if (conflict && editing === this.editingColumnId) this.rebase(editing);
  }
  /** Version for saving the open column draft; see draftVersion. */
  expectedVersion(columnId: string) {
    const confirmed = this.boardStore.confirmed()!;
    const current = confirmed.columns.find((column) => column.id === columnId);
    return columnId && this.base
      ? draftVersion(
          this.base,
          confirmed.project.version,
          current,
          sameColumnFields,
        )
      : confirmed.project.version;
  }
  private rebase(columnId: string) {
    const confirmed = this.boardStore.confirmed();
    const current = confirmed?.columns.find((column) => column.id === columnId);
    this.base =
      confirmed && current
        ? { version: confirmed.project.version, value: current }
        : undefined;
  }
  async deleteColumn() {
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      await this.api.request(
        `/projects/${this.boardStore.board()!.project.id}/columns/${this.editingColumnId}`,
        "DELETE",
        { expectedVersion: this.boardStore.board()!.project.version },
      );
      if (!context.current()) return;
      this.ui.panel.set(null);
      if (!context.current()) return;
      await this.boardStore.refresh(false);
    });
  }
}
