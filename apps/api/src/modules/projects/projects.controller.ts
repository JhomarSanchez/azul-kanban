import { ProjectInput } from "@azul/contracts";
import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest, parse } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { ProjectsService } from "./projects.service";
@ApiTags("Projects")
@UseGuards(SessionGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private projects: ProjectsService) {}
  @Get() list(@Req() req: ActorRequest) {
    return this.projects.list(req.actor.id);
  }
  @Post() async create(@Req() req: ActorRequest, @Body() body: unknown) {
    return this.projects.createForActor(
      req.actor.id,
      parse(ProjectInput, body),
    );
  }
}
