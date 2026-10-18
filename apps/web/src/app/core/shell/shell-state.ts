import { Injectable, signal } from "@angular/core";
export type Panel =
  | "task"
  | "ai"
  | "invite"
  | "project"
  | "auth"
  | "help"
  | "column"
  | null;
@Injectable({ providedIn: "root" })
export class ShellState {
  readonly panel = signal<Panel>(null);
  readonly view = signal<"board" | "metrics" | "activity">("board");
  readonly railOpen = signal(false);
  close() {
    this.panel.set(null);
    this.railOpen.set(false);
  }
}
