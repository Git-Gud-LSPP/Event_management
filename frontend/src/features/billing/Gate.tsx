import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { byId } from "../../billing/catalog";
import { addModule, freeSlots, hasModule, markUsed, useWorkspace } from "../../billing/plan";
import { Clip } from "../../marketing/ui";
import { buttonCls } from "../../marketing/lib";
import { SlotDialog } from "./shared";
import { getStoredUser } from "../../services/authApi";

// What a locked preview promises, per live add-on. Concrete outcomes, not feature names.
const PREVIEW: Record<string, { bullets: string[]; clip?: string }> = {
  "floor-plan": {
    clip: "floorplan",
    bullets: ["Draw halls and outdoor sites to scale", "Place stages, bars, first-aid and exits", "Share the current layout with every crew member"],
  },
  incidents: {
    clip: "incidents",
    bullets: ["Staff log incidents from the floor in seconds", "Triage by severity and assign an owner", "Timestamped trail for the post-event review"],
  },
  vendors: {
    bullets: ["One directory of suppliers, contacts and history", "Track quotes and bookings per event", "See which vendor is delivering what, and when"],
  },
};

/** Route wrapper: renders the module when the workspace has it, otherwise its preview. */
export default function Gate({ id, children }: { id: string; children: ReactNode }) {
  const w = useWorkspace();
  const on = hasModule(w, id);
  useEffect(() => {
    if (on) markUsed(id);
  }, [on, id]);
  return on ? children : <LockedModule id={id} />;
}

function LockedModule({ id }: { id: string }) {
  const w = useWorkspace();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<string | null>(null);
  const m = byId(id)!;
  const p = PREVIEW[id] ?? { bullets: [m.blurb] };
  const slots = freeSlots(w);

  const add = () => {
    if (slots > 0) {
      addModule(id);
      if (m.route) navigate(m.route);
    } else setDialog(id);
  };

  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="flex items-center gap-2 text-sm text-ink-3">
            <Lock className="size-4" aria-hidden="true" /> Not in your plan yet
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink">{m.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-2">{m.blurb}</p>
          <ul className="mt-6 space-y-3">
            {p.bullets.map((b) => (
              <li key={b} className="flex gap-2.5 text-ink">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-8 border-t border-line pt-4 text-sm text-ink-2">
            Included as one of your picks on every plan, and always on Enterprise.{" "}
            {slots > 0 ? `You have ${slots} free slot${slots === 1 ? "" : "s"}.` : "All your slots are in use."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {getStoredUser()?.role === "staff" ? (
              <p className="text-sm text-ink-2">Ask your organizer to add it.</p>
            ) : (
              <button type="button" onClick={add} className={buttonCls.primary}>
                Add to my plan
              </button>
            )}
            <Link to="/events" className={buttonCls.secondary}>Back to events</Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          {p.clip ? (
            <Clip name={p.clip} url={m.route ?? ""} label={`Preview of ${m.name}`} />
          ) : (
            <div className="eh-grid-bg flex aspect-[16/10] items-center justify-center rounded-card border border-line text-ink-3">
              <Lock className="size-8" strokeWidth={1} aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
      <SlotDialog want={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
