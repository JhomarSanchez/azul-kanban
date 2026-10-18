import { config } from "dotenv";
import { resolve } from "node:path";
export const rootDir = resolve(__dirname, "../../../..");
config({ path: resolve(rootDir, ".env"), quiet: true });
export const settings = {
  production: process.env.NODE_ENV === "production",
  origin: process.env.APP_ORIGIN ?? "http://127.0.0.1:4200",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://azul:azul_local_only@127.0.0.1:55432/azul",
  port: Number(process.env.PORT ?? 3000),
  demoHours: Number(process.env.DEMO_TTL_HOURS ?? 24),
};
