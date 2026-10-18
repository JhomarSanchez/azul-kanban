import { Component, computed, HostListener, inject } from "@angular/core";
import { AiStore } from "@features/ai";
import { AiPanel } from "@features/ai/ai-panel";
import { AuthPanel } from "@features/identity/auth-panel";
import { BoardStore, TaskDetailStore } from "@features/kanban";
import { ColumnEditor } from "@features/kanban/column-editor";
import { TaskDetail } from "@features/kanban/task-detail";
import { ProjectEditor } from "@features/projects/project-editor";
import { TeamPanel } from "@features/projects/team-panel";
import { HelpPanel } from "@shared/help/help-panel";
import { SidePanel } from "@shared/side-panel/side-panel";
import { IconName } from "@shared/icon/icon";
import { SessionStore } from "../session/session-store";
import { ShellState } from "./shell-state";
@Component({
  selector: "az-panel-outlet",
  standalone: true,
  imports: [
    SidePanel,
    TaskDetail,
    ColumnEditor,
    AiPanel,
    TeamPanel,
    ProjectEditor,
    AuthPanel,
    HelpPanel,
  ],
  templateUrl: "./panel-outlet.html",
})
export class PanelOutlet {
  readonly ui = inject(ShellState);
  private board = inject(BoardStore);
  private session = inject(SessionStore);
  private tasks = inject(TaskDetailStore);
  private ai = inject(AiStore);
  close() {
    if (this.ui.panel() !== "task" || this.tasks.confirmDiscard()) this.ui.close();
  }
  @HostListener("window:beforeunload", ["$event"])
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.tasks.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
  readonly busy = computed(
    () => this.board.pending() || this.session.pending() || this.ai.aiLoading(),
  );
  readonly title = computed(
    () =>
      ({
        task: this.tasks.selected() ? "Detalle de tarea" : "Nueva tarea",
        ai: "Tu asistente de trabajo",
        invite: "Trabajamos mejor juntos",
        project: "Un nuevo comienzo",
        column: "Configurar columna",
        auth: "Tu espacio en Azul",
        help: "Conoce Azul",
      })[this.ui.panel() ?? "help"],
  );
  readonly icon = computed(
    () =>
      (
        ({ task: "file", ai: "sparkle", invite: "people" }) as Record<
          string,
          IconName
        >
      )[this.ui.panel() ?? ""] ?? "board",
  );
}
