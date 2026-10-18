import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@core": fileURLToPath(new URL("./src/app/core", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/app/shared", import.meta.url)),
      "@features": fileURLToPath(
        new URL("./src/app/features", import.meta.url),
      ),
    },
  },
  test: { include: ["src/**/*.spec.ts"] },
});
