import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";
import { ActorRequest } from "./contracts";
@Catch()
export class Errors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<ActorRequest>();
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) return;
    let status = error instanceof HttpException ? error.getStatus() : 500;
    const detail = error instanceof HttpException ? error.getResponse() : null;
    let body =
      typeof detail === "object" && detail
        ? (detail as any)
        : {
            code: "INTERNAL",
            message: "No pudimos completar la operación. Vuelve a intentarlo.",
          };
    if ((error as any)?.code === "P2002") {
      status = 409;
      body = { code: "DUPLICATE", message: "Ese registro ya existe." };
    }
    if (status === 500)
      console.error(
        JSON.stringify({
          requestId: request.requestId,
          error: error instanceof Error ? error.name : "UnknownError",
        }),
      );
    response.status(status).json({ ...body, requestId: request.requestId });
  }
}
