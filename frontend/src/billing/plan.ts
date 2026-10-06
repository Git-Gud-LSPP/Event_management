import { useSyncExternalStore } from "react";
import { byId, planById, TRIAL_PLAN, type EventType, type PlanId } from "./catalog";
import { apiFetch } from "../services/api";
import { getStoredUser, isLoggedIn } from "../services/authApi";

// Workspace entitlements. localStorage is the fast local copy; the server copy (/api/billing/workspace)
// is the one backend routes enforce (backend/billing/billing.js).
// ponytail: plan changes have no payment behind them yet; verify against Stripe before charging money.

export interface Workspace {
  plan: PlanId;
  cycle: "monthly" | "annual";
  addOns: string[];
  renewsAt: string; // ISO date
  trialEndsAt?: string;
  cancelAt?: string; // set when cancelled or downgraded; change applies on this date
  pendingPlan?: PlanId;
  onboarded?: boolean;
  eventTypes?: EventType[];
  lastUsed?: Record<string, number>; // module id -> ms, for the swap dialog
  notify?: string[]; // roadmap modules the user asked to hear about
}

const KEY = "eh.workspace";
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Accounts that predate billing keep the modules they already use (as a Starter trial) instead of
// waking up to locked pages. New signups get set to Starter (free) by onboarding.
const legacyDefault = (): Workspace => ({
  plan: TRIAL_PLAN,
  cycle: "monthly",
  addOns: ["vendors", "incidents", "floor-plan"],
  renewsAt: iso(Date.now() + 14 * DAY),
  trialEndsAt: iso(Date.now() + 14 * DAY),
});

let cache: Workspace | null = null;
const listeners = new Set<() => void>();

// Date-driven rules, applied on load and on every save.
function normalize(w: Workspace): Workspace {
  const today = iso(Date.now());
  // Pre-v2 workspaces stored a "free" plan; Starter is the free tier now.
  if ((w.plan as string) === "free") w = { ...w, plan: "starter" };
  if ((w.pendingPlan as string) === "free") w = { ...w, pendingPlan: "starter" };
  // Core modules are always on and never take a slot (an older stack could list them as add-ons).
  if (w.addOns.some((id) => byId(id)?.core)) w = { ...w, addOns: w.addOns.filter((id) => !byId(id)?.core) };
  // A scheduled downgrade/cancel takes effect once its date passes. Kept add-ons are ordered first.
  if (w.pendingPlan && w.cancelAt && w.cancelAt <= today) w = { ...w, plan: w.pendingPlan, pendingPlan: undefined, cancelAt: undefined };
  // Unpaid trial ran out: back to Starter (free). Add-ons stay listed (locked, data kept) so upgrading restores them.
  if (w.trialEndsAt && w.trialEndsAt < today) w = { ...w, plan: "starter", trialEndsAt: undefined };
  return w;
}

export function readWorkspace(): Workspace {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = normalize(raw ? (JSON.parse(raw) as Workspace) : legacyDefault());
  } catch {
    cache = legacyDefault();
  }
  return cache;
}

const pushToServer = (w: Workspace) => {
  if (isLoggedIn() && getStoredUser()?.role !== "staff") {
    apiFetch("/billing/workspace", { method: "PUT", body: JSON.stringify(w) }).catch(() => {});
  }
};

// Local only (used when the server copy arrives).
function storeLocal(next: Workspace) {
  cache = normalize(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* private mode: keep in memory */
  }
  listeners.forEach((l) => l());
}

export function saveWorkspace(next: Workspace) {
  storeLocal(next);
  pushToServer(cache!);
}

/** On app load: take the server copy (staff get their organizer's), or seed the server from this browser. */
export async function syncWorkspace() {
  if (!isLoggedIn()) return;
  try {
    const { workspace } = await apiFetch<{ workspace: Workspace | null }>("/billing/workspace");
    if (workspace) storeLocal(workspace);
    else pushToServer(readWorkspace());
  } catch {
    /* offline: keep the local copy */
  }
}

const update = (fn: (w: Workspace) => Partial<Workspace>) => saveWorkspace({ ...readWorkspace(), ...fn(readWorkspace()) });

export function useWorkspace() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    readWorkspace,
    readWorkspace,
  );
}

export const slotsFor = (w: Workspace) => planById(w.plan).slots;
export const freeSlots = (w: Workspace) => Math.max(0, slotsFor(w) - w.addOns.length);

export const slotLabel = (w: Workspace) =>
  w.plan === "enterprise" ? "All modules included" : `${Math.min(w.addOns.length, slotsFor(w))} of ${slotsFor(w)} add-on slots used`;


export function hasModule(w: Workspace, id: string) {
  const m = byId(id);
  if (!m) return false;
  if (m.core || w.plan === "enterprise") return true;
  // Only the first `slots` add-ons are active; extras (after a downgrade or expired trial) are locked, not deleted.
  const at = w.addOns.indexOf(id);
  return !m.enterpriseOnly && at !== -1 && at < slotsFor(w);
}

export const addModule = (id: string) =>
  update((w) => ({ addOns: freeSlots(w) > 0 ? [...w.addOns.filter((a) => a !== id), id] : w.addOns }));
export const removeModule = (id: string) => update((w) => ({ addOns: w.addOns.filter((a) => a !== id) }));
export const swapModule = (out: string, inn: string) =>
  // In place, so the new module inherits the active slot (appending could land past the slot count).
  update((w) => ({ addOns: w.addOns.filter((a) => a !== inn).map((a) => (a === out ? inn : a)) }));

/** Immediate upgrade (prorated) or plan start from checkout. */
export function changePlan(plan: PlanId, cycle: Workspace["cycle"], addOns?: string[]) {
  const slots = planById(plan).slots;
  update((w) => ({
    plan,
    cycle,
    addOns: (addOns ?? w.addOns).slice(0, slots),
    renewsAt: iso(Date.now() + (cycle === "annual" ? 365 : 30) * DAY),
    trialEndsAt: undefined,
    cancelAt: undefined,
    pendingPlan: undefined,
  }));
}

/** Downgrades and cancellations apply at period end; `keep` = add-ons that stay active. */
export function scheduleChange(plan: PlanId, keep: string[]) {
  update((w) => ({ pendingPlan: plan, cancelAt: w.renewsAt, addOns: [...keep, ...w.addOns.filter((a) => !keep.includes(a))] }));
}

/** 14-day trial (Growth unless extra.plan says otherwise), no card. Used from onboarding and locked-module previews. */
export const startTrial = (addOns: string[], extra: Partial<Workspace> = {}) =>
  saveWorkspace({
    ...readWorkspace(),
    plan: TRIAL_PLAN,
    cycle: "monthly",
    addOns: addOns.slice(0, planById(extra.plan ?? TRIAL_PLAN).slots),
    renewsAt: iso(Date.now() + 14 * DAY),
    trialEndsAt: iso(Date.now() + 14 * DAY),
    cancelAt: undefined,
    pendingPlan: undefined,
    ...extra,
  });

export const markUsed = (id: string) => {
  const w = readWorkspace();
  // Only write when stale by an hour, so opening a page doesn't churn storage/listeners.
  if (Date.now() - (w.lastUsed?.[id] ?? 0) > 3_600_000) update(() => ({ lastUsed: { ...w.lastUsed, [id]: Date.now() } }));
};

export const toggleNotify = (id: string) =>
  update((w) => ({ notify: w.notify?.includes(id) ? w.notify.filter((x) => x !== id) : [...(w.notify ?? []), id] }));

export const daysLeft = (isoDate?: string) =>
  isoDate ? Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / DAY)) : 0;

export const undoScheduledChange = () => update(() => ({ pendingPlan: undefined, cancelAt: undefined }));

export const priceFor = (plan: PlanId, cycle: Workspace["cycle"]) => {
  const p = planById(plan);
  return cycle === "annual" ? p.annual : p.monthly;
};

// The stack a visitor builds in the landing-page explorer, carried into signup/onboarding.
const STACK_KEY = "eh.stack";
export const saveStack = (ids: string[]) => {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
};
export const loadStack = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(STACK_KEY) ?? "[]");
  } catch {
    return [];
  }
};
