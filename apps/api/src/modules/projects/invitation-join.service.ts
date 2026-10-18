import { Injectable } from "@nestjs/common";
import { Response } from "express";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import {
  ActorRequest,
  checkOrigin,
  fail,
  RateLimit,
} from "../../infrastructure/http";
import {
  csrfMatches,
  digest,
  IdentityService,
  publicUser,
} from "../identity";
import { JoinInvitationInput } from "./invitation.input";

@Injectable()
export class InvitationJoinService {
  constructor(
    private db: Database,
    private identity: IdentityService,
    private rate: RateLimit,
  ) {}
  async invitation(token: string) {
    if (token.length > 80)
      fail(404, "La invitación no está disponible.", "INVITATION");
    const invitation = await this.db.invitation.findUnique({
      where: { id: digest(token) },
      include: { project: true },
    });
    if (
      !invitation ||
      invitation.revoked ||
      invitation.expiresAt.getTime() <= Date.now() ||
      (invitation.project.expiresAt &&
        invitation.project.expiresAt.getTime() <= Date.now())
    )
      fail(
        410,
        "Este enlace ha caducado o fue revocado. Pide una nueva invitación.",
        "INVITATION_EXPIRED",
      );
    return invitation;
  }
  async preview(token: string) {
    const item = await this.invitation(token);
    return {
      name: item.project.name,
      role: item.role,
      demo: item.project.demo,
    };
  }
  async join(
    token: string,
    req: ActorRequest,
    res: Response,
    body: z.infer<typeof JoinInvitationInput>,
  ) {
    checkOrigin(req);
    this.rate.check(`join:${req.ip}`, 30);
    const input = body;
    const invite = await this.invitation(token);
    const session = await this.identity.resolve(req.cookies?.azul_session);
    if (session && !csrfMatches(req.get("x-csrf-token"), session.csrf))
      fail(403, "Actualiza la página para validar la sesión.", "CSRF");
    if (!invite.project.demo && (!session || session.user.guest))
      fail(
        401,
        "Inicia sesión o crea una cuenta para unirte al proyecto.",
        "ACCOUNT_REQUIRED",
      );
    // The guest is created with the membership so a revoked link leaves no orphan account.
    const user = await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id=${invite.projectId} FOR UPDATE`;
      const current = await tx.invitation.findUnique({
        where: { id: invite.id },
      });
      if (
        !current ||
        current.revoked ||
        current.expiresAt.getTime() <= Date.now()
      )
        fail(
          410,
          "Esta invitación ya no está disponible.",
          "INVITATION_EXPIRED",
        );
      const user =
        session?.user ??
        (await tx.user.create({
          data: { name: input.name ?? "Invitado del equipo", guest: true },
        }));
      const existing = await tx.membership.findUnique({
        where: {
          userId_projectId: { userId: user.id, projectId: invite.projectId },
        },
      });
      if (!existing) {
        await tx.membership.create({
          data: {
            userId: user.id,
            projectId: invite.projectId,
            role: invite.role,
          },
        });
        const project = await tx.project.update({
          where: { id: invite.projectId },
          data: { version: { increment: 1 } },
        });
        await tx.activity.create({
          data: {
            projectId: invite.projectId,
            version: project.version,
            type: "membership.joined",
            actor: user.name,
            title: project.name,
          },
        });
      }
      return user;
    });
    const csrf =
      session?.csrf ??
      (await this.identity.issue(
        user.id,
        res,
        Math.max(1, (invite.expiresAt.getTime() - Date.now()) / 3600000),
      ));
    return { user: publicUser(user), csrf, projectId: invite.projectId };
  }
}
