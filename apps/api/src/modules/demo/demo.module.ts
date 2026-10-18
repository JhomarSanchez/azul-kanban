import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity";
import { ProjectsModule } from "../projects";
import { DemoCleanupService } from "./demo-cleanup.service";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";
@Module({
  imports: [IdentityModule, ProjectsModule],
  controllers: [DemoController],
  providers: [DemoService, DemoCleanupService],
  exports: [DemoService, DemoCleanupService],
})
export class DemoModule {}
