import { Plus } from 'lucide-react';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

const Button = ({ label, onClick, disabled = false, type = 'button' }: ButtonProps) => {
    return (
        <div>
            <button
              type={type}
              onClick={onClick}
              disabled={disabled}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f3f8f7] text-[#021814] rounded-full font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
          <Plus className="w-4 h-4" />
          <span>{label}</span>
        </button>
        </div>
    );
}

export default Button;
