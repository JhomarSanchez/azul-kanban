# 0003 · Límites por funcionalidad y movimientos pendientes

Estado: aceptada · 2026-10-17.

## Problema

El despliegue único y la separación de aplicaciones no bastaban para una implementación modular. Angular concentraba vistas y estado en un componente; NestJS mezclaba adaptadores HTTP y acceso a datos. Además, CDK devolvía visualmente la tarjeta a su posición confirmada mientras el cliente esperaba guardar y recargar.

## Decisión

Dividir Angular en infraestructura de cliente, elementos compartidos y funcionalidades con estado propio. Mantener la raíz como composición. Usar componentes standalone con entradas/eventos tipados, sin una fachada que reproduzca el componente original. El panel compartido se limita a presentación, foco y cierre.

Cada funcionalidad NestJS declara sus proveedores y superficie pública. Los controladores validan y delegan; las consultas y transacciones pertenecen a servicios. Kanban posee la creación de tareas, incluidos los lotes de propuestas. Los consumidores de otro módulo usan sus exports. Los límites se comprueban con ESLint y pruebas de integración.

Representar el movimiento pendiente como una proyección inmutable del snapshot REST. Nunca inventar una versión confirmada. Conservar el destino hasta reconciliar la versión reconocida, serializar escrituras y descartar respuestas antiguas. Un resultado incierto se verifica mediante lectura: no se reenvía automáticamente.

## Consecuencias y comprobación

Más archivos pequeños con responsabilidades reconocibles, conservando una sola aplicación desplegable. No cambian las interfaces externas ni la base de datos. Las pruebas retienen la respuesta del movimiento y muestrean frames para detectar retornos al origen; también cubren rechazos, reconexión, aislamiento de contexto, foco y movimiento reducido. La revisión visual comprueba que la extracción de estilos conserve el diseño.
