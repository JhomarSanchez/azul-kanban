import { Module } from "@nestjs/common";
import { ActivityModule } from "../activity";
import { IdentityModule } from "../identity";
import { ProjectsModule } from "../projects";
import { Collaboration } from "./collaboration.gateway";
import { OutboxPublisher } from "./outbox-publisher.service";
import { SocketAccessService } from "./socket-access.service";
@Module({
  imports: [IdentityModule, ProjectsModule, ActivityModule],
  controllers: [],
  providers: [Collaboration, OutboxPublisher, SocketAccessService],
  exports: [Collaboration],
})
export class CollaborationModule {}
