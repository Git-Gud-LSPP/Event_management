import React from "react";
import Button from "./Button";
import SearchBar from "./SearchBar";

const DashboardHeader = ({
  title,
  subtitle,
  label,
  categoriesList
}: {
  title: string;
  subtitle: string;
  label: string;
  categoriesList: string[];
}): React.JSX.Element => {
  return (
    <header className="mb-8 space-y-6">
      {/* Top Row: Category Tag, Title & Create Event Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/80 rounded-full mb-2">
            {title}
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">{subtitle}</p>
        </div>

        {/* Searchbar */}
        <Button label={label} />

      </div>

      {/* Bottom Row: Status Filter Bar & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 bg-white rounded-full border border-gray-100 shadow-sm flex-wrap gap-1">
          {
            categoriesList.map((category: string) => (
              <button className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#021814] text-white transition-colors cursor-pointer">
                {category} <span className="ml-1 opacity-70">6</span>
              </button>
              )
            )
          }
        </div>

        {/* Search Field */}
        <SearchBar placeholder="Search for events..." />
      </div>
    </header>
  );
};

export default DashboardHeader;
