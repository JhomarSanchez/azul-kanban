import { Injectable } from "@nestjs/common";
import { Database } from "../../infrastructure/database";
import { ActorRequest, fail } from "../../infrastructure/http";
import { ProjectAccessService } from "../projects";
import { PROMPT_VERSION } from "./prompts";
@Injectable()
export class AiBudgetService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
  ) {}
  async reserve(
    projectId: string,
    req: ActorRequest,
    kind: "proposal" | "analysis",
    real: boolean,
    month: string,
    budget: number,
    reservation: number,
    model: string,
    provider: string,
  ) {
    return await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id=${projectId} FOR UPDATE`;
      const member = await this.projects.access(
        projectId,
        req.actor.id,
        kind === "proposal" ? "write" : "read",
        tx,
      );
      if (member.project.demo && member.project.aiRequests >= 3)
        fail(
          429,
          "Esta demo incluye tres consultas de IA. Puedes seguir usando el tablero.",
          "AI_DEMO_LIMIT",
        );
      if (real) {
        await tx.aiBudget.upsert({
          where: { month },
          create: { month },
          update: {},
        });
        const reserved = await tx.aiBudget.updateMany({
          where: { month, reservedUsd: { lte: budget - reservation } },
          data: { reservedUsd: { increment: reservation } },
        });
        if (!reserved.count)
          fail(
            429,
            "El presupuesto mensual de IA está agotado. El tablero sigue disponible.",
            "AI_BUDGET",
          );
      }
      await tx.project.update({
        where: { id: projectId },
        data: { aiRequests: { increment: 1 } },
      });
      return tx.aiRun.create({
        data: {
          projectId,
          model,
          provider,
          kind,
          promptVersion: PROMPT_VERSION,
          status: "started",
          reservedUsd: reservation,
        },
      });
    });
  }
  async complete(
    run: { id: string },
    start: number,
    usageKnown: boolean,
    cost: number | null,
    inputTokens: number,
    outputTokens: number,
    real: boolean,
    month: string,
    reservation: number,
  ) {
    await this.db.$transaction(async (tx) => {
      await tx.aiRun.update({
        where: { id: run.id },
        data: {
          status: "completed",
          costUsd: cost,
          inputTokens: usageKnown ? inputTokens : null,
          outputTokens: usageKnown ? outputTokens : null,
          durationMs: Date.now() - start,
        },
      });
      if (real && cost !== null)
        await tx.aiBudget.update({
          where: { month },
          data: { reservedUsd: { increment: cost - reservation } },
        });
    });
  }
}
