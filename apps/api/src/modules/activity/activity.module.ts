import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity";
import { ProjectsModule } from "../projects";
import { ActivityController } from "./activity.controller";
import { ActivityService } from "./activity.service";
import { OutboxRepository } from "./outbox.repository";
@Module({
  imports: [IdentityModule, ProjectsModule],
  controllers: [ActivityController],
  providers: [ActivityService, OutboxRepository],
  exports: [OutboxRepository],
})
export class ActivityModule {}
