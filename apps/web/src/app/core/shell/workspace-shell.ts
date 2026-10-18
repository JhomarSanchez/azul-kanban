import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
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
}
