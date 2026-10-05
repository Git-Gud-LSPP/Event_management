import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Circle, Transformer } from "react-konva";
import { Minus, Plus, Maximize } from "lucide-react";
import type Konva from "konva";
import type { Floor, Placement, Room, RosterMember } from "./types";
import { contentBounds, initials, roomAt } from "./geometry";

const MIN_SIZE = 40;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const FIT_PADDING = 48;

const clampZoom = (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s));

interface Props {
  floor: Floor;
  roster: RosterMember[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRoomsChange: (rooms: Room[]) => void;
  onPlacementsChange: (placements: Placement[]) => void;
  /** Drop from the left palette or the People list, in stage coords. */
  onDrop: (
    payload: { kind: "room" } | { kind: "staff"; userId: string },
    x: number,
    y: number
  ) => void;
}

export default function FloorCanvas({
  floor,
  roster,
  selectedId,
  onSelect,
  onRoomsChange,
  onPlacementsChange,
  onDrop,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [renaming, setRenaming] = useState<string | null>(null);
  // Pan/zoom lives in React state so the wheel, the buttons and the readout agree.
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });

  // Stage needs pixel dimensions, so track the wrapper.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Attach the transformer to whichever room is selected.
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selectedId ? stage.findOne("#" + selectedId) : null;
    tr.nodes(node ? [node] : []);
  }, [selectedId, floor.rooms]);

  const nameOf = (userId: string) => roster.find((m) => m._id === userId)?.name || "Unknown";

  const patchRoom = (id: string, patch: Partial<Room>) =>
    onRoomsChange(floor.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // Browser drop -> stage coordinates, undoing the stage's own pan/zoom.
  const toStageCoords = (e: React.DragEvent) => {
    const stage = stageRef.current!;
    stage.setPointersPositions(e.nativeEvent);
    const pos = stage.getPointerPosition()!;
    return stage.getAbsoluteTransform().copy().invert().point(pos);
  };

  // Zoom to `next`, keeping `anchor` (viewport px) pinned to the same spot on the plan.
  const zoomTo = useCallback((next: number, anchor?: { x: number; y: number }) => {
    setView((v) => {
      const scale = clampZoom(next);
      const a = anchor ?? { x: size.width / 2, y: size.height / 2 };
      const k = scale / v.scale;
      return { scale, x: a.x - (a.x - v.x) * k, y: a.y - (a.y - v.y) * k };
    });
  }, [size.width, size.height]);

  const fit = useCallback(() => {
    const b = contentBounds(floor.rooms, floor.placements);
    if (!b) return setView({ scale: 1, x: 0, y: 0 });
    const scale = clampZoom(
      Math.min(
        (size.width - FIT_PADDING * 2) / b.width,
        (size.height - FIT_PADDING * 2) / b.height
      )
    );
    setView({
      scale,
      x: (size.width - b.width * scale) / 2 - b.x * scale,
      y: (size.height - b.height * scale) / 2 - b.y * scale,
    });
  }, [floor.rooms, floor.placements, size.width, size.height]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const pointer = e.target.getStage()!.getPointerPosition()!;
    zoomTo(view.scale * (e.evt.deltaY > 0 ? 0.92 : 1.08), pointer);
  };

  const renamingRoom = floor.rooms.find((r) => r.id === renaming);

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden rounded-xl border border-line bg-surface"
      style={{
        backgroundImage:
          "linear-gradient(#EDF2EC 1px, transparent 1px), linear-gradient(90deg, #EDF2EC 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const userId = e.dataTransfer.getData("application/x-staff-id");
        const { x, y } = toStageCoords(e);
        onDrop(userId ? { kind: "staff", userId } : { kind: "room" }, x, y);
      }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={view.scale}
        scaleY={view.scale}
        x={view.x}
        y={view.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          // Child drags bubble up here too; only the stage itself is a pan.
          if (e.target === e.target.getStage()) {
            setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
          }
        }}
        onMouseDown={(e) => {
          // Clicking empty canvas clears the selection.
          if (e.target === e.target.getStage()) onSelect(null);
        }}
      >
        <Layer>
          {floor.rooms.map((room) => {
            const occupied = floor.placements.filter((p) => p.roomId === room.id).length;
            return (
              <Group key={room.id}>
                <Rect
                  id={room.id}
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={room.color}
                  stroke={selectedId === room.id ? "#16231C" : "#C4CEC6"}
                  strokeWidth={selectedId === room.id ? 2 : 1}
                  cornerRadius={4}
                  draggable
                  onClick={() => onSelect(room.id)}
                  onTap={() => onSelect(room.id)}
                  onDblClick={() => setRenaming(room.id)}
                  onDragEnd={(e) => patchRoom(room.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={(e) => {
                    // Konva scales nodes rather than resizing them: bake the scale into
                    // width/height and reset it, or every later drag compounds it.
                    const node = e.target;
                    patchRoom(room.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(MIN_SIZE, node.width() * node.scaleX()),
                      height: Math.max(MIN_SIZE, node.height() * node.scaleY()),
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
                <Text
                  x={room.x + 10}
                  y={room.y + 8}
                  text={room.name}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#16231C"
                  listening={false}
                />
                <Text
                  x={room.x + 10}
                  y={room.y + 26}
                  text={occupied + " / " + room.capacity}
                  fontSize={12}
                  fill={occupied > room.capacity ? "#8A2E52" : "#5C6A62"}
                  listening={false}
                />
              </Group>
            );
          })}

          {floor.placements.map((p) => (
            <Group
              key={p.user}
              x={p.x}
              y={p.y}
              draggable
              onDragEnd={(e) => {
                const x = e.target.x();
                const y = e.target.y();
                onPlacementsChange(
                  floor.placements.map((q) =>
                    q.user === p.user ? { ...q, x, y, roomId: roomAt(floor.rooms, x, y) } : q
                  )
                );
              }}
            >
              <Circle radius={16} fill="#16231C" stroke="white" strokeWidth={2} />
              <Text
                x={-16}
                y={-5}
                width={32}
                align="center"
                text={initials(nameOf(p.user))}
                fontSize={11}
                fontStyle="bold"
                fill="white"
                listening={false}
              />
              <Text
                x={-40}
                y={20}
                width={80}
                align="center"
                text={nameOf(p.user)}
                fontSize={11}
                fill="#16231C"
                listening={false}
              />
            </Group>
          ))}

          <Transformer
            ref={trRef}
            rotateEnabled={false}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < MIN_SIZE || newBox.height < MIN_SIZE ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-lg border border-line bg-surface/95 p-1 shadow-sm backdrop-blur">
        <button
          onClick={() => zoomTo(view.scale - 0.2)}
          disabled={view.scale <= MIN_ZOOM}
          title="Zoom out"
          aria-label="Zoom out"
          className="rounded p-1.5 text-ink-2 hover:bg-sunken disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoomTo(1)}
          title="Reset to 100%"
          aria-label="Reset zoom to 100%"
          className="min-w-14 rounded px-1 py-1 text-xs font-medium text-ink-2 tabular-nums hover:bg-sunken"
        >
          {Math.round(view.scale * 100)}%
        </button>
        <button
          onClick={() => zoomTo(view.scale + 0.2)}
          disabled={view.scale >= MAX_ZOOM}
          title="Zoom in"
          aria-label="Zoom in"
          className="rounded p-1.5 text-ink-2 hover:bg-sunken disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-sunken" />
        <button
          onClick={fit}
          title="Fit plan to screen"
          aria-label="Fit plan to screen"
          className="rounded p-1.5 text-ink-2 hover:bg-sunken"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>

      {/* Inline rename, positioned over the room in screen space. */}
      {renamingRoom && (
        <input
          autoFocus
          defaultValue={renamingRoom.name}
          className="absolute z-10 rounded border border-ink px-1 text-sm outline-none"
          style={{
            left: renamingRoom.x * view.scale + view.x + 8,
            top: renamingRoom.y * view.scale + view.y + 6,
            width: 140,
          }}
          onBlur={(e) => {
            const name = e.target.value.trim();
            if (name) patchRoom(renamingRoom.id, { name });
            setRenaming(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setRenaming(null);
          }}
        />
      )}
    </div>
  );
}
