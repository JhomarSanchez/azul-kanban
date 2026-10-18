import { A11yModule } from "@angular/cdk/a11y";
import { Component, HostListener, input, output } from "@angular/core";
import { Icon, IconName } from "../icon/icon";
@Component({
  selector: "az-side-panel",
  standalone: true,
  imports: [A11yModule, Icon],
  templateUrl: "./side-panel.html",
  styleUrl: "./side-panel.css",
})
export class SidePanel {
  title = input.required<string>();
  label = input("Opciones de Azul");
  icon = input<IconName>("board");
  wide = input(false);
  busy = input(false);
  closed = output<void>();
  @HostListener("document:keydown.escape") close() {
    if (!this.busy()) this.closed.emit();
  }
}
