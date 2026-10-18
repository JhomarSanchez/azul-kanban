import { Component, Input } from "@angular/core";
const paths: Record<string, string> = {
  board: "M3 4h18v16H3z M9 4v16 M15 4v16 M5.5 8h1 M11.5 8h1 M17.5 8h1",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  chart: "M4 3v17h17 M8 15v-4 M13 15V7 M18 15v-7",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  sparkle:
    "m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3Z M20 2v4 M18 4h4",
  plus: "M12 5v14 M5 12h14",
  search: "m21 21-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  close: "m6 6 12 12 M18 6 6 18",
  filter: "M4 7h16 M7 12h10 M10 17h4",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  calendar: "M4 5h16v16H4z M16 3v4 M8 3v4 M4 11h16",
  comment: "M21 11a8 8 0 0 1-8 8H7l-5 3V11a9 9 0 0 1 19 0Z",
  checklist: "m3 6 2 2 4-4 M12 6h9 m-18 9 2 2 4-4 M12 15h9",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2",
  check: "m5 12 4 4L19 6",
  link: "M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l2-2",
  arrow: "M5 12h14 m-6-6 6 6-6 6",
  help: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4 M12 17h.01",
  logout: "M9 21H4V3h5 M9 12h12 m-5-5 5 5-5 5",
  lock: "M5 10h14v11H5z M8 10V7a4 4 0 0 1 8 0v3",
  archive: "M3 3h18v5H3z M5 8v13h14V8 M10 12h4",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
  flag: "M5 21V3 M5 4c5-4 9 4 15 0v10c-6 4-10-4-15 0",
  refresh:
    "M3 12a9 9 0 0 1 15.36-6.36L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15.36 6.36L3 16 M8 16H3v5",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  settings:
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
  file: "M14 2H4v20h16V8z M14 2v6h6 M8 12h8 M8 16h5",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  moon: "M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13",
};
@Component({
  selector: "az-icon",
  standalone: true,
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path"/></svg>',
  styles:
    ":host{display:inline-flex;width:19px;height:19px;flex-shrink:0}svg{display:block;width:100%;height:100%;}",
})
export class Icon {
  @Input() name = "board";
  get path() {
    return paths[this.name] ?? paths["board"];
  }
}
