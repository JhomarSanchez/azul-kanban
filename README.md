# Azul · Kanban con IA

Un proyecto de portafolio full stack para **planificar → colaborar → medir → mejorar**. Angular 22, NestJS 12 y PostgreSQL 17, con sincronización Socket.IO y propuestas de IA que se revisan antes de convertirse en tareas.

## Dónde está cada cosa

```text
apps/
  web/                Interfaz Angular
  api/                Backend NestJS y esquema de base de datos
packages/contracts/   Contratos compartidos entre frontend y backend
tests/e2e/            Pruebas del recorrido completo en navegador
config/               Configuración de ESLint y Playwright
scripts/              Base local, capturas y grabación de la demo
docs/                 Arquitectura, decisiones, roadmap y material de portafolio
```

Empieza por `apps/web` para la interfaz o `apps/api` para el servidor. El [mapa del repositorio](docs/structure.md) explica los archivos de configuración y las carpetas generadas. `PRODUCT.md`, `DESIGN.md` y `AGENTS.md` permanecen en la raíz como contexto para las herramientas de asistencia; el resto de la documentación se consulta desde el [índice de documentación](docs/README.md).

## Probar localmente

Requisitos: Node.js 24.15+ de la línea 24 y pnpm 12.14. Puedes usar `npx --yes pnpm@12.14.0` en lugar de `pnpm` en todos los comandos.

```powershell
npm install --global pnpm@12.14.0
pnpm install --frozen-lockfile
Copy-Item .env.example .env  # solo la primera vez; no sobrescribir credenciales existentes
pnpm db:generate
```

En una terminal deja PostgreSQL local funcionando:

```powershell
pnpm db:local
```

En otra terminal:

```powershell
pnpm db:migrate
pnpm dev
```

Abre [Azul en local](http://127.0.0.1:4200). `APP_ORIGIN` debe coincidir exactamente con el origen del navegador; el valor predeterminado es `http://127.0.0.1:4200`. La documentación de la API está en [Swagger](http://127.0.0.1:4200/api/docs), bajo el mismo origen para permitir pruebas interactivas con sesión y CSRF.

La opción local utiliza binarios reales de PostgreSQL 17, limitados a `127.0.0.1:55432`. El wrapper de desarrollo `embedded-postgres` tiene versión beta; no forma parte del backend de producción. Los datos viven en `.local/postgres`. También puedes usar cualquier PostgreSQL 17 mediante `DATABASE_URL` o iniciar solo la base de datos con `docker compose up -d postgres`. No inicies a la vez dos bases sobre el mismo puerto.

## Recorrido de demostración

1. Pulsa **Explorar la demo**. Se crea un proyecto aislado con tareas e historial sintéticos; caduca a las 24 horas.
2. Crea una tarea, añade criterios, comentarios y responsable. Muévela arrastrando o mediante el selector de estado en su detalle.
3. Usa **Invitar** para generar un enlace. Ábrelo en otro navegador o ventana privada: los cambios aparecen en ambos tableros.
4. Visita **Métricas** para consultar entregas, tiempos y trabajo en curso.
5. Abre **Asistente IA**, escribe una idea, edita las propuestas y acepta una selección. Sin clave se muestra una simulación determinista identificada.

Una cuenta normal comienza sin datos ficticios y permite proyectos permanentes. La cuenta no convierte ni migra la demo. Miembros pueden editar, observadores pueden consultar y propietarios administran el equipo. Los enlaces de invitación caducan; se puede retirar acceso a miembros desde el panel de equipo.

## IA real y consumo

Configura `OPENAI_API_KEY` solo en el entorno del backend. `OPENAI_MODEL` comienza en `gpt-5.4-mini`; se usa Responses API con salidas estructuradas, sin guardar la respuesta en OpenAI (`store:false`). Reinicia la API al cambiar variables.

El límite de admisión inicial es USD 5/mes para IA, separado del alojamiento. Precios por millón de tokens se configuran en `.env`; verifícalos contra el proveedor antes de habilitar la clave. El ledger reserva coste conservador antes de llamar y ajusta al uso confirmado. Errores sin uso confirmado conservan la reserva. No hay reintentos pagados automáticos. Los límites locales no sustituyen controles de facturación del proveedor.

La demo permite tres solicitudes por proyecto; hay límites adicionales por usuario e IP. La IA no modifica tareas directamente. No contiene RAG, predicciones de fechas ni clasificación de productividad personal.

## Verificación

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Las pruebas de integración modifican únicamente una base dedicada cuyo nombre termina en `_test`:

```powershell
$env:DATABASE_URL='postgresql://azul:azul_local_only@127.0.0.1:55432/azul_test'
pnpm db:migrate
pnpm test:integration
Remove-Item Env:DATABASE_URL
```

Con la aplicación y la base arrancadas:

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
```

Las pruebas de navegador están en `tests/e2e`. Sus informes, trazas y vídeos se guardan en `.local/reports/`; puedes abrir el informe con `pnpm test:e2e:report`. Las pruebas unitarias y de integración de la API permanecen junto al código que verifican.

Jest necesita `--experimental-vm-modules` para cargar las dependencias ESM de NestJS 12; los scripts ya incluyen esa opción. La CI reproduce migraciones, permisos, concurrencia, outbox, métricas, propuestas y recorridos de navegador. Los resultados locales y límites de verificación están en [roadmap](docs/roadmap.md).

## Producción

`docker compose up --build` arranca la base y la aplicación compilada en [localhost:3000](http://localhost:3000). Compose está configurado para HTTP local; Railway usa `NODE_ENV=production`, cookie Secure y HTTPS.

Si ya tienes el entorno de desarrollo en ejecución, usa otros puertos para Docker:

```powershell
$env:AZUL_HTTP_PORT='3001'
$env:AZUL_DB_PORT='55433'
docker compose up --build
```

En ese caso abre [localhost:3001](http://localhost:3001). Compose ajusta automáticamente el origen; `DOCKER_APP_ORIGIN` permite indicar otro nombre de host. Los datos de Docker se conservan en su propio volumen. La construcción Linux, los recorridos de navegador y la persistencia tras reiniciar el contenedor están verificados.

Railway: despliega este repositorio con Dockerfile, añade PostgreSQL 17 y configura `DATABASE_URL`, `APP_ORIGIN` con el origen HTTPS público y las variables de IA si procede. La migración se ejecuta antes del arranque y readiness comprueba la base. Mantén **una réplica**. Configura límites de recursos, alertas de gasto y copias de seguridad desde la cuenta del proveedor antes de habilitar una demo pública. Las cuentas y el despliegue no se crean por ejecutar el proyecto localmente.

La imagen conserva el árbol pnpm completo para preservar enlaces y el cliente Prisma generado. Una entrega posterior puede optimizar su tamaño sin cambiar la arquitectura.

## Contexto técnico

- [Instrucciones de trabajo](AGENTS.md)
- [Producto](PRODUCT.md) y [diseño](DESIGN.md)
- [Arquitectura y flujos](docs/architecture.md)
- [Decisiones técnicas](docs/adr/0001-modular-monolith.md)
- [Entregas y limitaciones](docs/roadmap.md)

El backend guarda estado actual, historial y outbox en transacciones con versión por proyecto. Las métricas distinguen tiempo transcurrido de esfuerzo efectivo; reaperturas y archivo mantienen la primera entrega. Los sockets son avisos para recuperar estado autorizado mediante REST.

## Capturas y recorrido

![Tablero de Azul con datos sintéticos](docs/media/board.png)

[Vídeo de la demo](docs/media/demo.webm) · [Métricas](docs/media/metrics.png) · [Asistente](docs/media/ai.png) · [Vista móvil](docs/media/mobile.png)

Puedes regenerar las capturas con `node scripts/capture.mjs` y el vídeo con `node scripts/record-demo.mjs`, con la aplicación local en ejecución. Son recorridos programáticos de la funcionalidad real.

## Limitaciones de la primera versión

Una instancia; sin edición de texto simultánea a nivel de carácter, correo transaccional, recuperación de contraseña, adjuntos, RAG o migración de demo a cuenta. No se afirma conformidad WCAG sin auditoría. La API real de OpenAI y Railway requieren verificaciones externas indicadas en el roadmap.
