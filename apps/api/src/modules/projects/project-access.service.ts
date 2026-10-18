import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Database } from "../../infrastructure/database";
import { fail } from "../../infrastructure/http";
export type Transaction = Prisma.TransactionClient;
@Injectable()
export class ProjectAccessService {
  constructor(private db: Database) {}
  async access(
    projectId: string,
    userId: string,
    required: "read" | "write" | "owner" = "read",
    db: Transaction = this.db,
  ) {
    const member = await db.membership.findUnique({
      where: { userId_projectId: { userId, projectId } },
      include: { project: true },
    });
    if (!member)
      fail(404, "No tienes acceso a este proyecto.", "PROJECT_ACCESS");
    if (
      member.project.expiresAt &&
      member.project.expiresAt.getTime() <= Date.now()
    )
      fail(
        410,
        "Esta demo ha caducado. Crea una nueva para continuar.",
        "DEMO_EXPIRED",
      );
    if (
      (required === "write" && member.role === "VIEWER") ||
      (required === "owner" && member.role !== "OWNER")
    )
      fail(403, "Tu rol no permite esta acción.", "FORBIDDEN");
    return member;
  }
  /** Batch read check: the `userId:projectId` keys that still grant access. */
  async readable(pairs: { userId: string; projectId: string }[]) {
    if (!pairs.length) return new Set<string>();
    const members = await this.db.membership.findMany({
      where: {
        userId: { in: [...new Set(pairs.map((pair) => pair.userId))] },
        projectId: { in: [...new Set(pairs.map((pair) => pair.projectId))] },
        project: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
      select: { userId: true, projectId: true },
    });
    return new Set(members.map((m) => `${m.userId}:${m.projectId}`));
  }
}
