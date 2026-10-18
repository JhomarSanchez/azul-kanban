---
name: Azul
description: Espacio claro de trabajo visible y propuestas revisables.
colors:
  blue: "#0078d4"
  action: "#0067b8"
  blue-pale: "#eaf4fe"
  canvas: "#f4f7fb"
  surface: "#fff"
  rail: "#f8fafd"
  ink: "#152a43"
  muted: "#52677d"
  faint: "#e1e8f0"
  green: "#18794e"
  amber: "#8a5700"
  red: "#b42332"
  violet: "#6941c6"
typography:
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "27px"
    fontWeight: 800
    lineHeight: 1.5
    letterSpacing: "-0.9px"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.8
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.5
  control:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.6
rounded:
  tag: "4px"
  control: "8px"
  surface: "12px"
  avatar: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-text:
    textColor: "{colors.action}"
  button-danger:
    textColor: "{colors.red}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-icon:
    textColor: "{colors.muted}"
    size: "33px"
    rounded: "7px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
  navigation-item:
    textColor: "{colors.muted}"
    rounded: "7px"
    padding: "11px 13px"
  tag:
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "3px 7px"
  task-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
  side-panel:
    backgroundColor: "{colors.surface}"
    width: "min(520px, 100vw)"
---

# Design System: Azul

## Overview

**Creative North Star: "Trabajo visible y propuestas revisables"**

Azul es una herramienta de trabajo (Operate) construida desde código. La dirección aceptada combina azul inspirado en Windows 11, blanco y una densidad adecuada para uso frecuente en escritorio y complementario en móvil. La superficie permite leer tareas y operar sobre ellas con una jerarquía constante.

Las tarjetas y columnas pertenecen al propio mundo Kanban. El gesto distintivo es el panel lateral revisable: tarea y asistente conservan el tablero como contexto. Manrope autoalojada, iconos SVG de trazo uniforme y movimiento breve acompañan acciones concretas.

**Key Characteristics:**

- Azul para acción, selección y foco sobre superficies claras.
- Tarjetas legibles con título, descripción breve y metadatos separados.
- Panel lateral que conserva el contexto del tablero.
- Interacción por teclado y alternativa visible al arrastre.

Fuente visual: `apps/web/src/styles.css` conserva tokens y utilidades comunes. Las plantillas y estilos están distribuidos en `apps/web/src/app/features/`, el marco en `core/shell/` y los iconos en `shared/icon/`. El contrato de la superficie permanece en `.impeccable/briefs/board.md`; los principios del producto permanecen en `PRODUCT.md`.

## Colors

La paleta concentra la identidad en azul y usa neutros fríos para separar el trabajo del marco de navegación. Los valores normativos están en el frontmatter y corresponden a las propiedades de `:root`.

### Primary

- **Azul Windows:** `blue` identifica la marca, el foco y la pestaña activa.
- **Azul de acción:** `action` se usa en botones primarios, enlaces y acciones del asistente.
- **Azul suave:** `blue-pale` señala filtros activos sin competir con la acción principal.

### Neutral

- **Lienzo frío:** `canvas` sostiene el tablero.
- **Blanco de trabajo:** `surface` identifica cabecera, tarjetas, formularios y paneles.
- **Rail claro:** `rail` diferencia la navegación lateral.
- **Tinta:** `ink` es el texto principal; `muted` conserva la lectura secundaria.
- **Borde tenue:** `faint` separa bloques y superficies.

Los semánticos `green`, `amber`, `red` y `violet` acompañan confirmación, advertencia, peligro y clasificación. Las etiquetas implementadas también usan fondos y tintas propios por categoría; no son nuevos colores de marca. Estado y prioridad tienen texto o nombre accesible además del color.

**The Acción azul Rule.** Reservar el azul de acción para controles y estados interactivos; mantener blanco y neutros como superficies de lectura.

## Typography

**Body Font:** Manrope autoalojada, con fallback sans-serif. La misma familia cubre títulos, controles y metadatos; están disponibles los pesos 400, 500, 600, 700 y 800. La raíz usa (14px), pero cada rol operativo tiene su tamaño explícito.

### Hierarchy

- **Headline:** cabecera de proyecto según el token; se adapta a (30px) desde (1550px), (23px) hasta (1190px) y (21px) hasta (420px). Los títulos de panel usan (27px) y el asistente (29px).
- **Title:** título de tarjeta según el token; mantiene (14px) en móvil y escritorio grande, con salto de palabras largas.
- **Body:** descripción de tarjeta según el token, limitada a dos líneas. Comentarios y textos auxiliares de panel usan (12px); párrafos generales de panel y campos usan (13px).
- **Label:** etiquetas según el token. Fechas, contadores, autores, notas y metadatos operativos usan (11px); los números de tarjeta y métricas usan cifras tabulares.
- **Bienvenida:** el encabezado de entrada usa `clamp(36px, 4.3vw, 62px)`; esta escala pertenece a la bienvenida y no a las tarjetas de trabajo.

**The Lectura antes que densidad Rule.** Mantener títulos de tarea de 14px, descripciones de 12px y metadatos operativos de al menos 11px; no comprimirlos al reducir el ancho.

## Layout

Rail fijo de (235px), cabecera de (70px), pestañas de (49px) y área principal con margen igual al rail. El tablero utiliza columnas flexibles de mínimo (210px) y máximo (330px), separación de (17px), tarjetas separadas por (12px) y desplazamiento horizontal dentro del tablero. El relleno lateral habitual del contenido es (34px); la escala de espaciado convive con ajustes locales como los (14px) internos de tarjeta.

Desde (1550px), el rail pasa a (252px) y las columnas a mínimo (230px). Hasta (1190px), el rail ocupa (215px), el contenido usa (25px) laterales y las columnas tienen mínimo (215px). Hasta (820px), el rail es plegable con velo, el contenido ocupa todo el ancho y las columnas conservan mínimo (240px). Hasta (420px) se compactan controles y cabeceras. El ancho reducido conserva el desplazamiento del tablero.

Métricas usa cuatro cifras en una franja y dos gráficos en paralelo; hasta (820px) pasa a dos cifras por fila y gráficos apilados. El panel lateral mide `min(520px, 100vw)` y el del asistente `min(570px, 100vw)`; su cuerpo desplaza de forma independiente.

## Elevation & Depth

La estructura descansa en fondos claros, bordes de un píxel y separación. Las tarjetas no tienen sombra en reposo. La sombra refuerza hover, arrastre y superficies flotantes; el panel añade un velo para mantener visible el contexto detrás.

### Shadow Vocabulary

- **Tarjeta en hover:** `0 5px 13px -8px #44668545`.
- **Tarjeta arrastrada:** `0 12px 28px -10px #233f6450`, con giro de (2deg).
- **Panel lateral:** `-12px 0 44px -14px #1e3b5a38`.
- **Aviso flotante:** `0 8px 30px -8px #12315150`.
- **Control secundario:** borde visual mediante `inset 0 0 0 1px #dce4ee`.

Los controles cambian fondo y color en (160ms). El velo entra en (180ms), el arrastre y el rail móvil usan (200ms), el panel entra en (250ms). La curva compartida es `cubic-bezier(0.16, 1, 0.3, 1)`. `prefers-reduced-motion` elimina animaciones y transiciones.

## Shapes

Tarjetas y contenedores de métricas comparten esquina de (12px); controles de formulario y botones, (8px); etiquetas, (4px). Los botones de icono y la navegación usan (7px). Los avatares son circulares. El panel lateral ocupa el borde de la ventana sin redondear su silueta: el anterior valor direccional de panel redondeado no describe este componente construido.

Los iconos son SVG de `viewBox="0 0 24 24"`, sin relleno, trazo (1.7), extremos y uniones redondeados. El tamaño base es (19px) y se ajusta por contexto. Los iconos decorativos usan `aria-hidden`; el control aporta el nombre accesible.

## Components

### Buttons

El botón base usa (12px/700), mínimo (39px), relleno (9px 15px) y separación interna de (8px). El primario utiliza azul de acción y blanco; en hover cambia a `#00579d`. El secundario es blanco con borde interior y hover `#f2f7fd`. Las acciones de texto usan azul; las destructivas tranquilas usan rojo. Los controles de icono miden (33px) y los pequeños (25px). Deshabilitado reduce opacidad a (0.5) y cambia el cursor.

El foco visible general tiene contorno azul de (3px) con separación de (3px). La búsqueda agrupa el foco en su contenedor con contorno de (2px) y separación de (2px).

### Inputs / Fields

Campos blancos con borde `#cfdbe7`, radio de control, relleno (11px 12px) y tipografía de control. Etiqueta encima, ayuda debajo; las áreas de texto permiten cambio vertical de tamaño. El selector de columna ofrece una alternativa al arrastre en el detalle de tarea.

### Navigation

La navegación del rail combina icono, etiqueta y contador cuando corresponde. Hover tiene fondo `#edf3fa`; activo usa fondo `#e6f1fd`, texto `#0066b6` y peso (800). Las pestañas usan texto e indicador inferior azul de (2px) para la vista seleccionada. El rail móvil aparece mediante un control con nombre accesible y un velo de cierre.

### Chips

Etiquetas compactas con relleno (3px 7px), peso (700) y pares de fondo/tinta violeta, azul, ámbar o verde. Son clasificación de contenido, no botones. Los contadores de columna distinguen el límite alcanzado con ámbar y contenido numérico.

### Cards / Containers

Tarjeta blanca con borde `#e0e7f0`, radio de superficie y hover definido en Elevation & Depth. El cuerpo comienza con (14px) de relleno; desde (1550px) usa (16px). Etiquetas arriba, título y descripción en medio y metadatos con avatar debajo de un separador. El título es un botón que abre el detalle.

### Panel revisable

El panel mantiene una cabecera con título y cierre, cuerpo desplazable y contexto visible tras el velo. El asistente separa idea, propuesta editable, selección y aceptación explícita. El proveedor simulado tiene etiqueta visible; las referencias a tareas aparecen como enlaces de evidencia.

El contenedor de panel es reutilizable: recibe título, icono, anchura y estado ocupado, proyecta el contenido y devuelve el foco al cerrar. Los contenidos pertenecen a su funcionalidad. Al soltar una tarjeta se conserva su posición provisional hasta confirmar el servidor; el placeholder tiene su altura real. Actualizar tablero muestra un estado ocupado y el icono completo, con movimiento reducido respetado.

### Métricas y avisos

Las barras llevan valor y periodo visibles. Un conteo cero produce altura cero; no añadir altura mínima que represente una entrega inexistente. Los avisos son flotantes, con texto, cierre y `role="status"`; error cambia su tratamiento de color. La demo conserva su identificación visible.

## Do's and Don'ts

### Do:

- Do mantener azul de acción, blanco y neutros con los roles documentados.
- Do conservar títulos de tarea de 14px, cuerpo de 12px y metadatos operativos de al menos 11px.
- Do conservar foco visible, nombres accesibles y alternativa al arrastre.
- Do mantener identificados la demo y el proveedor simulado.
- Do representar el cero sin barra y mantener el valor textual visible.
- Do comprobar tablero, panel de tarea, propuestas, métricas, error, vacío y móvil al extender el sistema.

### Don't:

- Don't usar solo el color para comunicar estado o prioridad.
- Don't trasladar la escala de bienvenida a las tarjetas de trabajo.
- Don't añadir altura mínima a barras de conteo cero.
- Don't declarar conformidad WCAG sin auditoría; contraste, teclado y pruebas automatizadas son evidencia parcial.

El sidecar `.impeccable/design.json` usa el esquema v2 y extiende estos tokens con estados, profundidad, movimiento y ejemplos. No incorpora rampas tonales sintéticas: solo se documentan valores presentes en el código.
