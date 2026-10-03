import React from "react";
import Button from "./Button";
import SearchBar from "./SearchBar";

const DashboardHeader = ({
  title,
  subtitle,
  label,
  categoriesList,
  counts,
  activeCategory,
  onCategoryChange,
  onAction,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
}: {
  title: string;
  subtitle: string;
  label: string;
  categoriesList: string[];
  counts?: Record<string, number>;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onAction?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}): React.JSX.Element => {
  return (
    <header className="mb-8 space-y-6">
      {/* Top Row: Title & primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">{subtitle}</p>
        </div>

        <Button label={label} onClick={onAction} />
      </div>

      {/* Bottom Row: Status Filter Bar & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 bg-white rounded-full border border-gray-100 shadow-sm flex-wrap gap-1">
          {categoriesList.map((category: string) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange?.(category)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#021814] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category}
                {counts?.[category] !== undefined && (
                  <span className="ml-1 opacity-70">{counts[category]}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <SearchBar
          placeholder={searchPlaceholder}
          value={search}
          onChange={onSearchChange}
        />
      </div>
    </header>
  );
};

export default DashboardHeader;
