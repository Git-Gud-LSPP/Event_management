import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import Sidebar from "./components/Sidebar";
import { NAV, navFor } from "./components/nav";
import { listEvents, type EventRecord } from "./features/events/api";
import { getSelectedEventId } from "./services/selectedEvent";
import LandingPage from "./marketing/LandingPage";
import Gate from "./features/billing/Gate";
import { getStoredUser, isLoggedIn } from "./services/authApi";
import { syncWorkspace, useWorkspace } from "./billing/plan";

// Landing stays in the main chunk (it's the LCP page); everything behind it loads on demand,
// so visitors don't download Leaflet/Konva/Gantt to read the homepage.
const AgentPanel = lazy(() => import("./features/agent/AgentPanel"));
const AuthPage = lazy(() => import("./features/auth/AuthPage"));
const SignupPage = lazy(() => import("./features/billing/SignupPage"));
const OnboardingPage = lazy(() => import("./features/billing/OnboardingPage"));
const ModulesPage = lazy(() => import("./features/billing/ModulesPage"));
const BillingPage = lazy(() => import("./features/billing/BillingPage"));
const CheckoutPage = lazy(() => import("./features/billing/CheckoutPage"));
const EventsDashboard = lazy(() => import("./features/events/EventsDashboard"));
const EventDetail = lazy(() => import("./features/events/EventDetail"));
const StaffDashboard = lazy(() => import("./features/staff/StaffDashboard"));
const SchedulePage = lazy(() => import("./features/schedule/SchedulePage"));
const MyTasksPage = lazy(() => import("./features/mytask/MyTaskpage"));
const VendorsPage = lazy(() => import("./features/vendors/VendorsPage"));
const IncidentsPage = lazy(() => import("./features/incidents/IncidentsPage"));
const FloorPlanPage = lazy(() => import("./features/floorplan/FloorPlanPage"));
const VendorDetailPage = lazy(() => import("./features/vendors/VendorDetailPage"));
const DocumentsPage = lazy(() => import("./features/documents/DocumentsPage"));
const BudgetPage = lazy(() => import("./features/budget/BudgetPage"));
const LostFoundPage = lazy(() => import("./features/lostfound/LostFoundPage"));
const AnalyticsPage = lazy(() => import("./features/analytics/AnalyticsPage"));
const ExportPage = lazy(() => import("./features/export/ExportPage"));
const IntegrationsPage = lazy(() => import("./features/integrations/IntegrationsPage"));

// Pages reach the assistant drawer through useOutletContext<LayoutContext>().
export type LayoutContext = { openAgent: () => void };

const EXTRA_CRUMBS: Record<string, string> = { "/events": "Events", "/modules": "Modules", "/billing": "Plan & billing", "/billing/checkout": "Checkout", "/integrations": "Integrations" };

// Layout wrapper for authenticated application routes.
// No token -> straight to the login screen, remembering where they were headed.
const MainLayout = () => {
  const location = useLocation();
  const [agentOpen, setAgentOpen] = useState(false);
  // Bumped when the agent changes data; the key remounts the open page so it refetches.
  // ponytail: a remount also drops unsaved page state (e.g. an unsaved floor plan);
  // switch to per-page refetch hooks if that bites.
  const [dataVersion, setDataVersion] = useState(0);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const ws = useWorkspace();

  useEffect(() => {
    void syncWorkspace();
  }, []);

  // The sidebar's "current event" card. Refetched when the agent changes data.
  useEffect(() => {
    if (isLoggedIn()) listEvents().then(({ items }) => setEvents(items)).catch(() => setEvents([]));
  }, [dataVersion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAgentOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const selectedId = getSelectedEventId();
  const event = events.find((e) => e._id === selectedId) ?? events[0] ?? null;
  const here = EXTRA_CRUMBS[location.pathname] ?? NAV.find((n) => location.pathname.startsWith(n.path))?.label ?? "Workspace";
  const openAgent = () => setAgentOpen(true);

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <Sidebar event={event} onOpenAgent={openAgent} />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-line bg-[rgba(242,245,241,.86)] backdrop-blur-[14px]">
          <div className="flex h-[60px] items-center justify-between gap-4 px-[clamp(16px,3vw,32px)]">
            <div className="flex min-w-0 items-center gap-2 text-[13px]">
              <span className="truncate whitespace-nowrap text-ink-3">{event?.title ?? "EventOps"}</span>
              <span className="text-[#C4CEC6]" aria-hidden="true">/</span>
              <span className="truncate font-medium">{here}</span>
            </div>
            <button
              type="button"
              onClick={openAgent}
              aria-keyshortcuts="Control+K"
              className="flex h-9 min-w-0 flex-[0_1_340px] cursor-pointer items-center gap-2.5 rounded-full bg-surface px-3 text-[13px] text-ink-3 ring-1 ring-transparent hover:ring-ink"
            >
              <span className="size-1.5 flex-none rounded-full bg-live" aria-hidden="true" />
              <span className="flex-1 truncate text-left">Ask AI about tasks, staff, vendors…</span>
              <span className="font-mono text-[10.5px]">Ctrl K</span>
            </button>
          </div>
          {/* Narrow screens: the sidebar is hidden, so workspaces become a scrolling pill row. */}
          <nav aria-label="Workspaces" className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 lg:hidden">
            {navFor(event, ws).map((n) => (
              <NavLink
                key={n.label}
                to={n.path}
                className={({ isActive }) => `rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap ${isActive ? "bg-ink text-paper" : "bg-surface text-ink-2"}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mx-auto max-w-[1240px] px-[clamp(16px,3vw,32px)] pt-[clamp(24px,4vw,44px)] pb-20">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-sunken motion-reduce:animate-none" aria-label="Loading" />}>
            <Outlet key={dataVersion} context={{ openAgent } satisfies LayoutContext} />
          </Suspense>
        </div>
      </main>
      <Suspense>
        <AgentPanel
          open={agentOpen}
          onClose={() => setAgentOpen(false)}
          onDataChanged={() => setDataVersion((v) => v + 1)}
        />
      </Suspense>
    </div>
  );
};

// Plan and billing belong to the organizer; staff land back on their tasks.
const OrganizerOnly = ({ children }: { children: ReactNode }) =>
  getStoredUser()?.role === "staff" ? <Navigate to="/my-tasks" replace /> : children;

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public */}
        {/* Marketing pages share the landing shell (nav, footer, motion); the key remounts it so scroll motion re-binds. */}
        <Route path="/" element={<LandingPage key="home" />} />
        {["/demo", "/product", "/ai", "/use-cases", "/pricing"].map((p) => (
          <Route key={p} path={p} element={<LandingPage key={p} />} />
        ))}
        <Route path="/login" element={<Suspense><AuthPage /></Suspense>} />
        <Route path="/signup" element={<Suspense><SignupPage /></Suspense>} />
        <Route path="/contact-sales" element={<Navigate to="/demo" replace />} />
        <Route
          path="/welcome"
          element={isLoggedIn() ? <Suspense><OnboardingPage /></Suspense> : <Navigate to="/signup" replace />}
        />

        {/* 2. App (login required). Add-on modules sit behind <Gate>, which shows a preview when locked. */}
        <Route element={<MainLayout />}>
          <Route path="/events" element={<EventsDashboard />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/my-tasks" element={<MyTasksPage />} />
          <Route path="/vendors" element={<Gate id="vendors"><VendorsPage /></Gate>} />
          <Route path="/vendors/:vendorId" element={<Gate id="vendors"><VendorDetailPage /></Gate>} />
          <Route path="/incidents" element={<Gate id="incidents"><IncidentsPage /></Gate>} />
          <Route path="/staffs" element={<StaffDashboard />} />
          <Route path="/floorplan" element={<Gate id="floor-plan"><FloorPlanPage /></Gate>} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/budget" element={<Gate id="budget-planner"><BudgetPage /></Gate>} />
          <Route path="/lost-and-found" element={<Gate id="lost-and-found"><LostFoundPage /></Gate>} />
          <Route path="/analytics" element={<Gate id="analytics"><AnalyticsPage /></Gate>} />
          <Route path="/export" element={<Gate id="data-export"><ExportPage /></Gate>} />
          {/* Each integration card checks its own module, so the page itself isn't gated. */}
          <Route path="/integrations" element={<OrganizerOnly><IntegrationsPage /></OrganizerOnly>} />
          <Route path="/modules" element={<OrganizerOnly><ModulesPage /></OrganizerOnly>} />
          <Route path="/billing" element={<OrganizerOnly><BillingPage /></OrganizerOnly>} />
          <Route path="/billing/checkout" element={<OrganizerOnly><CheckoutPage /></OrganizerOnly>} />
        </Route>

        {/* 3. Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
