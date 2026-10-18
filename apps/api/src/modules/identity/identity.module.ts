import { Module } from "@nestjs/common";
import { CredentialsService } from "./credentials.service";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";
import { SessionGuard } from "./session.guard";

@Module({
  imports: [],
  controllers: [IdentityController],
  providers: [IdentityService, SessionGuard, CredentialsService],
  exports: [IdentityService, SessionGuard],
})
export class IdentityModule {}
