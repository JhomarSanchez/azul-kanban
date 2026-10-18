import { describe, expect, it } from "vitest";
import {
  dateInputValue,
  dayLabel,
  dueDateFromInput,
  duration,
  initials,
} from "./presentation";
describe("accessible presentation of domain data", () => {
  it("distinguishes absent samples from a measured zero", () => {
    expect(duration(null)).toBe("Sin datos");
    expect(duration(0)).toBe("0.0 h");
    expect(duration(48)).toBe("2.0 días");
  });
  it("uses Bogota dates instead of host time", () => {
    expect(dayLabel("2026-10-18T02:00:00Z")).toContain("17");
    expect(initials("Lucía Ramírez")).toBe("LR");
  });
  it("keeps the card and date field on the same civil day", () => {
    expect(dateInputValue("2026-10-18T02:00:00Z")).toBe("2026-10-17");
    expect(dateInputValue("2026-10-18T17:00:00Z")).toBe("2026-10-18");
    expect(dateInputValue(null)).toBe("");
  });
  it("preserves an untouched deadline and stores changed dates at Bogota noon", () => {
    const original = "2026-10-18T02:00:00Z";
    expect(dueDateFromInput("2026-10-17", original)).toBe(original);
    expect(dueDateFromInput("2026-10-19", original)).toBe(
      "2026-10-19T17:00:00.000Z",
    );
    expect(dueDateFromInput("2026-10-19", null)).toBe(
      "2026-10-19T17:00:00.000Z",
    );
    expect(dueDateFromInput("", original)).toBeNull();
  });
});
