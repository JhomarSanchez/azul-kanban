import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ActorRequest, checkOrigin, fail } from "../../infrastructure/http";
import { csrfMatches, IdentityService } from "./identity.service";
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private identity: IdentityService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<ActorRequest>();
    const session = await this.identity.resolve(req.cookies?.azul_session);
    if (!session)
      fail(401, "Tu sesión ha terminado. Vuelve a entrar.", "UNAUTHENTICATED");
    req.actor = session.user;
    req.sessionId = session.id;
    req.csrf = session.csrf;
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      checkOrigin(req);
      if (!csrfMatches(req.get("x-csrf-token"), session.csrf))
        fail(403, "No pudimos validar la sesión. Actualiza la página.", "CSRF");
    }
    return true;
  }
}
