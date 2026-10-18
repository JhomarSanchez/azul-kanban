import { INestApplication } from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import request from "supertest";
import { Database } from "../infrastructure/database";
import { settings } from "../infrastructure/settings";
import { createApp } from "../main";
import { AiTransport } from "../modules/ai";
import { Collaboration } from "../modules/collaboration";
import { DemoCleanupService } from "../modules/demo";
import { InvitationJoinService } from "../modules/projects/invitation-join.service";
describe("PostgreSQL integration", () => {
  let app: INestApplication;
  let db: Database;
  let projectId: string;
  let owner: any;
  let outsider: any;
  let viewer: any;
  let ownerCsrf: string;
  let viewerCsrf: string;
  let cookie = "";
  let viewerCookie = "";
  let socket: Socket | undefined;
  const tasksPath = () => `/api/v1/projects/${projectId}/tasks`;
  const board = () => owner.get(`/api/v1/projects/${projectId}/board`);
  beforeAll(async () => {
    if (!new URL(settings.databaseUrl).pathname.endsWith("_test"))
      throw new Error(
        "Integration tests require a dedicated DATABASE_URL ending in _test.",
      );
    app = await createApp();
    await app.listen(0, "127.0.0.1");
    db = app.get(Database);
    await db.$executeRawUnsafe(
      'TRUNCATE TABLE "User", "Project", "AiBudget" CASCADE',
    );
    owner = request.agent(app.getHttpServer());
    outsider = request.agent(app.getHttpServer());
    viewer = request.agent(app.getHttpServer());
    const registration = await owner
      .post("/api/v1/auth/register")
      .send({
        name: "Propietario",
        email: "owner@example.test",
        password: "A-long-password-123",
      })
      .expect(201);
    ownerCsrf = registration.body.csrf;
    cookie = registration.headers["set-cookie"][0].split(";")[0];
    expect(registration.headers["set-cookie"][0]).toContain("HttpOnly");
    await outsider
      .post("/api/v1/auth/register")
      .send({
        name: "Otro equipo",
        email: "outsider@example.test",
        password: "A-long-password-123",
      })
      .expect(201);
    const viewerRegistration = await viewer
      .post("/api/v1/auth/register")
      .send({
        name: "Observador",
        email: "viewer@example.test",
        password: "A-long-password-123",
      })
      .expect(201);
    viewerCsrf = viewerRegistration.body.csrf;
    viewerCookie = viewerRegistration.headers["set-cookie"][0].split(";")[0];
    const project = await owner
      .post("/api/v1/projects")
      .set("X-CSRF-Token", ownerCsrf)
      .send({ name: "Proyecto de prueba", description: "Pruebas verificables" })
      .expect(201);
    projectId = project.body.id;
  });
  afterAll(async () => {
    socket?.disconnect();
    if (app) await app.close();
  });
  it("enforces CSRF, origins, project boundaries and viewer role", async () => {
    await owner.post(tasksPath()).send({}).expect(403);
    await owner
      .post(tasksPath())
      .set("X-CSRF-Token", ownerCsrf)
      .set("Origin", "https://untrusted.example")
      .send({})
      .expect(403);
    await outsider.get(`/api/v1/projects/${projectId}/board`).expect(404);
    const invite = await owner
      .post(`/api/v1/projects/${projectId}/invitations`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({ role: "VIEWER" })
      .expect(201);
    await viewer
      .post(`/api/v1/invitations/${invite.body.token}/join`)
      .set("X-CSRF-Token", viewerCsrf)
      .send({})
      .expect(201);
    const state = await viewer
      .get(`/api/v1/projects/${projectId}/board`)
      .expect(200);
    expect(state.body.project.role).toBe("VIEWER");
    await viewer
      .post(tasksPath())
      .set("X-CSRF-Token", viewerCsrf)
      .send({
        title: "No permitido",
        columnId: state.body.columns[0].id,
        expectedVersion: 0,
      })
      .expect(403);
  });
  it("serializes concurrent writes and records only the accepted mutation", async () => {
    const state = (await board()).body;
    const body = {
      title: "Cambio concurrente",
      columnId: state.columns[0].id,
      expectedVersion: state.project.version,
    };
    const responses = await Promise.all([
      owner.post(tasksPath()).set("X-CSRF-Token", ownerCsrf).send(body),
      owner.post(tasksPath()).set("X-CSRF-Token", ownerCsrf).send(body),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const after = (await board()).body;
    expect(after.project.version).toBe(state.project.version + 1);
    expect(after.tasks).toHaveLength(1);
    expect(
      await db.activity.count({ where: { projectId, type: "task.created" } }),
    ).toBe(1);
  });
  it("enforces WIP and task membership constraints", async () => {
    let state = (await board()).body;
    const active = state.columns.find((c: any) => c.category === "ACTIVE");
    await owner
      .patch(`/api/v1/projects/${projectId}/columns/${active.id}`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({
        name: active.name,
        category: active.category,
        wipLimit: 1,
        expectedVersion: state.project.version,
      })
      .expect(200);
    state = (await board()).body;
    await owner
      .post(tasksPath())
      .set("X-CSRF-Token", ownerCsrf)
      .send({
        title: "Trabajo activo",
        columnId: active.id,
        expectedVersion: state.project.version,
      })
      .expect(201);
    state = (await board()).body;
    await owner
      .post(tasksPath())
      .set("X-CSRF-Token", ownerCsrf)
      .send({
        title: "Supera WIP",
        columnId: active.id,
        expectedVersion: state.project.version,
      })
      .expect(422);
    await owner
      .patch(`${tasksPath()}/${state.tasks[0].id}`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({
        assigneeId: "not-a-member",
        expectedVersion: state.project.version,
      })
      .expect(400);
  });
  it("publishes authorized invalidations and recovers persisted changes after reconnect", async () => {
    socket = io(await app.getUrl(), {
      extraHeaders: { Cookie: cookie, Origin: settings.origin },
      transports: ["websocket"],
      forceNew: true,
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("socket connect timeout")),
        7000,
      );
      socket!.once("connect", () => {
        socket!.emit("project:subscribe", projectId, (ack: any) => {
          clearTimeout(timeout);
          if (ack.ok) resolve();
          else reject(new Error("subscription rejected"));
        });
      });
    });
    const state = (await board()).body;
    const received = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("outbox timeout")),
        7000,
      );
      socket!.on("board:changed", (event) => {
        if (event.version > state.project.version) {
          clearTimeout(timeout);
          resolve(event);
        }
      });
    });
    await owner
      .post(tasksPath())
      .set("X-CSRF-Token", ownerCsrf)
      .send({
        title: "Visible en vivo",
        columnId: state.columns[0].id,
        expectedVersion: state.project.version,
      })
      .expect(201);
    expect((await received).projectId).toBe(projectId);
    socket.disconnect();
    const offline = (await board()).body;
    await owner
      .post(tasksPath())
      .set("X-CSRF-Token", ownerCsrf)
      .send({
        title: "Guardado sin conexión",
        columnId: offline.columns[0].id,
        expectedVersion: offline.project.version,
      })
      .expect(201);
    socket.connect();
    await new Promise<void>((resolve) =>
      socket!.once("connect", () => resolve()),
    );
    expect(
      (await board()).body.tasks.some(
        (t: any) => t.title === "Guardado sin conexión",
      ),
    ).toBe(true);
    await app.get(Collaboration).flush();
    expect(
      await db.activity.count({ where: { projectId, publishedAt: null } }),
    ).toBe(0);
  });
  it("validates and accepts edited AI proposals idempotently", async () => {
    await owner
      .post(`/api/v1/projects/${projectId}/ai/proposals`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({ idea: "x" })
      .expect(400);
    const proposal = await owner
      .post(`/api/v1/projects/${projectId}/ai/proposals`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({ idea: "Implementar registro de usuarios" })
      .expect(201);
    expect(proposal.body.provider).toBe("simulated");
    const state = (await board()).body;
    const body = {
      expectedVersion: state.project.version,
      proposalId: proposal.body.id,
      columnId: state.columns[0].id,
      tasks: [
        {
          ...proposal.body.tasks[0],
          title: "Título editado por una persona",
          sourceIndex: 0,
        },
      ],
    };
    const accepted = await owner
      .post(`/api/v1/projects/${projectId}/ai/accept`)
      .set("X-CSRF-Token", ownerCsrf)
      .send(body)
      .expect(201);
    const second = await owner
      .post(`/api/v1/projects/${projectId}/ai/accept`)
      .set("X-CSRF-Token", ownerCsrf)
      .send(body)
      .expect(201);
    expect(second.body.alreadyAccepted).toBe(true);
    expect(second.body.result).toEqual(accepted.body.result);
    expect(
      (await board()).body.tasks.filter(
        (t: any) => t.title === "Título editado por una persona",
      ),
    ).toHaveLength(1);
    const analysis = await owner
      .post(`/api/v1/projects/${projectId}/ai/analysis`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({})
      .expect(201);
    expect(analysis.body.observations[1].text).toContain("insuficiente");
  });
  it("isolates demos, enforces their AI quota and expires invitation links", async () => {
    const a = request.agent(app.getHttpServer());
    const b = request.agent(app.getHttpServer());
    const da = (await a.post("/api/v1/demo").send({}).expect(201)).body;
    const dbb = (await b.post("/api/v1/demo").send({}).expect(201)).body;
    expect(da.projectId).not.toBe(dbb.projectId);
    await b.get(`/api/v1/projects/${da.projectId}/board`).expect(404);
    for (let i = 0; i < 3; i++)
      await a
        .post(`/api/v1/projects/${da.projectId}/ai/analysis`)
        .set("X-CSRF-Token", da.csrf)
        .send({})
        .expect(201);
    await a
      .post(`/api/v1/projects/${da.projectId}/ai/analysis`)
      .set("X-CSRF-Token", da.csrf)
      .send({})
      .expect(429);
    const invite = (
      await a
        .post(`/api/v1/projects/${da.projectId}/invitations`)
        .set("X-CSRF-Token", da.csrf)
        .send({ role: "MEMBER" })
        .expect(201)
    ).body;
    const guest = request.agent(app.getHttpServer());
    await guest
      .post(`/api/v1/invitations/${invite.token}/join`)
      .send({})
      .expect(201);
    await guest.get(`/api/v1/projects/${da.projectId}/board`).expect(200);
    await db.project.update({
      where: { id: da.projectId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await a.get(`/api/v1/projects/${da.projectId}/board`).expect(410);
    await guest.get(`/api/v1/invitations/${invite.token}`).expect(410);
    await app.get(DemoCleanupService).cleanup();
    expect(
      await db.project.findUnique({ where: { id: da.projectId } }),
    ).toBeNull();
  });
  it("reserves budget before admission", async () => {
    const previous = process.env.OPENAI_API_KEY;
    const previousBudget = process.env.AI_MONTHLY_BUDGET_USD;
    process.env.OPENAI_API_KEY = "test-key-never-sent";
    process.env.AI_MONTHLY_BUDGET_USD = "0.000001";
    try {
      await owner
        .post(`/api/v1/projects/${projectId}/ai/analysis`)
        .set("X-CSRF-Token", ownerCsrf)
        .send({})
        .expect(429);
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
      if (previousBudget === undefined)
        delete process.env.AI_MONTHLY_BUDGET_USD;
      else process.env.AI_MONTHLY_BUDGET_USD = previousBudget;
    }
  });
  it("rejects malformed provider data and exposes upstream failures without retrying", async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key-never-sent";
    const transport = jest.spyOn(app.get(AiTransport), "generate");
    try {
      transport.mockResolvedValueOnce({
        status: "completed",
        output_parsed: { tasks: [] },
        usage: { input_tokens: 20, output_tokens: 30 },
      } as any);
      const invalid = await owner
        .post(`/api/v1/projects/${projectId}/ai/proposals`)
        .set("X-CSRF-Token", ownerCsrf)
        .send({ idea: "Planificar una funcionalidad" })
        .expect(502);
      expect(invalid.body.code).toBe("AI_INVALID_OUTPUT");
      transport.mockRejectedValueOnce(new Error("provider offline"));
      const failed = await owner
        .post(`/api/v1/projects/${projectId}/ai/analysis`)
        .set("X-CSRF-Token", ownerCsrf)
        .send({})
        .expect(502);
      expect(failed.body.code).toBe("AI_PROVIDER");
      expect(transport).toHaveBeenCalledTimes(2);
      expect(
        await db.aiRun.count({ where: { projectId, status: "failed" } }),
      ).toBe(2);
    } finally {
      transport.mockRestore();
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });
  it("keeps the budget reservation if successful provider output omits usage", async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key-never-sent";
    const month = new Date().toISOString().slice(0, 7);
    const before = await db.aiBudget.findUnique({ where: { month } });
    const transport = jest
      .spyOn(app.get(AiTransport), "generate")
      .mockResolvedValueOnce({
        status: "completed",
        output_parsed: { observations: [] },
      } as any);
    try {
      await owner
        .post(`/api/v1/projects/${projectId}/ai/analysis`)
        .set("X-CSRF-Token", ownerCsrf)
        .send({})
        .expect(201);
      const after = await db.aiBudget.findUniqueOrThrow({ where: { month } });
      expect(after.reservedUsd).toBeGreaterThan(before?.reservedUsd ?? 0);
      const run = await db.aiRun.findFirstOrThrow({
        where: { projectId, provider: "openai", status: "completed" },
        orderBy: { createdAt: "desc" },
      });
      expect(run.costUsd).toBeNull();
    } finally {
      transport.mockRestore();
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });
  it("keeps omitted task fields on partial updates and archive", async () => {
    let state = (await board()).body;
    const created = await owner
      .post(tasksPath())
      .set("X-CSRF-Token", ownerCsrf)
      .send({
        title: "Conservar campos",
        description: "Contexto importante",
        priority: "HIGH",
        labels: ["UX"],
        checklist: [{ id: "1", text: "Paso", done: false }],
        dueDate: "2026-10-20T17:00:00.000Z",
        columnId: state.columns[0].id,
        expectedVersion: state.project.version,
      })
      .expect(201);
    const id = created.body.result.id;
    await owner
      .patch(`${tasksPath()}/${id}`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({ title: "Conservar campos 2", expectedVersion: created.body.version })
      .expect(200);
    state = (await board()).body;
    expect(state.tasks.find((t: any) => t.id === id)).toMatchObject({
      title: "Conservar campos 2",
      description: "Contexto importante",
      priority: "HIGH",
      labels: ["UX"],
      checklist: [{ id: "1", text: "Paso", done: false }],
      dueDate: "2026-10-20T17:00:00.000Z",
    });
    await owner
      .patch(`${tasksPath()}/${id}`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({ archived: true, expectedVersion: state.project.version })
      .expect(200);
    expect(await db.task.findUniqueOrThrow({ where: { id } })).toMatchObject({
      archived: true,
      description: "Contexto importante",
      priority: "HIGH",
      labels: ["UX"],
    });
  });
  it("appends a new column after a deleted middle column", async () => {
    let state = (await board()).body;
    const middle = state.columns[1];
    expect(middle.category).toBe("TODO");
    await owner
      .delete(`/api/v1/projects/${projectId}/columns/${middle.id}`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({ expectedVersion: state.project.version })
      .expect(200);
    state = (await board()).body;
    await owner
      .post(`/api/v1/projects/${projectId}/columns`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({
        name: "Validación",
        category: "ACTIVE",
        expectedVersion: state.project.version,
      })
      .expect(201);
    const positions = (await board()).body.columns.map((c: any) => c.position);
    expect(new Set(positions).size).toBe(positions.length);
    expect((await board()).body.columns.at(-1).name).toBe("Validación");
  });
  it("validates join CSRF and leaves no guest when a link is revoked mid-join", async () => {
    const host = request.agent(app.getHttpServer());
    const demo = (await host.post("/api/v1/demo").send({}).expect(201)).body;
    const invite = (
      await host
        .post(`/api/v1/projects/${demo.projectId}/invitations`)
        .set("X-CSRF-Token", demo.csrf)
        .send({ role: "MEMBER" })
        .expect(201)
    ).body;
    await owner
      .post(`/api/v1/invitations/${invite.token}/join`)
      .set("X-CSRF-Token", ownerCsrf.slice(1) + "x")
      .send({})
      .expect(403);
    const joins = app.get(InvitationJoinService);
    const stale = await joins.invitation(invite.token);
    await host
      .delete(`/api/v1/projects/${demo.projectId}/invitations`)
      .set("X-CSRF-Token", demo.csrf)
      .send({})
      .expect(200);
    const guests = await db.user.count({ where: { guest: true } });
    const lookup = jest.spyOn(joins, "invitation").mockResolvedValueOnce(stale);
    try {
      await request(app.getHttpServer())
        .post(`/api/v1/invitations/${invite.token}/join`)
        .send({})
        .expect(410);
    } finally {
      lookup.mockRestore();
    }
    expect(await db.user.count({ where: { guest: true } })).toBe(guests);
  });
  it("revokes invitation links and removed member access", async () => {
    const invite = (
      await owner
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("X-CSRF-Token", ownerCsrf)
        .send({ role: "MEMBER" })
        .expect(201)
    ).body;
    await owner
      .delete(`/api/v1/projects/${projectId}/invitations`)
      .set("X-CSRF-Token", ownerCsrf)
      .send({})
      .expect(200);
    await outsider.get(`/api/v1/invitations/${invite.token}`).expect(410);
    const user = await db.user.findUniqueOrThrow({
      where: { email: "viewer@example.test" },
    });
    const viewerSocket = io(await app.getUrl(), {
      extraHeaders: { Cookie: viewerCookie, Origin: settings.origin },
      transports: ["websocket"],
      forceNew: true,
    });
    try {
      await new Promise<void>((resolve, reject) => {
        viewerSocket.once("connect", () =>
          viewerSocket.emit("project:subscribe", projectId, (ack: any) =>
            ack.ok ? resolve() : reject(new Error("subscription rejected")),
          ),
        );
      });
      const revoked = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("revocation timeout")),
          7000,
        );
        viewerSocket.once("project:revoked", () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      await owner
        .delete(`/api/v1/projects/${projectId}/members/${user.id}`)
        .set("X-CSRF-Token", ownerCsrf)
        .send({})
        .expect(200);
      await revoked;
    } finally {
      viewerSocket.disconnect();
    }
    await viewer.get(`/api/v1/projects/${projectId}/board`).expect(404);
  });
});
