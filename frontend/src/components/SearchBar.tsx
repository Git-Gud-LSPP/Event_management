import { Search } from "lucide-react";

const SearchBar = ({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}) => {
    return (
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={placeholder}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200/80 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
    );
}

export default SearchBar;
