// v2 building blocks shared by the workspace pages (cards, table heads, status pills).
// Pill colours follow the PILL map in the claude.ai/design "EventOps App v2" file.

export const card = "overflow-hidden rounded-2xl bg-surface";
export const cardHead = "flex items-center justify-between border-b border-line-soft px-[18px] py-4";
export const mono = "font-mono text-[10.5px] tracking-[.04em]";
export const pill = `${mono} whitespace-nowrap rounded-full px-2 py-[3px]`;
export const tableHead = "border-b border-line bg-soft px-[18px] py-3 font-mono text-[10.5px] tracking-[.04em] text-ink-3";

const GOOD = "bg-accent-soft text-[#2A6E4B]";
const BAD = "bg-danger-soft text-danger";
const WARN = "bg-warn-soft text-warn";
const QUIET = "bg-line-soft text-[#56645B]";

export const PILL: Record<string, string> = {
  // tasks
  Done: GOOD, "In Progress": "bg-ink text-paper", Blocked: BAD, Pending: QUIET,
  // incidents
  Open: BAD, Resolved: GOOD, Critical: "bg-danger text-white", High: BAD, Medium: WARN, Low: QUIET,
  // staff
  "On task": GOOD, Available: QUIET,
  // vendor stages
  Shortlisted: QUIET, "RFQ Sent": "bg-[#D6E4F5] text-[#24518A]", Quoted: WARN, Booked: GOOD, Paid: GOOD, Rejected: BAD,
};

export const pillOf = (status: string) => `${pill} ${PILL[status] ?? QUIET}`;

export const PRIORITY_TEXT: Record<string, string> = { High: "text-danger", Medium: "text-warn", Low: "text-[#6E7C73]" };

export const initialsOf = (name = "") =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
