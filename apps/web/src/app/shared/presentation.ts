export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
export function duration(hours: number | null) {
  if (hours === null) return "Sin datos";
  return hours >= 24
    ? `${(hours / 24).toFixed(1)} días`
    : `${hours.toFixed(1)} h`;
}
export function dayLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short",
        timeZone: "America/Bogota",
      }).format(new Date(value))
    : "";
}
export function dateInputValue(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Bogota",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function dueDateFromInput(value: string, original: string | null) {
  if (!value) return null;
  if (original && dateInputValue(original) === value) return original;
  // A date field has no time: new deadlines use noon in Bogota.
  return `${value}T17:00:00.000Z`;
}
export function relativeDate(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  return days <= 0 ? "Hoy" : days === 1 ? "Ayer" : `Hace ${days} días`;
}
