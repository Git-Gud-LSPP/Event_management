import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar";
import LandingPage from "./marketing/LandingPage";
import Gate from "./features/billing/Gate";
import { isLoggedIn } from "./services/authApi";

// Landing stays in the main chunk (it's the LCP page); everything behind it loads on demand,
// so visitors don't download Leaflet/Konva/Gantt to read the homepage.
const AgentPanel = lazy(() => import("./features/agent/AgentPanel"));
const AuthPage = lazy(() => import("./features/auth/AuthPage"));
const SignupPage = lazy(() => import("./features/billing/SignupPage"));
const OnboardingPage = lazy(() => import("./features/billing/OnboardingPage"));
const ContactSalesPage = lazy(() => import("./marketing/ContactSalesPage"));
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

// Layout wrapper for authenticated application routes.
// No token -> straight to the login screen, remembering where they were headed.
const MainLayout = () => {
  const location = useLocation();
  const [agentOpen, setAgentOpen] = useState(false);
  // Bumped when the agent changes data; the key remounts the open page so it refetches.
  // ponytail: a remount also drops unsaved page state (e.g. an unsaved floor plan);
  // switch to per-page refetch hooks if that bites.
  const [dataVersion, setDataVersion] = useState(0);

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

  return (
    <div className="flex min-h-screen bg-[#FBFBF9] text-slate-900">
      <Sidebar />
      {/* Main content */}
      {/* <main className="flex-1 overflow-y-auto p-6"> */}
      <main className="h-screen min-w-0 flex-1 overflow-y-auto p-6">
        {/* Child routes render here */}
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-gray-100 motion-reduce:animate-none" aria-label="Loading" />}>
          <Outlet key={dataVersion} />
        </Suspense>
      </main>
      {!agentOpen && (
        <button
          type="button"
          onClick={() => setAgentOpen(true)}
          aria-label="Open assistant (Ctrl+K)"
          title="Assistant (Ctrl+K)"
          className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}
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

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Suspense><AuthPage /></Suspense>} />
        <Route path="/signup" element={<Suspense><SignupPage /></Suspense>} />
        <Route path="/contact-sales" element={<Suspense><ContactSalesPage /></Suspense>} />
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
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/billing/checkout" element={<CheckoutPage />} />
        </Route>

        {/* 3. Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
