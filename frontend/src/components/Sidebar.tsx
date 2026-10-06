import { NavLink } from "react-router-dom";
import { CreditCard, LayoutGrid } from "lucide-react";
import { getStoredUser, logout } from "../services/authApi";
import { planById } from "../billing/catalog";
import { daysLeft, useWorkspace } from "../billing/plan";
import { Wordmark } from "../marketing/ui";
import type { EventRecord } from "../features/events/api";
import { eventBadge, initials, navFor } from "./nav";
import { ThinkingOrb } from "thinking-orbs";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-sm transition-colors ${
    isActive
      ? "bg-surface text-ink shadow-[0_1px_2px_rgba(20,45,30,.08)]"
      : "text-ink-2 hover:bg-surface hover:text-ink"
  }`;

export default function Sidebar({
  event,
  onOpenAgent,
}: {
  event: EventRecord | null;
  onOpenAgent: () => void;
}) {
  const user = getStoredUser();
  const ws = useWorkspace();
  const isOrganizer = user?.role !== "staff";
  const badge = eventBadge(event);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-line bg-paper lg:flex">
      <div className="flex h-[60px] items-center border-b border-line px-[18px]">
        <NavLink to="/" aria-label="EventOps home">
          <Wordmark />
        </NavLink>
      </div>

      <div className="px-3 pt-3.5 pb-1.5">
        <NavLink
          to="/events"
          title="Switch event"
          className="flex items-center justify-between gap-2 rounded-[10px] bg-surface px-3 py-2.5 text-[13px] hover:ring-1 hover:ring-line-strong"
        >
          <div className="min-w-0">
            <div className="font-mono text-[10px] tracking-[.04em] text-ink-3">
              CURRENT EVENT
            </div>
            <div className="mt-0.5 truncate font-medium">
              {event?.title ?? "No event selected"}
            </div>
          </div>
          {badge && (
            <span
              className={`inline-flex shrink-0 items-center gap-[5px] rounded-full px-[7px] py-0.5 font-mono text-[10px] ${badge.cls}`}
            >
              <span className={`size-[5px] rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          )}
        </NavLink>
      </div>

      <nav
        className="flex flex-1 flex-col gap-0.5 overflow-auto px-3 py-2"
        aria-label="Workspaces"
      >
        {navFor(event, ws).map((n) => (
          <NavLink key={n.label} to={n.path} className={navCls}>
            <n.icon
              className={`h-4 w-4 flex-none ${n.tint}`}
              aria-hidden="true"
            />
            <span className="flex-1">{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2.5 p-3">
        {isOrganizer && (
          <div className="flex flex-col gap-0.5 border-b border-line pb-2.5">
            <NavLink to="/modules" className={navCls}>
              <LayoutGrid className="h-4 w-4 text-ink-3" aria-hidden="true" />
              <span className="flex-1">Browse modules</span>
            </NavLink>
            <NavLink to="/billing" className={navCls}>
              <CreditCard className="h-4 w-4 text-ink-3" aria-hidden="true" />
              <span className="flex-1">Plan & billing</span>
              <span className="font-mono text-[10.5px] text-ink-3">
                {ws.trialEndsAt
                  ? `TRIAL · ${daysLeft(ws.trialEndsAt)}D`
                  : planById(ws.plan).name.toUpperCase()}
              </span>
            </NavLink>
          </div>
        )}
        <button
          type="button"
          onClick={onOpenAgent}
          aria-label="Open EventOps AI (Ctrl K)"
          title="EventOps AI · Ctrl K"
          className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-ink px-2 py-1.5 text-left shadow-[0_4px_14px_rgba(75,58,134,.35)] ring-1 ring-ai/40 transition hover:ring-ai"
        >
          <ThinkingOrb
            state="working"
            size={32}
            theme="dark"
            color="#c7ffb3"
            aria-hidden="true"
          />
          <span className="font-mono text-[10.5px] tracking-[.04em] text-[#c7ffb3]">
            EVENTOPS AI
          </span>
          <span className="ml-auto font-mono text-[10.5px] text-[#95A39A]">
            Ctrl K
          </span>
        </button>
        {user && (
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <span className="grid size-[30px] flex-none place-items-center rounded-full bg-[#D6E4D9] text-[11px]">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">
                {user.name}
              </div>
              <div className="truncate text-[11.5px] text-ink-3 capitalize">
                {user.role}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="cursor-pointer text-xs text-ink-3 hover:text-accent"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
