import { Injectable } from "@nestjs/common";
import { Database } from "../../infrastructure/database";
import { ProjectAccessService } from "../projects";
import { calculateMetrics } from "./metrics-calculation";
@Injectable()
export class MetricsService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
  ) {}
  async get(projectId: string, userId: string) {
    return this.db.$transaction(
      async (tx) => {
        await this.projects.access(projectId, userId, "read", tx);
        const [tasks, columns, events] = await Promise.all([
          tx.task.findMany({ where: { projectId } }),
          tx.column.findMany({
            where: { projectId },
            orderBy: [{ position: "asc" }, { id: "asc" }],
          }),
          tx.activity.findMany({
            where: { projectId },
            orderBy: { createdAt: "asc" },
          }),
        ]);
        return calculateMetrics(tasks, columns, events);
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
}
