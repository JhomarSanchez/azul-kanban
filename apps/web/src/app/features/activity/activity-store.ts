import { Injectable, inject, signal } from "@angular/core";
import { ActivityView } from "@azul/contracts";
import { Api } from "@core/http/api";
@Injectable({ providedIn: "root" })
export class ActivityStore {
  private api = inject(Api);
  private generation = 0;
  readonly activity = signal<ActivityView[]>([]);
  async load(id: string, current: () => boolean) {
    const generation = ++this.generation;
    const result = await this.api.request<ActivityView[]>(
      "/projects/" + id + "/activity",
    );
    if (current() && generation === this.generation) this.activity.set(result);
  }
}
