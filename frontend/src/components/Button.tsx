import { Plus } from "lucide-react";

/** Primary page action: ink pill. */
const Button = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="eh-press inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-ink px-[18px] py-[11px] text-sm text-paper hover:bg-ink-hover sm:self-auto"
  >
    <Plus className="h-4 w-4" aria-hidden="true" />
    <span>{label}</span>
  </button>
);

export default Button;
