import { CommonModule } from "@angular/common";
import { A11yModule } from "@angular/cdk/a11y";
import { Component, ElementRef, inject, input, viewChild } from "@angular/core";
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
  imports: [CommonModule, FormsModule, Icon, A11yModule],
  templateUrl: "./sidebar.html",
  styleUrl: "./sidebar.css",
})
export class Sidebar {
  mobile = input(false);
  private boardLink = viewChild<ElementRef<HTMLButtonElement>>("boardLink");
  focusNavigation() {
    this.boardLink()?.nativeElement.focus();
  }
  readonly boards = inject(BoardStore);
  readonly ui = inject(ShellState);
  readonly session = inject(SessionStore);
  readonly workspace = inject(Workspace);
  readonly ai = inject(AiStore);
  initials = initials;
}
