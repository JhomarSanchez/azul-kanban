import { Global, Module } from "@nestjs/common";
import { Database } from "./database";
import { HealthService } from "./health.service";
import { RateLimit } from "./http";
@Global()
@Module({
  providers: [Database, RateLimit, HealthService],
  exports: [Database, RateLimit, HealthService],
})
export class InfrastructureModule {}
