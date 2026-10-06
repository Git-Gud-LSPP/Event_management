import { initials } from "./geometry";
import { PX_PER_M } from "./itemStyle";
import type { Floor, Kind, Room, RosterMember } from "./types";
import { KINDS, catOf, isSpace, kindOf } from "./types";

const kicker = "font-mono text-[10.5px] tracking-[.05em] text-[#6E7C73]";
const card = "rounded-2xl bg-surface p-[18px]";
const m = (px: number) => (px / PX_PER_M).toFixed(1);

export interface Check {
  tone: "bad" | "warn";
  text: string;
  actLabel: string;
  fix: { add: Kind } | { select: string };
}

interface Props {
  floors: Floor[];
  active: number;
  roster: RosterMember[];
  selectedId: string | null;
  snap: boolean;
  checks: Check[];
  dragging: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (kind: Kind) => void;
  onGoTo: (floor: number, id: string) => void;
  onBeginEdit: () => void;
  onPatchRoom: (id: string, patch: Partial<Room>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onUnplace: (userId: string) => void;
  onPlace: (userId: string) => void;
  onDragPerson: (name: string | null) => void;
}

export default function DetailsPanel(p: Props) {
  const floor = p.floors[p.active];
  const nameOf = (id: string) => p.roster.find((r) => r._id === id)?.name || "Unknown";
  const roomName = (id: string | null) => floor.rooms.find((r) => r.id === id)?.name;
  const sel = floor.rooms.find((r) => r.id === p.selectedId);
  const pinUser = p.selectedId?.startsWith("u:") ? p.selectedId.slice(2) : null;
  const pin = pinUser ? floor.placements.find((q) => q.user === pinUser) : undefined;
  const placedTotal = p.floors.reduce((a, f) => a + f.placements.length, 0);
  const spaces = floor.rooms.filter(isSpace);

  return (
    <aside className="flex h-[calc(100vh-170px)] min-h-[560px] max-w-full flex-[0_0_300px] flex-col gap-3 overflow-y-auto">
      {sel && <ItemCard key={sel.id} {...p} sel={sel} floorName={floor.name} staffHere={floor.placements.filter((q) => q.roomId === sel.id).map((q) => q.user)} nameOf={nameOf} />}

      {pin && (
        <div className={`${card} flex flex-col gap-3.5`}>
          <div className="flex items-center justify-between">
            <span className={kicker}>STAFF</span>
            <CloseBtn onClick={() => p.onSelect(null)} />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#F4F7F3] p-3">
            <Avatar name={nameOf(pin.user)} placed />
            <div className="min-w-0 text-[13px]">
              <div className="truncate font-medium">{nameOf(pin.user)}</div>
              <div className="text-xs text-[#6E7C73]">{roomName(pin.roomId) ? `In ${roomName(pin.roomId)}` : "Loose on the floor"}</div>
            </div>
          </div>
          <ActionBtn danger onClick={() => p.onUnplace(pin.user)}>Remove from plan</ActionBtn>
        </div>
      )}

      {!sel && !pin && (
        <div className={card}>
          <div className={kicker}>{floor.name.toUpperCase()} · SUMMARY</div>
          <div className="mt-3.5 grid grid-cols-2 gap-x-2.5 gap-y-3.5">
            {[
              ["Spaces", spaces.length],
              ["Capacity", spaces.reduce((a, r) => a + (r.capacity || 0), 0)],
              ["Fire exits", floor.rooms.filter((r) => kindOf(r) === "exit").length],
              ["Staff on floor", floor.placements.length],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-2xl tracking-[-0.03em] tabular-nums">{v}</div>
                <div className="text-xs text-[#6E7C73]">{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={card}>
        <div className="mb-2 flex items-center justify-between">
          <span className={kicker}>PEOPLE · {placedTotal}/{p.roster.length} PLACED</span>
          <span className="text-[11.5px] text-[#8A968E]">Drag onto the plan</span>
        </div>
        {p.roster.length === 0 && <p className="border-t border-line-soft pt-2 text-[13px] text-ink-3">No staff on this event yet.</p>}
        {p.roster.map((r) => {
          const fIdx = p.floors.findIndex((f) => f.placements.some((q) => q.user === r._id));
          const here = fIdx === p.active;
          const q = fIdx >= 0 ? p.floors[fIdx].placements.find((x) => x.user === r._id)! : null;
          const where = !q ? "not placed" : here ? roomName(q.roomId) ?? "on floor" : p.floors[fIdx].name;
          return (
            <div
              key={r._id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", "staff:" + r._id);
                e.dataTransfer.effectAllowed = "move";
                p.onDragPerson(r.name);
              }}
              onDragEnd={() => p.onDragPerson(null)}
              title="Drag onto the plan"
              className={`flex cursor-grab items-center gap-2.5 rounded-lg border-t border-line-soft py-2 pr-1.5 text-[13px] hover:bg-[#F7FAF6] ${p.dragging === r.name ? "bg-[#F4F9F3]" : ""}`}
            >
              <span aria-hidden className="grid flex-none grid-cols-[3px_3px] gap-0.5 px-0.5">
                {Array.from({ length: 6 }, (_, i) => <span key={i} className="size-[3px] rounded-full bg-[#B5BFB8]" />)}
              </span>
              <Avatar name={r.name} placed={!!q} small />
              <div className="min-w-0 flex-1">
                <div className="truncate">{r.name}</div>
                <div className="truncate text-[11.5px] text-[#6E7C73]">{where}</div>
              </div>
              <button
                onClick={() => (q ? p.onGoTo(fIdx, "u:" + r._id) : p.onPlace(r._id))}
                className="cursor-pointer rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 hover:border-ink"
              >
                {q ? (here ? "Locate" : "Go") : "Place"}
              </button>
            </div>
          );
        })}
      </div>

      <div className={card}>
        <div className={`${kicker} mb-2.5 flex items-center gap-[7px]`}>
          <span className="size-1.5 rounded-full bg-[#8A75D1]" />CHECKS · {p.checks.length}
        </div>
        {p.checks.length === 0 && (
          <div className="flex gap-2.5 border-t border-line-soft py-[9px] text-[13px] text-ink-2">
            <span className="mt-1.5 size-[7px] flex-none rounded-full bg-live" />No issues found on this floor.
          </div>
        )}
        {p.checks.map((c) => (
          <div key={c.text} className="flex items-start gap-2.5 border-t border-line-soft py-[9px] text-[13px] leading-[1.4]">
            <span className={`mt-1.5 size-[7px] flex-none rounded-full ${c.tone === "bad" ? "bg-danger" : "bg-[#C08A1E]"}`} />
            <span className="flex-1 text-ink-2">{c.text}</span>
            <button onClick={() => ("add" in c.fix ? p.onAdd(c.fix.add) : p.onSelect(c.fix.select))} className="cursor-pointer text-xs font-medium whitespace-nowrap hover:text-accent">{c.actLabel}</button>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ItemCard(p: Props & { sel: Room; floorName: string; staffHere: string[]; nameOf: (id: string) => string }) {
  const { sel } = p;
  const k: Kind = kindOf(sel), cat = catOf(sel), step = p.snap ? 12 : 6;
  const space = isSpace(sel);
  const room = !space ? p.floors[p.active].rooms.filter(isSpace).find((r) => {
    const cx = sel.x + sel.width / 2, cy = sel.y + sel.height / 2;
    return cx > r.x && cx < r.x + r.width && cy > r.y && cy < r.y + r.height;
  }) : undefined;
  const patch = (x: Partial<Room>) => {
    p.onBeginEdit();
    p.onPatchRoom(sel.id, x);
  };
  const fields: [string, string | number, (d: number) => void][] = [];
  if (cat !== "safety") {
    fields.push(["Width", m(sel.width) + " m", (d) => patch({ width: Math.max(20, sel.width + d * step) })]);
    fields.push(["Depth", m(sel.height) + " m", (d) => patch({ height: Math.max(20, sel.height + d * step) })]);
  }
  if (KINDS[k].cap !== undefined) fields.push(["Capacity", sel.capacity, (d) => patch({ capacity: Math.max(0, sel.capacity + d * (sel.capacity >= 50 ? 10 : 1)) })]);

  return (
    <div className={`${card} flex flex-col gap-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className={kicker}>{KINDS[k].label.toUpperCase()}{sel.locked ? " · LOCKED" : ""}</span>
        <CloseBtn onClick={() => p.onSelect(null)} />
      </div>
      <input
        aria-label="Name"
        value={sel.name}
        onFocus={p.onBeginEdit}
        onChange={(e) => p.onPatchRoom(sel.id, { name: e.target.value })}
        className="border-b border-dashed border-transparent pb-0.5 text-[22px] font-medium tracking-[-0.03em] outline-none hover:border-[#CBD6CC] focus:border-ink"
      />

      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {fields.map(([label, value, set]) => (
            <div key={label} className="flex flex-col gap-[5px]">
              <span className="text-[11.5px] text-[#6E7C73]">{label}</span>
              <span className="flex h-9 items-center overflow-hidden rounded-[10px] border border-[#CBD6CC] bg-[#F7FAF6]">
                <button onClick={() => set(-1)} aria-label={`Decrease ${label}`} className="w-7 cursor-pointer text-center text-[#56645B]">−</button>
                <span className="flex-1 text-center font-mono text-[13px]">{value}</span>
                <button onClick={() => set(1)} aria-label={`Increase ${label}`} className="w-7 cursor-pointer text-center text-[#56645B]">+</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {cat === "service" && (
        <label className="flex flex-col gap-[5px]">
          <span className="text-[11.5px] text-[#6E7C73]">Owner on show day</span>
          <select
            value={sel.owner ?? ""}
            onChange={(e) => patch({ owner: e.target.value || null })}
            className="h-9 rounded-[10px] border border-[#CBD6CC] bg-[#F7FAF6] px-2.5 text-[13px] outline-none"
          >
            <option value="">Unassigned</option>
            {p.roster.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </label>
      )}

      {space && (
        <div>
          <div className="mb-1.5 text-[11.5px] text-[#6E7C73]">Staff in this space</div>
          {p.staffHere.length === 0 ? (
            <p className="text-[13px] text-ink-3">Nobody placed yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {p.staffHere.map((u) => (
                <li key={u}>
                  <button onClick={() => p.onSelect("u:" + u)} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#F4F7F3] py-0.5 pr-2.5 pl-0.5 text-xs hover:bg-line-soft">
                    <Avatar name={p.nameOf(u)} placed small />{p.nameOf(u)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex justify-between border-t border-line-soft pt-3 text-[12.5px] text-[#6E7C73]">
        <span>{cat === "safety" ? p.floorName : `${m(sel.width)} × ${m(sel.height)} m · ${Math.round((sel.width * sel.height) / PX_PER_M ** 2)} m²`}</span>
        <span>{room ? `in ${room.name}` : ""}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <ActionBtn onClick={() => patch({ rot: ((sel.rot || 0) + 90) % 360 })}>Rotate</ActionBtn>
        <ActionBtn onClick={() => p.onDuplicate(sel.id)}>Duplicate</ActionBtn>
        <ActionBtn onClick={() => patch({ locked: !sel.locked })}>{sel.locked ? "Unlock" : "Lock"}</ActionBtn>
        <ActionBtn danger onClick={() => p.onDelete(sel.id)}>Delete</ActionBtn>
      </div>
    </div>
  );
}

function Avatar({ name, placed, small }: { name: string; placed: boolean; small?: boolean }) {
  return (
    <span
      className={`grid flex-none place-items-center rounded-full ${small ? "size-[26px] text-[9.5px]" : "size-[34px] text-[11px]"} ${
        placed ? "bg-ink text-paper" : "border border-dashed border-[#C4CEC6] text-ink-2"
      }`}
    >
      {initials(name)}
    </span>
  );
}

const CloseBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} aria-label="Close" className="grid size-6 cursor-pointer place-items-center rounded-full bg-paper text-[13px] text-ink-2">×</button>
);

const ActionBtn = ({ danger, onClick, children }: { danger?: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`cursor-pointer rounded-[10px] border border-line px-1 py-2 text-center text-xs hover:border-ink ${danger ? "text-danger" : "text-ink"}`}
  >
    {children}
  </button>
);
