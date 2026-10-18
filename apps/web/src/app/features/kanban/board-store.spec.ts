import "@angular/compiler";
import { Injector, runInInjectionContext } from "@angular/core";
import { BoardView } from "@azul/contracts";
import { Api, ApiError } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { Realtime } from "@core/realtime/realtime";
import { ShellState } from "@core/shell/shell-state";
import { ActivityStore } from "@features/activity";
import { MetricsStore } from "@features/metrics";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoardStore } from "./board-store";
import { projectMove } from "./movement";

function snapshot(id = "project", version = 1): BoardView {
  return {
    project: {
      id,
      version,
      name: id,
      description: "",
      role: "OWNER",
      demo: false,
      expiresAt: null,
    },
    columns: [
      {
        id: "todo",
        name: "Pendiente",
        category: "TODO",
        position: 0,
        wipLimit: null,
      },
      {
        id: "active",
        name: "En curso",
        category: "ACTIVE",
        position: 1,
        wipLimit: 2,
      },
    ],
    members: [],
    tasks: ["a", "b", "c"].map((task, position) => ({
      id: task,
      projectId: id,
      columnId: position === 2 ? "active" : "todo",
      position: position === 2 ? 0 : position,
      title: task,
      description: "",
      priority: "MEDIUM",
      labels: [],
      checklist: [],
      assigneeId: null,
      dueDate: null,
      archived: false,
      createdAt: "2026-10-17T00:00:00Z",
    })),
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function setup() {
  vi.stubGlobal("history", { replaceState: vi.fn() });
  let latest = snapshot();
  const request = vi.fn(async () => latest as unknown);
  const notices = { show: vi.fn(), error: vi.fn() };
  const injector = Injector.create({
    providers: [
      { provide: Api, useValue: { request } },
      { provide: Notifications, useValue: notices },
      {
        provide: Realtime,
        useValue: { connect: vi.fn(), disconnect: vi.fn() },
      },
      { provide: ShellState, useValue: { close: vi.fn() } },
      {
        provide: MetricsStore,
        useValue: { metrics: { set: vi.fn() }, load: vi.fn(async () => {}) },
      },
      {
        provide: ActivityStore,
        useValue: { activity: { set: vi.fn() }, load: vi.fn(async () => {}) },
      },
    ],
  });
  const store = runInInjectionContext(injector, () => new BoardStore());
  return {
    store,
    request,
    notices,
    setLatest: (value: BoardView) => {
      latest = value;
    },
  };
}
afterEach(() => vi.unstubAllGlobals());
describe("confirmed board and pending movement", () => {
  it("projects stable order without changing the confirmed snapshot or version", () => {
    const b = snapshot();
    const next = projectMove(b, {
      projectId: "project",
      taskId: "a",
      columnId: "active",
      position: 0,
      expectedVersion: 1,
    });
    expect(next.project.version).toBe(1);
    expect(b.tasks[0].columnId).toBe("todo");
    expect(
      next.tasks
        .filter((t) => t.columnId === "active")
        .sort((a, b) => a.position - b.position)
        .map((t) => t.id),
    ).toEqual(["a", "c"]);
    expect(new Set(next.tasks.map((t) => t.id)).size).toBe(3);
    const reordered = projectMove(b, {
      projectId: "project",
      taskId: "b",
      columnId: "todo",
      position: 0,
      expectedVersion: 1,
    });
    expect(
      reordered.tasks
        .filter((t) => t.columnId === "todo")
        .sort((a, b) => a.position - b.position)
        .map((t) => t.id),
    ).toEqual(["b", "a"]);
  });
  it("keeps the destination before the HTTP acknowledgement and through an old socket refresh", async () => {
    const { store, request, setLatest } = setup();
    await store.open("project");
    const command = deferred<{ version: number }>();
    request.mockImplementation(async (_url?: unknown, method?: unknown) =>
      method === "POST" ? command.promise : snapshot(),
    );
    const saving = store.move(store.board()!.tasks[0], "active", 0);
    expect(store.board()!.tasks[0].columnId).toBe("active");
    expect(store.confirmed()!.project.version).toBe(1);
    await store.refresh(false);
    expect(store.board()!.tasks[0].columnId).toBe("active");
    const result = projectMove(snapshot("project", 2), store.pendingMove());
    setLatest(result);
    request.mockImplementation(async (_url?: unknown, method?: unknown) =>
      method === "POST" ? command.promise : result,
    );
    command.resolve({ version: 2 });
    await saving;
    expect(store.pendingMove()).toBeNull();
    expect(store.confirmed()!.project.version).toBe(2);
  });
  it.each([409, 422, 403])(
    "reconciles a rejected movement (%s)",
    async (status) => {
      const { store, request } = setup();
      await store.open("project");
      request.mockImplementation(async (_url?: unknown, method?: unknown) => {
        if (method === "POST")
          throw new ApiError(status, "REJECTED", "Movimiento rechazado");
        return snapshot();
      });
      await store.move(store.board()!.tasks[0], "active", 0);
      expect(store.pendingMove()).toBeNull();
      expect(store.board()!.tasks[0].columnId).toBe("todo");
    },
  );
  it("does not retry a network failure and reconciles on manual refresh", async () => {
    const { store, request } = setup();
    await store.open("project");
    request.mockImplementation(async (_url?: unknown, method?: unknown) => {
      if (method === "POST") throw new ApiError(0, "NETWORK", "Sin conexión");
      return snapshot();
    });
    await store.move(store.board()!.tasks[0], "active", 0);
    expect(store.pendingMove()?.uncertain).toBe(true);
    await store.refresh();
    expect(store.pendingMove()).toBeNull();
    expect(
      request.mock.calls.filter((call) => call[1] === "POST"),
    ).toHaveLength(1);
  });
  it("ignores a movement response after a project switch", async () => {
    const { store, request, setLatest } = setup();
    await store.open("project");
    const command = deferred<{ version: number }>();
    request.mockImplementation(async (_url?: unknown, method?: unknown) =>
      method === "POST" ? command.promise : snapshot("other", 4),
    );
    const saving = store.move(store.board()!.tasks[0], "active", 0);
    await store.open("other");
    command.resolve({ version: 2 });
    await saving;
    expect(store.board()!.project.id).toBe("other");
    expect(store.pendingMove()).toBeNull();
    setLatest(snapshot("other", 3));
    request.mockResolvedValue(snapshot("other", 3));
    await store.refresh(false);
    expect(store.confirmed()!.project.version).toBe(4);
  });
  it("defers remote changes during a drag and serializes refresh requests", async () => {
    const { store, request } = setup();
    await store.open("project");
    store.startDrag();
    request.mockResolvedValue(snapshot("project", 2));
    await store.refresh(false);
    expect(store.confirmed()!.project.version).toBe(1);
    store.endDrag();
    expect(store.confirmed()!.project.version).toBe(2);
    const response = deferred<BoardView>();
    request.mockReturnValue(response.promise);
    const first = store.refresh();
    const second = store.refresh();
    expect(
      request.mock.calls.filter(
        (call) => call[0] === "/projects/project/board",
      ),
    ).toHaveLength(3);
    response.resolve(snapshot("project", 3));
    await Promise.all([first, second]);
    expect(store.confirmed()!.project.version).toBe(3);
  });
});
