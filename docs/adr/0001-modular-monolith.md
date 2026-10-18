# ADR 0001: monolito modular

Aceptada · 2026-10-17.

Angular y NestJS comparten TypeScript y contratos puros. Una instancia simplifica sesiones, WebSockets y operación económica. PostgreSQL mantiene identidad, estado, historial, outbox y consumo. Escalado horizontal requeriría un adaptador compartido para Socket.IO y coordinación de trabajos; no se habilitarán varias réplicas sin ese cambio.
