import { Injectable } from "@nestjs/common";
import { Database } from "../../infrastructure/database";
import { settings } from "../../infrastructure/settings";
import { ProjectsService } from "../projects";
import { sampleTasks } from "./demo-fixtures";
@Injectable()
export class DemoService {
  constructor(
    private db: Database,
    private projects: ProjectsService,
  ) {}
  async create() {
    const user = await this.db.user.create({
      data: { name: "Invitado", guest: true },
    });
    const expiresAt = new Date(Date.now() + settings.demoHours * 3600000);
    const project = await this.projects.create(
      user.id,
      {
        name: "Lanzamiento de producto",
        description:
          "Un lugar para las ideas. Un equipo para hacerlas realidad.",
      },
      true,
      expiresAt,
    );
    const colleagues = await Promise.all(
      ["Lucía Ramírez", "Mateo Torres", "Sofía Castro"].map((name) =>
        this.db.user.create({ data: { name, guest: true } }),
      ),
    );
    await this.db.membership.createMany({
      data: colleagues.map((person) => ({
        projectId: project.id,
        userId: person.id,
        role: "MEMBER" as const,
      })),
    });
    const counts = [0, 0, 0, 0, 0];
    const now = Date.now();
    await this.db.$transaction(async (tx) => {
      for (const [index, entry] of sampleTasks.entries()) {
        const [columnIndex, title, description, priority, labels, person] =
          entry;
        const column = project.columns[columnIndex];
        const createdAt = new Date(now - (12 + (index % 4)) * 86400000);
        const startedAt =
          columnIndex >= 2
            ? new Date(
                now -
                  (columnIndex === 4 ? 8 - (index % 3) : 2 + (index % 3)) *
                    86400000,
              )
            : null;
        const doneAt =
          columnIndex === 4
            ? new Date(now - (1 + (index % 4)) * 86400000)
            : null;
        const task = await tx.task.create({
          data: {
            projectId: project.id,
            columnId: column.id,
            title,
            description,
            priority,
            labels: [...labels],
            position: counts[columnIndex]++,
            assigneeId: person === null ? null : colleagues[person].id,
            createdAt,
            firstStartedAt: startedAt,
            firstCompletedAt: doneAt,
            checklist: [
              {
                id: "1",
                text: "El comportamiento está documentado",
                done: columnIndex === 4,
              },
              {
                id: "2",
                text: "El recorrido funciona con teclado",
                done: columnIndex >= 3,
              },
              {
                id: "3",
                text: "La implementación está revisada",
                done: columnIndex === 4,
              },
            ],
            dueDate: new Date(now + ((index % 5) - 1) * 86400000),
          },
        });
        const origin = project.columns[0];
        await tx.activity.create({
          data: {
            projectId: project.id,
            version: 0,
            taskId: task.id,
            type: "task.created",
            actor: "Equipo de ejemplo",
            title,
            createdAt,
            payload: {
              to: origin.id,
              toName: origin.name,
              toCategory: origin.category,
            },
          },
        });
        if (startedAt)
          await tx.activity.create({
            data: {
              projectId: project.id,
              version: 0,
              taskId: task.id,
              type: "task.moved",
              actor: colleagues[person ?? 0].name,
              title,
              createdAt: startedAt,
              payload: {
                from: origin.id,
                fromName: origin.name,
                fromCategory: "TODO",
                to: project.columns[columnIndex === 4 ? 2 : columnIndex].id,
                toName:
                  project.columns[columnIndex === 4 ? 2 : columnIndex].name,
                toCategory: "ACTIVE",
              },
            },
          });
        if (!startedAt && columnIndex === 1)
          await tx.activity.create({
            data: {
              projectId: project.id,
              version: 0,
              taskId: task.id,
              type: "task.moved",
              actor: "Equipo de ejemplo",
              title,
              createdAt: new Date(now - 5 * 86400000),
              payload: {
                from: origin.id,
                fromCategory: "TODO",
                to: column.id,
                toName: column.name,
                toCategory: "TODO",
              },
            },
          });
        if (doneAt)
          await tx.activity.create({
            data: {
              projectId: project.id,
              version: 0,
              taskId: task.id,
              type: "task.moved",
              actor: colleagues[person ?? 0].name,
              title,
              createdAt: doneAt,
              payload: {
                from: project.columns[2].id,
                fromCategory: "ACTIVE",
                to: column.id,
                toName: column.name,
                toCategory: "DONE",
              },
            },
          });
      }
    });
    return { user, projectId: project.id };
  }
}
