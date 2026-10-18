import { Injectable, signal } from "@angular/core";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
interface ErrorBody {
  code?: string;
  message?: string;
}
const invalid = Symbol("invalid");
const gatewayStatuses = new Set([502, 503, 504]);
function readJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return invalid;
  }
}
@Injectable({ providedIn: "root" })
export class Api {
  csrf = signal("");
  async request<T = unknown>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`/api/v1${path}`, {
        method,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.csrf(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const data = readJson(await response.text());
      if (data === invalid) {
        // A gateway error page means the command may or may not have reached the API.
        if (gatewayStatuses.has(response.status))
          throw new ApiError(
            0,
            "NETWORK",
            "El servidor no respondió. Comprobaremos el resultado al recuperar la conexión.",
          );
        throw new ApiError(
          response.status,
          response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED",
          response.ok
            ? "El servidor devolvió una respuesta que no pudimos leer."
            : `No pudimos completar la acción (error ${response.status}).`,
        );
      }
      if (!response.ok)
        throw new ApiError(
          response.status,
          (data as ErrorBody)?.code ?? "REQUEST_FAILED",
          (data as ErrorBody)?.message ?? "No pudimos completar la acción.",
        );
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        "NETWORK",
        "No pudimos conectar. Comprueba tu conexión y vuelve a intentarlo.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
