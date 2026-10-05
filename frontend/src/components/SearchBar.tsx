import { Search } from "lucide-react";

const SearchBar = ({ placeholder, value, onChange }: { placeholder: string; value?: string; onChange?: (value: string) => void }) => (
  <div className="relative w-full md:w-72">
    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
    <input
      type="search"
      aria-label={placeholder}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      className="h-9 w-full rounded-full border border-line-strong/60 bg-surface pr-4 pl-9 text-[13px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
    />
  </div>
);

export default SearchBar;
