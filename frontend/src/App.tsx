import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import EventsDashboard from "./features/events/EventsDashboard";
import EventDetail from "./features/events/EventDetail";
import AuthPage from "./features/auth/AuthPage";

// Layout wrapper for authenticated application routes
const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#FBFBF9] text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Child routes render here */}
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Full-screen Public Route */}
        <Route path="/login" element={<AuthPage />} />

        {/* 2. Main App Routes inside MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsDashboard />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
        </Route>

        {/* 3. Fallback Route */}
        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;