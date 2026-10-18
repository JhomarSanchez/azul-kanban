import { CreateTask, MoveTask, UpdateTask } from "@azul/contracts";
import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest, parse } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { TaskCommandsService } from "./task-commands.service";
@ApiTags("Tasks")
@UseGuards(SessionGuard)
@Controller("projects/:projectId")
export class TasksController {
  constructor(private board: TaskCommandsService) {}
  @Post("tasks") create(
    @Param("projectId") id: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.board.create(id, req, parse(CreateTask, body));
  }
  @Patch("tasks/:taskId") update(
    @Param("projectId") id: string,
    @Param("taskId") taskId: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.board.update(id, taskId, req, parse(UpdateTask, body));
  }
  @Post("tasks/:taskId/move") move(
    @Param("projectId") id: string,
    @Param("taskId") taskId: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.board.move(id, taskId, req, parse(MoveTask, body));
  }
}
