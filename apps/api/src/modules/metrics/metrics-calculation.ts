import { MetricsView } from "@azul/contracts";
interface MetricTask {
  id: string;
  columnId: string;
  archived: boolean;
  createdAt: Date;
  firstStartedAt: Date | null;
  firstCompletedAt: Date | null;
}
interface MetricColumn {
  id: string;
  name: string;
  category: string;
}
interface MetricEvent {
  taskId: string | null;
  type: string;
  createdAt: Date;
  payload: any;
}
const hour = 3600000;
export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
export function weekKey(date: Date) {
  const local = new Date(date.getTime() - 5 * hour);
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - ((local.getUTCDay() + 6) % 7));
  return local.toISOString().slice(0, 10);
}
export function calculateMetrics(
  tasks: MetricTask[],
  columns: MetricColumn[],
  events: MetricEvent[],
  now = new Date(),
): MetricsView {
  const since = now.getTime() - 28 * 24 * hour;
  const completed = tasks.filter(
    (t) =>
      t.firstCompletedAt &&
      t.firstCompletedAt.getTime() >= since &&
      t.firstCompletedAt <= now,
  );
  const cycle = completed
    .filter((t) => t.firstStartedAt && t.firstStartedAt <= t.firstCompletedAt!)
    .map((t) =>
      (t.firstCompletedAt!.getTime() - t.firstStartedAt!.getTime()) / hour,
    );
  const lead = completed.map(
    (t) => (t.firstCompletedAt!.getTime() - t.createdAt.getTime()) / hour,
  );
  const weeks = new Map<string, number>();
  for (let n = 4; n >= 0; n--)
    weeks.set(weekKey(new Date(now.getTime() - n * 7 * 24 * hour)), 0);
  for (const task of completed) {
    const key = weekKey(task.firstCompletedAt!);
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }
  const columnMap = new Map(columns.map((c) => [c.id, c]));
  const durations = new Map<string, number>();
  const current = new Map<string, { columnId: string; start: number }>();
  let reopens = 0;
  for (const event of [...events].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )) {
    if (!event.taskId) continue;
    if (
      event.type === "task.moved" &&
      event.payload?.fromCategory === "DONE" &&
      event.payload?.toCategory !== "DONE" &&
      event.createdAt.getTime() >= since
    )
      reopens++;
    if (!["task.created", "task.moved", "task.archived"].includes(event.type))
      continue;
    const previous = current.get(event.taskId);
    if (previous)
      durations.set(
        previous.columnId,
        (durations.get(previous.columnId) ?? 0) +
          Math.max(
            0,
            Math.min(now.getTime(), event.createdAt.getTime()) -
              Math.max(since, previous.start),
          ) /
            hour,
      );
    if (event.type === "task.archived") current.delete(event.taskId);
    else if (event.payload?.to)
      current.set(event.taskId, {
        columnId: event.payload.to,
        start: event.createdAt.getTime(),
      });
  }
  for (const value of current.values())
    durations.set(
      value.columnId,
      (durations.get(value.columnId) ?? 0) +
        Math.max(0, now.getTime() - Math.max(since, value.start)) / hour,
    );
  return {
    sampleSize: completed.length,
    cycleTime: median(cycle),
    leadTime: median(lead),
    wip: tasks.filter(
      (t) => !t.archived && columnMap.get(t.columnId)?.category === "ACTIVE",
    ).length,
    reopens,
    throughput: [...weeks].map(([week, count]) => ({ week, count })),
    columnTime: columns.map((c) => ({
      id: c.id,
      name: c.name,
      hours: Math.round((durations.get(c.id) ?? 0) * 10) / 10,
    })),
    completed: tasks.filter(
      (t) => !t.archived && columnMap.get(t.columnId)?.category === "DONE",
    ).length,
    total: tasks.filter((t) => !t.archived).length,
  };
}
