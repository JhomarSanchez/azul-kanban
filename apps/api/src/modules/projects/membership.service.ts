import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import { ActorRequest, fail } from "../../infrastructure/http";
import { InvitationRoleInput } from "./invitation.input";
import { ProjectAccessService } from "./project-access.service";
@Injectable()
export class MembershipService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
  ) {}
  async changeMember(
    projectId: string,
    actor: { id: string; name: string },
    userId: string,
    role?: "MEMBER" | "VIEWER",
  ) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id=${projectId} FOR UPDATE`;
      await this.projects.access(projectId, actor.id, "owner", tx);
      const target = await tx.membership.findUnique({
        where: { userId_projectId: { userId, projectId } },
        include: { user: true },
      });
      if (!target || target.role === "OWNER")
        fail(400, "No se puede modificar ese miembro.", "MEMBER");
      if (role)
        await tx.membership.update({
          where: { id: target.id },
          data: { role },
        });
      else {
        await tx.membership.delete({ where: { id: target.id } });
        await tx.task.updateMany({
          where: { projectId, assigneeId: userId },
          data: { assigneeId: null },
        });
      }
      const project = await tx.project.update({
        where: { id: projectId },
        data: { version: { increment: 1 } },
      });
      await tx.activity.create({
        data: {
          projectId,
          version: project.version,
          type: "membership.updated",
          actor: actor.name,
          title: target.user.name,
          payload: { userId, role: role ?? "REMOVED" },
        },
      });
      return { ok: true };
    });
  }
  async changeRole(
    id: string,
    userId: string,
    req: ActorRequest,
    body: z.infer<typeof InvitationRoleInput>,
  ) {
    const { role } = body;
    return this.changeMember(id, req.actor, userId, role);
  }
  async remove(id: string, userId: string, req: ActorRequest) {
    return this.changeMember(id, req.actor, userId);
  }
}
