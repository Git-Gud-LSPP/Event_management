import type { IconType } from "react-icons";
import { LayoutDashboard } from "lucide-react";
import type { EventRecord } from "../features/events/api";
import { moduleIcon } from "../billing/icons";
import { hasModule, type Workspace } from "../billing/plan";

export interface NavItem {
  label: string;
  path: string;
  icon: IconType;
  tint: string; // per-workspace icon colour
  module?: string; // gated add-on: shows a lock when not in the plan
}

export const NAV: NavItem[] = [
  { label: "Dashboard", path: "/events", icon: LayoutDashboard, tint: "text-ink" }, // pointed at the current event by navFor()
  { label: "My Tasks", path: "/my-tasks", icon: moduleIcon("my-tasks"), tint: "text-live" },
  { label: "Schedule", path: "/schedule", icon: moduleIcon("run-of-show"), tint: "text-[#6F9BD6]" },
  { label: "Staff", path: "/staffs", icon: moduleIcon("staff"), tint: "text-[#C9A54A]" },
  { label: "Vendors", path: "/vendors", icon: moduleIcon("vendors"), tint: "text-[#8A75D1]", module: "vendors" },
  { label: "Incidents", path: "/incidents", icon: moduleIcon("incidents"), tint: "text-[#C9668E]", module: "incidents" },
  { label: "Floor Plan", path: "/floorplan", icon: moduleIcon("floor-plan"), tint: "text-[#7DB394]", module: "floor-plan" },
  { label: "Documents", path: "/documents", icon: moduleIcon("documents"), tint: "text-ink-3" },
  { label: "Budget", path: "/budget", icon: moduleIcon("budget-planner"), tint: "text-[#C9A54A]", module: "budget-planner" },
  { label: "Lost & Found", path: "/lost-and-found", icon: moduleIcon("lost-and-found"), tint: "text-[#6F9BD6]", module: "lost-and-found" },
  { label: "Analytics", path: "/analytics", icon: moduleIcon("analytics"), tint: "text-[#7DB394]", module: "analytics" },
  { label: "Export", path: "/export", icon: moduleIcon("data-export"), tint: "text-ink-3", module: "data-export" },
];

/** NAV minus add-ons not in the plan, with Dashboard opening the current event (the event list when there is none). */
export const navFor = (event: EventRecord | null, ws: Workspace): NavItem[] =>
  NAV.filter((n) => !n.module || hasModule(ws, n.module)).map((n, i) => (i === 0 && event ? { ...n, path: `/events/${event._id}` } : n));

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
