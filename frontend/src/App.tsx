import Sidebar from "./components/Sidebar";
import EventsDashboard from "./features/events/EventsDashboard";

// Main routing and app wrapper
const App = () => {
  return (
    <div className="flex min-h-screen text-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <EventsDashboard />
      </main>
    </div>
  );
};

export default App;
