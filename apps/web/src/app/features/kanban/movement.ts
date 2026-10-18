import { BoardView } from "@azul/contracts";

export interface PendingMove {
  projectId: string;
  taskId: string;
  columnId: string;
  position: number;
  expectedVersion: number;
  acknowledgedVersion?: number;
  uncertain?: boolean;
}

/** A visual projection; the confirmed project version always belongs to REST. */
export function projectMove(
  board: BoardView,
  move: PendingMove | null,
): BoardView {
  if (!move || move.projectId !== board.project.id) return board;
  const task = board.tasks.find((task) => task.id === move.taskId);
  if (!task || !board.columns.some((column) => column.id === move.columnId))
    return board;
  const target = board.tasks
    .filter(
      (task) => task.columnId === move.columnId && task.id !== move.taskId,
    )
    .sort((a, b) => a.position - b.position);
  target.splice(Math.min(move.position, target.length), 0, {
    ...task,
    columnId: move.columnId,
  });
  const positions = new Map(
    target.map((task, position) => [task.id, position]),
  );
  const source = board.tasks
    .filter((item) => item.columnId === task.columnId && item.id !== task.id)
    .sort((a, b) => a.position - b.position);
  const sourcePositions = new Map(
    source.map((task, position) => [task.id, position]),
  );
  return {
    ...board,
    tasks: board.tasks.map((item) => {
      const position = positions.get(item.id);
      if (position !== undefined)
        return { ...item, columnId: move.columnId, position };
      const sourcePosition = sourcePositions.get(item.id);
      return sourcePosition === undefined
        ? item
        : { ...item, position: sourcePosition };
    }),
  };
}
