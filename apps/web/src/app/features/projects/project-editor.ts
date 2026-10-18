import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Notifications } from "@core/notifications/notifications";
import { SessionStore } from "@core/session/session-store";
import { Workspace } from "@features/projects/workspace";
import { Icon } from "@shared/icon/icon";
@Component({
  selector: "az-project-editor",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./project-editor.html",
  styleUrl: "./project-editor.css",
})
export class ProjectEditor {
  readonly session = inject(SessionStore);
  readonly workspace = inject(Workspace);
  projectName = "";
  projectDescription = "";
  async createProject() {
    if (this.session.pending()) return;
    this.session.pending.set(true);
    try {
      const project = await this.workspace.projects.create(
        this.projectName,
        this.projectDescription,
      );
      await this.workspace.projects.load();
      await this.workspace.openProject(project.id);
    } catch (e) {
      this.notices.error(e);
    } finally {
      this.session.pending.set(false);
    }
  }
  private notices = inject(Notifications);
}
