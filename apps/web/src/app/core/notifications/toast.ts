import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Icon } from "@shared/icon/icon";
import { Notifications } from "./notifications";
@Component({
  selector: "az-toast",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./toast.html",
  styleUrl: "./toast.css",
})
export class Toast {
  readonly notices = inject(Notifications);
}
