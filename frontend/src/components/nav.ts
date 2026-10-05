import type { EventRecord } from "../features/events/api";

export interface NavItem {
  label: string;
  path: string;
  dot: string; // the small coloured square per workspace, as in the v2 design
  module?: string; // gated add-on: shows a lock when not in the plan
}

export const NAV: NavItem[] = [
  { label: "Events", path: "/events", dot: "bg-ink" },
  { label: "My Tasks", path: "/my-tasks", dot: "bg-live" },
  { label: "Schedule", path: "/schedule", dot: "bg-[#6F9BD6]" },
  { label: "Staff", path: "/staffs", dot: "bg-[#C9A54A]" },
  { label: "Vendors", path: "/vendors", dot: "bg-[#8A75D1]", module: "vendors" },
  { label: "Incidents", path: "/incidents", dot: "bg-[#C9668E]", module: "incidents" },
  { label: "Floor Plan", path: "/floorplan", dot: "bg-[#7DB394]", module: "floor-plan" },
  { label: "Documents", path: "/documents", dot: "bg-ink-3" },
];

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** "LIVE" while a published event is running, otherwise its status. */
export function eventBadge(e: EventRecord | null) {
  if (!e) return null;
  const now = Date.now(), start = Date.parse(e.startsAt), end = e.endsAt ? Date.parse(e.endsAt) : start + 86_400_000;
  if (e.status === "published" && start <= now && now <= end) return { label: "LIVE", cls: "bg-accent-soft text-[#2A6E4B]", dot: "bg-[#3C9A68]" };
  if (e.status === "cancelled") return { label: "CANCELLED", cls: "bg-danger-soft text-danger", dot: "bg-danger" };
  if (e.status === "draft") return { label: "DRAFT", cls: "bg-sunken text-ink-2", dot: "bg-ink-3" };
  return { label: end < now ? "DONE" : "UPCOMING", cls: "bg-[#D6E4F5] text-[#24518A]", dot: "bg-[#6F9BD6]" };
}
