import { ColumnInput, Version } from "@azul/contracts";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import { ActorRequest, fail } from "../../infrastructure/http";
import { ProjectAccessService } from "../projects";
import { BoardTransactionService } from "./board-transaction.service";
@Injectable()
export class ColumnsService {
  constructor(
    private db: Database,
    private board: BoardTransactionService,
    private projects: ProjectAccessService,
  ) {}
  async createColumn(
    id: string,
    req: ActorRequest,
    body: z.infer<typeof ColumnInput>,
  ) {
    const input = body;
    return this.board.mutate(
      id,
      req,
      input.expectedVersion,
      "column.created",
      async (tx) => {
        const existing = await tx.column.aggregate({
          where: { projectId: id },
          _count: true,
          _max: { position: true },
        });
        if (existing._count >= 10)
          fail(422, "El tablero admite hasta diez columnas.", "COLUMN_LIMIT");
        // Deleting a middle column leaves a gap; counting would reuse a taken position.
        const position = (existing._max.position ?? -1) + 1;
        const result = await tx.column.create({
          data: {
            projectId: id,
            name: input.name,
            category: input.category,
            wipLimit: input.wipLimit,
            position,
          },
        });
        return { result, title: input.name };
      },
      true,
    );
  }
  async updateColumn(
    id: string,
    columnId: string,
    req: ActorRequest,
    body: z.infer<typeof ColumnInput>,
  ) {
    const input = body;
    return this.board.mutate(
      id,
      req,
      input.expectedVersion,
      "column.updated",
      async (tx) => {
        const column = await this.board.column(tx, id, columnId);
        if (column.category !== input.category)
          fail(
            400,
            "La categoría histórica de una columna es estable. Crea otra columna para un flujo distinto.",
            "CATEGORY_STABLE",
          );
        const count = await tx.task.count({
          where: { columnId, archived: false },
        });
        if (input.wipLimit !== null && count > input.wipLimit)
          fail(
            422,
            "El límite debe permitir las tareas que ya contiene.",
            "WIP_LIMIT",
          );
        await tx.column.update({
          where: { id: columnId },
          data: { name: input.name, wipLimit: input.wipLimit },
        });
        return { title: input.name };
      },
      true,
    );
  }
  async deleteColumn(
    id: string,
    columnId: string,
    req: ActorRequest,
    body: z.infer<typeof Version>,
  ) {
    const input = body;
    return this.board.mutate(
      id,
      req,
      input.expectedVersion,
      "column.deleted",
      async (tx) => {
        const column = await this.board.column(tx, id, columnId);
        if (await tx.task.count({ where: { columnId } }))
          fail(
            422,
            "Solo puedes eliminar columnas sin tareas ni historial asociado.",
            "COLUMN_NOT_EMPTY",
          );
        if (
          (await tx.column.count({
            where: { projectId: id, category: column.category },
          })) < 2
        )
          fail(
            422,
            "Conserva al menos una columna de cada categoría.",
            "COLUMN_CATEGORY",
          );
        await tx.column.delete({ where: { id: columnId } });
        return { title: column.name };
      },
      true,
    );
  }
}
