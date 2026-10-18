import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AiStore } from "@features/ai/ai-store";
import { BoardStore, TaskDetailStore } from "@features/kanban";
import { Icon } from "@shared/icon/icon";
@Component({
  selector: "az-ai-panel",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./ai-panel.html",
  styleUrl: "./ai-panel.css",
})
export class AiPanel {
  readonly boards = inject(BoardStore);
  readonly ai = inject(AiStore);
  readonly tasks = inject(TaskDetailStore);
  priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };
}
