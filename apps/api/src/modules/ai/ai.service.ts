import {
  AnalysisView,
  InsightOutput,
  ProposalOutput,
  ProposalView,
} from "@azul/contracts";
import { Injectable } from "@nestjs/common";
import { zodTextFormat } from "openai/helpers/zod";
import { Database } from "../../infrastructure/database";
import {
  ActorRequest,
  fail,
  parse,
  RateLimit,
} from "../../infrastructure/http";
import { BoardService } from "../kanban";
import { MetricsService } from "../metrics";
import { ProjectAccessService } from "../projects";
import { AiBudgetService } from "./ai-budget.service";
import { AiTransport } from "./openai.transport";
import { validateAiOutput } from "./output-validation";
import { systemPrompt } from "./prompts";
import { simulate } from "./simulated-provider";
@Injectable()
export class AiService {
  constructor(
    private db: Database,
    private board: BoardService,
    private metrics: MetricsService,
    private projects: ProjectAccessService,
    private rate: RateLimit,
    private transport: AiTransport,
    private budgetLedger: AiBudgetService,
  ) {}
  async execute(
    projectId: string,
    req: ActorRequest,
    kind: "proposal" | "analysis",
    idea = "",
  ) {
    await this.projects.access(
      projectId,
      req.actor.id,
      kind === "proposal" ? "write" : "read",
    );
    this.rate.check(`ai:user:${req.actor.id}`, 10);
    this.rate.check(`ai:ip:${req.ip}`, 20);
    const board = await this.board.get(projectId, req.actor.id);
    const metrics = await this.metrics.get(projectId, req.actor.id);
    const real = Boolean(process.env.OPENAI_API_KEY?.trim());
    const provider = real ? "openai" : "simulated";
    const model = real
      ? (process.env.OPENAI_MODEL ?? "gpt-5.4-mini")
      : "deterministic-demo";
    const inputPrice = Number(process.env.AI_INPUT_USD_PER_MILLION ?? 0.75);
    const outputPrice = Number(process.env.AI_OUTPUT_USD_PER_MILLION ?? 4.5);
    const maxOutput = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 4000);
    const maxChars = Number(process.env.AI_MAX_INPUT_CHARS ?? 16000);
    const budget = Number(process.env.AI_MONTHLY_BUDGET_USD ?? 5);
    if (
      ![inputPrice, outputPrice, maxOutput, maxChars, budget].every(
        (n) => Number.isFinite(n) && n > 0,
      )
    )
      fail(
        503,
        "La configuración de consumo de IA requiere revisión.",
        "AI_CONFIG",
      );
    const context = {
      idea,
      project: {
        name: board.project.name,
        description: board.project.description,
      },
      metrics,
      tasks: board.tasks.slice(0, 40).map((t) => ({
        id: t.id,
        title: t.title,
        columnId: t.columnId,
        priority: t.priority,
      })),
      columns: board.columns.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
      })),
    };
    const input = JSON.stringify(context);
    if (input.length > maxChars)
      fail(
        422,
        "El contexto es demasiado grande para esta versión. Reduce el tamaño del tablero o de la solicitud.",
        "AI_CONTEXT",
      );
    const reservation = real
      ? ((Buffer.byteLength(input, "utf8") + 8192) * inputPrice +
          maxOutput * outputPrice) /
        1000000
      : 0;
    const month = new Date().toISOString().slice(0, 7);
    const run = await this.budgetLedger.reserve(
      projectId,
      req,
      kind,
      real,
      month,
      budget,
      reservation,
      model,
      provider,
    );
    const start = Date.now();
    try {
      let output: any;
      let inputTokens = 0;
      let outputTokens = 0;
      let usageKnown = !real;
      if (real) {
        const schema = kind === "proposal" ? ProposalOutput : InsightOutput;
        const response = await this.transport.generate({
          model,
          store: false,
          max_output_tokens: maxOutput,
          reasoning: { effort: "low" },
          input: [
            {
              role: "system",
              content: systemPrompt(kind),
            },
            { role: "user", content: input },
          ],
          text: { format: zodTextFormat(schema, kind) },
        });
        if (response.status !== "completed" || !response.output_parsed)
          fail(
            502,
            "La IA no pudo completar una respuesta válida. Puedes volver a intentarlo.",
            "AI_INCOMPLETE",
          );
        output = validateAiOutput(schema, response.output_parsed);
        inputTokens = response.usage?.input_tokens ?? 0;
        outputTokens = response.usage?.output_tokens ?? 0;
        usageKnown = Boolean(
          response.usage &&
            Number.isFinite(response.usage.input_tokens) &&
            Number.isFinite(response.usage.output_tokens),
        );
      } else {
        output = simulate(kind, idea, board, metrics);
      }
      output = parse(
        kind === "proposal" ? ProposalOutput : InsightOutput,
        output,
      );
      if (
        kind === "analysis" &&
        output.observations.some((o: any) =>
          o.taskIds.some(
            (id: string) => !context.tasks.some((t) => t.id === id),
          ),
        )
      )
        fail(
          502,
          "El análisis contiene referencias que no pudimos verificar.",
          "AI_EVIDENCE",
        );
      const cost = !usageKnown
        ? null
        : real
          ? (inputTokens * inputPrice + outputTokens * outputPrice) / 1000000
          : 0;
      await this.budgetLedger.complete(
        run,
        start,
        usageKnown,
        cost,
        inputTokens,
        outputTokens,
        real,
        month,
        reservation,
      );
      if (kind === "analysis") return { ...output, provider } as AnalysisView;
      const proposal = await this.db.aiProposal.create({
        data: { projectId, provider, tasks: output.tasks },
      });
      return {
        id: proposal.id,
        provider,
        tasks: output.tasks,
        accepted: false,
      } as ProposalView;
    } catch (error) {
      await this.db.aiRun.update({
        where: { id: run.id },
        data: { status: "failed", durationMs: Date.now() - start },
      });
      if ((error as any)?.getStatus) throw error;
      fail(
        502,
        "No pudimos conectar con la IA. La solicitud no se ha reintentado automáticamente.",
        "AI_PROVIDER",
      );
    }
  }
  async list(id: string, req: ActorRequest) {
    await this.projects.access(id, req.actor.id);
    return (
      await this.db.aiProposal.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    ).map((p) => ({
      id: p.id,
      provider: p.provider,
      tasks: p.tasks,
      accepted: Boolean(p.acceptedAt),
    }));
  }
}
