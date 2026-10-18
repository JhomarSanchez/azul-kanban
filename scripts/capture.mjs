import { chromium } from "@playwright/test";
import { mkdirSync, copyFileSync } from "node:fs";
mkdirSync(".impeccable/review", { recursive: true });
mkdirSync("docs/media", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 1040 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:4200/");
await page
  .getByRole("button", { name: "Explorar la demo", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Lanzamiento de producto", exact: true })
  .waitFor();
await page.getByText("En tiempo real", { exact: true }).waitFor();
if (
  await page
    .getByRole("button", { name: "Cerrar mensaje", exact: true })
    .isVisible()
)
  await page
    .getByRole("button", { name: "Cerrar mensaje", exact: true })
    .click();
await page.waitForTimeout(1000);
// A full-page capture cuts the sticky rail; a taller viewport shows the whole board.
await page.setViewportSize({ width: 1600, height: 1400 });
await page.screenshot({ path: ".impeccable/review/desktop.png" });
copyFileSync(".impeccable/review/desktop.png", "docs/media/board.png");
await page.setViewportSize({ width: 1600, height: 1040 });
await page
  .getByRole("button")
  .filter({
    has: page.getByRole("heading", {
      name: "Construir el sistema de componentes",
      exact: true,
    }),
  })
  .click();
await page.screenshot({ path: ".impeccable/review/task.png" });
await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
await page.getByRole("tab", { name: "Métricas", exact: true }).click();
await page.screenshot({ path: ".impeccable/review/metrics.png" });
copyFileSync(".impeccable/review/metrics.png", "docs/media/metrics.png");
await page.getByRole("button", { name: "Interpretar con IA" }).click();
await page.getByRole("button", { name: "Idea → tareas", exact: true }).click();
await page
  .getByRole("textbox", { name: "¿Qué te gustaría construir?" })
  .fill("Implementar el registro de usuarios");
await page
  .getByRole("button", { name: "Proponer un plan", exact: true })
  .click();
await page.getByRole("textbox", { name: "Título propuesto" }).first().waitFor();
await page.screenshot({ path: ".impeccable/review/ai.png" });
copyFileSync(".impeccable/review/ai.png", "docs/media/ai.png");
await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
await page.getByRole("tab", { name: "Tablero", exact: true }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: ".impeccable/review/mobile.png",
  fullPage: true,
});
copyFileSync(".impeccable/review/mobile.png", "docs/media/mobile.png");
const overflow = await page.evaluate(() => ({
  width: innerWidth,
  documentWidth: document.documentElement.scrollWidth,
}));
await context.close();
await browser.close();
console.log(
  JSON.stringify({
    errors,
    overflow,
    captures: ["desktop", "task", "metrics", "ai", "mobile"],
  }),
);
if (errors.length) process.exitCode = 1;
