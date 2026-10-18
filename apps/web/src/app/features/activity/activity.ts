import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Icon } from "@shared/icon/icon";
import { relativeDate } from "@shared/presentation";
import { ActivityStore } from "./activity-store";
@Component({
  selector: "az-activity",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./activity.html",
  styleUrl: "./activity.css",
})
export class Activity {
  readonly store = inject(ActivityStore);
  relativeDate = relativeDate;
  activityLabels: Record<string, string> = {
    "task.created": "creó una tarea",
    "task.updated": "actualizó una tarea",
    "task.moved": "movió una tarea",
    "task.archived": "archivó una tarea",
    "task.commented": "comentó una tarea",
    "column.created": "añadió una columna",
    "column.updated": "actualizó una columna",
    "column.deleted": "eliminó una columna",
    "membership.updated": "actualizó el acceso de",
    "membership.joined": "se unió al proyecto",
  };
}
