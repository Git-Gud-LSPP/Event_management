import { NavLink } from "react-router-dom";
import { CreditCard, LayoutGrid, Lock } from "lucide-react";
import { getStoredUser, logout } from "../services/authApi";
import { planById } from "../billing/catalog";
import { daysLeft, hasModule, useWorkspace } from "../billing/plan";
import { Wordmark } from "../marketing/ui";
import type { EventRecord } from "../features/events/api";
import { NAV, eventBadge, initials } from "./nav";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-sm transition-colors ${
    isActive ? "bg-surface text-ink shadow-[0_1px_2px_rgba(20,45,30,.08)]" : "text-ink-2 hover:bg-surface hover:text-ink"
  }`;

export default function Sidebar({ event, onOpenAgent }: { event: EventRecord | null; onOpenAgent: () => void }) {
  const user = getStoredUser();
  const ws = useWorkspace();
  const isOrganizer = user?.role !== "staff";
  const badge = eventBadge(event);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-line bg-paper lg:flex">
      <div className="flex h-[60px] items-center border-b border-line px-[18px]">
        <NavLink to="/" aria-label="EventOps home"><Wordmark /></NavLink>
      </div>

      <div className="px-3 pt-3.5 pb-1.5">
        <NavLink to={event ? `/events/${event._id}` : "/events"} className="flex items-center justify-between gap-2 rounded-[10px] bg-surface px-3 py-2.5 text-[13px] hover:ring-1 hover:ring-line-strong">
          <div className="min-w-0">
            <div className="font-mono text-[10px] tracking-[.04em] text-ink-3">CURRENT EVENT</div>
            <div className="mt-0.5 truncate font-medium">{event?.title ?? "No event selected"}</div>
          </div>
          {badge && (
            <span className={`inline-flex shrink-0 items-center gap-[5px] rounded-full px-[7px] py-0.5 font-mono text-[10px] ${badge.cls}`}>
              <span className={`size-[5px] rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          )}
        </NavLink>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-auto px-3 py-2" aria-label="Workspaces">
        {NAV.map((n) => (
          <NavLink key={n.path} to={n.path} className={navCls}>
            <span className={`size-[7px] flex-none rounded-[2px] ${n.dot}`} aria-hidden="true" />
            <span className="flex-1">{n.label}</span>
            {n.module && !hasModule(ws, n.module) && <Lock className="h-3.5 w-3.5 text-ink-3" aria-label="Not in your plan" />}
          </NavLink>
        ))}
        {isOrganizer && (
          <div className="mt-3 flex flex-col gap-0.5 border-t border-line pt-3">
            <NavLink to="/modules" className={navCls}>
              <LayoutGrid className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
              <span className="flex-1">Browse modules</span>
            </NavLink>
            <NavLink to="/billing" className={navCls}>
              <CreditCard className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
              <span className="flex-1">Plan & billing</span>
              <span className="font-mono text-[10.5px] text-ink-3">{ws.trialEndsAt ? `TRIAL · ${daysLeft(ws.trialEndsAt)}D` : planById(ws.plan).name.toUpperCase()}</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="flex flex-col gap-2.5 p-3">
        <button type="button" onClick={onOpenAgent} className="block cursor-pointer rounded-xl bg-ink p-3.5 text-left text-paper hover:bg-[#22322A]">
          <div className="flex items-center gap-[7px] font-mono text-[10.5px] tracking-[.04em] text-ai">
            <span className="size-1.5 rounded-full bg-live" />EVENTOPS AI
          </div>
          <div className="mt-2 text-[13.5px] leading-[1.4]">Ask about {event?.title ?? "your events"}, or tell it what to do.</div>
          <div className="mt-2.5 flex justify-between text-xs text-[#95A39A]">
            <span>Ask anything</span>
            <span className="font-mono">Ctrl K</span>
          </div>
        </button>
        {user && (
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <span className="grid size-[30px] flex-none place-items-center rounded-full bg-[#D6E4D9] text-[11px]">{initials(user.name)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{user.name}</div>
              <div className="truncate text-[11.5px] text-ink-3 capitalize">{user.role}</div>
            </div>
            <button type="button" onClick={logout} className="cursor-pointer text-xs text-ink-3 hover:text-accent">Log out</button>
          </div>
        )}
      </div>
    </aside>
  );
}
