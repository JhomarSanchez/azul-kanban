import { test, expect, Page, Locator } from "@playwright/test";
import { mkdirSync } from "node:fs";
import type { BoardView } from "@azul/contracts";

test.use({ viewport: { width: 1600, height: 1200 } });

test("panels retain focus and fit tablet and mobile layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await demo(page);
  mkdirSync(".impeccable/review", { recursive: true });
  await page.screenshot({
    animations: "disabled",
    path: ".impeccable/review/tablet.png",
    fullPage: true,
  });
  const invite = page.getByRole("button", { name: "Invitar", exact: true });
  await invite.click();
  await expect(
    page.getByRole("heading", { name: "Un espacio para cada persona." }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: ".impeccable/review/tablet-team.png",
  });
  await page.keyboard.press("Escape");
  await expect(invite).toBeFocused();
  await page
    .getByRole("button", { name: "Configurar columna Backlog", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Guardar columna", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: ".impeccable/review/tablet-column.png",
  });
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Actividad", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "El trabajo también cuenta una historia",
    }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: ".impeccable/review/tablet-activity.png",
  });
  await page.getByRole("tab", { name: "Tablero", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await column(page, "Backlog").locator(".task-main").first().press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Detalle de tarea" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    animations: "disabled",
    path: ".impeccable/review/mobile-task.png",
  });
});
async function demo(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explorar la demo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lanzamiento de producto", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("En tiempo real", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Actualizar tablero", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("status")).toContainText(
    "Tu espacio de ejemplo está listo",
  );
  await page
    .getByRole("button", { name: "Cerrar mensaje", exact: true })
    .click();
}
const column = (page: Page, name: string) =>
  page
    .locator(".kanban-column")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
async function drag(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(),
    to = await target.boundingBox();
  if (!from || !to) throw Error("Las tarjetas y columnas deben ser visibles");
  await page.mouse.move(from.x + from.width / 2, from.y + 30);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + 35, {
    steps: 3,
  });
  await page.mouse.move(to.x + to.width / 2, to.y + 15, { steps: 20 });
  await page.mouse.up();
}

test("real drag stays in destination while HTTP is held, then supports reordering", async ({
  page,
}) => {
  await demo(page);
  const source = column(page, "Backlog").locator(".task-card").first();
  const id = (await source.getAttribute("data-task-id"))!;
  const destination = column(page, "Por hacer").locator(".task-list");
  const destinationId = (await destination.getAttribute("id"))!;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let requests = 0;
  await page.route("**/tasks/*/move", async (route) => {
    requests++;
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  const socketRefresh = page.waitForResponse(async (response) => {
    if (!response.url().endsWith("/board") || response.request().method() !== "GET") return false;
    const snapshot: BoardView = await response.json();
    return snapshot.tasks.some(task => task.id === id && task.columnId === destinationId);
  });
  try {
    await drag(page, source, destination);
    await expect.poll(() => requests).toBe(1);
    await socketRefresh;
    await expect(destination.locator(`[data-task-id="${id}"]`)).toBeVisible();
    expect(
      await page.evaluate(
        async ({ id, destinationId }) => {
          for (let frame = 0; frame < 12; frame++) {
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
            const cards = document.querySelectorAll(
              `[data-task-id="${id}"]:not(.cdk-drag-preview)`,
            );
            if (
              cards.length !== 1 ||
              cards[0].closest(".task-list")?.id !== destinationId
            )
              return false;
          }
          return true;
        },
        { id, destinationId },
      ),
    ).toBe(true);
  } finally {
    release();
  }
  await expect(page.getByRole("status")).toContainText("Tarea movida");
  await page.unroute("**/tasks/*/move");
  const second = destination.locator(".task-card").nth(1);
  const reorderedId = (await second.getAttribute("data-task-id"))!;
  const moved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/move") &&
      response.request().method() === "POST",
  );
  await drag(page, second, destination);
  expect((await moved).ok()).toBe(true);
  await expect(destination.locator(".task-card").first()).toHaveAttribute(
    "data-task-id",
    reorderedId,
  );
  await page
    .getByRole("button", { name: "Actualizar tablero", exact: true })
    .click();
  await expect(destination.locator(".task-card").first()).toHaveAttribute(
    "data-task-id",
    reorderedId,
  );
});

test("conflict and WIP rejection restore one card and explain the failure", async ({
  page,
}) => {
  await demo(page);
  for (const [status, code, message] of [
    [409, "VERSION_CONFLICT", "Otra persona actualizó el tablero."],
    [422, "WIP_LIMIT", "La columna alcanzó su límite WIP."],
  ] as const) {
    const source = column(page, "Backlog").locator(".task-card").first();
    const id = (await source.getAttribute("data-task-id"))!;
    await page.route("**/tasks/*/move", (route) =>
      route.fulfill({ status, json: { code, message } }),
    );
    await drag(page, source, column(page, "Por hacer").locator(".task-list"));
    await expect(page.getByRole("status")).toContainText(message);
    await expect(
      column(page, "Backlog").locator(`[data-task-id="${id}"]`),
    ).toBeVisible();
    await expect(page.locator(`[data-task-id="${id}"]`)).toHaveCount(1);
    await page.unroute("**/tasks/*/move");
  }
});

test("an uncertain movement is reconciled without resending the command", async ({
  page,
}) => {
  await demo(page);
  const source = column(page, "Backlog").locator(".task-card").first();
  const id = (await source.getAttribute("data-task-id"))!;
  let requests = 0;
  await page.route("**/tasks/*/move", (route) => {
    requests++;
    return route.abort("failed");
  });
  await drag(page, source, column(page, "Por hacer").locator(".task-list"));
  await expect(page.getByRole("status")).toContainText(
    "pendiente de confirmar",
  );
  await expect(
    column(page, "Por hacer").locator(`[data-task-id="${id}"]`),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Actualizar tablero", exact: true })
    .click();
  await expect(
    column(page, "Backlog").locator(`[data-task-id="${id}"]`),
  ).toBeVisible();
  expect(requests).toBe(1);
});

test("refresh icon fits its viewBox and refresh is single flight with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await demo(page);
  const button = page.getByRole("button", {
    name: "Actualizar tablero",
    exact: true,
  });
  expect(
    await button.locator("svg path").evaluate((path) => {
      const box = (path as SVGGraphicsElement).getBBox();
      return (
        box.x >= 1 &&
        box.y >= 1 &&
        box.x + box.width <= 23 &&
        box.y + box.height <= 23
      );
    }),
  ).toBe(true);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let requests = 0;
  await page.route("**/api/v1/projects/*/board", async (route) => {
    requests++;
    await gate;
    await route.continue();
  });
  try {
    await button.click();
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    expect(
      await button
        .locator("az-icon")
        .evaluate((icon) => getComputedStyle(icon).animationName),
    ).toBe("none");
    expect(requests).toBe(1);
  } finally {
    release();
  }
  await expect(button).toBeEnabled();
});

test("deadline uses the same Bogota day in card and editor and survives unrelated edits", async ({
  page,
}) => {
  await demo(page);
  const projectId = new URL(page.url()).searchParams.get("project");
  const boardPath = `/api/v1/projects/${projectId}/board`;
  const initial = await page.request.get(boardPath);
  expect(initial.ok()).toBe(true);
  const board: BoardView = await initial.json();
  const task = board.tasks.find(
    (entry) => entry.columnId === board.columns[0].id,
  )!;
  const session = await (await page.request.get("/api/v1/auth/session")).json();
  const original = "2026-10-18T02:00:00.000Z";
  const seed = await page.request.patch(
    `/api/v1/projects/${projectId}/tasks/${task.id}`,
    {
      headers: {
        Origin: new URL(page.url()).origin,
        "X-CSRF-Token": session.csrf,
      },
      data: { expectedVersion: board.project.version, dueDate: original },
    },
  );
  expect(seed.ok()).toBe(true);
  await page
    .getByRole("button", { name: "Actualizar tablero", exact: true })
    .click();
  const card = page.locator(`[data-task-id="${task.id}"]`);
  await expect(card.locator(".task-due")).toContainText(/17(?: de)? oct/);
  await card.locator(".task-main").click();
  await expect(page.getByLabel("Fecha límite", { exact: true })).toHaveValue(
    "2026-10-17",
  );
  await page
    .getByRole("textbox", { name: "Título", exact: true })
    .fill("Fecha coherente en Bogotá");
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().endsWith(`/tasks/${task.id}`),
  );
  await page
    .getByRole("button", { name: "Guardar tarea", exact: true })
    .click();
  expect((await saved).ok()).toBe(true);
  const persisted: BoardView = await (await page.request.get(boardPath)).json();
  expect(persisted.tasks.find((entry) => entry.id === task.id)?.dueDate).toBe(
    original,
  );
  await expect(card.locator(".task-due")).toContainText(/17(?: de)? oct/);
});
