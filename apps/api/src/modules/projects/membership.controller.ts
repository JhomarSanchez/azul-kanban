import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest, parse } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { InvitationRoleInput } from "./invitation.input";
import { MembershipService } from "./membership.service";
@ApiTags("Membership")
@UseGuards(SessionGuard)
@Controller("projects")
export class MembershipController {
  constructor(private service: MembershipService) {}
  @Patch(":id/members/:userId") async changeRole(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.service.changeRole(
      id,
      userId,
      req,
      parse(InvitationRoleInput, body),
    );
  }
  @Delete(":id/members/:userId") async remove(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Req() req: ActorRequest,
  ) {
    return this.service.remove(id, userId, req);
  }
}
