export const STATUS_PILL: Record<string, string> = {
  Live: "bg-accent-soft text-[#2A6E4B]",
  Upcoming: "bg-[#D6E4F5] text-[#24518A]",
  Draft: "bg-sunken text-ink-2",
  Completed: "bg-line-soft text-ink-3",
  Cancelled: "bg-danger-soft text-danger",
};

export const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
