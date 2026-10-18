import { Injectable, inject, signal } from "@angular/core";
import { Api, ApiError } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { SessionResult, SessionStore } from "@core/session/session-store";
import { ShellState } from "@core/shell/shell-state";
import { BoardStore } from "@features/kanban";
import { ProjectStore } from "./project-store";
@Injectable({ providedIn: "root" })
export class Workspace {
  private api = inject(Api);
  readonly session = inject(SessionStore);
  readonly projects = inject(ProjectStore);
  readonly board = inject(BoardStore);
  readonly ui = inject(ShellState);
  private notices = inject(Notifications);
  readonly loading = signal(true);
  readonly joinToken = signal("");
  readonly invitation = signal<{
    name: string;
    role: string;
    demo: boolean;
  } | null>(null);
  async boot() {
    try {
      await this.session.load();
      const match = location.pathname.match(/^\/join\/([^/]+)$/);
      if (match) {
        // An unusable link must not keep the person away from their own projects.
        try {
          this.invitation.set(
            await this.api.request("/invitations/" + match[1]),
          );
          this.joinToken.set(match[1]);
        } catch (e) {
          this.notices.error(e);
          history.replaceState({}, "", "/");
        }
      }
      if (this.session.user()) {
        await this.projects.load();
        const target = new URLSearchParams(location.search).get("project");
        const id =
          this.projects.projects().find((p) => p.id === target)?.id ??
          this.projects.projects()[0]?.id;
        if (id) await this.openProject(id);
      }
    } catch (e) {
      this.notices.error(e);
    } finally {
      this.loading.set(false);
    }
  }
  async openProject(id: string) {
    this.ui.close();
    this.ui.view.set("board");
    await this.board.open(id);
  }
  async startDemo() {
    if (this.session.pending()) return;
    this.session.pending.set(true);
    await this.notices.run(async () => {
      const id = await this.session.demo();
      this.joinToken.set("");
      this.invitation.set(null);
      await this.projects.load();
      await this.openProject(id);
      this.notices.show(
        "Tu espacio de ejemplo está listo. Los cambios son tuyos durante 24 horas.",
      );
    });
    this.session.pending.set(false);
  }
  async authenticated() {
    await this.projects.load();
    this.ui.close();
    if (this.joinToken()) await this.joinInvitation();
    else if (this.projects.projects().length)
      await this.openProject(this.projects.projects()[0].id);
    else this.ui.panel.set("project");
  }
  async joinInvitation() {
    if (this.session.pending()) return;
    this.session.pending.set(true);
    try {
      const result = await this.api.request<
        SessionResult & { projectId: string }
      >("/invitations/" + this.joinToken() + "/join", "POST", {
        name: "Invitado del equipo",
      });
      this.session.accept(result);
      this.joinToken.set("");
      this.invitation.set(null);
      await this.projects.load();
      await this.openProject(result.projectId);
      this.notices.show("Ya formas parte del proyecto.");
    } catch (e) {
      if (e instanceof ApiError && e.code === "ACCOUNT_REQUIRED")
        this.ui.panel.set("auth");
      else this.notices.error(e);
    } finally {
      this.session.pending.set(false);
    }
  }
  async logout() {
    await this.notices.run(async () => {
      await this.session.logout();
      this.board.reset();
      this.projects.projects.set([]);
      this.ui.close();
      history.replaceState({}, "", "/");
    });
  }
}
