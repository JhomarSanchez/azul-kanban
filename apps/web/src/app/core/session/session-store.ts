import { Injectable, inject, signal } from "@angular/core";
import { UserView } from "@azul/contracts";
import { Api } from "../http/api";
export interface SessionResult {
  user: UserView;
  csrf: string;
  projectId?: string;
}
@Injectable({ providedIn: "root" })
export class SessionStore {
  private api = inject(Api);
  readonly user = signal<UserView | null>(null);
  readonly pending = signal(false);
  async load() {
    const result = await this.api.request<{
      user: UserView | null;
      csrf: string;
    }>("/auth/session");
    this.user.set(result.user);
    this.api.csrf.set(result.csrf);
  }
  accept(result: SessionResult) {
    this.user.set(result.user);
    this.api.csrf.set(result.csrf);
  }
  async authenticate(
    mode: "login" | "register",
    body: { email: string; password: string; name?: string },
  ) {
    this.accept(
      await this.api.request<SessionResult>("/auth/" + mode, "POST", body),
    );
  }
  async demo() {
    const result = await this.api.request<
      SessionResult & { projectId: string }
    >("/demo", "POST", {});
    this.accept(result);
    return result.projectId;
  }
  async logout() {
    await this.api.request("/auth/logout", "POST", {});
    this.user.set(null);
    this.api.csrf.set("");
  }
}
