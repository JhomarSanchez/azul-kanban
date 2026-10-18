import { Controller, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import {
  ActorRequest,
  checkOrigin,
  RateLimit,
} from "../../infrastructure/http";
import { settings } from "../../infrastructure/settings";
import { IdentityService, publicUser } from "../identity";
import { DemoService } from "./demo.service";
@ApiTags("Demo e invitaciones")
@Controller()
export class DemoController {
  constructor(
    private demo: DemoService,
    private identity: IdentityService,
    private rate: RateLimit,
  ) {}
  @Post("demo") async create(
    @Req() req: ActorRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    checkOrigin(req);
    this.rate.check(`demo:${req.ip}`, 10);
    const { user, projectId } = await this.demo.create();
    const csrf = await this.identity.issue(user.id, res, settings.demoHours);
    return { user: publicUser(user), csrf, projectId };
  }
}
