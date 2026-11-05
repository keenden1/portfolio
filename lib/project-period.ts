export function projectPeriod(start?: string | null, end?: string | null): string {
  const format = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`));
  if (!start) return "";
  return `${format(start)} – ${end ? format(end) : "Present"}`;
}
