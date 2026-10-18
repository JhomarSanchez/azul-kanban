import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import "reflect-metadata";
import { z } from "zod";
import { AppModule } from "./app.module";
import { Errors } from "./infrastructure/http";
import { setupOpenApi } from "./infrastructure/openapi";
import "./infrastructure/settings";
import { rootDir, settings } from "./infrastructure/settings";
export async function createApp() {
  z.config(z.locales.es());
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });
  if (settings.production)
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }),
  );
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());
  app.use((req: any, res: any, next: any) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    if (req.path.startsWith("/api/v1"))
      res.setHeader("Cache-Control", "no-store");
    const start = Date.now();
    res.on("finish", () => {
      if (!req.path.startsWith("/api")) return;
      console.log(
        JSON.stringify({
          requestId: req.requestId,
          method: req.method,
          status: res.statusCode,
          durationMs: Date.now() - start,
        }),
      );
    });
    next();
  });
  app.useGlobalFilters(new Errors());
  setupOpenApi(app);
  const web = resolve(rootDir, "apps/web/dist/web/browser");
  if (existsSync(resolve(web, "index.html"))) {
    app.use(express.static(web));
    app.use((req: any, res: any, next: any) => {
      if (
        req.method === "GET" &&
        !req.path.startsWith("/api") &&
        !req.path.startsWith("/socket.io")
      )
        return res.sendFile(resolve(web, "index.html"));
      next();
    });
  }
  return app;
}
if (require.main === module)
  void createApp()
    .then((app) => app.listen(settings.port, "0.0.0.0"))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Startup failed");
      process.exitCode = 1;
    });
