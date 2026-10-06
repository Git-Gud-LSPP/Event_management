import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Cat, Floor, Room, RosterMember } from "./types";
import { CATS, KINDS, catOf, isSpace } from "./types";
import { contentBounds, initials } from "./geometry";
import { PX_PER_M, itemStyle, type DropPayload } from "./itemStyle";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const PIN = 28; // staff pin diameter; placements store the pin's centre

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
const mono = "font-mono";

type Drag =
  | { mode: "pan"; sx: number; sy: number; px: number; py: number; moved: boolean }
  | { mode: "move"; id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean }
  | { mode: "resize"; id: string; sx: number; sy: number; ow: number; oh: number; moved: boolean }
  | { mode: "pin"; user: string; sx: number; sy: number; ox: number; oy: number; moved: boolean };

interface Props {
  floor: Floor;
  roster: RosterMember[];
  selectedId: string | null; // room id, or "u:<userId>" for a staff pin
  hidden: Cat[];
  snap: boolean;
  onSelect: (id: string | null) => void;
  onToggleLayer: (c: Cat) => void;
  onToggleSnap: () => void;
  /** Called once before a drag changes anything, so the page can push an undo step. */
  onBeginEdit: () => void;
  onPatchRoom: (id: string, patch: Partial<Room>) => void;
  onMovePin: (userId: string, x: number, y: number) => void;
  onDrop: (payload: DropPayload, x: number, y: number) => void;
  /** The page reads the visible centre through this to place click-added items. */
  centerRef: React.MutableRefObject<() => { x: number; y: number }>;
  dragLabel: string | null;
}

export default function FloorCanvas(p: Props) {
  const { floor, roster, selectedId, hidden, snap } = p;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ zoom: 0.7, x: 24, y: 24 });
  const [layersOpen, setLayersOpen] = useState(false);
  const [dropHint, setDropHint] = useState(false);
  const userMoved = useRef(false);
  const drag = useRef<Drag | null>(null);
  // Window listeners are bound once; they read the latest render through this.
  const live = useRef({ p, view });
  useLayoutEffect(() => {
    live.current = { p, view };
  });

  const visible = floor.rooms
    .filter((r) => !hidden.includes(catOf(r)))
    // Spaces underneath, biggest first, then markers on top.
    .sort((a, b) => (isSpace(b) ? 1 : 0) - (isSpace(a) ? 1 : 0) || b.width * b.height - a.width * a.height);
  const pins = hidden.includes("staff") ? [] : floor.placements;

  const fit = useCallback(() => {
    const el = wrapRef.current;
    const b = contentBounds(
      floor.rooms.filter((r) => !hidden.includes(catOf(r))),
      hidden.includes("staff") ? [] : floor.placements
    );
    if (!el || !b) return setView({ zoom: 0.8, x: 24, y: 24 });
    const zoom = clampZoom(Math.min((el.clientWidth - 64) / b.width, (el.clientHeight - 96) / b.height));
    setView({
      zoom,
      x: (el.clientWidth - b.width * zoom) / 2 - b.x * zoom,
      y: (el.clientHeight - b.height * zoom) / 2 - b.y * zoom,
    });
  }, [floor.rooms, floor.placements, hidden]);

  // Fit on first size and on every resize until the user pans or zooms. The page keys this
  // component by floor, so switching floors remounts and refits.
  const fitRef = useRef(fit);
  useLayoutEffect(() => {
    fitRef.current = fit;
  });
  useEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => !userMoved.current && fitRef.current());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoomTo = useCallback((next: number, a?: { x: number; y: number }) => {
    userMoved.current = true;
    setView((v) => {
      const el = wrapRef.current!;
      const zoom = clampZoom(next), k = zoom / v.zoom;
      const pt = a ?? { x: el.clientWidth / 2, y: el.clientHeight / 2 };
      return { zoom, x: pt.x - (pt.x - v.x) * k, y: pt.y - (pt.y - v.y) * k };
    });
  }, []);

  // Wheel must be non-passive to stop the page scrolling.
  useEffect(() => {
    const el = wrapRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomTo(live.current.view.zoom * (e.deltaY > 0 ? 0.92 : 1.08), { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomTo]);

  const toWorld = (cx: number, cy: number) => {
    const r = wrapRef.current!.getBoundingClientRect(), v = live.current.view;
    return { x: (cx - r.left - v.x) / v.zoom, y: (cy - r.top - v.y) / v.zoom };
  };
  const { centerRef } = p;
  useLayoutEffect(() => {
    centerRef.current = () => {
      const r = wrapRef.current!.getBoundingClientRect(), v = live.current.view;
      return { x: (r.width / 2 - v.x) / v.zoom, y: (r.height / 2 - v.y) / v.zoom };
    };
  }, [centerRef]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const { p, view } = live.current;
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      if (!d.moved && d.mode !== "pan") p.onBeginEdit();
      d.moved = true;
      const z = view.zoom;
      const s = (v: number) => (p.snap ? Math.round(v / 12) * 12 : Math.round(v));
      if (d.mode === "pan") {
        userMoved.current = true;
        setView((v) => ({ ...v, x: d.px + dx, y: d.py + dy }));
      } else if (d.mode === "move") p.onPatchRoom(d.id, { x: s(d.ox + dx / z), y: s(d.oy + dy / z) });
      else if (d.mode === "resize") p.onPatchRoom(d.id, { width: Math.max(20, s(d.ow + dx / z)), height: Math.max(20, s(d.oh + dy / z)) });
      else p.onMovePin(d.user, Math.round(d.ox + dx / z), Math.round(d.oy + dy / z));
    };
    const up = () => {
      const d = drag.current;
      drag.current = null;
      // A click (no movement) on empty canvas clears the selection.
      if (d?.mode === "pan" && !d.moved) {
        live.current.p.onSelect(null);
        setLayersOpen(false);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const stop = (e: React.PointerEvent) => e.stopPropagation();
  const staffIn = (r: Room) => floor.placements.filter((q) => q.roomId === r.id).length;
  const nameOf = (id: string) => roster.find((m) => m._id === id)?.name || "Unknown";
  const zoom = view.zoom;
  const pill = "cursor-pointer rounded-full px-3 py-[7px] text-[12.5px]";

  return (
    <div
      ref={wrapRef}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, px: view.x, py: view.y, moved: false };
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dropHint) setDropHint(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDropHint(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropHint(false);
        const d = e.dataTransfer.getData("text/plain"), pt = toWorld(e.clientX, e.clientY);
        if (d.startsWith("kind:")) p.onDrop({ kind: "item", type: d.slice(5) as keyof typeof KINDS }, pt.x, pt.y);
        if (d.startsWith("staff:")) p.onDrop({ kind: "staff", userId: d.slice(6) }, pt.x, pt.y);
      }}
      className="relative h-full min-h-[560px] w-full cursor-grab touch-none overflow-hidden rounded-2xl bg-surface select-none"
      style={{
        outline: dropHint ? "2px dashed #3F8A64" : "none",
        outlineOffset: -2,
        backgroundImage: "linear-gradient(#EDF2EC 1px,transparent 1px),linear-gradient(90deg,#EDF2EC 1px,transparent 1px)",
        backgroundSize: `${PX_PER_M * zoom}px ${PX_PER_M * zoom}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    >
      <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `translate(${view.x}px,${view.y}px) scale(${zoom})` }}>
        {visible.map((it) => {
          const st = itemStyle(it, isSpace(it) ? staffIn(it) : 0);
          const sel = it.id === selectedId;
          return (
            <div
              key={it.id}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (e.button !== 0) return;
                p.onSelect(it.id);
                setLayersOpen(false);
                if (!it.locked) drag.current = { mode: "move", id: it.id, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, moved: false };
              }}
              className="absolute"
              style={{
                left: it.x, top: it.y, width: it.width, height: it.height,
                transform: `rotate(${it.rot || 0}deg)`,
                outline: sel ? "2px solid #3F8A64" : "none", outlineOffset: 3,
                borderRadius: st.radius, cursor: it.locked ? "default" : "move",
              }}
            >
              <div
                className="absolute inset-0 flex flex-col gap-0.5 overflow-hidden"
                style={{
                  borderRadius: st.radius, background: st.bg, border: st.border, color: st.fg,
                  alignItems: st.align, justifyContent: st.justify, padding: st.pad,
                }}
              >
                <span className="leading-[1.15] font-medium whitespace-nowrap" style={{ fontSize: st.fs, fontFamily: st.ff, letterSpacing: st.ls }}>
                  {st.label}
                </span>
                {st.sub && <span className={`${mono} text-[10px] whitespace-nowrap`} style={{ color: st.subFg }}>{st.sub}</span>}
              </div>
              {sel && !it.locked && catOf(it) !== "safety" && (
                <span
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    drag.current = { mode: "resize", id: it.id, sx: e.clientX, sy: e.clientY, ow: it.width, oh: it.height, moved: false };
                  }}
                  className="absolute -right-[7px] -bottom-[7px] size-3 cursor-nwse-resize rounded-[3px] border-2 border-live bg-white"
                />
              )}
            </div>
          );
        })}
        {pins.map((q) => (
          <div
            key={q.user}
            title={nameOf(q.user)}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.button !== 0) return;
              p.onSelect("u:" + q.user);
              drag.current = { mode: "pin", user: q.user, sx: e.clientX, sy: e.clientY, ox: q.x, oy: q.y, moved: false };
            }}
            className="absolute grid cursor-move place-items-center rounded-full border-2 border-white bg-ink text-[9.5px] font-medium text-paper"
            style={{
              left: q.x - PIN / 2, top: q.y - PIN / 2, width: PIN, height: PIN,
              outline: selectedId === "u:" + q.user ? "2px solid #3F8A64" : "none", outlineOffset: 3,
            }}
          >
            {initials(nameOf(q.user))}
          </div>
        ))}
      </div>

      {/* Layers */}
      <div onPointerDown={stop} className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
        <button onClick={() => setLayersOpen((o) => !o)} className={`${pill} flex items-center gap-2 bg-ink text-paper`}>
          Layers<span className={`${mono} text-[10.5px] text-[#95A39A]`}>{CATS.length - hidden.length}/{CATS.length}</span>
        </button>
        {layersOpen && (
          <div className="w-[220px] rounded-xl bg-surface p-1.5 shadow-[0_20px_40px_-20px_rgba(20,45,30,.35),0_0_0_1px_#E1E8E0]">
            {CATS.map(([c, name]) => {
              const on = !hidden.includes(c);
              const count = c === "staff" ? floor.placements.length : floor.rooms.filter((r) => catOf(r) === c).length;
              return (
                <button
                  key={c}
                  role="switch"
                  aria-checked={on}
                  onClick={() => p.onToggleLayer(c)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-[#F4F7F3] ${on ? "text-ink" : "text-[#8A968E]"}`}
                >
                  <span className={`relative h-4 w-7 flex-none rounded-full ${on ? "bg-live" : "bg-[#CBD6CC]"}`}>
                    <span className="absolute top-0.5 size-3 rounded-full bg-white transition-[left]" style={{ left: on ? 14 : 2 }} />
                  </span>
                  <span className="flex-1">{name}</span>
                  <span className={`${mono} text-[10.5px] text-[#8A968E]`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div onPointerDown={stop} className="absolute top-3 right-3">
        <button
          onClick={p.onToggleSnap}
          aria-pressed={snap}
          className={`${pill} shadow-[0_0_0_1px_#E1E8E0] ${snap ? "bg-ink text-paper" : "bg-surface text-ink-2"}`}
        >
          Snap {snap ? "0.5 m" : "off"}
        </button>
      </div>

      <div onPointerDown={stop} className="absolute right-3 bottom-3 flex items-center gap-1.5">
        <div className="flex items-center rounded-full bg-surface text-[13px] shadow-[0_0_0_1px_#E1E8E0]">
          <button onClick={() => zoomTo(zoom / 1.2)} aria-label="Zoom out" className="cursor-pointer px-3 py-[7px]">−</button>
          <span className={`${mono} min-w-[42px] text-center text-[11px]`}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => zoomTo(zoom * 1.2)} aria-label="Zoom in" className="cursor-pointer px-3 py-[7px]">+</button>
        </div>
        <button
          onClick={() => {
            userMoved.current = false;
            fit();
          }}
          className={`${pill} bg-surface shadow-[0_0_0_1px_#E1E8E0]`}
        >
          Fit
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3.5 left-3 flex flex-col gap-1">
        <span className={`${mono} text-[10px] text-[#6E7C73]`}>5 m</span>
        <span className="block h-1.5 border-[1.5px] border-t-0 border-[#6E7C73]" style={{ width: 5 * PX_PER_M * zoom }} />
      </div>

      {dropHint && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-live px-3.5 py-[7px] text-[12.5px] whitespace-nowrap text-white">
          {p.dragLabel ? `Drop to place ${p.dragLabel}` : "Drop to place"}
        </div>
      )}

      {!floor.rooms.length && !floor.placements.length && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="max-w-[300px] text-center">
            <div className="text-base font-medium">An empty floor</div>
            <div className="mt-1.5 text-[13.5px] leading-[1.45] text-ink-3">Drag a room from Components, or click one to add it here.</div>
          </div>
        </div>
      )}
    </div>
  );
}
