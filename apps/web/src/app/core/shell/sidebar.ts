import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SessionStore } from "@core/session/session-store";
import { ShellState } from "@core/shell/shell-state";
import { AiStore } from "@features/ai";
import { BoardStore } from "@features/kanban";
import { Workspace } from "@features/projects";
import { Icon } from "@shared/icon/icon";
import { initials } from "@shared/presentation";
@Component({
  selector: "az-sidebar",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./sidebar.html",
  styleUrl: "./sidebar.css",
})
export class Sidebar {
  readonly boards = inject(BoardStore);
  readonly ui = inject(ShellState);
  readonly session = inject(SessionStore);
  readonly workspace = inject(Workspace);
  readonly ai = inject(AiStore);
  initials = initials;
}
