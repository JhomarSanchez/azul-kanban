import {
  CdkDragDrop,
  CdkDragStart,
  DragDropModule,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BoardView, TaskView } from "@azul/contracts";
import { Icon } from "@shared/icon/icon";
import { TaskCard } from "./task-card";
@Component({
  selector: "az-board-column",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon, DragDropModule, TaskCard],
  templateUrl: "./board-column.html",
  styleUrl: "./board-column.css",
})
export class BoardColumn {
  columnInput = input.required<BoardView["columns"][number]>();
  tasks = input.required<TaskView[]>();
  members = input.required<BoardView["members"]>();
  count = input(0);
  canEdit = input(false);
  isOwner = input(false);
  disabled = input(false);
  filtered = input(false);
  taskOpened = output<TaskView>();
  taskCreated = output<string>();
  columnEdited = output<string>();
  taskDropped = output<CdkDragDrop<TaskView[]>>();
  dragStarted = output<void>();
  dragEnded = output<void>();
  dragHeight = 160;
  tasksFor(_id: string) {
    return this.tasks();
  }
  countFor(_id: string) {
    return this.count();
  }
  onDrop(event: CdkDragDrop<TaskView[]>, _id: string) {
    this.taskDropped.emit(event);
  }
  onDragStarted(event: CdkDragStart) {
    this.dragHeight =
      event.source.element.nativeElement.getBoundingClientRect().height;
    this.dragStarted.emit();
  }
}
