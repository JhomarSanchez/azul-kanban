# Mapa del repositorio

El repositorio reúne dos aplicaciones y un paquete compartido. La organización distingue código, herramientas, documentación y archivos generados.

## Código y pruebas

| Ruta | Contenido |
|---|---|
| `apps/web/src/app/core/` | Sesión, HTTP, avisos, conexión y composición del marco de Angular. |
| `apps/web/src/app/shared/` | Iconos, panel lateral y formato reutilizables. |
| `apps/web/src/app/features/` | Identidad, proyectos/equipo, Kanban, métricas, actividad e IA, con componentes y estado propios. |
| `apps/web/public/` | Recursos públicos de la interfaz. |
| `apps/api/src/modules/` | Módulos NestJS de identidad, proyectos, Kanban, actividad, métricas, IA, demo y colaboración. |
| `apps/api/src/infrastructure/` | Base de datos, configuración, HTTP, salud y OpenAPI. |
| `apps/api/src/tests/` | Escenarios de integración con PostgreSQL dedicado. |
| `apps/api/prisma/` | Modelo de datos y migraciones de PostgreSQL. |
| `packages/contracts/src/` | Esquemas Zod y tipos compartidos. |
| `tests/e2e/` | Recorridos Playwright que prueban la aplicación completa. |

Los archivos `*.spec.ts` dentro de las aplicaciones son pruebas cercanas al código que verifican. Los `AGENTS.md` locales contienen las instrucciones de cada aplicación.

En Angular, el componente raíz solo compone; una tarjeta o un panel se modifica dentro de su funcionalidad. En NestJS, cada módulo registra sus proveedores: los controladores validan/delegan y los servicios ejecutan las reglas y consultas. La [decisión modular](adr/0003-feature-boundaries-and-pending-moves.md) explica los límites.

## Herramientas y documentación

| Ruta | Contenido |
|---|---|
| `config/` | Configuración compartida de ESLint y Playwright; los comandos de `package.json` la cargan explícitamente. |
| `scripts/` | Comandos auxiliares para PostgreSQL local, capturas y vídeo. |
| `docs/` | Documentación técnica; comenzar por su [índice](README.md). |
| `docs/adr/` | Decisiones de arquitectura y sus motivos. |
| `docs/media/` | Capturas y vídeo destinados al portafolio. |
| `.github/workflows/` | Comprobaciones automáticas para GitHub Actions. |
| `.vscode/settings.json` | Oculta dependencias, compilaciones y datos locales en el explorador de VS Code. |
| `.impeccable/` | Metadatos y brief de diseño usados por Impeccable; las capturas de revisión son locales. |

## Archivos de la raíz

| Archivo | Responsabilidad |
|---|---|
| `README.md`, `README.es.md` | Entrada al proyecto e instrucciones de uso, en inglés (la que muestra GitHub) y en español. |
| `LICENSE` | Licencia MIT del proyecto. |
| `AGENTS.md` | Instrucciones generales para asistentes de desarrollo. |
| `PRODUCT.md`, `DESIGN.md` | Contexto de producto y diseño que Impeccable busca en la raíz. |
| `package.json` | Comandos y dependencias comunes. |
| `pnpm-workspace.yaml` | Declara los paquetes del monorepo y las compilaciones de dependencias permitidas. |
| `pnpm-lock.yaml` | Fija las dependencias para instalaciones reproducibles; lo mantiene pnpm. |
| `Dockerfile`, `compose.yaml` | Construcción de la imagen y ejecución local con PostgreSQL. |
| `.env.example` | Variables de entorno de ejemplo, sin credenciales reales. |
| `.gitignore`, `.dockerignore` | Archivos que deben quedar fuera de Git y del contexto Docker. |

La configuración específica de Angular, TypeScript, Jest y Prisma permanece dentro de la aplicación o paquete al que pertenece.

## Archivos locales y generados

Estas carpetas no forman parte del código publicado. El editor las oculta para reducir ruido, pero siguen disponibles en el disco.

| Ruta | Contenido y cuidado |
|---|---|
| `node_modules/` | Dependencias instaladas por pnpm, también dentro de cada paquete. |
| `apps/*/dist/`, `packages/*/dist/` | Resultado de compilar las aplicaciones y los contratos. |
| `apps/web/.angular/` | Caché de Angular. |
| `apps/api/generated/` | Cliente Prisma generado a partir del esquema. |
| `.local/reports/playwright/` | Informe HTML de las pruebas de navegador. |
| `.local/reports/test-results/` | Trazas, vídeos y otros resultados de Playwright. |
| `.local/video/` | Grabaciones temporales antes de exportar el vídeo a `docs/media/`. |
| `.local/postgres/` | Datos persistentes de la base local: no borrar ni mover mientras esté en uso. |
| `.local/` | También conserva logs y utilidades temporales de verificación, fuera de Git. |

Los datos de PostgreSQL ejecutado mediante Compose se guardan en un volumen Docker separado. Reorganizar el repositorio no requiere borrar bases ni volúmenes.

Para abrir el informe del último recorrido de navegador, ejecuta `pnpm test:e2e:report` desde la raíz. Los demás comandos habituales siguen descritos en el [README](../README.es.md).
