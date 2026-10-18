import { Injectable, inject, signal } from "@angular/core";
import { Api } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { BoardStore } from "@features/kanban";
@Injectable({ providedIn: "root" })
export class TeamStore {
  private api = inject(Api);
  readonly boardStore = inject(BoardStore);
  private notices = inject(Notifications);
  inviteRole = "MEMBER";
  inviteUrl = signal("");
  async createInvite() {
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      const result = await this.api.request<{ url: string }>(
        `/projects/${this.boardStore.board()!.project.id}/invitations`,
        "POST",
        { role: this.inviteRole },
      );
      if (!context.current()) return;
      this.inviteUrl.set(`${location.origin}${result.url}`);
    });
  }
  async copyInvite() {
    try {
      await navigator.clipboard.writeText(this.inviteUrl());
      this.notices.show("Enlace copiado.");
    } catch {
      this.notices.show("Selecciona el enlace y cópialo manualmente.");
    }
  }
  async revokeInvites() {
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      await this.api.request(
        `/projects/${this.boardStore.board()!.project.id}/invitations`,
        "DELETE",
        {},
      );
      if (!context.current()) return;
      this.inviteUrl.set("");
      this.notices.show(
        "Los enlaces anteriores ya no permiten unirse al proyecto.",
      );
    });
  }
  async changeMember(userId: string, role: string) {
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      await this.api.request(
        `/projects/${this.boardStore.board()!.project.id}/members/${userId}`,
        "PATCH",
        { role },
      );
      if (!context.current()) return;
      await this.boardStore.refresh(false);
      this.notices.show("Rol actualizado.");
    });
  }
  async removeMember(userId: string) {
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      await this.api.request(
        `/projects/${this.boardStore.board()!.project.id}/members/${userId}`,
        "DELETE",
        {},
      );
      if (!context.current()) return;
      await this.boardStore.refresh(false);
      this.notices.show("Acceso retirado.");
    });
  }
}
