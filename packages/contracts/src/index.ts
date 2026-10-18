import { z } from "zod";

export const Role = z.enum(["OWNER", "MEMBER", "VIEWER"]);
export const Category = z.enum(["TODO", "ACTIVE", "DONE"]);
export const Priority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const Version = z.object({
  expectedVersion: z.number().int().nonnegative(),
});
export const Credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(10).max(128),
  name: z.string().trim().min(2).max(80).optional(),
});
export const ProjectInput = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default(""),
});
export const ChecklistItem = z.object({
  id: z.string().max(80),
  text: z.string().trim().min(1).max(300),
  done: z.boolean(),
});
const EditableTaskFields = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(6000),
  priority: Priority,
  labels: z.array(z.string().trim().min(1).max(30)).max(8),
  checklist: z.array(ChecklistItem).max(30),
  assigneeId: z.string().nullable(),
  dueDate: z.iso.datetime().nullable(),
});
export const TaskFields = EditableTaskFields.extend({
  description: EditableTaskFields.shape.description.default(""),
  priority: EditableTaskFields.shape.priority.default("MEDIUM"),
  labels: EditableTaskFields.shape.labels.default([]),
  checklist: EditableTaskFields.shape.checklist.default([]),
  assigneeId: EditableTaskFields.shape.assigneeId.default(null),
  dueDate: EditableTaskFields.shape.dueDate.default(null),
});
export const CreateTask = TaskFields.extend({
  columnId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
});
// Without defaults: Zod 4 applies defaults inside partial objects and would erase omitted fields.
export const UpdateTask = EditableTaskFields.partial().extend({
  archived: z.boolean().optional(),
  expectedVersion: z.number().int().nonnegative(),
});
export const MoveTask = Version.extend({
  columnId: z.string().min(1),
  position: z.number().int().nonnegative(),
});
export const ColumnInput = Version.extend({
  name: z.string().trim().min(1).max(40),
  category: Category,
  wipLimit: z.number().int().min(1).max(100).nullable().default(null),
});
export const ProposedTask = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000),
  priority: Priority,
  acceptanceCriteria: z.array(z.string().min(1).max(300)).min(1).max(6),
});
export const ProposalOutput = z.object({
  tasks: z.array(ProposedTask).min(1).max(8),
});
export const InsightOutput = z.object({
  observations: z
    .array(
      z.object({
        text: z.string().max(1000),
        taskIds: z.array(z.string()).max(10),
        metricKeys: z
          .array(
            z.enum([
              "cycleTime",
              "leadTime",
              "throughput",
              "wip",
              "columnTime",
              "reopens",
            ]),
          )
          .max(6),
      }),
    )
    .max(6),
});
export const AcceptProposal = Version.extend({
  proposalId: z.string(),
  tasks: z
    .array(ProposedTask.extend({ sourceIndex: z.number().int().nonnegative() }))
    .min(1)
    .max(8),
  columnId: z.string(),
});
export const BoardInvalidation = z.object({
  eventId: z.string(),
  projectId: z.string(),
  version: z.number().int(),
  type: z.string(),
});
export interface UserView {
  id: string;
  name: string;
  email: string | null;
  guest: boolean;
}
export interface ProjectView {
  id: string;
  name: string;
  description: string;
  version: number;
  role: z.infer<typeof Role>;
  demo: boolean;
  expiresAt: string | null;
}
export interface TaskView extends z.infer<typeof TaskFields> {
  id: string;
  projectId: string;
  columnId: string;
  position: number;
  archived: boolean;
  createdAt: string;
}
export interface ColumnView {
  id: string;
  name: string;
  category: z.infer<typeof Category>;
  position: number;
  wipLimit: number | null;
}
export interface MemberView {
  id: string;
  userId: string;
  name: string;
  role: z.infer<typeof Role>;
}
export interface BoardView {
  project: ProjectView;
  columns: ColumnView[];
  tasks: TaskView[];
  members: MemberView[];
}
export interface ActivityView {
  id: string;
  type: string;
  taskId: string | null;
  actor: string;
  title: string;
  createdAt: string;
}
export interface MetricsView {
  sampleSize: number;
  cycleTime: number | null;
  leadTime: number | null;
  wip: number;
  reopens: number;
  throughput: { week: string; count: number }[];
  columnTime: { id: string; name: string; hours: number }[];
  completed: number;
  total: number;
}
export interface ProposalView {
  id: string;
  provider: "simulated" | "openai";
  tasks: z.infer<typeof ProposedTask>[];
  accepted: boolean;
}
export interface AnalysisView extends z.infer<typeof InsightOutput> {
  provider: "simulated" | "openai";
}
export interface ErrorView {
  code: string;
  message: string;
  requestId?: string;
}
