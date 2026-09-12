import { useState } from "react";
import {
  List,
  Grid2X2,
  Search,
  ChevronDown,
  Bell,
  Check,
} from "lucide-react";

import { tasks } from "./data";
import ScheduleList from "./components/ScheduleList";
import Gantt from "./components/GanttView";

export default function SchedulePage() {
  const [view, setView] = useState<"list" | "gantt">("list");
  const [search, setSearch] = useState("");
  const [eventOpen, setEventOpen] = useState(false);

  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(search.toLowerCase()) ||
      task.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBF9]">

      {/* =====================================================
          TOP BAR
      ===================================================== */}
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 -mx-6 -mt-6">

        {/* LEFT */}
        <div className="flex items-center gap-4">

          {/* Event selector */}
          <div className="relative">
            <button
              onClick={() => setEventOpen(!eventOpen)}
              className="flex items-center gap-2 rounded-full bg-[#F5F5F2] px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

              <span>TechSummit 2026</span>

              <ChevronDown
                size={15}
                className={`transition-transform ${
                  eventOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Event dropdown */}
            {eventOpen && (
              <div className="absolute left-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                {/* Live */}
                <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Live
                </div>

                <button
                  onClick={() => setEventOpen(false)}
                  className="flex w-full items-center justify-between bg-green-50 px-4 py-4 text-left hover:bg-green-100"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-green-500" />

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        TechSummit 2026
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Aug 9, 2026 · 9:00 AM
                      </p>
                    </div>
                  </div>

                  <Check size={16} className="text-gray-800" />
                </button>

                {/* At Risk */}
                <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  At Risk
                </div>

                <button
                  onClick={() => setEventOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      GreenFest Music Festival
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Aug 15, 2026 · 2:00 PM
                    </p>
                  </div>
                </button>

                {/* Upcoming */}
                <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Upcoming
                </div>

                <button
                  onClick={() => setEventOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Meridian Corporate Gala
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Aug 22, 2026 · 6:00 PM
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setEventOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Design Week Opening
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Sep 5, 2026 · 11:00 AM
                    </p>
                  </div>
                </button>

                {/* Completed */}
                <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Completed
                </div>

                <button
                  onClick={() => setEventOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Founders Forum Q2
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Jul 12, 2026 · 8:00 AM
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <span className="text-sm text-gray-500">
            Schedule
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-5">

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-full border border-gray-200 bg-[#F7F7F5] py-2 pl-9 pr-4 text-sm outline-none focus:border-gray-400"
            />
          </div>

          {/* Notification */}
          <div className="relative">
            <Bell size={19} className="text-gray-700" />

            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              4
            </span>
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-800">
              PK
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Priya K.
              </p>

              <p className="text-xs text-gray-500">
                Organizer
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <div className="mb-8 flex items-start justify-between">

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Schedule
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {tasks.length} tasks ·{" "}
            {tasks.filter((task) => task.delayed).length} delayed
          </p>
        </div>

        {/* LIST / GANTT */}
        <div className="flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">

          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
              view === "list"
                ? "bg-[#002F2B] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <List size={15} />
            List
          </button>

          <button
            onClick={() => setView("gantt")}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
              view === "gantt"
                ? "bg-[#002F2B] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid2X2 size={14} />
            Gantt
          </button>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      {view === "list" && (
        <ScheduleList tasks={filteredTasks} />
      )}

      {view === "gantt" && (
        <Gantt tasks={filteredTasks} />
      )}
    </div>
  );
}