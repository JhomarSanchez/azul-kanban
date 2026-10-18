import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import { ActorRequest } from "../../infrastructure/http";
import { ProjectAccessService } from "../projects";
import { BoardTransactionService } from "./board-transaction.service";
import { CommentInput } from "./comment.input";
@Injectable()
export class CommentsService {
  constructor(
    private db: Database,
    private board: BoardTransactionService,
    private projects: ProjectAccessService,
  ) {}
  async comments(id: string, taskId: string, req: ActorRequest) {
    await this.projects.access(id, req.actor.id);
    await this.board.task(this.db, id, taskId);
    return this.db.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }
  async comment(
    id: string,
    taskId: string,
    req: ActorRequest,
    body: z.infer<typeof CommentInput>,
  ) {
    const input = body;
    return this.board.mutate(
      id,
      req,
      input.expectedVersion,
      "task.commented",
      async (tx) => {
        const task = await this.board.task(tx, id, taskId);
        const comment = await tx.comment.create({
          data: {
            taskId,
            authorId: req.actor.id,
            authorName: req.actor.name,
            text: input.text,
          },
        });
        return { result: comment, taskId, title: task.title };
      },
    );
  }
}
