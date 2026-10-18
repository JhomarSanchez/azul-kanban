import { test as base, expect, Page, APIRequestContext } from "@playwright/test";

type AccountState = Awaited<ReturnType<APIRequestContext["storageState"]>>;
const test = base.extend<object, { account: AccountState }>({
  account: [async ({ playwright }, use) => {
    const api = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4200" });
    try {
      const registration = await api.post("/api/v1/auth/register", { data: {
        name: "Revisión", email: `audit-${crypto.randomUUID()}@example.test`, password: "Audit-password-123",
      } });
      expect(registration.status()).toBe(201);
      await use(await api.storageState());
    } finally { await api.dispose(); }
  }, { scope: "worker" }],
  storageState: async ({ account }, use) => { await use(account); },
});

async function workspace(page: Page) {
  const { csrf } = await (await page.request.get("/api/v1/auth/session")).json();
  const headers = { "X-CSRF-Token": csrf };
  const response = await page.request.post("/api/v1/projects", { headers, data: {
    name: "Lanzamiento de producto", description: "Recorrido de regresión",
  } });
  expect(response.status()).toBe(201);
  const project = await response.json();
  const board = await (await page.request.get(`/api/v1/projects/${project.id}/board`)).json();
  const task = await page.request.post(`/api/v1/projects/${project.id}/tasks`, { headers, data: {
    title: "Tarea de revisión", columnId: board.columns[0].id, expectedVersion: board.project.version,
  } });
  expect(task.status()).toBe(201);
  await page.goto(`/?project=${project.id}`);
  await expect(page.getByRole("heading", { name: "Lanzamiento de producto", exact: true })).toBeVisible();
  await expect(page.locator(".connection")).toHaveText("En tiempo real");
  return { projectId: project.id as string, taskId: (await task.json()).result.id as string, headers };
}

test("task drafts require explicit discard by button, backdrop, Escape and reload", async ({ page }) => {
  await workspace(page);
  const task = page.locator(".task-main").first();
  await task.click();
  const title = page.getByRole("textbox", { name: "Título", exact: true });
  const original = await title.inputValue();
  await title.fill("Borrador que no debe perderse");
  for (const close of [
    () => page.getByRole("button", { name: "Cerrar panel" }).click(),
    () => page.locator(".panel-backdrop").click({ position: { x: 10, y: 200 } }),
    () => page.keyboard.press("Escape"),
  ]) {
    page.once("dialog", (dialog) => { expect(dialog.type()).toBe("confirm"); void dialog.dismiss(); });
    await close();
    await expect(title).toHaveValue("Borrador que no debe perderse");
    await expect(page.getByRole("dialog")).toBeVisible();
  }
  const unloading = page.waitForEvent("dialog");
  void page.reload({ timeout: 5000 }).catch(() => undefined);
  const warning = await unloading;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await expect(title).toHaveValue("Borrador que no debe perderse");
  page.once("dialog", (dialog) => dialog.accept());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await task.click();
  await expect(title).toHaveValue(original);
  await page.getByRole("textbox", { name: "Escribir comentario" }).fill("Comentario pendiente");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("textbox", { name: "Escribir comentario" })).toHaveValue("Comentario pendiente");
  page.once("dialog", (dialog) => dialog.accept());
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Nueva tarea", exact: true }).click();
  await page.getByRole("textbox", { name: "Nuevo criterio" }).fill("Criterio pendiente");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("textbox", { name: "Nuevo criterio" })).toHaveValue("Criterio pendiente");
});

test("saving with unfinished checklist text keeps the draft without duplicating the task", async ({ page }) => {
  await workspace(page);
  await page.getByRole("button", { name: "Nueva tarea", exact: true }).click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill("Guardar sin perder pasos");
  await page.getByRole("textbox", { name: "Nuevo criterio" }).fill("Pendiente de añadir");
  await page.getByRole("button", { name: "Guardar tarea", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Tarea creada");
  await expect(page.getByRole("textbox", { name: "Nuevo criterio" })).toHaveValue("Pendiente de añadir");
  await page.getByRole("button", { name: "Añadir criterio", exact: true }).click();
  await page.getByRole("button", { name: "Guardar tarea", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Guardar sin perder pasos", exact: true })).toHaveCount(1);
  await page.getByRole("heading", { name: "Guardar sin perder pasos", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Pendiente de añadir" })).toBeVisible();
});

test("mobile navigation captures focus, restores it and hands it to panels", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await workspace(page);
  const menu = page.getByRole("button", { name: "Abrir navegación", exact: true });
  await menu.focus();
  await page.keyboard.press("Shift+Tab");
  expect(await page.locator(".sidebar").count()).toBe(0);
  await menu.click();
  const rail = page.getByRole("dialog", { name: "Navegación del espacio" });
  await expect(rail.getByRole("button", { name: "Cerrar navegación" })).toBeFocused();
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press("Tab");
    expect(await rail.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath("mobile-navigation.png") });
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.click();
  await rail.getByRole("button", { name: "Una vuelta por Azul" }).click();
  await expect(page.getByRole("dialog", { name: "Opciones de Azul" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cerrar panel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.click();
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator(".sidebar")).toBeVisible();
  await expect(page.locator(".rail-scrim")).toHaveCount(0);
  await expect(page.locator("main")).not.toHaveAttribute("inert");
});

test("remote comments refresh the open task and preserve local writing", async ({ page, browser }) => {
  await workspace(page);
  await page.getByRole("button", { name: "Invitar", exact: true }).click();
  await page.getByRole("button", { name: "Crear enlace", exact: true }).click();
  const invitation = await page.getByRole("textbox", { name: "Enlace de invitación", exact: true }).inputValue();
  await page.getByRole("button", { name: "Cerrar panel" }).click();
  const peerContext = await browser.newContext();
  try {
    const peer = await peerContext.newPage();
    const registration = await peer.request.post("/api/v1/auth/register", { data: {
      name: "Colaborador", email: `peer-${crypto.randomUUID()}@example.test`, password: "Audit-password-123",
    } });
    expect(registration.status()).toBe(201);
    await peer.goto(invitation);
    await peer.getByRole("button", { name: "Unirme al proyecto", exact: true }).click();
    await expect(peer.getByText("En tiempo real", { exact: true })).toBeVisible();
    const taskId = await page.locator(".task-card").first().getAttribute("data-task-id");
    for (const client of [page, peer])
      await client.locator(`[data-task-id="${taskId}"] .task-main`).click();
    const title = page.getByRole("textbox", { name: "Título", exact: true });
    await title.fill("Edición local protegida");
    const comment = page.getByRole("textbox", { name: "Escribir comentario" });
    await comment.fill("Respuesta todavía sin enviar");
    await peer.getByRole("textbox", { name: "Escribir comentario" }).fill("Comentario desde otro navegador");
    await peer.getByRole("button", { name: "Comentar", exact: true }).click();
    await expect(page.locator(".comment").filter({ hasText: "Comentario desde otro navegador" })).toBeVisible();
    await expect(comment).toHaveValue("Respuesta todavía sin enviar");
    await expect(title).toHaveValue("Edición local protegida");
    await peerContext.setOffline(true);
    await page.getByRole("button", { name: "Comentar", exact: true }).click();
    await expect(page.locator(".comment").filter({ hasText: "Respuesta todavía sin enviar" })).toBeVisible();
    await peerContext.setOffline(false);
    await expect(peer.locator(".comment").filter({ hasText: "Respuesta todavía sin enviar" })).toBeVisible();
  } finally { await peerContext.close(); }
});

test("an old comment response cannot replace the conversation after reopening the task", async ({ page }) => {
  const { projectId, taskId, headers } = await workspace(page);
  const path = `/api/v1/projects/${projectId}/tasks/${taskId}/comments`;
  let held = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`**${path}`, async (route) => {
    if (held || route.request().method() !== "GET") return route.continue();
    held = true;
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  try {
    const task = page.locator(`[data-task-id="${taskId}"] .task-main`);
    await task.click();
    await expect.poll(() => held).toBe(true);
    await page.getByRole("button", { name: "Cerrar panel" }).click();
    const state = await (await page.request.get(`/api/v1/projects/${projectId}/board`)).json();
    const posted = await page.request.post(path, { headers, data: {
      text: "La conversación más reciente", expectedVersion: state.project.version,
    } });
    expect(posted.status()).toBe(201);
    await task.click();
    await expect(page.locator(".comment")).toContainText("La conversación más reciente");
    const finished = page.waitForEvent("requestfinished", { predicate: (request) => request.url().endsWith(path) });
    release();
    await finished;
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.locator(".comment")).toContainText("La conversación más reciente");
  } finally { release(); }
});
