import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Icon } from "@shared/icon/icon";

@Component({
  selector: "az-help-panel",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./help-panel.html",
  styleUrl: "./help-panel.css",
})
export class HelpPanel {}
