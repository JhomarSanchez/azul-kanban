import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Database } from "../../infrastructure/database";
import { ActorRequest, fail } from "../../infrastructure/http";
import { ProjectAccessService, Transaction } from "../projects";
export interface Change {
  result?: unknown;
  taskId?: string;
  title: string;
  payload?: Prisma.InputJsonValue;
}
@Injectable()
export class BoardTransactionService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
  ) {}
  async mutate(
    projectId: string,
    req: Pick<ActorRequest, "actor">,
    version: number,
    type: string,
    change: (tx: Transaction) => Promise<Change>,
    owner = false,
  ) {
    return this.db.$transaction(
      async (tx) => {
        await this.projects.access(
          projectId,
          req.actor.id,
          owner ? "owner" : "write",
          tx,
        );
        const lock = await tx.project.updateMany({
          where: { id: projectId, version },
          data: { version: { increment: 1 } },
        });
        if (!lock.count)
          fail(
            409,
            "Otra persona actualizó el tablero. Recargamos los cambios; revisa y vuelve a intentarlo.",
            "VERSION_CONFLICT",
          );
        // Membership can change while this command waits for the project row lock.
        await this.projects.access(
          projectId,
          req.actor.id,
          owner ? "owner" : "write",
          tx,
        );
        const result = await change(tx);
        await tx.activity.create({
          data: {
            projectId,
            version: version + 1,
            type,
            actor: req.actor.name,
            title: result.title,
            taskId: result.taskId,
            payload: result.payload ?? {},
          },
        });
        return { result: result.result ?? null, version: version + 1 };
      },
      { timeout: 15000 },
    );
  }
  async column(tx: Transaction, projectId: string, id: string) {
    const column = await tx.column.findFirst({ where: { id, projectId } });
    if (!column) fail(404, "La columna ya no está disponible.", "COLUMN");
    return column;
  }
  async task(tx: Transaction, projectId: string, id: string) {
    const task = await tx.task.findFirst({
      where: { id, projectId, archived: false },
      include: { column: true },
    });
    if (!task) fail(404, "La tarea ya no está disponible.", "TASK");
    return task;
  }
  async capacity(
    tx: Transaction,
    column: { id: string; wipLimit: number | null },
    exclude?: string,
    additions = 1,
  ) {
    if (column.wipLimit === null) return;
    const count = await tx.task.count({
      where: {
        columnId: column.id,
        archived: false,
        ...(exclude ? { id: { not: exclude } } : {}),
      },
    });
    if (count + additions > column.wipLimit)
      fail(
        422,
        "Esta columna alcanzó su límite WIP. Termina o mueve una tarea antes de añadir otra.",
        "WIP_LIMIT",
      );
  }
  async assignee(
    tx: Transaction,
    projectId: string,
    userId: string | null | undefined,
  ) {
    if (
      userId &&
      !(await tx.membership.findUnique({
        where: { userId_projectId: { userId, projectId } },
      }))
    )
      fail(400, "La persona asignada no pertenece al proyecto.", "ASSIGNEE");
  }
}
