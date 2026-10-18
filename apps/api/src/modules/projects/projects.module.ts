import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity";
import { InvitationJoinController } from "./invitation-join.controller";
import { InvitationJoinService } from "./invitation-join.service";
import { InvitationsController } from "./invitations.controller";
import { InvitationsService } from "./invitations.service";
import { MembershipController } from "./membership.controller";
import { MembershipService } from "./membership.service";
import { ProjectAccessService } from "./project-access.service";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
@Module({
  imports: [IdentityModule],
  controllers: [
    ProjectsController,
    MembershipController,
    InvitationsController,
    InvitationJoinController,
  ],
  providers: [
    ProjectsService,
    ProjectAccessService,
    MembershipService,
    InvitationsService,
    InvitationJoinService,
  ],
  exports: [ProjectsService, ProjectAccessService],
})
export class ProjectsModule {}
