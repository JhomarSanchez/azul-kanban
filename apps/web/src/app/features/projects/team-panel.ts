import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BoardStore } from "@features/kanban";
import { TeamStore } from "@features/projects/team-store";
import { Icon } from "@shared/icon/icon";
import { initials } from "@shared/presentation";
@Component({
  selector: "az-team-panel",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./team-panel.html",
  styleUrl: "./team-panel.css",
})
export class TeamPanel {
  readonly boards = inject(BoardStore);
  readonly team = inject(TeamStore);
  initials = initials;
}
