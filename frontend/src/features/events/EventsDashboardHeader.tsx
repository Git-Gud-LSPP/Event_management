import React from 'react';
import { Plus, Search } from 'lucide-react';

const EventsDashboardHeader = (): React.JSX.Element => {
  return (
    <header className="mb-8 space-y-6">
      {/* Top Row: Category Tag, Title & Create Event Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/80 rounded-full mb-2">
            EVENT OPERATIONS
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Events Overview</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">6 events across all status</p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#021814] text-white rounded-full font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Bottom Row: Status Filter Bar & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 bg-white rounded-full border border-gray-100 shadow-sm flex-wrap gap-1">
          <button className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#021814] text-white transition-colors cursor-pointer">
            All <span className="ml-1 opacity-70">6</span>
          </button>
          <button className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            Live <span className="ml-1 text-gray-400">1</span>
          </button>
          <button className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            Upcoming <span className="ml-1 text-gray-400">2</span>
          </button>
          <button className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            At Risk <span className="ml-1 text-gray-400">1</span>
          </button>
          <button className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            Completed <span className="ml-1 text-gray-400">2</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200/80 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
      </div>
    </header>
  );
}

export default EventsDashboardHeader;