import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest, parse } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { InvitationRoleInput } from "./invitation.input";
import { InvitationsService } from "./invitations.service";
@ApiTags("Invitations")
@UseGuards(SessionGuard)
@Controller("projects")
export class InvitationsController {
  constructor(private service: InvitationsService) {}
  @Post(":id/invitations") async invite(
    @Param("id") id: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.service.invite(id, req, parse(InvitationRoleInput, body));
  }
  @Delete(":id/invitations") async revoke(
    @Param("id") id: string,
    @Req() req: ActorRequest,
  ) {
    return this.service.revoke(id, req);
  }
}
