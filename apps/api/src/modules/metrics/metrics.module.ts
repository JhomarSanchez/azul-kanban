import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity";
import { ProjectsModule } from "../projects";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
@Module({
  imports: [IdentityModule, ProjectsModule],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
