# Entregas y estado

1. Implementado: contexto, contratos, PostgreSQL 17, migración SQL y workflow de CI.
2. Implementado: identidad, proyectos, permisos, tareas, criterios, comentarios e historial.
3. Implementado: invitaciones y revocación, conflictos, outbox, cambios de rol y reconexión.
4. Implementado: métricas deterministas y dashboard; reaperturas, archivo y semanas en Bogotá.
5. Implementado: integración Responses API, simulador identificado, propuestas editables, aceptación idempotente y ledger de presupuesto.
6. Implementado localmente: demo aislada de 24 horas, capturas, vídeo, documentación, Dockerfile y Compose.

Organización del repositorio: herramientas compartidas en `config/`, recorridos de navegador en `tests/e2e/` e informes generados en `.local/reports/`. El [mapa](structure.md) explica la estructura y el [índice](README.md) reúne la documentación. El contexto que Impeccable descubre automáticamente permanece en la raíz.

## Verificación vigente · 2026-10-18

Ejecutado sobre el árbol que incluye las correcciones de la auditoría:

- Typecheck, ESLint y compilación de contratos, API y web correctos.
- 29 pruebas unitarias: 9 de API (Jest) y 20 de web (Vitest).
- 14 pruebas de integración (Jest) sobre PostgreSQL 17 en la base dedicada `azul_test`.
- 14 recorridos Playwright: sincronización y revocación entre navegadores, demo con propuesta IA, móvil, foco de paneles, arrastre con respuesta retenida, conflicto y WIP, movimiento incierto, actualización, fechas en Bogotá y las cinco regresiones de la auditoría.
- Capturas y vídeo de `docs/media/` regenerados con `scripts/capture.mjs` y `scripts/record-demo.mjs`; sin errores JavaScript ni desbordamiento horizontal a 390px.

Comprobado el 2026-10-17 y no repetido desde entonces: imagen Docker construida en Linux, Compose con PostgreSQL 17, los recorridos Playwright de ese momento contra Docker y persistencia tras reiniciar el contenedor; aplicación compilada sirviendo SPA, invitaciones, readiness y OpenAPI.

Los límites de frecuencia en memoria (10 demos y 10 registros por hora e IP) impiden repetir la suite E2E completa contra el mismo proceso de API en menos de una hora. Reiniciar la API los restablece.

## Auditoría de consistencia · 2026-10-17

La auditoría contrastó implementación, producto, diseño y ADR, y encontró seis fallos. Están corregidos y cubiertos por pruebas:

- **P1:** una sesión invitada ya no puede crear proyectos permanentes; la API responde 403 (integración).
- **P1:** cerrar el detalle de tarea con cambios, comentario o criterio pendientes pide confirmación, y recargar la página muestra la advertencia del navegador (E2E).
- **P1:** en móvil, el rail cerrado sale del orden de foco; abierto actúa como diálogo con foco contenido y lo devuelve al cerrar (E2E).
- **P2:** la conversación de la tarea abierta se recarga con cada cambio confirmado del tablero, sin reemplazar el texto en edición (E2E).
- **P2:** una tarea terminada sin pasar por ACTIVE conserva su ciclo inicial desconocido al reabrirse (unitaria e integración).
- **P3:** el historial usa el icono correcto y los nombres de icono se comprueban al compilar.

El informe y sus capturas se conservan localmente en `.local/reports/audit-2026-10-17/`.

## Pendiente

Detectado en la revisión del 2026-10-18; cada punto se cierra con una prueba que lo cubra:

- Archivar en remoto la tarea que otra persona está editando cierra su panel sin aviso y descarta el borrador.
- La conversación devuelve los 100 comentarios más antiguos; a partir del 101 los nuevos no se muestran.
- Comentar justo después de un cambio remoto puede devolver 409 porque el comentario exige la versión global del tablero; el texto se conserva, pero hay que reintentar.
- La aceptación de propuestas IA repite el bloqueo, la versión y el historial en el módulo de IA en lugar de usar el coordinador transaccional de Kanban.
- El 403 de proyectos permanentes no incluye `code`, a diferencia del resto de errores de la API.
- La primera semana de «Entregas por semana» solo cubre parte de la ventana de 28 días y subestima su recuento.
- Evaluación de IA con casos reproducibles, prevista en el plan inicial: no existe todavía.
- Los propietarios no pueden editar ni eliminar un proyecto, aunque el plan inicial incluía administrar su configuración.

## Dependencias externas y límites

- OpenAI real: falta una clave de API y una ejecución controlada con presupuesto. Las pruebas de errores del proveedor usan dobles y no realizan llamadas pagadas. Sin clave la aplicación usa simulación.
- Sin despliegue público por decisión: el proyecto se prueba clonando el repositorio. La IA real requiere que cada persona configure su propia clave.
- El workflow de GitHub Actions está escrito; su ejecución remota requiere publicar el repositorio. Git está inicializado localmente, sin remoto ni commits automáticos.
- Accesibilidad: controles de teclado y móvil comprobados; no se declara una auditoría completa WCAG. Imagen Docker con dependencias de compilación conservadas: optimización de tamaño pendiente.
- Próxima ampliación funcional: RAG con documentos y referencias; luego escalado horizontal si lo justifica el uso.
