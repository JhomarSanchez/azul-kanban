import { CreateTask, UpdateTask } from "@azul/contracts";
describe("task command contracts", () => {
  it("keeps omitted fields out of a partial update", () => {
    expect(UpdateTask.parse({ expectedVersion: 3, archived: true })).toEqual({
      expectedVersion: 3,
      archived: true,
    });
    expect(
      UpdateTask.parse({ expectedVersion: 3, assigneeId: null, labels: [] }),
    ).toEqual({ expectedVersion: 3, assigneeId: null, labels: [] });
  });
  it("still fills defaults when a task is created", () => {
    expect(
      CreateTask.parse({ title: "Nueva", columnId: "c", expectedVersion: 0 }),
    ).toMatchObject({
      description: "",
      priority: "MEDIUM",
      labels: [],
      checklist: [],
      assigneeId: null,
      dueDate: null,
    });
  });
});
