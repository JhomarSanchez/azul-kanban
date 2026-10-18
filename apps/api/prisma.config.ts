import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";
config({ path: "../../.env", quiet: true });
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://azul:azul_local_only@127.0.0.1:55432/azul",
  },
});
