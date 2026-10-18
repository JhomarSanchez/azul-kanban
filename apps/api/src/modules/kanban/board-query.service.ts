import { BoardView, TaskView } from "@azul/contracts";
import { Injectable } from "@nestjs/common";
import { Database } from "../../infrastructure/database";
import { ProjectAccessService, projectView } from "../projects";

@Injectable()
export class BoardService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
  ) {}
  async get(projectId: string, userId: string): Promise<BoardView> {
    return this.db.$transaction(
      async (tx) => {
        const member = await this.projects.access(
          projectId,
          userId,
          "read",
          tx,
        );
        const [columns, tasks, members] = await Promise.all([
          tx.column.findMany({
            where: { projectId },
            orderBy: [{ position: "asc" }, { id: "asc" }],
          }),
          tx.task.findMany({
            where: { projectId, archived: false },
            orderBy: [{ position: "asc" }, { id: "asc" }],
          }),
          tx.membership.findMany({
            where: { projectId },
            include: { user: true },
          }),
        ]);
        return {
          project: projectView(member.project, member.role),
          columns,
          tasks: tasks.map((t) => ({
            ...t,
            labels: t.labels as string[],
            checklist: t.checklist as unknown as TaskView["checklist"],
            dueDate: t.dueDate?.toISOString() ?? null,
            createdAt: t.createdAt.toISOString(),
          })),
          members: members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            role: m.role,
          })),
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
}
