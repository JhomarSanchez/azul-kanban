import { Credentials } from "@azul/contracts";
import { Injectable } from "@nestjs/common";
import { hash, verify } from "argon2";
import { Response } from "express";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import {
  ActorRequest,
  checkOrigin,
  fail,
  RateLimit,
} from "../../infrastructure/http";
import { IdentityService, publicUser } from "./identity.service";
@Injectable()
export class CredentialsService {
  constructor(
    private db: Database,
    private identity: IdentityService,
    private rate: RateLimit,
  ) {}
  async session(req: ActorRequest) {
    const session = await this.identity.resolve(req.cookies?.azul_session);
    return session
      ? { user: publicUser(session.user), csrf: session.csrf }
      : { user: null, csrf: "" };
  }
  async register(
    req: ActorRequest,
    res: Response,
    body: z.infer<typeof Credentials>,
  ) {
    checkOrigin(req);
    this.rate.check(`register:${req.ip}`, 10);
    const input = body;
    const user = await this.db.user.create({
      data: {
        email: input.email,
        name: input.name ?? input.email.split("@")[0],
        passwordHash: await hash(input.password),
      },
    });
    const csrf = await this.identity.issue(user.id, res);
    return { user: publicUser(user), csrf };
  }
  async login(
    req: ActorRequest,
    res: Response,
    body: z.infer<typeof Credentials>,
  ) {
    checkOrigin(req);
    this.rate.check(`login:${req.ip}`, 20, 900000);
    const input = body;
    const user = await this.db.user.findUnique({
      where: { email: input.email },
    });
    if (
      !user?.passwordHash ||
      !(await verify(user.passwordHash, input.password))
    )
      fail(401, "Correo o contraseña incorrectos.", "CREDENTIALS");
    const csrf = await this.identity.issue(user.id, res);
    return { user: publicUser(user), csrf };
  }
  async logout(req: ActorRequest, res: Response) {
    await this.db.session.deleteMany({ where: { id: req.sessionId } });
    res.clearCookie("azul_session", { path: "/" });
    return { ok: true };
  }
}
