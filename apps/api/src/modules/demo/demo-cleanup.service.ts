import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Database } from "../../infrastructure/database";
@Injectable()
export class DemoCleanupService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  constructor(private db: Database) {}
  onModuleInit() {
    this.timer = setInterval(() => void this.cleanup(), 60000);
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async cleanup() {
    try {
      await this.db.project.deleteMany({
        where: { demo: true, expiresAt: { lt: new Date() } },
      });
      await this.db.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      await this.db.user.deleteMany({
        where: {
          guest: true,
          memberships: { none: {} },
          createdAt: { lt: new Date(Date.now() - 86400000) },
        },
      });
    } catch {
      console.error(
        JSON.stringify({ component: "demo-cleanup", error: "CleanupFailed" }),
      );
    }
  }
}
