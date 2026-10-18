import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { ActorRequest, parse } from "../../infrastructure/http";
import { InvitationJoinService } from "./invitation-join.service";
import { JoinInvitationInput } from "./invitation.input";
@ApiTags("Invitaciones")
@Controller("invitations")
export class InvitationJoinController {
  constructor(private service: InvitationJoinService) {}
  @Get(":token") async preview(@Param("token") token: string) {
    return this.service.preview(token);
  }
  @Post(":token/join") async join(
    @Param("token") token: string,
    @Req() req: ActorRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() body: unknown,
  ) {
    return this.service.join(
      token,
      req,
      res,
      parse(JoinInvitationInput, body ?? {}),
    );
  }
}
