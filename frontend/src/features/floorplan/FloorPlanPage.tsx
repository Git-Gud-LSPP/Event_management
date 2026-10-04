import { useCallback, useEffect, useState } from "react";
import { Square, UserPlus, Plus, Save } from "lucide-react";
import FloorCanvas from "./FloorCanvas";
import { roomAt } from "./geometry";
import DetailsPanel from "./DetailsPanel";
import { getFloorPlan, listEvents, saveFloorPlan } from "./api";
import type { EventSummary, Floor, Placement, Room, RosterMember } from "./types";

const ROOM_TINTS = ["#e4f7f9", "#e8f6ec", "#fdeaea", "#fff3c2", "#f3e8fd", "#e8eefd"];

const newFloor = (n: number): Floor => ({ name: `Floor ${n}`, rooms: [], placements: [] });

export default function FloorPlanPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventId, setEventId] = useState("");
  const [floors, setFloors] = useState<Floor[]>([newFloor(1)]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [active, setActive] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    listEvents()
      .then((items) => {
        setEvents(items);
        if (items.length) setEventId(items[0]._id);
      })
      .catch((e) => setStatus(e.message));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    getFloorPlan(eventId)
      .then(({ floors, roster }) => {
        setFloors(floors);
        setRoster(roster);
        setActive(0);
        setSelectedId(null);
        setDirty(false);
        setStatus(null);
      })
      .catch((e) => setStatus(e.message));
  }, [eventId]);

  const floor = floors[active];

  const patchFloor = useCallback(
    (patch: Partial<Floor>) => {
      setFloors((prev) => prev.map((f, i) => (i === active ? { ...f, ...patch } : f)));
      setDirty(true);
    },
    [active]
  );

  const patchRoom = (id: string, patch: Partial<Room>) =>
    patchFloor({ rooms: floor.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const deleteRoom = (id: string) => {
    patchFloor({
      rooms: floor.rooms.filter((r) => r.id !== id),
      // People stay where they are, just no longer counted against the room.
      placements: floor.placements.map((p) => (p.roomId === id ? { ...p, roomId: null } : p)),
    });
    setSelectedId(null);
  };

  const unplace = (userId: string) =>
    patchFloor({ placements: floor.placements.filter((p) => p.user !== userId) });

  const handleDrop = (
    payload: { kind: "room" } | { kind: "staff"; userId: string },
    x: number,
    y: number
  ) => {
    if (payload.kind === "room") {
      const room: Room = {
        id: crypto.randomUUID(),
        name: `Room ${floor.rooms.length + 1}`,
        x: Math.round(x),
        y: Math.round(y),
        width: 240,
        height: 160,
        capacity: 8,
        color: ROOM_TINTS[floor.rooms.length % ROOM_TINTS.length],
      };
      patchFloor({ rooms: [...floor.rooms, room] });
      setSelectedId(room.id);
      return;
    }

    // A person sits on exactly one floor at a time: drop clears them elsewhere.
    const placement: Placement = {
      user: payload.userId,
      roomId: roomAt(floor.rooms, x, y),
      x: Math.round(x),
      y: Math.round(y),
    };
    setFloors((prev) =>
      prev.map((f, i) => ({
        ...f,
        placements:
          i === active
            ? [...f.placements.filter((p) => p.user !== payload.userId), placement]
            : f.placements.filter((p) => p.user !== payload.userId),
      }))
    );
    setDirty(true);
  };

  const save = async () => {
    setStatus("Saving...");
    try {
      await saveFloorPlan(eventId, floors);
      setDirty(false);
      setStatus("Saved");
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Floor Plan</h1>

        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        >
          {events.length === 0 && <option value="">No events</option>}
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {floors.map((f, i) => (
            <button
              key={f.name + i}
              onClick={() => {
                setActive(i);
                setSelectedId(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                i === active
                  ? "border border-indigo-200 bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f.name}
            </button>
          ))}
          <button
            onClick={() => {
              setFloors((prev) => [...prev, newFloor(prev.length + 1)]);
              setActive(floors.length);
              setDirty(true);
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" /> Add Floor
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {status && <span className="text-xs text-gray-500">{status}</span>}
          <button
            onClick={save}
            disabled={!eventId}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Save
            {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Palette */}
        <div className="flex w-24 shrink-0 flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2">
          <div
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", "room")}
            className="flex cursor-grab flex-col items-center gap-1 rounded-lg border border-gray-200 px-2 py-3 text-xs text-gray-600 hover:bg-gray-50 active:cursor-grabbing"
          >
            <Square className="h-5 w-5" />
            Room
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-gray-200 px-2 py-3 text-center text-[11px] text-gray-400">
            <UserPlus className="h-5 w-5" />
            Drag staff from the list on the right
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <FloorCanvas
            floor={floor}
            roster={roster}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRoomsChange={(rooms) => patchFloor({ rooms })}
            onPlacementsChange={(placements) => patchFloor({ placements })}
            onDrop={handleDrop}
          />
        </div>

        <DetailsPanel
          floor={floor}
          floorName={floor.name}
          roster={roster}
          selectedRoom={floor.rooms.find((r) => r.id === selectedId)}
          onPatchRoom={patchRoom}
          onDeleteRoom={deleteRoom}
          onUnplace={unplace}
        />
      </div>
    </div>
  );
}
