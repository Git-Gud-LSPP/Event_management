import type { ReactNode } from "react";
import Button from "./Button";
import SearchBar from "./SearchBar";

/** v2 page title: mono eyebrow, large title, one-line subtitle, actions on the right. */
export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow: string; title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <div className="font-mono text-xs tracking-[.04em] text-ink-3 uppercase">{eyebrow}</div>
        <h1 className="mt-2.5 mb-1.5 text-[clamp(30px,3.4vw,44px)] leading-none font-medium tracking-[-0.045em] text-ink">{title}</h1>
        {subtitle && <div className="text-[15px] text-ink-3">{subtitle}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Pill filter chips with optional counts. */
export function FilterChips({ options, counts, active, onChange }: { options: string[]; counts?: Record<string, number>; active?: string; onChange?: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
      {options.map((o) => {
        const on = active === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange?.(o)}
            className={`flex cursor-pointer items-center gap-[7px] rounded-full border px-[13px] py-[7px] text-[13px] transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2 hover:border-ink"}`}
          >
            {o}
            {counts?.[o] !== undefined && <span className="font-mono text-[10.5px] opacity-60">{counts[o]}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Two-way segmented control (List / Board, Timeline / List). */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-full bg-sunken p-[3px] text-[13px]" role="group">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`cursor-pointer rounded-full px-3.5 py-[7px] ${value === o ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]" : "text-ink-2"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const DashboardHeader = ({
  title,
  subtitle,
  label,
  eyebrow,
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
  eyebrow?: string;
  categoriesList: string[];
  counts?: Record<string, number>;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onAction?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}) => (
  <header className="mb-5">
    <PageHeader eyebrow={eyebrow ?? title} title={title} subtitle={subtitle}>
      <Button label={label} onClick={onAction} />
    </PageHeader>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <FilterChips options={categoriesList} counts={counts} active={activeCategory} onChange={onCategoryChange} />
      <SearchBar placeholder={searchPlaceholder} value={search} onChange={onSearchChange} />
    </div>
  </header>
);

export default DashboardHeader;
