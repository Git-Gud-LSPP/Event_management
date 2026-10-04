import { NavLink } from "react-router-dom";
import {
  Calendar,
  BarChart2,
  Users,
  Building2,
  LayoutPanelTop,
  Zap,
  LogOut,
  AlertTriangle,
  ListTodo,
  FileText,
  Lock,
  LayoutGrid,
  CreditCard,
} from "lucide-react";
import { getStoredUser, logout } from "../services/authApi";
import { planById } from "../billing/catalog";
import { daysLeft, hasModule, useWorkspace } from "../billing/plan";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  module?: string; // gated add-on: shows a lock when not in the plan
}

const navItems: NavItem[] = [
  { label: "Events", icon: Calendar, path: "/events" },
  { label: "My Tasks", icon: ListTodo, path: "/my-tasks" },
  { label: "Schedule", icon: BarChart2, path: "/schedule" },
  { label: "Staff", icon: Users, path: "/staffs" },
  { label: "Vendors", icon: Building2, path: "/vendors", module: "vendors" },
  { label: "Incidents", icon: AlertTriangle, path: "/incidents", module: "incidents" },
  { label: "Floor Plan", icon: LayoutPanelTop, path: "/floorplan", module: "floor-plan" },
  { label: "Documents", icon: FileText, path: "/documents" },
];

export default function Sidebar() {
  const user = getStoredUser();
  const ws = useWorkspace();
  const isOrganizer = user?.role !== "staff";

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <span className="font-semibold text-gray-900 text-base">EventHQ</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-amber-400" />
                  )}
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.module && !hasModule(ws, item.module) && (
                    <Lock className="h-3.5 w-3.5 text-gray-400" aria-label="Not in your plan" />
                  )}
                  {item.badge && (
                    <span className="bg-red-100 text-red-500 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {isOrganizer && (
        <div className="space-y-1 border-t border-gray-100 px-3 py-3">
          {[
            { label: "Browse modules", icon: LayoutGrid, path: "/modules" },
            { label: "Plan & billing", icon: CreditCard, path: "/billing" },
          ].map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {path === "/billing" && (
                <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                  {ws.trialEndsAt ? `Trial · ${daysLeft(ws.trialEndsAt)}d` : planById(ws.plan).name}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}

      {/* Who is signed in, and the way out */}
      <div className="border-t border-gray-100 px-3 py-3">
        {user && (
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-800">
              {user.name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
              <p className="truncate text-xs capitalize text-gray-500">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}
