import { CreateTask, MoveTask, UpdateTask } from "@azul/contracts";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import { ActorRequest, fail } from "../../infrastructure/http";
import { BoardTransactionService } from "./board-transaction.service";
@Injectable()
export class TaskCommandsService {
  constructor(
    private db: Database,
    private mutations: BoardTransactionService,
  ) {}
  async create(
    projectId: string,
    req: ActorRequest,
    input: z.infer<typeof CreateTask>,
  ) {
    return this.mutations.mutate(
      projectId,
      req,
      input.expectedVersion,
      "task.created",
      async (tx) => {
        const column = await this.mutations.column(
          tx,
          projectId,
          input.columnId,
        );
        await this.mutations.capacity(tx, column);
        await this.mutations.assignee(tx, projectId, input.assigneeId);
        const { expectedVersion: _version, ...fields } = input;
        const position =
          ((
            await tx.task.aggregate({
              where: { columnId: column.id, archived: false },
              _max: { position: true },
            })
          )._max.position ?? -1) + 1;
        const task = await tx.task.create({
          data: {
            ...fields,
            projectId,
            position,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            firstStartedAt: column.category === "ACTIVE" ? new Date() : null,
            firstCompletedAt: column.category === "DONE" ? new Date() : null,
          },
        });
        return {
          result: task,
          taskId: task.id,
          title: task.title,
          payload: {
            to: column.id,
            toName: column.name,
            toCategory: column.category,
          },
        };
      },
    );
  }
  async move(
    projectId: string,
    taskId: string,
    req: ActorRequest,
    input: z.infer<typeof MoveTask>,
  ) {
    return this.mutations.mutate(
      projectId,
      req,
      input.expectedVersion,
      "task.moved",
      async (tx) => {
        const task = await this.mutations.task(tx, projectId, taskId);
        const column = await this.mutations.column(
          tx,
          projectId,
          input.columnId,
        );
        await this.mutations.capacity(tx, column, task.id);
        const siblings = await tx.task.findMany({
          where: { columnId: column.id, archived: false, id: { not: task.id } },
          orderBy: [{ position: "asc" }, { id: "asc" }],
        });
        if (input.position > siblings.length)
          fail(400, "La posición de destino no es válida.", "POSITION");
        const ordered = siblings.map((t) => t.id);
        ordered.splice(input.position, 0, task.id);
        await tx.task.update({
          where: { id: task.id },
          data: {
            columnId: column.id,
            firstStartedAt:
              task.firstStartedAt ??
              (!task.firstCompletedAt && column.category === "ACTIVE"
                ? new Date()
                : null),
            firstCompletedAt:
              task.firstCompletedAt ??
              (column.category === "DONE" ? new Date() : null),
          },
        });
        for (const [position, id] of ordered.entries())
          await tx.task.update({ where: { id }, data: { position } });
        return {
          taskId,
          title: task.title,
          payload: {
            from: task.columnId,
            fromName: task.column.name,
            fromCategory: task.column.category,
            to: column.id,
            toName: column.name,
            toCategory: column.category,
          },
        };
      },
    );
  }
  async update(
    projectId: string,
    taskId: string,
    req: ActorRequest,
    input: z.infer<typeof UpdateTask>,
  ) {
    return this.mutations.mutate(
      projectId,
      req,
      input.expectedVersion,
      input.archived ? "task.archived" : "task.updated",
      async (tx) => {
        const task = await this.mutations.task(tx, projectId, taskId);
        await this.mutations.assignee(tx, projectId, input.assigneeId);
        const { expectedVersion: _version, dueDate, ...fields } = input;
        await tx.task.update({
          where: { id: taskId },
          data: {
            ...fields,
            ...(dueDate !== undefined
              ? { dueDate: dueDate ? new Date(dueDate) : null }
              : {}),
          },
        });
        return { taskId, title: input.title ?? task.title };
      },
    );
  }
}
