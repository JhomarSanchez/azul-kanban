import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { MetricsService } from "./metrics.service";
@ApiTags("Métricas")
@UseGuards(SessionGuard)
@Controller("projects/:projectId/metrics")
export class MetricsController {
  constructor(private metrics: MetricsService) {}
  @Get() get(@Param("projectId") id: string, @Req() req: ActorRequest) {
    return this.metrics.get(id, req.actor.id);
  }
}
