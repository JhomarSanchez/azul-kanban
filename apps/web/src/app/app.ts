import { Component, effect, HostListener, inject } from "@angular/core";
import { Toast } from "@core/notifications/toast";
import { PanelOutlet } from "@core/shell/panel-outlet";
import { WorkspaceShell } from "@core/shell/workspace-shell";
import { Welcome } from "@features/identity/welcome";
import { Workspace } from "@features/projects";
@Component({
  selector: "azul-app",
  standalone: true,
  imports: [WorkspaceShell, Welcome, PanelOutlet, Toast],
  templateUrl: "./app.html",
})
export class App {
  readonly workspace = inject(Workspace);
  constructor() {
    void this.workspace.boot();
    effect(() => {
      if (!this.workspace.board.board()) this.workspace.ui.close();
    });
  }
  @HostListener("window:focus") onFocus() {
    void this.workspace.board.refresh(false);
  }
  @HostListener("document:keydown.escape") escape() {
    this.workspace.ui.railOpen.set(false);
  }
}
