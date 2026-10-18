import { Injectable, effect, inject, signal } from "@angular/core";
import { AnalysisView, ProposalView, ProposedTask } from "@azul/contracts";
import { Api } from "@core/http/api";
import { Notifications } from "@core/notifications/notifications";
import { ShellState } from "@core/shell/shell-state";
import { BoardStore } from "@features/kanban";
import { z } from "zod";
@Injectable({ providedIn: "root" })
export class AiStore {
  private api = inject(Api);
  readonly boardStore = inject(BoardStore);
  private notices = inject(Notifications);
  private ui = inject(ShellState);
  proposal = signal<ProposalView | null>(null);
  proposalTasks = signal<
    (z.infer<typeof ProposedTask> & {
      sourceIndex: number;
      selected: boolean;
    })[]
  >([]);
  analysis = signal<AnalysisView | null>(null);
  aiTab = signal<"create" | "analyze">("create");
  idea = "";
  aiLoading = signal(false);
  private project = "";
  private sequence = 0;
  constructor() {
    effect(() => {
      const id = this.boardStore.confirmed()?.project.id ?? "";
      if (this.project !== id) {
        this.sequence++;
        this.aiLoading.set(false);
        this.project = id;
        this.proposal.set(null);
        this.analysis.set(null);
        this.proposalTasks.set([]);
        this.idea = "";
      }
    });
  }
  async openAi(tab: "create" | "analyze" = "create") {
    const context = this.boardStore.context();
    this.aiTab.set(tab);
    this.ui.panel.set("ai");
    if (tab === "create" && !this.proposal()) {
      try {
        const proposals = await this.api.request<ProposalView[]>(
          `/projects/${this.boardStore.board()!.project.id}/ai/proposals`,
        );
        const pending = proposals.find((p) => !p.accepted);
        if (pending && context.current() && !this.proposal())
          this.setProposal(pending);
      } catch (error) {
        if (context.current()) this.notices.error(error);
      }
    }
  }
  setProposal(proposal: ProposalView) {
    this.proposal.set(proposal);
    this.proposalTasks.set(
      proposal.tasks.map((task, sourceIndex) => ({
        ...task,
        acceptanceCriteria: [...task.acceptanceCriteria],
        sourceIndex,
        selected: true,
      })),
    );
  }
  async generate() {
    await this.execute<ProposalView>(
      "proposals",
      { idea: this.idea },
      (proposal) => this.setProposal(proposal),
    );
  }
  async analyze() {
    await this.execute<AnalysisView>("analysis", {}, (analysis) =>
      this.analysis.set(analysis),
    );
  }
  selectedProposalCount() {
    return this.proposalTasks().filter((t) => t.selected).length;
  }
  async accept() {
    await this.boardStore.action(async () => {
      const context = this.boardStore.context();
      const b = this.boardStore.confirmed()!;
      const column = b.columns.find((c) => c.category === "TODO")!;
      await this.api.request(`/projects/${b.project.id}/ai/accept`, "POST", {
        proposalId: this.proposal()!.id,
        columnId: column.id,
        expectedVersion: b.project.version,
        tasks: this.proposalTasks()
          .filter((t) => t.selected)
          .map(({ selected: _selected, ...task }) => task),
      });
      if (!context.current()) return;
      this.proposal.set({ ...this.proposal()!, accepted: true });
      await this.boardStore.refresh(false);
      this.notices.show("Las tareas seleccionadas ya están en el Backlog.");
    });
  }
  private async execute<T>(
    route: string,
    body: unknown,
    accept: (result: T) => void,
  ) {
    if (this.aiLoading()) return;
    const context = this.boardStore.context();
    const sequence = ++this.sequence;
    this.aiLoading.set(true);
    try {
      const result = await this.api.request<T>(
        "/projects/" + context.id + "/ai/" + route,
        "POST",
        body,
      );
      if (context.current() && sequence === this.sequence) accept(result);
    } catch (error) {
      if (context.current() && sequence === this.sequence)
        this.notices.error(error);
    } finally {
      if (context.current() && sequence === this.sequence)
        this.aiLoading.set(false);
    }
  }
}
