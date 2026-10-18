import { Injectable } from "@nestjs/common";
import { Database } from "../../infrastructure/database";
import { ActorRequest } from "../../infrastructure/http";
import { ProjectAccessService } from "../projects";

@Injectable()
export class ActivityService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
  ) {}
  async activity(id: string, req: ActorRequest) {
    await this.projects.access(id, req.actor.id);
    return this.db.activity.findMany({
      where: { projectId: id },
      select: {
        id: true,
        type: true,
        taskId: true,
        actor: true,
        title: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
