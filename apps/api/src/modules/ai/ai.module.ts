import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity";
import { KanbanModule } from "../kanban";
import { MetricsModule } from "../metrics";
import { ProjectsModule } from "../projects";
import { AiBudgetService } from "./ai-budget.service";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiTransport } from "./openai.transport";
import { ProposalAcceptanceService } from "./proposal-acceptance.service";
@Module({
  imports: [IdentityModule, ProjectsModule, KanbanModule, MetricsModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiTransport,
    AiBudgetService,
    ProposalAcceptanceService,
  ],
  exports: [AiTransport],
})
export class AiModule {}
