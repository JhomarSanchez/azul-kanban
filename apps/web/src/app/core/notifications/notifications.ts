import { Injectable, signal } from "@angular/core";
@Injectable({ providedIn: "root" })
export class Notifications {
  readonly notice = signal<{ message: string; error: boolean } | null>(null);
  private timer?: ReturnType<typeof setTimeout>;
  show(message: string, error = false) {
    this.notice.set({ message, error });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.notice.set(null), error ? 10000 : 5000);
  }
  error(error: unknown) {
    this.show(
      error instanceof Error
        ? error.message
        : "Ocurrió un error. Vuelve a intentarlo.",
      true,
    );
  }
  async run(work: () => Promise<void>) {
    try {
      await work();
      return true;
    } catch (error) {
      this.error(error);
      return false;
    }
  }
}
