import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ShellState } from "@core/shell/shell-state";
import { AiStore } from "@features/ai";
import { BoardStore } from "@features/kanban";
import { TeamStore } from "@features/projects/team-store";
import { Icon } from "@shared/icon/icon";
import { initials } from "@shared/presentation";
@Component({
  selector: "az-project-header",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./project-header.html",
  styleUrl: "./project-header.css",
})
export class ProjectHeader {
  readonly boards = inject(BoardStore);
  readonly ui = inject(ShellState);
  readonly ai = inject(AiStore);
  readonly team = inject(TeamStore);
  initials = initials;
}
