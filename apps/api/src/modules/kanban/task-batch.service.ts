import { Injectable } from "@nestjs/common";
import { AcceptProposal } from "@azul/contracts";
import { z } from "zod";
import { Transaction } from "../projects";
import { ActorRequest } from "../../infrastructure/http";
import { BoardTransactionService } from "./board-transaction.service";
@Injectable()
export class TaskBatchService {
  constructor(private board: BoardTransactionService) {}
  async create(
    tx: Transaction,
    projectId: string,
    req: ActorRequest,
    input: z.infer<typeof AcceptProposal>,
  ) {
    const column = await this.board.column(tx, projectId, input.columnId);
    await this.board.capacity(tx, column, undefined, input.tasks.length);
    const ids: string[] = [];
    let position =
      ((
        await tx.task.aggregate({
          where: { columnId: column.id, archived: false },
          _max: { position: true },
        })
      )._max.position ?? -1) + 1;
    for (const proposed of input.tasks) {
      const task = await tx.task.create({
        data: {
          projectId,
          columnId: column.id,
          position: position++,
          title: proposed.title,
          description: proposed.description,
          priority: proposed.priority,
          checklist: proposed.acceptanceCriteria.map((text, index) => ({
            id: `${index}`,
            text,
            done: false,
          })),
          firstStartedAt: column.category === "ACTIVE" ? new Date() : null,
          firstCompletedAt: column.category === "DONE" ? new Date() : null,
        },
      });
      ids.push(task.id);
      await tx.activity.create({
        data: {
          projectId,
          version: input.expectedVersion + 1,
          type: "task.created",
          actor: req.actor.name,
          taskId: task.id,
          title: task.title,
          payload: {
            to: column.id,
            toName: column.name,
            toCategory: column.category,
            proposalId: input.proposalId,
          },
        },
      });
    }
    return ids;
  }
}
