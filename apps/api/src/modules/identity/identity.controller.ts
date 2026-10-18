import { Credentials } from "@azul/contracts";
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { ActorRequest, parse } from "../../infrastructure/http";
import { CredentialsService } from "./credentials.service";
import { SessionGuard } from "./session.guard";
@ApiTags("Identidad")
@Controller("auth")
export class IdentityController {
  constructor(private credentials: CredentialsService) {}
  @Get("session")
  @ApiOperation({ summary: "Obtener usuario actual y token CSRF" })
  async session(@Req() req: ActorRequest) {
    return this.credentials.session(req);
  }
  @Post("register")
  @ApiOperation({ summary: "Crear cuenta y sesión" })
  async register(
    @Req() req: ActorRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() body: unknown,
  ) {
    return this.credentials.register(req, res, parse(Credentials, body));
  }
  @Post("login")
  @ApiOperation({ summary: "Iniciar sesión con contraseña" })
  async login(
    @Req() req: ActorRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() body: unknown,
  ) {
    return this.credentials.login(req, res, parse(Credentials, body));
  }
  @Post("logout")
  @UseGuards(SessionGuard)
  async logout(
    @Req() req: ActorRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.credentials.logout(req, res);
  }
}
