import { Injectable } from "@nestjs/common";
import { Database } from "./database";
@Injectable()
export class HealthService {
  constructor(private db: Database) {}
  async ready() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: "ready" };
  }
}
