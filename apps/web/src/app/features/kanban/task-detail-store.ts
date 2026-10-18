import { Injectable, effect, inject, signal, untracked } from "@angular/core";
import { TaskView } from "@azul/contracts";
import { Api, ApiError } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { ShellState } from "@core/shell/shell-state";
import { dateInputValue, dueDateFromInput } from "@shared/presentation";
import { BoardStore } from "./board-store";
import { DraftBase, draftVersion, sameTaskFields } from "./draft-version";
type Draft = {
  title: string;
  description: string;
  priority: TaskView["priority"];
  labels: string;
  columnId: string;
  assigneeId: string;
  dueDate: string;
  checklist: TaskView["checklist"];
};
interface CommentView {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}
@Injectable({ providedIn: "root" })
export class TaskDetailStore {
  private api = inject(Api);
  readonly boardStore = inject(BoardStore);
  private notices = inject(Notifications);
  private ui = inject(ShellState);
  selected = signal<TaskView | null>(null);
  comments = signal<CommentView[]>([]);
  commentText = "";
  checklistText = "";
  private base?: DraftBase<TaskView>;
  private cleanForm = "";
  private commentsRequest = 0;
  taskForm: Draft = {
    title: "",
    description: "",
    priority: "MEDIUM",
    labels: "",
    columnId: "",
    assigneeId: "",
    dueDate: "",
    checklist: [],
  };
  constructor() {
    effect(() => {
      const b = this.boardStore.board();
      const id = this.selected()?.id;
      if (!b) {
        this.selected.set(null);
        this.comments.set([]);
        this.commentText = "";
        this.checklistText = "";
        this.cleanForm = "";
      } else if (id) {
        const task = b.tasks.find((t) => t.id === id);
        if (task) this.selected.set(task);
        else if (this.ui.panel() === "task") {
          this.selected.set(null);
          this.ui.panel.set(null);
        }
      }
    });
    effect(() => {
      const board = this.boardStore.confirmed();
      const id = this.selected()?.id;
      const open = this.ui.panel() === "task";
      if (board && id && open && board.tasks.some((task) => task.id === id))
        untracked(() => void this.loadComments(id));
      else this.commentsRequest++;
    });
  }
  hasUnsavedChanges() {
    return (
      this.ui.panel() === "task" &&
      ((!!this.cleanForm && JSON.stringify(this.taskForm) !== this.cleanForm) ||
        !!this.commentText.trim() ||
        !!this.checklistText.trim())
    );
  }
  confirmDiscard() {
    return (
      !this.hasUnsavedChanges() ||
      window.confirm(
        "Tienes cambios sin guardar. ¿Quieres descartarlos? El comentario y el criterio que estés escribiendo también se perderán.",
      )
    );
  }
  openTask(task: TaskView) {
    if (!this.confirmDiscard()) return;
    this.selected.set(task);
    this.rebase(task);
    this.taskForm = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      labels: task.labels.join(", "),
      columnId: task.columnId,
      assigneeId: task.assigneeId ?? "",
      dueDate: dateInputValue(task.dueDate),
      checklist: task.checklist.map((c) => ({ ...c })),
    };
    this.comments.set([]);
    this.commentText = "";
    this.checklistText = "";
    this.cleanForm = JSON.stringify(this.taskForm);
    this.ui.panel.set("task");
  }
  async loadComments(id: string) {
    const context = this.boardStore.context();
    const request = ++this.commentsRequest;
    const current = () =>
      context.current() &&
      this.selected()?.id === id &&
      this.ui.panel() === "task" &&
      request === this.commentsRequest;
    try {
      const comments = await this.api.request<CommentView[]>(
        `/projects/${context.id}/tasks/${id}/comments`,
      );
      if (current()) this.comments.set(comments);
    } catch (error) {
      if (current()) this.notices.error(error);
    }
  }
  newTask(columnId?: string) {
    if (!this.confirmDiscard()) return;
    this.selected.set(null);
    this.base = undefined;
    this.taskForm = {
      title: "",
      description: "",
      priority: "MEDIUM",
      labels: "",
      columnId:
        columnId ??
        this.boardStore.board()?.columns[1]?.id ??
        this.boardStore.board()!.columns[0].id,
      assigneeId: "",
      dueDate: "",
      checklist: [],
    };
    this.comments.set([]);
    this.commentText = "";
    this.checklistText = "";
    this.cleanForm = JSON.stringify(this.taskForm);
    this.ui.panel.set("task");
  }
  addChecklist() {
    const text = this.checklistText.trim();
    if (!text) return;
    this.taskForm.checklist = [
      ...this.taskForm.checklist,
      { id: crypto.randomUUID(), text, done: false },
    ];
    this.checklistText = "";
  }
  async saveTask() {
    let conflict = false;
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      const b = this.boardStore.board()!;
      const f = this.taskForm;
      const selected = this.selected();
      const savedForm = JSON.stringify(f);
      let created: TaskView | undefined;
      const body = {
        title: f.title,
        description: f.description,
        priority: f.priority,
        labels: f.labels
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        checklist: f.checklist,
        assigneeId: f.assigneeId || null,
        dueDate: dueDateFromInput(f.dueDate, selected?.dueDate ?? null),
        expectedVersion: selected
          ? this.expectedVersion(selected.id)
          : b.project.version,
      };
      try {
        if (selected)
          await this.api.request(
            `/projects/${b.project.id}/tasks/${selected.id}`,
            "PATCH",
            body,
          );
        else {
          const response = await this.api.request<{ result: TaskView }>(
            `/projects/${b.project.id}/tasks`,
            "POST",
            { ...body, columnId: f.columnId },
          );
          created = response.result;
        }
      } catch (error) {
        conflict = error instanceof ApiError && error.status === 409;
        throw error;
      }
      if (!context.current()) return;
      this.cleanForm = savedForm;
      if (!this.hasUnsavedChanges()) this.ui.panel.set(null);
      await this.boardStore.refresh(false);
      if (!context.current()) return;
      if (created) this.selected.set(created);
      const current = this.selected();
      if (current) this.rebase(current);
      this.notices.show(
        selected ? "Cambios guardados." : "Tarea creada. Un paso más cerca.",
      );
    });
    // The draft is kept; after reviewing the reloaded task, saving again is a deliberate overwrite.
    const selected = this.selected();
    if (conflict && selected) this.rebase(selected);
  }
  /** Version for saving the open draft; see draftVersion. */
  expectedVersion(taskId: string) {
    const confirmed = this.boardStore.confirmed()!;
    const current = confirmed.tasks.find((task) => task.id === taskId);
    return this.base
      ? draftVersion(
          this.base,
          confirmed.project.version,
          current,
          sameTaskFields,
        )
      : confirmed.project.version;
  }
  private rebase(task: TaskView) {
    const confirmed = this.boardStore.confirmed();
    const current = confirmed?.tasks.find((item) => item.id === task.id);
    this.base = confirmed
      ? { version: confirmed.project.version, value: current ?? task }
      : undefined;
  }
  async archiveTask() {
    if (!this.confirmDiscard()) return;
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      await this.api.request(
        `/projects/${this.boardStore.board()!.project.id}/tasks/${this.selected()!.id}`,
        "PATCH",
        {
          expectedVersion: this.boardStore.board()!.project.version,
          archived: true,
        },
      );
      if (!context.current()) return;
      this.ui.panel.set(null);
      await this.boardStore.refresh(false);
      this.notices.show("Tarea archivada. Su historial se conserva.");
    });
  }
  async addComment() {
    if (!this.commentText.trim()) return;
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      const taskId = this.selected()!.id;
      const text = this.commentText;
      await this.api.request(
        `/projects/${this.boardStore.board()!.project.id}/tasks/${this.selected()!.id}/comments`,
        "POST",
        {
          text,
          expectedVersion: this.boardStore.board()!.project.version,
        },
      );
      if (!context.current() || this.selected()?.id !== taskId) return;
      if (this.commentText === text) this.commentText = "";
      await this.boardStore.refresh(false);
    });
  }
}
