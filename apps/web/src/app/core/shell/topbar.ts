import { CommonModule } from "@angular/common";
import { Component, ElementRef, inject, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SessionStore } from "@core/session/session-store";
import { ShellState } from "@core/shell/shell-state";
import { BoardStore } from "@features/kanban";
import { Icon } from "@shared/icon/icon";
import { initials } from "@shared/presentation";
@Component({
  selector: "az-topbar",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./topbar.html",
  styleUrl: "./topbar.css",
})
export class Topbar {
  private menu = viewChild<ElementRef<HTMLButtonElement>>("menu");
  focusMenu() {
    this.menu()?.nativeElement.focus();
  }
  readonly boards = inject(BoardStore);
  readonly ui = inject(ShellState);
  readonly session = inject(SessionStore);
  initials = initials;
}
