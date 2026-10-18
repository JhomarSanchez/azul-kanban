# Azul — Real-time Kanban where AI suggests and you decide

[English](README.md) · **Español**

Aplicación full stack para **planificar → colaborar → medir → mejorar**: un tablero Kanban compartido en tiempo real, con métricas de flujo calculadas en el servidor y un asistente de IA que propone tareas que una persona revisa antes de crearlas.

[![CI](https://github.com/JhomarSanchez/azul-kanban/actions/workflows/ci.yml/badge.svg)](https://github.com/JhomarSanchez/azul-kanban/actions/workflows/ci.yml)
![Angular 22](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![NestJS 12](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)

![Tablero de Azul con datos de demostración](docs/media/board.png)

> Proyecto de portafolio pensado para ejecutarse en local: clónalo y sigue [Ejecutar localmente](#ejecutar-localmente). Los datos de la demo son sintéticos y, sin una clave de OpenAI, el asistente usa una simulación determinista que se identifica como tal en la interfaz.

## Qué demuestra

| Aspecto | Cómo se resuelve | Dónde mirarlo |
|---|---|---|
| Concurrencia sin sobrescrituras | Cada comando envía la versión esperada del tablero; la escritura, el historial y el evento de salida se guardan en una misma transacción. Un conflicto devuelve 409. | [board-transaction.service.ts](apps/api/src/modules/kanban/board-transaction.service.ts) |
| Tiempo real fiable | Socket.IO solo avisa de cambios; el cliente recarga el estado autorizado por REST. Un outbox en PostgreSQL republica tras reinicios. | [collaboration.gateway.ts](apps/api/src/modules/collaboration/collaboration.gateway.ts), [board-store.ts](apps/web/src/app/features/kanban/board-store.ts) |
| Arrastre sin parpadeo | El movimiento pendiente es una proyección visual separada del estado confirmado; un resultado incierto se verifica sin reenviar el comando. | [movement.ts](apps/web/src/app/features/kanban/movement.ts), [ADR 0003](docs/adr/0003-feature-boundaries-and-pending-moves.md) |
| IA que propone, personas que deciden | Salidas estructuradas validadas con Zod, propuestas editables, aceptación idempotente y presupuesto mensual reservado antes de cada llamada. | [ai.service.ts](apps/api/src/modules/ai/ai.service.ts), [ai-budget.service.ts](apps/api/src/modules/ai/ai-budget.service.ts) |
| Métricas reproducibles | Ciclo, entrega, throughput semanal en America/Bogota, WIP y permanencia por columna como funciones puras, con reaperturas contadas aparte. | [metrics-calculation.ts](apps/api/src/modules/metrics/metrics-calculation.ts) |
| Seguridad | Argon2id, sesiones opacas guardadas como hash, cookie HttpOnly, CSRF y comprobación de origen; roles comprobados en HTTP y en sockets. | [identity](apps/api/src/modules/identity), [project-access.service.ts](apps/api/src/modules/projects/project-access.service.ts) |
| Arquitectura modular | Monolito modular: módulos NestJS por funcionalidad y Angular en `core`, `shared` y `features`. ESLint impide que los controladores accedan a la base de datos. | [Arquitectura](docs/architecture.md), [ADR 0001](docs/adr/0001-modular-monolith.md) |

## Funcionalidades

- **Proyectos y equipo:** cuentas con correo y contraseña, roles de propietario, miembro y observador, e invitaciones por enlace con caducidad y revocación.
- **Tablero:** columnas configurables con límites WIP, tareas con prioridad, etiquetas, responsable, fecha límite, criterios de aceptación y comentarios. Las tareas se mueven arrastrando o desde un selector accesible por teclado.
- **Colaboración:** cambios visibles en otros navegadores sin recargar, recuperación al reconectar y conflictos explicados en lugar de perdidos.
- **Métricas e historial:** panel de flujo y actividad cronológica; archivar una tarea conserva su historial.
- **Asistente IA:** convierte una idea en tareas revisables y analiza el flujo del tablero con referencias a tareas y métricas reales.
- **Demo sin registro:** cada visitante recibe un proyecto aislado con datos sintéticos que caduca a las 24 horas.

| Métricas | Asistente IA | Móvil |
|---|---|---|
| ![Métricas de flujo](docs/media/metrics.png) | ![Propuesta del asistente IA](docs/media/ai.png) | ![Tablero en móvil](docs/media/mobile.png) |

[Ver el vídeo del recorrido](docs/media/demo.webm) (WebM, se descarga para reproducirlo).

## Arquitectura

```mermaid
flowchart LR
  Angular -->|REST /api/v1: consultas y comandos| NestJS
  NestJS -->|Socket.IO: avisos de cambio| Angular
  NestJS -->|Prisma: estado, historial y outbox| PostgreSQL[(PostgreSQL 17)]
  NestJS -->|Responses API| OpenAI
```

Una sola instancia de NestJS sirve la interfaz Angular, la API REST y Socket.IO bajo el mismo origen. PostgreSQL es la fuente de verdad y no se necesita Redis para una instancia. Los contratos compartidos son esquemas Zod puros en `packages/contracts`.

La [documentación técnica](docs/README.md) recoge la [arquitectura](docs/architecture.md), las [decisiones (ADR)](docs/adr/), el [mapa del repositorio](docs/structure.md) y el [estado del proyecto](docs/roadmap.md).

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 standalone, Signals, Angular CDK (arrastre y accesibilidad), CSS propio con tokens |
| Backend | NestJS 12 sobre Node.js 24, Socket.IO 4, OpenAPI |
| Datos | PostgreSQL 17, Prisma 7 |
| IA | SDK oficial de OpenAI, Responses API con salidas estructuradas |
| Contratos | Zod 4 compartido entre frontend y backend |
| Pruebas | Jest, Vitest, Playwright |
| Operación | Docker multi-stage, Docker Compose, GitHub Actions |

## Calidad y pruebas

Verificado el 2026-10-18: typecheck, ESLint y compilación correctos; **29 pruebas unitarias**, **14 de integración** sobre PostgreSQL real y **14 recorridos de navegador**. Estos cubren sincronización entre dos navegadores, revocación de acceso, arrastre con la respuesta retenida, conflictos y WIP, móvil y teclado. El detalle y los límites de la verificación están en el [roadmap](docs/roadmap.md).

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Las pruebas de integración solo modifican una base dedicada cuyo nombre termina en `_test`:

```powershell
$env:DATABASE_URL='postgresql://azul:azul_local_only@127.0.0.1:55432/azul_test'
pnpm db:migrate
pnpm test:integration
Remove-Item Env:DATABASE_URL
```

Con la aplicación y la base en marcha:

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
```

Los informes se guardan en `.local/reports/`; ábrelos con `pnpm test:e2e:report`. Jest se ejecuta con `--experimental-vm-modules` porque NestJS 12 usa dependencias ESM; los scripts ya lo incluyen.

## Ejecutar localmente

Requisitos: Node.js 24.15 o posterior de la línea 24 y pnpm 12.14. Sin pnpm instalado puedes usar `npx --yes pnpm@12.14.0` en lugar de `pnpm`.

```powershell
npm install --global pnpm@12.14.0
pnpm install --frozen-lockfile
Copy-Item .env.example .env  # solo la primera vez
pnpm db:generate
```

Deja PostgreSQL local en marcha en una terminal:

```powershell
pnpm db:local
```

Y en otra:

```powershell
pnpm db:migrate
pnpm dev
```

Abre [Azul en local](http://127.0.0.1:4200) y la documentación interactiva de la API en [Swagger](http://127.0.0.1:4200/api/docs). `APP_ORIGIN` debe coincidir con el origen del navegador; por defecto es `http://127.0.0.1:4200`.

`pnpm db:local` ejecuta binarios reales de PostgreSQL 17 en `127.0.0.1:55432` mediante `embedded-postgres`, un envoltorio de desarrollo que no forma parte de producción. Los datos viven en `.local/postgres`. También sirve cualquier PostgreSQL 17 indicado en `DATABASE_URL`, o `docker compose up -d postgres`.

### Recorrido sugerido

1. Pulsa **Explorar la demo**: se crea un proyecto aislado con tareas e historial sintéticos.
2. Crea una tarea con criterios, comentarios y responsable; muévela arrastrando o con el selector de estado del detalle.
3. Pulsa **Invitar** y abre el enlace en otra ventana privada: los cambios aparecen en ambas.
4. Consulta **Métricas** y **Actividad**.
5. Abre **Asistente IA**, describe una idea, edita las propuestas y acepta las que quieras.

## IA real con tu propia clave

El repositorio no incluye ninguna clave. Para usar OpenAI en lugar de la simulación, añade tu propia `OPENAI_API_KEY` al `.env` local, que Git ignora, y reinicia la API. La clave solo vive en el backend; nunca llega al navegador. `OPENAI_MODEL` empieza en `gpt-5.4-mini` y las respuestas no se almacenan en OpenAI (`store: false`).

El presupuesto mensual de IA parte de USD 5. Antes de cada llamada se reserva un coste conservador, que se ajusta al uso confirmado; no hay reintentos automáticos de pago. Comprueba los precios configurados en `.env` frente a los del proveedor antes de activar la clave. Cada demo admite tres solicitudes y hay límites adicionales por usuario e IP.

## Ejecutar con Docker

Como alternativa a la instalación con pnpm, `docker compose up --build` arranca la aplicación compilada y PostgreSQL en [localhost:3000](http://localhost:3000). Si el entorno de desarrollo ocupa esos puertos, define antes `AZUL_HTTP_PORT` y `AZUL_DB_PORT`.

## Limitaciones conocidas

Una sola instancia; sin edición simultánea de texto carácter a carácter, correo transaccional, recuperación de contraseña, adjuntos ni conversión de la demo en cuenta. La consulta de documentos con RAG queda para una ampliación posterior. No se declara conformidad WCAG 2.2 AA sin una auditoría completa, aunque el objetivo de diseño la toma como referencia.

## Regenerar capturas y vídeo

Con la aplicación local en marcha, `node scripts/capture.mjs` regenera las capturas y `node scripts/record-demo.mjs` el vídeo. Ambos recorren la funcionalidad real.

## Licencia

[MIT](LICENSE) © 2026 Jhomar Sanchez.
