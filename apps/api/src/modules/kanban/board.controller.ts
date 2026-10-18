import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { BoardService } from "./board-query.service";
@ApiTags("Board")
@UseGuards(SessionGuard)
@Controller("projects/:projectId")
export class BoardController {
  constructor(private board: BoardService) {}
  @Get("board") get(@Param("projectId") id: string, @Req() req: ActorRequest) {
    return this.board.get(id, req.actor.id);
  }
}
