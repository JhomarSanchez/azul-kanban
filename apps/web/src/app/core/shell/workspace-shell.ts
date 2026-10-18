import { CommonModule } from "@angular/common";
import { BreakpointObserver } from "@angular/cdk/layout";
import {
  afterRenderEffect,
  Component,
  effect,
  inject,
  viewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Activity } from "@features/activity/activity";
import { BoardStore } from "@features/kanban";
import { Board } from "@features/kanban/board";
import { Metrics } from "@features/metrics/metrics";
import { ProjectHeader } from "@features/projects/project-header";
import { ShellState } from "./shell-state";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
@Component({
  selector: "az-workspace-shell",
  standalone: true,
  imports: [
    CommonModule,
    Sidebar,
    Topbar,
    ProjectHeader,
    Board,
    Metrics,
    Activity,
  ],
  templateUrl: "./workspace-shell.html",
  styleUrl: "./workspace-shell.css",
})
export class WorkspaceShell {
  readonly boards = inject(BoardStore);
  readonly ui = inject(ShellState);
  private breakpoints = inject(BreakpointObserver);
  private topbar = viewChild(Topbar);
  private sidebar = viewChild(Sidebar);
  readonly viewport = toSignal(this.breakpoints.observe("(max-width: 820px)"), {
    initialValue: {
      matches: this.breakpoints.isMatched("(max-width: 820px)"),
      breakpoints: {},
    },
  });
  constructor() {
    effect(() => {
      if (!this.viewport().matches || this.ui.panel()) this.ui.railOpen.set(false);
    });
    let wasOpen = false;
    let restoreNavigation = false;
    afterRenderEffect(() => {
      const open = this.ui.railOpen();
      if (wasOpen && !open) restoreNavigation = true;
      wasOpen = open;
      if (restoreNavigation && !open && !this.ui.panel()) {
        if (this.viewport().matches) this.topbar()?.focusMenu();
        else this.sidebar()?.focusNavigation();
        restoreNavigation = false;
      }
    });
  }
}
