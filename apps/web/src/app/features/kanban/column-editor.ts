import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BoardStore } from "@features/kanban/board-store";
import { ColumnStore } from "@features/kanban/column-store";

@Component({
  selector: "az-column-editor",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./column-editor.html",
  styleUrl: "./column-editor.css",
})
export class ColumnEditor {
  readonly boards = inject(BoardStore);
  readonly columns = inject(ColumnStore);
}
