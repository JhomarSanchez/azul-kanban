import { ProjectInput } from "@azul/contracts";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import { projectView } from "./project-view";
export const defaults = [
  ["Backlog", "TODO", null],
  ["Por hacer", "TODO", null],
  ["En curso", "ACTIVE", 4],
  ["En revisión", "ACTIVE", 3],
  ["Terminado", "DONE", null],
] as const;
@Injectable()
export class ProjectsService {
  constructor(private db: Database) {}
  async list(userId: string) {
    const entries = await this.db.membership.findMany({
      where: {
        userId,
        project: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
      include: { project: true },
      orderBy: { project: { createdAt: "asc" } },
    });
    return entries.map((m) => projectView(m.project, m.role));
  }
  async create(
    userId: string,
    input: z.infer<typeof ProjectInput>,
    demo = false,
    expiresAt: Date | null = null,
  ) {
    return this.db.project.create({
      data: {
        ...input,
        demo,
        expiresAt,
        members: { create: { userId, role: "OWNER" } },
        columns: {
          create: defaults.map(([name, category, wipLimit], position) => ({
            name,
            category,
            wipLimit,
            position,
          })),
        },
      },
      include: { columns: { orderBy: { position: "asc" } } },
    });
  }
  async createForActor(userId: string, input: z.infer<typeof ProjectInput>) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || user.guest)
      throw new ForbiddenException(
        "Crea una cuenta para guardar proyectos permanentes.",
      );
    return projectView(await this.create(userId, input), "OWNER");
  }
}
