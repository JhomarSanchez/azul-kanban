import { Injectable } from "@nestjs/common";
import { fail } from "./contracts";
@Injectable()
export class RateLimit {
  private entries = new Map<string, { count: number; until: number }>();
  check(key: string, max: number, duration = 3600000) {
    const now = Date.now();
    if (this.entries.size > 10000)
      for (const [k, v] of this.entries)
        if (v.until < now) this.entries.delete(k);
    const entry = this.entries.get(key);
    if (entry && entry.until > now && entry.count >= max)
      fail(
        429,
        "Has alcanzado el límite temporal. Inténtalo más tarde.",
        "RATE_LIMIT",
      );
    this.entries.set(
      key,
      entry && entry.until > now
        ? { ...entry, count: entry.count + 1 }
        : { count: 1, until: now + duration },
    );
  }
}
