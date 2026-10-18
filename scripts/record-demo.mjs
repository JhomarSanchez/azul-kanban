import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
mkdirSync(".local/video", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 1040 },
  recordVideo: { dir: ".local/video", size: { width: 1600, height: 1040 } },
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:4200/");
await page
  .getByRole("button", { name: "Explorar la demo", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Lanzamiento de producto", exact: true })
  .waitFor();
if (
  await page
    .getByRole("button", { name: "Cerrar mensaje", exact: true })
    .isVisible()
)
  await page
    .getByRole("button", { name: "Cerrar mensaje", exact: true })
    .click();
await page.waitForTimeout(2500);
await page
  .getByRole("button")
  .filter({
    has: page.getByRole("heading", {
      name: "Construir el sistema de componentes",
      exact: true,
    }),
  })
  .click();
await page.waitForTimeout(2500);
await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
await page.getByRole("tab", { name: "Métricas", exact: true }).click();
await page.waitForTimeout(3000);
await page.getByRole("button", { name: "Interpretar con IA" }).click();
await page.getByRole("button", { name: "Idea → tareas", exact: true }).click();
await page
  .getByRole("textbox", { name: "¿Qué te gustaría construir?" })
  .pressSequentially("Implementar el registro de usuarios", { delay: 45 });
await page
  .getByRole("button", { name: "Proponer un plan", exact: true })
  .click();
await page.getByRole("textbox", { name: "Título propuesto" }).first().waitFor();
await page.waitForTimeout(3000);
await page
  .getByRole("button", { name: "Añadir 4 tareas al Backlog", exact: true })
  .scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await page
  .getByRole("button", { name: "Añadir 4 tareas al Backlog", exact: true })
  .click();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
await page.getByRole("tab", { name: "Tablero", exact: true }).click();
await page.waitForTimeout(2500);
const video = page.video();
await context.close();
await video.saveAs("docs/media/demo.webm");
await browser.close();
console.log("Grabación completa: docs/media/demo.webm");
