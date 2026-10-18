import js from "@eslint/js";
import ts from "typescript-eslint";
const modulePrivateImports=["../identity/*","../projects/*","../kanban/*","../metrics/*","../activity/*","../collaboration/*","../ai/*","../demo/*"];
export default ts.config(
  {
    ignores: [
      "**/dist/**",
      "**/generated/**",
      "**/node_modules/**",
      "**/.angular/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["apps/api/src/**/*.controller.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "El acceso a datos pertenece a servicios, no a controladores.",
            },
          ],
          patterns: [
            {
              group: ["**/infrastructure/database", "./database"],
              message: "Inyecta un servicio de aplicación en el controlador.",
            },
            {group:modulePrivateImports,message:"Usa los proveedores públicos de los módulos pares."},
          ],
        },
      ],
    },
  },
  {
    files: ["apps/api/src/modules/**/*.ts"],
    ignores: ["apps/api/src/**/*.controller.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: modulePrivateImports,
              message:
                "Usa los proveedores exportados por el módulo mediante su index.ts.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/web/src/app/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["@features/*", "@core/*"] },
      ],
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { globals: { module: "readonly", require: "readonly" } },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        Buffer: "readonly",
      },
    },
  },
);
