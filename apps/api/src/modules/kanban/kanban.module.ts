import { TaskBatchService } from "./task-batch.service";
import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity";
import { ProjectsModule } from "../projects";
import { BoardService } from "./board-query.service";
import { BoardTransactionService } from "./board-transaction.service";
import { BoardController } from "./board.controller";
import { ColumnsController } from "./columns.controller";
import { ColumnsService } from "./columns.service";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { TaskCommandsService } from "./task-commands.service";
import { TasksController } from "./tasks.controller";
@Module({
  imports: [IdentityModule, ProjectsModule],
  controllers: [
    BoardController,
    TasksController,
    ColumnsController,
    CommentsController,
  ],
  providers: [
    TaskBatchService,
    BoardService,
    BoardTransactionService,
    TaskCommandsService,
    ColumnsService,
    CommentsService,
  ],
  exports: [TaskBatchService, BoardService, BoardTransactionService],
})
export class KanbanModule {}
