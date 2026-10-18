import { Module } from "@nestjs/common";
import { HealthController } from "./infrastructure/health.controller";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { ActivityModule } from "./modules/activity";
import { AiModule } from "./modules/ai";
import { CollaborationModule } from "./modules/collaboration";
import { DemoModule } from "./modules/demo";
import { IdentityModule } from "./modules/identity";
import { KanbanModule } from "./modules/kanban";
import { MetricsModule } from "./modules/metrics";
import { ProjectsModule } from "./modules/projects";
@Module({
  imports: [
    InfrastructureModule,
    IdentityModule,
    ProjectsModule,
    KanbanModule,
    ActivityModule,
    MetricsModule,
    AiModule,
    DemoModule,
    CollaborationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
