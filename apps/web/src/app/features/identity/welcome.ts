import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SessionStore } from "@core/session/session-store";
import { ShellState } from "@core/shell/shell-state";
import { BoardStore } from "@features/kanban";
import { Workspace } from "@features/projects";
import { Icon } from "@shared/icon/icon";
@Component({
  selector: "az-welcome",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./welcome.html",
  styleUrl: "./welcome.css",
})
export class Welcome {
  readonly boards = inject(BoardStore);
  readonly ui = inject(ShellState);
  readonly session = inject(SessionStore);
  readonly workspace = inject(Workspace);
}
