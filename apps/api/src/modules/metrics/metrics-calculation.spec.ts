import { calculateMetrics, median, weekKey } from "./metrics-calculation";
describe("flow metrics", () => {
  const columns = [
    { id: "todo", name: "Por hacer", category: "TODO" },
    { id: "active", name: "En curso", category: "ACTIVE" },
    { id: "done", name: "Terminado", category: "DONE" },
  ];
  const date = (value: string) => new Date(value);
  it("returns null for an empty sample", () => {
    const m = calculateMetrics([], columns, [], date("2026-10-17T12:00:00Z"));
    expect(m.cycleTime).toBeNull();
    expect(m.leadTime).toBeNull();
    expect(m.wip).toBe(0);
  });
  it("keeps the first delivery stable across reopening, archive and column revisits", () => {
    const task = {
      id: "t1",
      columnId: "active",
      archived: false,
      createdAt: date("2026-10-12T12:00:00Z"),
      firstStartedAt: date("2026-10-13T12:00:00Z"),
      firstCompletedAt: date("2026-10-14T12:00:00Z"),
    };
    const events = [
      {
        taskId: "t1",
        type: "task.created",
        createdAt: task.createdAt,
        payload: { to: "todo" },
      },
      {
        taskId: "t1",
        type: "task.moved",
        createdAt: task.firstStartedAt,
        payload: { from: "todo", to: "active" },
      },
      {
        taskId: "t1",
        type: "task.moved",
        createdAt: task.firstCompletedAt,
        payload: {
          from: "active",
          to: "done",
          fromCategory: "ACTIVE",
          toCategory: "DONE",
        },
      },
      {
        taskId: "t1",
        type: "task.moved",
        createdAt: date("2026-10-15T12:00:00Z"),
        payload: {
          from: "done",
          to: "active",
          fromCategory: "DONE",
          toCategory: "ACTIVE",
        },
      },
    ];
    const m = calculateMetrics(
      [task],
      columns,
      events,
      date("2026-10-16T12:00:00Z"),
    );
    expect(m.cycleTime).toBe(24);
    expect(m.leadTime).toBe(48);
    expect(m.sampleSize).toBe(1);
    expect(m.reopens).toBe(1);
    expect(m.wip).toBe(1);
    expect(m.columnTime.find((c) => c.id === "active")?.hours).toBe(48);
    expect(m.throughput.reduce((sum, w) => sum + w.count, 0)).toBe(1);
    const archived = calculateMetrics(
      [{ ...task, archived: true }],
      columns,
      [
        ...events,
        {
          taskId: "t1",
          type: "task.archived",
          createdAt: date("2026-10-16T00:00:00Z"),
          payload: {},
        },
      ],
      date("2026-10-17T12:00:00Z"),
    );
    expect(archived.wip).toBe(0);
    expect(archived.sampleSize).toBe(1);
    expect(archived.columnTime.find((c) => c.id === "active")?.hours).toBe(36);
  });
  it("clips time at the period boundary", () => {
    const now = date("2026-10-17T12:00:00Z");
    const events = [
      {
        taskId: "old",
        type: "task.created",
        createdAt: date("2026-01-01T00:00:00Z"),
        payload: { to: "todo" },
      },
    ];
    expect(calculateMetrics([], columns, events, now).columnTime[0].hours).toBe(
      28 * 24,
    );
  });
  it("excludes missing starts and historical starts after the first delivery", () => {
    const task = {
      id: "valid", columnId: "active", archived: false,
      createdAt: date("2026-10-12T12:00:00Z"),
      firstStartedAt: date("2026-10-13T12:00:00Z"),
      firstCompletedAt: date("2026-10-14T12:00:00Z"),
    };
    const unknown = [
      { ...task, id: "missing", firstStartedAt: null },
      { ...task, id: "legacy", firstStartedAt: date("2026-10-15T12:00:00Z") },
    ];
    const now = date("2026-10-16T12:00:00Z");
    expect(calculateMetrics(unknown, columns, [], now).cycleTime).toBeNull();
    const metrics = calculateMetrics([task, ...unknown], columns, [], now);
    expect(metrics.cycleTime).toBe(24);
    expect(metrics.sampleSize).toBe(3);
    expect(metrics.leadTime).toBe(48);
  });
  it("uses Mondays in Bogota including Sunday UTC crossing", () => {
    expect(weekKey(date("2026-10-19T02:00:00Z"))).toBe("2026-10-12");
    expect(weekKey(date("2026-10-19T05:00:00Z"))).toBe("2026-10-19");
    expect(median([3, 1, 9, 5])).toBe(4);
  });
});
