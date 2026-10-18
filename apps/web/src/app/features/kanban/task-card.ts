import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BoardView, TaskView } from "@azul/contracts";
import { Icon } from "@shared/icon/icon";
import { dayLabel, initials } from "@shared/presentation";
@Component({
  selector: "az-task-card",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./task-card.html",
  styleUrl: "./task-card.css",
})
export class TaskCard {
  taskInput = input.required<TaskView>();
  members = input.required<BoardView["members"]>();
  done = input(false);
  opened = output<TaskView>();
  initials = initials;
  dayLabel = dayLabel;
  priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };
  labelClass(label: string) {
    return /diseño|ux/i.test(label)
      ? "violet"
      : /back|ingenier/i.test(label)
        ? "blue"
        : /producto/i.test(label)
          ? "amber"
          : "teal";
  }
  checklistDone(task: TaskView) {
    return task.checklist.filter((i) => i.done).length;
  }
  memberName(id: string | null) {
    return this.members().find((m) => m.userId === id)?.name ?? "";
  }
  overdue(task: TaskView) {
    return (
      !!task.dueDate &&
      new Date(task.dueDate).getTime() < Date.now() &&
      !this.done()
    );
  }
}
