import { ColumnView, TaskView } from "@azul/contracts";

/** The snapshot a form was opened from; its version is the basis of the edit. */
export interface DraftBase<T> {
  version: number;
  value: T;
}

/**
 * Keeps optimistic concurrency for long-lived forms. Unrelated board changes advance
 * the base silently; a remote change to the edited item keeps the old version so the
 * server rejects the save with a conflict instead of overwriting it.
 */
export function draftVersion<T>(
  base: DraftBase<T>,
  currentVersion: number,
  current: T | undefined,
  same: (a: T, b: T) => boolean,
) {
  return current !== undefined && same(base.value, current)
    ? Math.max(base.version, currentVersion)
    : base.version;
}

const json = (value: unknown) => JSON.stringify(value);

export function sameTaskFields(a: TaskView, b: TaskView) {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.priority === b.priority &&
    a.assigneeId === b.assigneeId &&
    a.dueDate === b.dueDate &&
    json(a.labels) === json(b.labels) &&
    json(a.checklist) === json(b.checklist)
  );
}

export function sameColumnFields(a: ColumnView, b: ColumnView) {
  return (
    a.name === b.name && a.category === b.category && a.wipLimit === b.wipLimit
  );
}
