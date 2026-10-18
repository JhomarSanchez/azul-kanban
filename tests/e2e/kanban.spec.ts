import { test, expect } from "@playwright/test";
test("two browsers synchronize work and recover permission changes", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explorar la demo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lanzamiento de producto", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Invitar", exact: true }).click();
  await page.getByRole("button", { name: "Crear enlace", exact: true }).click();
  const invitation = await page
    .getByRole("textbox", { name: "Enlace de invitación", exact: true })
    .inputValue();
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  try {
    await guest.goto(invitation);
    await guest
      .getByRole("button", { name: "Unirme al proyecto", exact: true })
      .click();
    await expect(
      guest.getByRole("heading", {
        name: "Lanzamiento de producto",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Cerrar panel", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Nueva tarea", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Título", exact: true })
      .fill("Visible para todo el equipo");
    await page
      .getByRole("button", { name: "Guardar tarea", exact: true })
      .click();
    await expect(
      guest.getByRole("heading", {
        name: "Visible para todo el equipo",
        exact: true,
      }),
    ).toBeVisible();
    await guestContext.setOffline(true);
    await page
      .getByRole("button", { name: "Nueva tarea", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Título", exact: true })
      .fill("Recuperado al reconectar");
    await page
      .getByRole("button", { name: "Guardar tarea", exact: true })
      .click();
    await guestContext.setOffline(false);
    await expect(
      guest.getByRole("heading", {
        name: "Recuperado al reconectar",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Invitar", exact: true }).click();
    await page
      .getByRole("combobox", {
        name: "Rol de Invitado del equipo",
        exact: true,
      })
      .selectOption("VIEWER");
    await expect(
      guest.getByRole("button", { name: "Nueva tarea", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "Quitar acceso de Invitado del equipo",
        exact: true,
      })
      .click();
    await expect(
      guest.getByRole("heading", {
        name: "Lanzamiento de producto",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(guest.getByRole("status")).toContainText(
      "Tu acceso al proyecto cambió",
    );
  } finally {
    await guestContext.close();
  }
});
test("demo, keyboard task creation, checklist, metrics and edited AI proposal", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar la demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Lanzamiento de producto", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nueva tarea", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Título", exact: true })
    .fill("Recorrido de portafolio");
  await page
    .getByRole("textbox", { name: "Descripción", exact: true })
    .fill("Comprobar el flujo de extremo a extremo.");
  await page
    .getByRole("button", { name: "Guardar tarea", exact: true })
    .click();
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", {
        name: "Recorrido de portafolio",
        exact: true,
      }),
    })
    .press("Enter");
  await page
    .getByRole("combobox", { name: "Mover tarea a columna" })
    .selectOption({ label: "En curso" });
  await expect(page.getByRole("status")).toContainText("Tarea movida");
  await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
  await page.getByRole("tab", { name: "Métricas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Encuentra el ritmo de tu equipo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Interpretar con IA" }).click();
  await page
    .getByRole("button", { name: "Analizar el flujo", exact: true })
    .click();
  await expect(
    page.getByText("Simulación · sin modelo conectado", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Idea → tareas", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "¿Qué te gustaría construir?" })
    .fill("Implementar registro de usuarios");
  await page
    .getByRole("button", { name: "Proponer un plan", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Título propuesto" }).first(),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Título propuesto" })
    .first()
    .fill("Plan revisado por mí");
  await page
    .getByRole("button", { name: "Añadir 4 tareas al Backlog", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tareas incorporadas" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
  await page.getByRole("tab", { name: "Tablero", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Plan revisado por mí", exact: true }),
  ).toBeVisible();
});
test("mobile layout contains scrolling within the board and supports the task panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar la demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Lanzamiento de producto", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Nueva tarea", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
