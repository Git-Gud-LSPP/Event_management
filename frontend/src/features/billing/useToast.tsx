import { useEffect, useRef, useState } from "react";

/** Bottom-centre status pill. `flash(msg)` shows it for 2.6s. */
export function useToast() {
  const [msg, setMsg] = useState("");
  const t = useRef<number>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const flash = (m: string) => {
    clearTimeout(t.current);
    setMsg(m);
    t.current = window.setTimeout(() => setMsg(""), 2600);
  };
  const toast = msg && (
    <div role="status" className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-ink px-4 py-[11px] text-[13.5px] text-paper shadow-[0_20px_40px_-20px_rgba(0,0,0,.4)]">
      <span className="size-1.5 rounded-full bg-live" aria-hidden="true" />
      {msg}
    </div>
  );
  return { flash, toast };
}
