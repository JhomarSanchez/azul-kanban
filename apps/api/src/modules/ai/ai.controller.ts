import { AcceptProposal } from "@azul/contracts";
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
import { z } from "zod";
import { ActorRequest, parse } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { AiService } from "./ai.service";
import { ProposalAcceptanceService } from "./proposal-acceptance.service";
@ApiTags("Ai")
@UseGuards(SessionGuard)
@Controller("projects/:projectId/ai")
export class AiController {
  constructor(
    private ai: AiService,
    private acceptance: ProposalAcceptanceService,
  ) {}
  @Post("proposals") propose(
    @Param("projectId") id: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.ai.execute(
      id,
      req,
      "proposal",
      parse(z.object({ idea: z.string().trim().min(5).max(2000) }), body).idea,
    );
  }
  @Post("analysis") analyze(
    @Param("projectId") id: string,
    @Req() req: ActorRequest,
  ) {
    return this.ai.execute(id, req, "analysis");
  }
  @Get("proposals") async list(
    @Param("projectId") id: string,
    @Req() req: ActorRequest,
  ) {
    return this.ai.list(id, req);
  }
  @Post("accept") accept(
    @Param("projectId") id: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.acceptance.accept(id, req, parse(AcceptProposal, body));
  }
}
