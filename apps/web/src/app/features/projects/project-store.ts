import { Injectable, inject, signal } from "@angular/core";
import { ProjectView } from "@azul/contracts";
import { Api } from "@core/http/api";
@Injectable({ providedIn: "root" })
export class ProjectStore {
  private api = inject(Api);
  readonly projects = signal<ProjectView[]>([]);
  async load() {
    this.projects.set(await this.api.request<ProjectView[]>("/projects"));
  }
  create(name: string, description: string) {
    return this.api.request<ProjectView>("/projects", "POST", {
      name,
      description,
    });
  }
}
