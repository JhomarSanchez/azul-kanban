import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import { ActorRequest } from "../../infrastructure/http";
import { digest } from "../identity";
import { InvitationRoleInput } from "./invitation.input";
import { ProjectAccessService } from "./project-access.service";
@Injectable()
export class InvitationsService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
  ) {}
  async invite(
    id: string,
    req: ActorRequest,
    body: z.infer<typeof InvitationRoleInput>,
  ) {
    const { role } = body;
    const member = await this.projects.access(id, req.actor.id, "owner");
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Math.min(
        Date.now() + 7 * 86400000,
        member.project.expiresAt?.getTime() ?? Infinity,
      ),
    );
    await this.db.invitation.create({
      data: { id: digest(token), projectId: id, role, expiresAt },
    });
    return { token, expiresAt: expiresAt.toISOString(), url: `/join/${token}` };
  }
  async revoke(id: string, req: ActorRequest) {
    await this.projects.access(id, req.actor.id, "owner");
    await this.db.invitation.updateMany({
      where: { projectId: id, revoked: false },
      data: { revoked: true },
    });
    return { ok: true };
  }
}
