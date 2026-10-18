import "@angular/compiler";
import { Injector, runInInjectionContext, signal } from "@angular/core";
import { Api, ApiError } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { SessionStore } from "@core/session/session-store";
import { ShellState } from "@core/shell/shell-state";
import { BoardStore } from "@features/kanban";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectStore } from "./project-store";
import { Workspace } from "./workspace";

afterEach(() => vi.unstubAllGlobals());
describe("workspace boot", () => {
  it("opens the person's projects when an invitation link has expired", async () => {
    vi.stubGlobal("location", { pathname: "/join/expired", search: "" });
    vi.stubGlobal("history", { replaceState: vi.fn() });
    const user = signal<unknown>(null);
    const projects = signal([{ id: "p1" }]);
    const open = vi.fn(async () => {});
    const error = vi.fn();
    const injector = Injector.create({
      providers: [
        {
          provide: Api,
          useValue: {
            request: vi.fn(async () => {
              throw new ApiError(410, "INVITATION_EXPIRED", "Caducado");
            }),
          },
        },
        {
          provide: SessionStore,
          useValue: {
            user,
            load: async () => user.set({ id: "u1", guest: false }),
          },
        },
        {
          provide: ProjectStore,
          useValue: { projects, load: vi.fn(async () => {}) },
        },
        { provide: BoardStore, useValue: { open } },
        {
          provide: ShellState,
          useValue: { close: vi.fn(), view: signal("board") },
        },
        { provide: Notifications, useValue: { error, show: vi.fn() } },
      ],
    });
    const workspace = runInInjectionContext(injector, () => new Workspace());
    await workspace.boot();
    expect(error).toHaveBeenCalledOnce();
    expect(workspace.joinToken()).toBe("");
    expect(workspace.invitation()).toBeNull();
    expect(open).toHaveBeenCalledWith("p1");
    expect(workspace.loading()).toBe(false);
  });
});
