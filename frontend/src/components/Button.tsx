import { Plus } from 'lucide-react';

const Button = ({ label, onClick }: { label: string; onClick?: () => void }) => {
    return (
        <div>
            <button
              type="button"
              onClick={onClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f3f8f7] text-[#021814] rounded-full font-medium text-sm hover:bg-slate-800 hover:text-white transition-colors shadow-sm self-start sm:self-auto cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>{label}</span>
        </button>
        </div>
    );
}

export default Button;
