import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BoardStore } from "@features/kanban/board-store";
import { ColumnStore } from "@features/kanban/column-store";
import { TaskDetailStore } from "@features/kanban/task-detail-store";
import { Icon } from "@shared/icon/icon";
import { initials, relativeDate } from "@shared/presentation";
@Component({
  selector: "az-task-detail",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./task-detail.html",
  styleUrl: "./task-detail.css",
})
export class TaskDetail {
  readonly boards = inject(BoardStore);
  readonly columns = inject(ColumnStore);
  initials = initials;
  relativeDate = relativeDate;
  readonly detail = inject(TaskDetailStore);
  priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };
}
