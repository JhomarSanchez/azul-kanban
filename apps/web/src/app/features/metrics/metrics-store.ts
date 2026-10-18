import { Injectable, inject, signal } from "@angular/core";
import { MetricsView } from "@azul/contracts";
import { Api } from "@core/http/api";
@Injectable({ providedIn: "root" })
export class MetricsStore {
  private api = inject(Api);
  private generation = 0;
  readonly metrics = signal<MetricsView | null>(null);
  async load(id: string, current: () => boolean) {
    const generation = ++this.generation;
    const result = await this.api.request<MetricsView>(
      "/projects/" + id + "/metrics",
    );
    if (current() && generation === this.generation) this.metrics.set(result);
  }
  barHeight(count: number) {
    return Math.max(
      0,
      (count /
        Math.max(
          1,
          ...(this.metrics()?.throughput.map((w) => w.count) ?? []),
        )) *
        100,
    );
  }
  columnWidth(hours: number) {
    return (
      (hours /
        Math.max(
          1,
          ...(this.metrics()?.columnTime.map((c) => c.hours) ?? []),
        )) *
      100
    );
  }
}
