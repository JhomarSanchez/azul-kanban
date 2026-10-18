import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AiStore } from "@features/ai";
import { Icon } from "@shared/icon/icon";
import { dayLabel, duration } from "@shared/presentation";
import { MetricsStore } from "./metrics-store";
@Component({
  selector: "az-metrics",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./metrics.html",
  styleUrl: "./metrics.css",
})
export class Metrics {
  readonly ai = inject(AiStore);
  dayLabel = dayLabel;
  duration = duration;
  readonly store = inject(MetricsStore);
}
