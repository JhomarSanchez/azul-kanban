import { HttpException } from "@nestjs/common";
import { User } from "@prisma/client";
import { Request } from "express";
import { z } from "zod";
import { settings } from "../settings";
export interface ActorRequest extends Request {
  actor: User;
  sessionId: string;
  csrf: string;
  requestId: string;
}
export function fail(
  status: number,
  message: string,
  code = "REQUEST_FAILED",
): never {
  throw new HttpException({ message, code }, status);
}
export function parse<T extends z.ZodType>(
  schema: T,
  value: unknown,
): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success)
    fail(
      400,
      result.error.issues
        .map((i) => `${i.path.join(".") || "datos"}: ${i.message}`)
        .join("; "),
      "VALIDATION",
    );
  return result.data;
}
export function checkOrigin(request: Request) {
  const origin = request.get("origin");
  if (origin && origin !== settings.origin)
    fail(403, "Origen no autorizado.", "ORIGIN");
  if (request.get("sec-fetch-site") === "cross-site")
    fail(403, "Solicitud externa no autorizada.", "ORIGIN");
}
