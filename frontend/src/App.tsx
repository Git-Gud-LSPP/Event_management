import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar";
import AgentPanel from "./features/agent/AgentPanel";
import AuthPage from "./features/auth/AuthPage";
import EventsDashboard from "./features/events/EventsDashboard";
import EventDetail from "./features/events/EventDetail";
import StaffDashboard from "./features/staff/StaffDashboard";
import SchedulePage from "./features/schedule/SchedulePage";
import MyTasksPage from "./features/mytask/MyTaskpage";
import VendorsPage from "./features/vendors/VendorsPage";
import IncidentsPage from "./features/incidents/IncidentsPage";
import FloorPlanPage from "./features/floorplan/FloorPlanPage";
import VendorDetailPage from "./features/vendors/VendorDetailPage";
import DocumentsPage from "./features/documents/DocumentsPage";
import { isLoggedIn } from "./services/authApi";

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
        <Outlet key={dataVersion} />
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
      <AgentPanel
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        onDataChanged={() => setDataVersion((v) => v + 1)}
      />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Full-screen Public Route */}
        <Route path="/login" element={<AuthPage />} />

        {/* 2. Main App Routes inside MainLayout (login required) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsDashboard />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/my-tasks" element={<MyTasksPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/:vendorId" element={<VendorDetailPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/staffs" element={<StaffDashboard />} />
          <Route path="/floorplan" element={<FloorPlanPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
        </Route>

        {/* 3. Fallback Route */}
        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
