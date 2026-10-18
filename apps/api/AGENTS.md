# Backend
Hereda AGENTS.md raíz. Leer la [arquitectura](../../docs/architecture.md).

- `src/main.ts` configura el arranque y `app.module.ts` compone módulos. Infraestructura contiene configuración, base de datos, HTTP, salud y OpenAPI.
- Cada funcionalidad en `src/modules/` declara sus controladores, servicios y exports. Importar otros módulos a través de `index.ts`; no acceder a sus controladores o proveedores privados.
- Los controladores validan la entrada y delegan. No inyectar Prisma/Database ni ejecutar consultas o transacciones en controladores; ESLint protege este límite.
- Kanban es dueño de los comandos de tareas, columnas y comentarios. Su coordinador mantiene membresía, expectedVersion e historial/outbox en la misma transacción. La creación de tareas desde propuestas usa el proveedor transaccional público de Kanban.
- No omitir sesión, CSRF, caducidad de demo, WIP ni comprobación de acceso después de adquirir el bloqueo. La aceptación de propuestas conserva su idempotencia.
- Actividad guarda y consulta el outbox; colaboración publica y revisa sesiones/membresías. Mantener una instancia de publicador y limpiar los temporizadores al cerrar la aplicación.
- Los contratos no importan Prisma. No registrar secretos ni prompts. Pruebas de integración usan PostgreSQL dedicado con nombre terminado en `_test`.
- Simular IA en pruebas ordinarias; llamadas reales solo con credenciales y presupuesto configurados. No añadir repositorios genéricos, microservicios o capas DDD sin necesidad concreta.
