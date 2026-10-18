# Azul — Real-time Kanban where AI suggests and you decide

**English** · [Español](README.es.md)

A full-stack app to **plan → collaborate → measure → improve**: a Kanban board shared in real time, flow metrics computed on the server, and an AI assistant that proposes tasks a person reviews before they are created.

[![CI](https://github.com/JhomarSanchez/azul-kanban/actions/workflows/ci.yml/badge.svg)](https://github.com/JhomarSanchez/azul-kanban/actions/workflows/ci.yml)
![Angular 22](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![NestJS 12](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)

![Azul board with demo data](docs/media/board.png)

> A portfolio project meant to run locally: clone it and follow [Run locally](#run-locally). The interface is in Spanish. Demo data is synthetic and, without an OpenAI key, the assistant uses a deterministic simulation that is labelled as such in the interface.

## What it demonstrates

| Concern | How it is handled | Where to look |
|---|---|---|
| Concurrency without lost updates | Every command sends the board's expected version; the write, its history entry and its outbox event are stored in one transaction. A conflict returns 409. | [board-transaction.service.ts](apps/api/src/modules/kanban/board-transaction.service.ts) |
| Reliable real time | Socket.IO only announces changes; clients reload the authorized state over REST. A PostgreSQL outbox republishes events after restarts. | [collaboration.gateway.ts](apps/api/src/modules/collaboration/collaboration.gateway.ts), [board-store.ts](apps/web/src/app/features/kanban/board-store.ts) |
| Flicker-free drag and drop | A pending move is a visual projection kept apart from the confirmed state; an uncertain result is checked by reading, never by resending the command. | [movement.ts](apps/web/src/app/features/kanban/movement.ts), [ADR 0003](docs/adr/0003-feature-boundaries-and-pending-moves.md) |
| AI proposes, people decide | Structured outputs validated with Zod, editable proposals, idempotent acceptance and a monthly budget reserved before each call. | [ai.service.ts](apps/api/src/modules/ai/ai.service.ts), [ai-budget.service.ts](apps/api/src/modules/ai/ai-budget.service.ts) |
| Reproducible metrics | Cycle time, lead time, weekly throughput in America/Bogota, WIP and time per column as pure functions, with reopened tasks counted separately. | [metrics-calculation.ts](apps/api/src/modules/metrics/metrics-calculation.ts) |
| Security | Argon2id, opaque sessions stored as hashes, HttpOnly cookie, CSRF and origin checks; roles enforced over HTTP and on sockets. | [identity](apps/api/src/modules/identity), [project-access.service.ts](apps/api/src/modules/projects/project-access.service.ts) |
| Modular architecture | Modular monolith: one NestJS module per feature and Angular split into `core`, `shared` and `features`. ESLint stops controllers from reaching the database. | [Architecture](docs/architecture.md), [ADR 0001](docs/adr/0001-modular-monolith.md) |

## Features

- **Projects and teams:** email and password accounts; owner, member and viewer roles; invitation links that expire and can be revoked.
- **Board:** configurable columns with WIP limits; tasks with priority, labels, assignee, due date, acceptance criteria and comments. Tasks move by drag and drop or through a keyboard-accessible selector.
- **Collaboration:** changes appear in other browsers without reloading, state recovers after reconnecting, and conflicts are explained instead of silently lost.
- **Metrics and history:** a flow dashboard and a chronological activity feed; archiving a task keeps its history.
- **AI assistant:** turns an idea into reviewable tasks and analyses the board's flow with references to real tasks and metrics.
- **No-signup demo:** each visitor gets an isolated project with synthetic data that expires after 24 hours.

| Metrics | AI assistant | Mobile |
|---|---|---|
| ![Flow metrics](docs/media/metrics.png) | ![AI assistant proposal](docs/media/ai.png) | ![Board on mobile](docs/media/mobile.png) |

[Watch the walkthrough video](docs/media/demo.webm) (WebM, downloads to play).

## Architecture

```mermaid
flowchart LR
  Angular -->|REST /api/v1: queries and commands| NestJS
  NestJS -->|Socket.IO: change notices| Angular
  NestJS -->|Prisma: state, history and outbox| PostgreSQL[(PostgreSQL 17)]
  NestJS -->|Responses API| OpenAI
```

A single NestJS instance serves the Angular app, the REST API and Socket.IO from one origin. PostgreSQL is the source of truth, and no Redis is needed for a single instance. Shared contracts are plain Zod schemas in `packages/contracts`.

The technical documentation is written in Spanish: [index](docs/README.md), [architecture](docs/architecture.md), [decision records](docs/adr/), [repository map](docs/structure.md) and [project status](docs/roadmap.md).

| Layer | Technology |
|---|---|
| Frontend | Angular 22 standalone components, Signals, Angular CDK (drag and drop, accessibility), custom CSS with design tokens |
| Backend | NestJS 12 on Node.js 24, Socket.IO 4, OpenAPI |
| Data | PostgreSQL 17, Prisma 7 |
| AI | Official OpenAI SDK, Responses API with structured outputs |
| Contracts | Zod 4 shared by frontend and backend |
| Testing | Jest, Vitest, Playwright |
| Tooling | Multi-stage Docker, Docker Compose, GitHub Actions |

## Quality and tests

Verified on 2026-10-18: typecheck, ESLint and builds pass; **29 unit tests**, **14 integration tests** against a real PostgreSQL database and **14 browser journeys**. The journeys cover two-browser sync, access revocation, drag and drop with the HTTP response held back, conflicts and WIP limits, mobile and keyboard use. Details and limits are in the [roadmap](docs/roadmap.md).

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Integration tests only touch a dedicated database whose name ends in `_test`:

```bash
DATABASE_URL='postgresql://azul:azul_local_only@127.0.0.1:55432/azul_test' pnpm db:migrate
DATABASE_URL='postgresql://azul:azul_local_only@127.0.0.1:55432/azul_test' pnpm test:integration
```

With the app and database running:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Reports are written to `.local/reports/`; open them with `pnpm test:e2e:report`. Jest runs with `--experimental-vm-modules` because NestJS 12 ships ESM dependencies; the scripts already pass it.

## Run locally

Requirements: Node.js 24.15 or later in the 24 line, and pnpm 12.14. Without pnpm installed you can use `npx --yes pnpm@12.14.0` instead of `pnpm`.

```bash
npm install --global pnpm@12.14.0
pnpm install --frozen-lockfile
cp .env.example .env   # first time only; PowerShell: Copy-Item .env.example .env
pnpm db:generate
```

Keep local PostgreSQL running in one terminal:

```bash
pnpm db:local
```

And in another:

```bash
pnpm db:migrate
pnpm dev
```

Open [Azul locally](http://127.0.0.1:4200) and the interactive API docs in [Swagger](http://127.0.0.1:4200/api/docs). `APP_ORIGIN` must match the browser origin; it defaults to `http://127.0.0.1:4200`.

`pnpm db:local` runs real PostgreSQL 17 binaries on `127.0.0.1:55432` through `embedded-postgres`, a development wrapper that is not part of production. Data lives in `.local/postgres`. Any PostgreSQL 17 set in `DATABASE_URL` also works, as does `docker compose up -d postgres`.

### Suggested walkthrough

1. Click **Explorar la demo** to create an isolated project with synthetic tasks and history.
2. Create a task with criteria, comments and an assignee; move it by dragging or with the status selector in its detail panel.
3. Click **Invitar** and open the link in another private window: changes show up in both.
4. Check **Métricas** and **Actividad**.
5. Open **Asistente IA**, describe an idea, edit the proposals and accept the ones you want.

## Real AI with your own key

The repository contains no API key. To use OpenAI instead of the simulation, add your own `OPENAI_API_KEY` to the local `.env`, which Git ignores, and restart the API. The key stays on the backend and never reaches the browser. `OPENAI_MODEL` defaults to `gpt-5.4-mini`, and responses are not stored by OpenAI (`store: false`).

The monthly AI budget starts at USD 5. A conservative cost is reserved before each call and adjusted to the confirmed usage; there are no automatic paid retries. Check the prices configured in `.env` against the provider's before enabling a key. Each demo allows three requests, with additional per-user and per-IP limits.

## Run with Docker

As an alternative to installing pnpm, `docker compose up --build` starts the compiled app and PostgreSQL at [localhost:3000](http://localhost:3000). If the development setup already uses those ports, set `AZUL_HTTP_PORT` and `AZUL_DB_PORT` first.

## Known limitations

Single instance; no character-level simultaneous text editing, transactional email, password recovery, attachments, or converting a demo into an account. Document search with RAG is left for a later extension. WCAG 2.2 AA is the design target, but no conformance is claimed without a full audit.

## Regenerate screenshots and video

With the app running locally, `node scripts/capture.mjs` regenerates the screenshots and `node scripts/record-demo.mjs` the video. Both drive the real app.

## License

[MIT](LICENSE) © 2026 Jhomar Sanchez.
