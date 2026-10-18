import "@angular/compiler";
import { Injector, runInInjectionContext } from "@angular/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Api, ApiError } from "./api";

function respond(status: number, body: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body || null, { status })),
  );
  return runInInjectionContext(Injector.create({ providers: [] }), () =>
    new Api().request("/projects", "POST", {}),
  );
}
async function failure(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("expected a failure");
}
afterEach(() => vi.unstubAllGlobals());
describe("HTTP transport", () => {
  it("keeps the code and message of API errors", async () => {
    const error = await failure(
      respond(409, JSON.stringify({ code: "VERSION_CONFLICT", message: "Cambió" })),
    );
    expect([error.status, error.code, error.message]).toEqual([
      409,
      "VERSION_CONFLICT",
      "Cambió",
    ]);
  });
  it("reports a non-JSON rejection as the server's answer, not a lost connection", async () => {
    const error = await failure(respond(413, "<html>Payload Too Large</html>"));
    expect(error.status).toBe(413);
    expect(error.code).toBe("REQUEST_FAILED");
    expect(error.message).toContain("413");
  });
  it("treats a gateway page as an uncertain result", async () => {
    const error = await failure(respond(502, "<html>Bad Gateway</html>"));
    expect([error.status, error.code]).toEqual([0, "NETWORK"]);
  });
  it("accepts an empty successful body", async () => {
    await expect(respond(204, "")).resolves.toBeUndefined();
  });
});
