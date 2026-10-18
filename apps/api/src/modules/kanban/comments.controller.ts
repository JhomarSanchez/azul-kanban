import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest, parse } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { CommentInput } from "./comment.input";
import { CommentsService } from "./comments.service";
@ApiTags("Comments")
@UseGuards(SessionGuard)
@Controller("projects/:projectId")
export class CommentsController {
  constructor(private service: CommentsService) {}
  @Get("tasks/:taskId/comments") async comments(
    @Param("projectId") id: string,
    @Param("taskId") taskId: string,
    @Req() req: ActorRequest,
  ) {
    return this.service.comments(id, taskId, req);
  }
  @Post("tasks/:taskId/comments") async comment(
    @Param("projectId") id: string,
    @Param("taskId") taskId: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.service.comment(id, taskId, req, parse(CommentInput, body));
  }
}
