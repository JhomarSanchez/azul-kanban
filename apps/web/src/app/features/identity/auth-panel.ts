import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Notifications } from "@core/notifications/notifications";
import { SessionStore } from "@core/session/session-store";
import { Workspace } from "@features/projects";

@Component({
  selector: "az-auth-panel",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./auth-panel.html",
  styleUrl: "./auth-panel.css",
})
export class AuthPanel {
  readonly session = inject(SessionStore);
  readonly workspace = inject(Workspace);
  authMode: "login" | "register" = "register";
  authName = "";
  authEmail = "";
  authPassword = "";
  private notices = inject(Notifications);
  async authenticate() {
    if (this.session.pending()) return;
    this.session.pending.set(true);
    const ok = await this.notices.run(() =>
      this.session.authenticate(this.authMode, {
        email: this.authEmail,
        password: this.authPassword,
        ...(this.authMode === "register" ? { name: this.authName } : {}),
      }),
    );
    this.authPassword = "";
    this.session.pending.set(false);
    if (ok) await this.workspace.authenticated();
  }
}
