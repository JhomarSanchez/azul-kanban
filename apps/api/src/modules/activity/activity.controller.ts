import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { ActivityService } from "./activity.service";
@ApiTags("Activity")
@UseGuards(SessionGuard)
@Controller("projects/:projectId")
export class ActivityController {
  constructor(private service: ActivityService) {}
  @Get("activity") async activity(
    @Param("projectId") id: string,
    @Req() req: ActorRequest,
  ) {
    return this.service.activity(id, req);
  }
}
