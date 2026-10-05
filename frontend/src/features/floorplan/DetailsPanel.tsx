import { useState } from "react";
import { Search, Users, Maximize2, X } from "lucide-react";
import { initials } from "./geometry";
import type { Floor, Room, RosterMember } from "./types";

interface Props {
  floor: Floor;
  floorName: string;
  roster: RosterMember[];
  selectedRoom: Room | undefined;
  onPatchRoom: (id: string, patch: Partial<Room>) => void;
  onDeleteRoom: (id: string) => void;
  onUnplace: (userId: string) => void;
}

// 24px on the canvas reads as 1m of venue, matching the grid square.
const PX_PER_M = 24;

export default function DetailsPanel({
  floor,
  floorName,
  roster,
  selectedRoom,
  onPatchRoom,
  onDeleteRoom,
  onUnplace,
}: Props) {
  const [search, setSearch] = useState("");

  const placedIds = new Set(floor.placements.map((p) => p.user));
  const inRoom = selectedRoom
    ? floor.placements.filter((p) => p.roomId === selectedRoom.id)
    : [];
  const nameOf = (id: string) => roster.find((m) => m._id === id)?.name || "Unknown";

  const visible = roster.filter((m) =>
    m.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
      {/* Room details */}
      <section className="rounded-xl border border-line bg-surface p-4">
        {!selectedRoom ? (
          <p className="text-sm text-ink-3">
            Select a room to edit it, or drag <strong>Room</strong> from the left onto the canvas.
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <input
                  value={selectedRoom.name}
                  onChange={(e) => onPatchRoom(selectedRoom.id, { name: e.target.value })}
                  className="w-full rounded border border-transparent px-1 text-base font-semibold text-ink hover:border-line focus:border-ink focus:outline-none"
                />
                <p className="px-1 text-xs text-ink-3">{floorName} · Room</p>
              </div>
              <button
                onClick={() => onDeleteRoom(selectedRoom.id)}
                title="Delete room"
                className="rounded p-1 text-ink-3 hover:bg-danger-soft hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="space-y-2 border-t border-line pt-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-ink-3">
                  <Users className="h-4 w-4" /> Capacity
                </dt>
                <dd>
                  <input
                    type="number"
                    min={0}
                    value={selectedRoom.capacity}
                    onChange={(e) =>
                      onPatchRoom(selectedRoom.id, {
                        capacity: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-20 rounded border border-line px-2 py-0.5 text-right focus:border-ink focus:outline-none"
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-3">Current occupancy</dt>
                <dd
                  className={
                    inRoom.length > selectedRoom.capacity
                      ? "font-semibold text-danger"
                      : "font-semibold text-ink"
                  }
                >
                  {inRoom.length}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-ink-3">
                  <Maximize2 className="h-4 w-4" /> Area
                </dt>
                <dd className="text-ink">
                  {Math.round((selectedRoom.width * selectedRoom.height) / (PX_PER_M * PX_PER_M))} m²
                </dd>
              </div>
            </dl>

            <p className="mt-4 mb-2 text-sm font-semibold text-ink">People in this room</p>
            {inRoom.length === 0 ? (
              <p className="text-sm text-ink-3">Nobody assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {inRoom.map((p) => (
                  <li key={p.user} className="flex items-center gap-2 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                      {initials(nameOf(p.user))}
                    </span>
                    <span className="flex-1 truncate text-ink">{nameOf(p.user)}</span>
                    <button
                      onClick={() => onUnplace(p.user)}
                      title="Remove from plan"
                      className="rounded p-1 text-ink-3 hover:bg-sunken hover:text-ink-2"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Roster */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">People ({roster.length})</p>
        <div className="relative mb-3">
          <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full rounded-lg border border-line py-1.5 pr-2 pl-8 text-sm focus:border-ink focus:outline-none"
          />
        </div>

        {roster.length === 0 && (
          <p className="text-sm text-ink-3">No staff on this event yet.</p>
        )}

        <ul className="space-y-1">
          {visible.map((m) => {
            const placed = placedIds.has(m._id);
            return (
              <li
                key={m._id}
                draggable={!placed}
                onDragStart={(e) => e.dataTransfer.setData("application/x-staff-id", m._id)}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                  placed ? "opacity-50" : "cursor-grab hover:bg-soft active:cursor-grabbing"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sunken text-[10px] font-bold text-ink-2">
                  {initials(m.name)}
                </span>
                <span className="flex-1 truncate text-ink">{m.name}</span>
                <span className="text-xs text-ink-3">
                  {placed ? "On plan" : "Drag to place"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
