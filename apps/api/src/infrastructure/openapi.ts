import * as contracts from "@azul/contracts";
import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import "reflect-metadata";
import { z } from "zod";

export function setupOpenApi(app: INestApplication) {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Azul API")
      .setDescription(
        "Kanban colaborativo, métricas y propuestas de IA. Sesión por cookie; mutaciones requieren X-CSRF-Token.",
      )
      .setVersion("1.0")
      .addCookieAuth("azul_session")
      .build(),
  );
  document.components ??= {};
  document.components.schemas ??= {};
  for (const [name, schema] of Object.entries(contracts))
    if (schema instanceof z.ZodType)
      document.components.schemas[name] = z.toJSONSchema(schema, {
        io: "input",
        unrepresentable: "any",
      }) as any;
  const bodySchemas: Record<string, string> = {
    "/api/v1/auth/register": "Credentials",
    "/api/v1/auth/login": "Credentials",
    "/api/v1/projects": "ProjectInput",
    "/api/v1/projects/{projectId}/tasks": "CreateTask",
    "/api/v1/projects/{projectId}/tasks/{taskId}": "UpdateTask",
    "/api/v1/projects/{projectId}/tasks/{taskId}/move": "MoveTask",
    "/api/v1/projects/{projectId}/columns": "ColumnInput",
    "/api/v1/projects/{projectId}/ai/accept": "AcceptProposal",
  };
  for (const [path, schema] of Object.entries(bodySchemas)) {
    const operation = document.paths[path]?.post ?? document.paths[path]?.patch;
    if (operation)
      operation.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${schema}` },
          },
        },
      };
  }
  const roleBody = z.object({ role: z.enum(["MEMBER", "VIEWER"]) });
  const extraBodies: [string, "post" | "patch" | "delete", z.ZodType][] = [
    [
      "/api/v1/projects/{projectId}/ai/proposals",
      "post",
      z.object({ idea: z.string().trim().min(5).max(2000) }),
    ],
    ["/api/v1/projects/{id}/invitations", "post", roleBody],
    ["/api/v1/projects/{id}/members/{userId}", "patch", roleBody],
    [
      "/api/v1/invitations/{token}/join",
      "post",
      z.object({ name: z.string().trim().min(2).max(80).optional() }),
    ],
    [
      "/api/v1/projects/{projectId}/tasks/{taskId}/comments",
      "post",
      contracts.Version.extend({ text: z.string().trim().min(1).max(2000) }),
    ],
    [
      "/api/v1/projects/{projectId}/columns/{columnId}",
      "patch",
      contracts.ColumnInput,
    ],
    [
      "/api/v1/projects/{projectId}/columns/{columnId}",
      "delete",
      contracts.Version,
    ],
  ];
  for (const [path, method, schema] of extraBodies) {
    const operation = document.paths[path]?.[method];
    if (operation)
      operation.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: z.toJSONSchema(schema, {
              io: "input",
              unrepresentable: "any",
            }) as any,
          },
        },
      };
  }
  for (const [path, item] of Object.entries(document.paths))
    for (const method of ["post", "patch", "delete"] as const) {
      const operation = item?.[method];
      if (
        operation &&
        !path.startsWith("/api/v1/auth/login") &&
        !path.startsWith("/api/v1/auth/register") &&
        path !== "/api/v1/demo"
      ) {
        operation.parameters ??= [];
        operation.parameters.push({
          name: "X-CSRF-Token",
          in: "header",
          required: !path.endsWith("/join"),
          schema: { type: "string" },
          description:
            "Token devuelto por GET /api/v1/auth/session; necesario cuando hay sesión.",
        });
      }
    }
  SwaggerModule.setup("api/docs", app, document);
}
