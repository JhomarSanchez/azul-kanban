# Frontend
Hereda AGENTS.md raíz. Leer DESIGN.md y la [arquitectura](../../docs/architecture.md).

- `src/app/core`: transporte HTTP, sesión, avisos, conexión y composición de la aplicación. `shared`: componentes y formato reutilizables, sin importar funcionalidades. `features`: estado y componentes de cada funcionalidad.
- El componente raíz solo compone e inicia la aplicación. No pasar instancias del componente raíz a hijos ni reunir todo el estado en una fachada global.
- Componentes standalone con entradas/eventos tipados; Signals para estado y CDK para comportamiento accesible. Cada componente conserva su plantilla y estilos. El CSS global contiene tokens, normalización, utilidades comunes y arrastre portado al documento.
- REST es el estado confirmado. El movimiento pendiente es una proyección visual separada: no incrementar la versión confirmada ni reenviar automáticamente una escritura de resultado incierto.
- Las respuestas asíncronas deben comprobar el proyecto y contexto que las inició. Agrupar recargas y mantener invalidaciones Socket.IO y recuperación al reconectar.
- No almacenar credenciales en localStorage. Mantener foco, teclado, alternativa al arrastre y movimiento reducido; toda acción tiene recuperación visible.
- Comprobar con Vitest, Playwright y vistas de 390px, 1024px y escritorio. No incorporar librerías de componentes o estado sin justificarlo.
