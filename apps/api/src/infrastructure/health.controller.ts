import { Controller, Get, Req } from "@nestjs/common";
import { HealthService } from "./health.service";
import { ActorRequest } from "./http";
@Controller("health")
export class HealthController {
  constructor(private health: HealthService) {}
  @Get() live(@Req() req: ActorRequest) {
    return { status: "ok", requestId: req.requestId };
  }
  @Get("ready") async ready() {
    return this.health.ready();
  }
}
