# Entregas y estado

1. Implementado: contexto, contratos, PostgreSQL 17, migración SQL y workflow de CI.
2. Implementado: identidad, proyectos, permisos, tareas, criterios, comentarios e historial.
3. Implementado: invitaciones y revocación, conflictos, outbox, cambios de rol y reconexión.
4. Implementado: métricas deterministas y dashboard; reaperturas, archivo y semanas en Bogotá.
5. Implementado: integración Responses API, simulador identificado, propuestas editables, aceptación idempotente y ledger de presupuesto.
6. Implementado localmente: demo aislada de 24 horas, capturas, vídeo, documentación, Dockerfile, Compose y configuración Railway.

Organización del repositorio: herramientas compartidas en `config/`, recorridos de navegador en `tests/e2e/` e informes generados en `.local/reports/`. El [mapa](structure.md) explica la estructura y el [índice](README.md) reúne la documentación. El contexto que Impeccable descubre automáticamente permanece en la raíz.

## Verificado en este entorno · 2026-10-17

- Migración aplicada sobre PostgreSQL 17 real y una base de pruebas separada.
- Typecheck, ESLint y compilaciones de frontend y backend correctos; dependencias peer compatibles.
- 4 pruebas de métricas (Jest), 2 de presentación (Vitest) y 10 escenarios de integración (Jest/PostgreSQL).
- 3 recorridos Playwright: dos navegadores con sincronización y revocación, tarea y propuestas IA, y móvil/teclado. Total: 19 pruebas.
- Capturas de escritorio, móvil, tarea, métricas e IA; sin errores JavaScript ni desbordamiento global en 390px.
- Detector Impeccable sin hallazgos. Revisión y correcciones visuales con disposición final `ship` para legibilidad y representación de ceros.
- Aplicación compilada sirve SPA, rutas de invitación, readiness y OpenAPI con HTTP 200.
- Imagen Docker construida en Linux; Compose arranca aplicación y PostgreSQL 17 con comprobaciones de salud correctas.
- Los mismos 3 recorridos Playwright pasan contra Docker. Registro con contraseña, sesión y tarea conservados tras reiniciar el contenedor de aplicación.
- Tras reorganizar: ESLint y los 3 recorridos Playwright correctos con las nuevas rutas; informes generados en `.local/reports/` y enlaces locales de documentación comprobados.

## Dependencias externas y límites

- OpenAI real: falta una clave de API y una ejecución controlada con presupuesto. Las pruebas de errores del proveedor usan dobles y no realizan llamadas pagadas. Sin clave la aplicación usa simulación.
- Railway: no hay credenciales disponibles; no se ha creado un despliegue público ni se ha incurrido en gasto de alojamiento. Antes de aprovisionar: verificar precios, límites, origen HTTPS y copias de seguridad.
- El workflow de GitHub Actions está escrito; su ejecución remota requiere publicar el repositorio. Git está inicializado localmente, sin remoto ni commits automáticos.
- Accesibilidad: controles de teclado y móvil comprobados; no se declara una auditoría completa WCAG. Imagen Docker con dependencias de compilación conservadas: optimización de tamaño pendiente.
- Próxima ampliación funcional: RAG con documentos y referencias; luego escalado horizontal si lo justifica el uso.
