import { AcceptProposal } from "@azul/contracts";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { Database } from "../../infrastructure/database";
import { ActorRequest, fail } from "../../infrastructure/http";
import { TaskBatchService } from "../kanban";
import { ProjectAccessService } from "../projects";
@Injectable()
export class ProposalAcceptanceService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
    private tasks: TaskBatchService,
  ) {}
  async accept(
    projectId: string,
    req: ActorRequest,
    input: z.infer<typeof AcceptProposal>,
  ) {
    const existing = await this.db.aiProposal.findFirst({
      where: { id: input.proposalId, projectId },
    });
    await this.projects.access(projectId, req.actor.id, "write");
    if (existing?.acceptedAt)
      return { result: existing.acceptedIds, alreadyAccepted: true };
    return this.db.$transaction(
      async (tx) => {
        // The board row is the serialization point for acceptance and ordinary writes.
        await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId} FOR UPDATE`;
        const proposal = await tx.aiProposal.findFirst({
          where: { id: input.proposalId, projectId },
        });
        if (!proposal)
          fail(404, "La propuesta no está disponible.", "PROPOSAL");
        if (proposal.acceptedAt)
          return { result: proposal.acceptedIds, alreadyAccepted: true };
        await this.projects.access(projectId, req.actor.id, "write", tx);
        const changed = await tx.project.updateMany({
          where: { id: projectId, version: input.expectedVersion },
          data: { version: { increment: 1 } },
        });
        if (!changed.count)
          fail(
            409,
            "El tablero cambió. Revisa la propuesta y vuelve a aceptarla.",
            "VERSION_CONFLICT",
          );
        const originals = proposal.tasks as any[];
        if (
          new Set(input.tasks.map((t) => t.sourceIndex)).size !==
            input.tasks.length ||
          input.tasks.some((t) => t.sourceIndex >= originals.length)
        )
          fail(
            400,
            "La selección contiene tareas repetidas o desconocidas.",
            "PROPOSAL_SELECTION",
          );
        const ids = await this.tasks.create(tx, projectId, req, input);
        await tx.aiProposal.update({
          where: { id: proposal.id },
          data: { acceptedAt: new Date(), acceptedIds: ids },
        });
        return { result: ids, version: input.expectedVersion + 1 };
      },
      { timeout: 15000 },
    );
  }
}
