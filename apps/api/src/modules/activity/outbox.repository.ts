import { Injectable } from "@nestjs/common";
import { Database } from "../../infrastructure/database";
@Injectable()
export class OutboxRepository {
  constructor(private db: Database) {}
  pending() {
    return this.db.activity.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }
  async published(id: string) {
    await this.db.activity.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
  }
}
