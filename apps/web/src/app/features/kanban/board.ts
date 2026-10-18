import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TaskView } from "@azul/contracts";
import { SessionStore } from "@core/session/session-store";
import { ShellState } from "@core/shell/shell-state";
import { BoardStore } from "@features/kanban/board-store";
import { ColumnStore } from "@features/kanban/column-store";
import { TaskDetailStore } from "@features/kanban/task-detail-store";
import { Icon } from "@shared/icon/icon";
import { BoardColumn } from "./board-column";
@Component({
  selector: "az-board",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon, DragDropModule, BoardColumn],
  templateUrl: "./board.html",
  styleUrl: "./board.css",
})
export class Board {
  readonly boards = inject(BoardStore);
  readonly ui = inject(ShellState);
  readonly session = inject(SessionStore);
  readonly tasks = inject(TaskDetailStore);
  readonly columns = inject(ColumnStore);
  search = signal("");
  priority = signal("");
  mine = signal(false);
  showFilters = signal(false);
  priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };
  filtered = computed(
    () => !!this.search() || !!this.priority() || this.mine(),
  );
  dragDisabled = computed(
    () => !this.boards.canEdit() || this.boards.pending() || this.filtered(),
  );
  visibleTasks = computed(() => {
    const needle = this.search().toLocaleLowerCase("es");
    const map = new Map<string, TaskView[]>();
    for (const task of this.boards.board()?.tasks ?? []) {
      if (
        (needle &&
          !`${task.title} ${task.description} ${task.labels.join(" ")}`
            .toLocaleLowerCase("es")
            .includes(needle)) ||
        (this.priority() && task.priority !== this.priority()) ||
        (this.mine() && task.assigneeId !== this.session.user()?.id)
      )
        continue;
      const list = map.get(task.columnId) ?? [];
      list.push(task);
      map.set(task.columnId, list);
    }
    for (const list of map.values())
      list.sort((a, b) => a.position - b.position);
    return map;
  });
  tasksFor(id: string) {
    return this.visibleTasks().get(id) ?? this.emptyTasks;
  }
  private emptyTasks: TaskView[] = [];
  drop(event: CdkDragDrop<TaskView[]>, columnId: string) {
    if (
      event.previousContainer === event.container &&
      event.previousIndex === event.currentIndex
    )
      return;
    void this.boards.move(event.item.data, columnId, event.currentIndex);
  }
}
