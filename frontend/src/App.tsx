import Sidebar from "./components/Sidebar";
import AuthPage from "./features/auth/AuthPage";
import EventsDashboard from "./features/events/EventsDashboard";
// Main routing and app wrapper
const App = () => {
  return (
    <div>
      {/* The below components are temporary and will be replaced with proper routing */}
      <AuthPage/>
      <Sidebar/>
      <EventsDashboard/>
    </div>
  );
}

export default App;
