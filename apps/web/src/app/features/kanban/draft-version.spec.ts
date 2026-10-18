import "@angular/compiler";
import { Injector, runInInjectionContext, signal } from "@angular/core";
import { BoardView, ColumnView, TaskView } from "@azul/contracts";
import { Api, ApiError } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { ShellState } from "@core/shell/shell-state";
import { describe, expect, it, vi } from "vitest";
import { BoardStore } from "./board-store";
import { ColumnStore } from "./column-store";
import { draftVersion, sameColumnFields, sameTaskFields } from "./draft-version";

const task: TaskView = {
  id: "t1",
  projectId: "p",
  columnId: "todo",
  position: 0,
  title: "Tarea",
  description: "",
  priority: "MEDIUM",
  labels: ["UX"],
  checklist: [{ id: "1", text: "Paso", done: false }],
  assigneeId: null,
  dueDate: null,
  archived: false,
  createdAt: "2026-10-17T00:00:00Z",
};
const column: ColumnView = {
  id: "c1",
  name: "En curso",
  category: "ACTIVE",
  position: 2,
  wipLimit: 3,
};
function board(version: number, columns: ColumnView[]): BoardView {
  return {
    project: {
      id: "p",
      name: "P",
      description: "",
      version,
      role: "OWNER",
      demo: false,
      expiresAt: null,
    },
    columns,
    tasks: [],
    members: [],
  };
}

describe("draft base version", () => {
  it("advances over unrelated changes, including moving the edited task", () => {
    const base = { version: 4, value: task };
    expect(
      draftVersion(base, 7, { ...task, columnId: "done", position: 3 }, sameTaskFields),
    ).toBe(7);
  });
  it("keeps the opening version when the edited item changed remotely", () => {
    const base = { version: 4, value: task };
    for (const changed of [
      { ...task, title: "Otra" },
      { ...task, labels: [] },
      { ...task, checklist: [{ id: "1", text: "Paso", done: true }] },
      { ...task, assigneeId: "u2" },
    ])
      expect(draftVersion(base, 7, changed, sameTaskFields)).toBe(4);
    expect(draftVersion(base, 7, undefined, sameTaskFields)).toBe(4);
    expect(
      draftVersion(
        { version: 1, value: column },
        2,
        { ...column, wipLimit: 1 },
        sameColumnFields,
      ),
    ).toBe(1);
  });
  it("lets the column editor see a remote edit as a conflict and rebase after it", async () => {
    const confirmed = signal<BoardView | null>(board(1, [column]));
    const request = vi.fn(async (..._args: unknown[]) => ({}));
    const boardStore = {
      confirmed,
      board: confirmed,
      context: () => ({ id: "p", current: () => true }),
      refresh: vi.fn(async () => {}),
      async action(work: () => Promise<void>) {
        try {
          await work();
          return true;
        } catch {
          return false;
        }
      },
    };
    const injector = Injector.create({
      providers: [
        { provide: Api, useValue: { request } },
        { provide: BoardStore, useValue: boardStore },
        { provide: Notifications, useValue: { show: vi.fn() } },
        { provide: ShellState, useValue: { panel: signal(null) } },
      ],
    });
    const store = runInInjectionContext(injector, () => new ColumnStore());
    store.editColumn("c1");
    confirmed.set(board(2, [column]));
    await store.saveColumn();
    expect(request.mock.calls[0][2]).toMatchObject({ expectedVersion: 2 });
    store.editColumn("c1");
    confirmed.set(board(3, [{ ...column, name: "Revisión" }]));
    request.mockRejectedValueOnce(new ApiError(409, "VERSION_CONFLICT", "x"));
    await store.saveColumn();
    expect(request.mock.calls[1][2]).toMatchObject({ expectedVersion: 2 });
    await store.saveColumn();
    expect(request.mock.calls[2][2]).toMatchObject({ expectedVersion: 3 });
  });
});
