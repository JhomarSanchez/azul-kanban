import { BoardView, MetricsView } from "@azul/contracts";
export function simulate(
  kind: "proposal" | "analysis",
  idea: string,
  board: BoardView,
  metrics: MetricsView,
) {
  let output: any;
  if (kind === "proposal") {
    const subject = idea.replace(/\s+/g, " ").slice(0, 90);
    output = {
      tasks: [
        {
          title: `Definir el alcance: ${subject}`.slice(0, 160),
          description:
            "Acordar el resultado esperado, los usuarios y los casos principales antes de implementar.",
          priority: "HIGH",
          acceptanceCriteria: [
            "Los casos principales están documentados",
            "El alcance está revisado por el equipo",
          ],
        },
        {
          title: `Diseñar la experiencia: ${subject}`.slice(0, 160),
          description:
            "Definir el recorrido, sus estados y los requisitos de accesibilidad.",
          priority: "MEDIUM",
          acceptanceCriteria: [
            "El recorrido contempla carga, error y vacío",
            "La interacción tiene alternativa de teclado",
          ],
        },
        {
          title: `Implementar y conectar: ${subject}`.slice(0, 160),
          description:
            "Construir el recorrido acordado y validar los datos y permisos en el servidor.",
          priority: "HIGH",
          acceptanceCriteria: [
            "El recorrido funciona de extremo a extremo",
            "Los errores tienen una recuperación visible",
          ],
        },
        {
          title: `Verificar y documentar: ${subject}`.slice(0, 160),
          description:
            "Probar el comportamiento principal y dejar instrucciones para reproducirlo.",
          priority: "MEDIUM",
          acceptanceCriteria: [
            "Las pruebas del recorrido principal pasan",
            "La documentación explica cómo probarlo",
          ],
        },
      ],
    };
  } else {
    const waiting = board.tasks.filter(
      (t) =>
        board.columns.find((c) => c.id === t.columnId)?.category === "ACTIVE",
    );
    output = {
      observations: [
        {
          text: `Hay ${metrics.wip} tareas en trabajo activo. Revisa los bloqueos antes de comenzar más trabajo.`,
          taskIds: waiting.slice(0, 4).map((t) => t.id),
          metricKeys: ["wip"],
        },
        {
          text:
            metrics.sampleSize < 5
              ? `Hay ${metrics.sampleSize} entregas iniciales en los últimos 28 días. La muestra es insuficiente para concluir tendencias.`
              : `La mediana del ciclo inicial es ${metrics.cycleTime?.toFixed(1) ?? "no disponible"} horas, con ${metrics.sampleSize} entregas. Revisa la distribución antes de interpretar cambios.`,
          taskIds: [],
          metricKeys: ["cycleTime", "throughput"],
        },
      ],
    };
  }
  return output;
}
