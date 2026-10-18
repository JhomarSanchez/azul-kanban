# Working in Azul

Read [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md) and [architecture](docs/architecture.md) before changes. Follow scoped instructions in `apps/web/AGENTS.md` and `apps/api/AGENTS.md`.

- Node 24, pnpm workspaces. Frontend in `apps/web`, Nest API in `apps/api`, pure Zod contracts in `packages/contracts`.
- Repository map: [docs/structure.md](docs/structure.md). Shared tool configuration lives in `config/`, browser tests in `tests/e2e`, generated reports in `.local/reports`. Keep unit and API integration tests next to their source.
- Root `PRODUCT.md` and `DESIGN.md` are canonical context files discovered by Impeccable; retain their locations. Other documentation belongs in `docs/`. Never move or clear `.local/postgres` as part of repository cleanup.
- Code and identifiers in English; UI, explanatory documentation and errors in Spanish. Exception: `README.md` is the English entry point shown on GitHub and `README.es.md` is its Spanish counterpart; keep both in sync.
- PostgreSQL is authoritative. All board writes use membership checks, expected version, transaction and activity/outbox event. Do not bypass these through sockets or AI.
- Keep secrets outside source. Never log cookies, invitation tokens, passwords or prompts.
- Commands: `pnpm dev`, `pnpm db:local`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`.
- Run relevant tests for behavior changes. Database tests require a dedicated PostgreSQL database. Do not reset an arbitrary DATABASE_URL.
- Update the owning context document when behavior changes. Accepted decisions belong in `docs/adr/`; unfinished work and external blockers belong in `docs/roadmap.md`. Do not duplicate policy across files.
- Demo data and simulated AI must stay explicitly labeled. Avoid invented claims, delivery predictions or productivity rankings.
