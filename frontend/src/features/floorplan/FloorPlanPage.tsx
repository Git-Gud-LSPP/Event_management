import { useEffect, useRef, useState } from "react";
import FloorCanvas from "./FloorCanvas";
import { itemStyle, type DropPayload } from "./itemStyle";
import DetailsPanel, { type Check } from "./DetailsPanel";
import { roomAt } from "./geometry";
import { getFloorPlan, listEvents, saveFloorPlan } from "./api";
import { getSelectedEventId, setSelectedEventId } from "../../services/selectedEvent";
import type { Cat, EventSummary, Floor, Kind, Placement, Room, RosterMember } from "./types";
import { CATS, KINDS, catOf, isSpace, kindOf } from "./types";

const ROOM_TINTS = ["#E3F1E7", "#E8EEFD", "#F3E8FD", "#E4F7F9", "#F4DCE6", "#F3E7C8"];
const newFloor = (n: number): Floor => ({ name: `Level ${n}`, rooms: [], placements: [] });
const seg = (on: boolean) =>
  `cursor-pointer whitespace-nowrap rounded-full px-[13px] py-1.5 text-[13px] ${on ? "bg-surface text-ink shadow-[0_1px_2px_rgba(22,35,28,.12)]" : "text-[#56645B] hover:text-ink"}`;

export default function FloorPlanPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventId, setEventId] = useState("");
  const [floors, setFloors] = useState<Floor[]>([newFloor(1)]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [active, setActive] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Cat[]>([]);
  const [snap, setSnap] = useState(true);
  const [palQ, setPalQ] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  // Undo history: whole-plan snapshots. ponytail: 60 full copies, fine for venue-sized plans.
  const [hist, setHist] = useState<{ past: Floor[][]; future: Floor[][] }>({ past: [], future: [] });
  const centerRef = useRef(() => ({ x: 300, y: 200 }));

  useEffect(() => {
    listEvents()
      .then((items) => {
        setEvents(items);
        const stored = getSelectedEventId();
        if (items.length) setEventId(items.some((e) => e._id === stored) ? stored : items[0]._id);
      })
      .catch((e) => setStatus(e.message));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    setSelectedEventId(eventId);
    getFloorPlan(eventId)
      .then(({ floors, roster }) => {
        setFloors(floors);
        setRoster(roster);
        setActive(0);
        setSelectedId(null);
        setDirty(false);
        setHist({ past: [], future: [] });
        setStatus(null);
      })
      .catch((e) => setStatus(e.message));
  }, [eventId]);

  const floor = floors[active];

  const snapshot = () => setHist((h) => ({ past: [...h.past.slice(-59), floors], future: [] }));
  const travel = (dir: "past" | "future") => {
    const back = dir === "past" ? "future" : "past";
    const target = hist[dir].at(-1);
    if (!target) return;
    setHist({ [dir]: hist[dir].slice(0, -1), [back]: [...hist[back], floors] } as typeof hist);
    setFloors(target);
    setSelectedId(null);
    setDirty(true);
  };
  const undo = () => travel("past");
  const redo = () => travel("future");

  const patchFloor = (fn: (f: Floor) => Partial<Floor>) => {
    setFloors((prev) => prev.map((f, i) => (i === active ? { ...f, ...fn(f) } : f)));
    setDirty(true);
  };
  const patchRoom = (id: string, patch: Partial<Room>) =>
    patchFloor((f) => ({ rooms: f.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const addItem = (kind: Kind, pos?: { x: number; y: number }) => {
    const at = pos ?? centerRef.current();
    const d = KINDS[kind];
    const sn = (v: number) => (snap ? Math.round(v / 12) * 12 : Math.round(v));
    const count = floor.rooms.filter((r) => kindOf(r) === kind).length;
    const item: Room = {
      id: crypto.randomUUID(),
      kind,
      name: kind === "room" ? `Room ${count + 1}` : d.label,
      x: sn(at.x - d.w / 2),
      y: sn(at.y - d.h / 2),
      width: d.w,
      height: d.h,
      capacity: d.cap ?? 0,
      color: ROOM_TINTS[floor.rooms.filter(isSpace).length % ROOM_TINTS.length],
    };
    snapshot();
    patchFloor((f) => ({ rooms: [...f.rooms, item] }));
    setSelectedId(item.id);
  };

  const deleteRoom = (id: string) => {
    snapshot();
    // People stay where they are, just no longer counted against the room.
    patchFloor((f) => ({
      rooms: f.rooms.filter((r) => r.id !== id),
      placements: f.placements.map((p) => (p.roomId === id ? { ...p, roomId: null } : p)),
    }));
    setSelectedId(null);
  };

  const duplicate = (id: string) => {
    const it = floor.rooms.find((r) => r.id === id);
    if (!it) return;
    const copy = { ...it, id: crypto.randomUUID(), x: it.x + 24, y: it.y + 24, locked: false };
    snapshot();
    patchFloor((f) => ({ rooms: [...f.rooms, copy] }));
    setSelectedId(copy.id);
  };

  // A person sits on exactly one floor at a time: placing them clears them elsewhere.
  const placeStaff = (userId: string, pos?: { x: number; y: number }) => {
    const at = pos ?? centerRef.current();
    const placement: Placement = {
      user: userId,
      roomId: roomAt(floor.rooms.filter(isSpace), at.x, at.y),
      x: Math.round(at.x),
      y: Math.round(at.y),
    };
    snapshot();
    setFloors((prev) =>
      prev.map((f, i) => {
        const rest = f.placements.filter((p) => p.user !== userId);
        return { ...f, placements: i === active ? [...rest, placement] : rest };
      })
    );
    setDirty(true);
    setSelectedId("u:" + userId);
  };

  const movePin = (userId: string, x: number, y: number) =>
    patchFloor((f) => ({
      placements: f.placements.map((p) =>
        p.user === userId ? { ...p, x, y, roomId: roomAt(f.rooms.filter(isSpace), x, y) } : p
      ),
    }));

  const unplace = (userId: string) => {
    snapshot();
    patchFloor((f) => ({ placements: f.placements.filter((p) => p.user !== userId) }));
    setSelectedId(null);
  };

  const handleDrop = (payload: DropPayload, x: number, y: number) => {
    setDragging(null);
    if (payload.kind === "item") addItem(payload.type, { x, y });
    else placeStaff(payload.userId, { x, y });
  };

  // Keyboard: undo/redo always; the rest act on the selection. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      const mod = e.metaKey || e.ctrlKey, key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        return e.shiftKey ? redo() : undo();
      }
      if (!selectedId) return;
      if (e.key === "Escape") return setSelectedId(null);
      const userId = selectedId.startsWith("u:") ? selectedId.slice(2) : null;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        return userId ? unplace(userId) : deleteRoom(selectedId);
      }
      if (userId) return;
      if (mod && key === "d") {
        e.preventDefault();
        return duplicate(selectedId);
      }
      const d = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[e.key];
      const it = floor.rooms.find((r) => r.id === selectedId);
      if (d && it && !it.locked) {
        e.preventDefault();
        const step = e.shiftKey ? 24 : snap ? 12 : 2;
        snapshot();
        patchRoom(it.id, { x: it.x + d[0] * step, y: it.y + d[1] * step });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const save = async () => {
    setStatus("Saving…");
    try {
      await saveFloorPlan(eventId, floors);
      setDirty(false);
      setStatus("Saved");
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  // Rule-based checks on the current floor.
  const checks: Check[] = [];
  const exits = floor.rooms.filter((r) => kindOf(r) === "exit").length;
  if (exits < 2) checks.push({ tone: "bad", text: `${exits} fire exit${exits === 1 ? "" : "s"} marked. Most venues need at least 2 per floor.`, actLabel: "Add exit", fix: { add: "exit" } });
  if (floor.rooms.length && !floor.rooms.some((r) => kindOf(r) === "access"))
    checks.push({ tone: "warn", text: "No accessible entry marked on this floor.", actLabel: "Add", fix: { add: "access" } });
  floor.rooms
    .filter((r) => kindOf(r) === "room" && !floor.placements.some((p) => p.roomId === r.id))
    .forEach((r) => checks.push({ tone: "warn", text: `Nobody is placed in ${r.name}.`, actLabel: "Show", fix: { select: r.id } }));
  floor.rooms
    .filter((r) => catOf(r) === "service" && !r.owner)
    .forEach((r) => checks.push({ tone: "warn", text: `${r.name} has no owner for show day.`, actLabel: "Assign", fix: { select: r.id } }));

  const term = palQ.trim().toLowerCase();
  const palette = CATS.filter(([c]) => c !== "staff")
    .map(([c, name]) => ({
      name,
      items: (Object.keys(KINDS) as Kind[]).filter((k) => KINDS[k].cat === c && (!term || KINDS[k].label.toLowerCase().includes(term))),
    }))
    .filter((g) => g.items.length);

  return (
    <div>
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <label className="flex items-center gap-1 font-mono text-xs tracking-[.04em] text-ink-3">
            FLOOR PLAN ·
            <select
              aria-label="Event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="max-w-[260px] cursor-pointer truncate bg-transparent uppercase outline-none hover:text-ink"
            >
              {events.length === 0 && <option value="">No events</option>}
              {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
          </label>
          <h1 className="mt-2.5 text-[clamp(30px,3.4vw,44px)] leading-none font-medium tracking-[-0.045em]">Floor plan</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status && <span role="status" className="text-xs text-ink-3">{status}</span>}
          <div className="flex gap-1 rounded-full bg-[#E6EEE6] p-1">
            {floors.map((f, i) => (
              <button key={i} onClick={() => { setActive(i); setSelectedId(null); }} className={seg(i === active)}>{f.name}</button>
            ))}
            <button
              onClick={() => {
                snapshot();
                setFloors((prev) => [...prev, newFloor(prev.length + 1)]);
                setActive(floors.length);
                setSelectedId(null);
                setDirty(true);
              }}
              className={seg(false)}
            >
              + Floor
            </button>
          </div>
          <div className="flex rounded-full bg-surface">
            <button onClick={undo} disabled={!hist.past.length} aria-label="Undo" className="cursor-pointer px-3 py-2 text-sm disabled:cursor-default disabled:opacity-35">↶</button>
            <button onClick={redo} disabled={!hist.future.length} aria-label="Redo" className="cursor-pointer px-3 py-2 text-sm disabled:cursor-default disabled:opacity-35">↷</button>
          </div>
          <button
            onClick={save}
            disabled={!eventId}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-[18px] py-2.5 text-sm text-paper hover:bg-ink-hover disabled:opacity-50"
          >
            {dirty || status !== "Saved" ? "Save" : "Saved"}
            {dirty && <span className="size-1.5 rounded-full bg-[#E0A93A]" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        {/* Palette */}
        <aside className="flex h-[calc(100vh-170px)] min-h-[560px] max-w-full flex-[0_0_232px] flex-col rounded-2xl bg-surface">
          <div className="border-b border-line-soft px-3.5 pt-3.5 pb-2.5">
            <div className="mb-2.5 font-mono text-[10.5px] tracking-[.05em] text-[#6E7C73]">COMPONENTS · DRAG OR CLICK</div>
            <input
              value={palQ}
              onChange={(e) => setPalQ(e.target.value)}
              placeholder="Search components"
              aria-label="Search components"
              className="h-[34px] w-full rounded-full border border-[#CBD6CC] bg-[#F7FAF6] px-3 text-[13px] outline-none focus:border-ink focus:bg-white"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pt-1.5 pb-3">
            {palette.map((g) => (
              <div key={g.name}>
                <div className="flex justify-between px-1.5 pt-2.5 pb-1 text-xs font-medium text-ink-2">
                  <span>{g.name}</span><span className="font-mono text-[10.5px] text-[#8A968E]">{g.items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {g.items.map((k) => <PaletteItem key={k} kind={k} onAdd={() => addItem(k)} onDrag={(on) => setDragging(on ? KINDS[k].label : null)} />)}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-2.5">
          <div className="h-[calc(100vh-170px)] min-h-[560px]">
            <FloorCanvas
              key={active + ":" + eventId}
              floor={floor}
              roster={roster}
              selectedId={selectedId}
              hidden={hidden}
              snap={snap}
              onSelect={setSelectedId}
              onToggleLayer={(c) => {
                setHidden((h) => (h.includes(c) ? h.filter((x) => x !== c) : [...h, c]));
                setSelectedId(null);
              }}
              onToggleSnap={() => setSnap((s) => !s)}
              onBeginEdit={snapshot}
              onPatchRoom={patchRoom}
              onMovePin={movePin}
              onDrop={handleDrop}
              centerRef={centerRef}
              dragLabel={dragging}
            />
          </div>
          <div className="flex flex-wrap gap-4 px-1 text-xs text-[#6E7C73]">
            <span>Drag to move · corner to resize · drag empty space to pan · scroll to zoom</span>
            <span className="font-mono text-[10.5px]">DEL remove · ⌘D duplicate · ⌘Z undo · ←→ nudge</span>
          </div>
        </div>

        <DetailsPanel
          floors={floors}
          active={active}
          roster={roster}
          selectedId={selectedId}
          snap={snap}
          checks={checks}
          dragging={dragging}
          onSelect={setSelectedId}
          onAdd={(k) => addItem(k)}
          onGoTo={(i, id) => { setActive(i); setSelectedId(id); }}
          onBeginEdit={snapshot}
          onPatchRoom={patchRoom}
          onDuplicate={duplicate}
          onDelete={deleteRoom}
          onUnplace={unplace}
          onPlace={(u) => placeStaff(u)}
          onDragPerson={setDragging}
        />
      </div>
    </div>
  );
}

function PaletteItem({ kind, onAdd, onDrag }: { kind: Kind; onAdd: () => void; onDrag: (on: boolean) => void }) {
  const d = KINDS[kind];
  const st = itemStyle({ id: "", kind, name: d.label, x: 0, y: 0, width: d.w, height: d.h, capacity: 0, color: ROOM_TINTS[0] });
  const sc = Math.min(1, 34 / d.w, 20 / d.h);
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "kind:" + kind);
        onDrag(true);
      }}
      onDragEnd={() => onDrag(false)}
      onClick={onAdd}
      title={d.label}
      className="flex cursor-grab flex-col items-center gap-[7px] rounded-[10px] bg-[#F7FAF6] px-1 pt-3 pb-[9px] hover:bg-line-soft"
    >
      <span className="grid h-[22px] place-items-center">
        <span
          className="grid place-items-center font-mono text-[7.5px] font-medium"
          style={{
            width: Math.max(12, d.w * sc), height: Math.max(10, d.h * sc), borderRadius: 4,
            background: st.bg, border: kind === "stage" ? 0 : st.border.replace("1.5px", "1px"), color: st.fg,
          }}
        >
          {d.cat === "safety" ? d.code : ""}
        </span>
      </span>
      <span className="text-center text-[11.5px] leading-[1.2] text-ink-2">{d.label}</span>
    </button>
  );
}
