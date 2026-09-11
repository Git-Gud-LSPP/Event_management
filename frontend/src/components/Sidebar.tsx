import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Calendar,
  BarChart2,
  Users,
  Box,
  Building2,
  Zap,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
  { label: "Events", icon: Calendar, path: "/events" },
  { label: "Schedule", icon: BarChart2, path: "/schedule" },
  { label: "Staff", icon: Users, path: "/staff" },
  { label: "Inventory", icon: Box, path: "/inventory" },
  { label: "Vendors", icon: Building2, path: "/vendors" },
  //   { label: "Incidents", icon: AlertTriangle, path: "/incidents", badge: 2 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("Dashboard");
  const location = useLocation();
  // const navigate = useNavigate();

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <span className="font-semibold text-gray-900 text-base">EventHQ</span>
        {/* <span className="text-gray-300 mx-1">|</span> */}
        {/* <span className="text-gray-500 text-sm">Kathmandu</span> */}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              //onClick={() => setActive(item.label)}
              onClick={() => {
                setActive(item.label);

                if (item.label === "Schedule") {
                  navigate("/schedule");
                }
              }}
              // onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent"
                }`}
            >
              {isActive && (
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-amber-400" />
              )}
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-red-100 text-red-500 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
