import type { Room } from "./types";

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Topmost room containing the point. Reverse scan: later rooms render on top.
export const roomAt = (rooms: Room[], x: number, y: number): string | null => {
  for (let i = rooms.length - 1; i >= 0; i--) {
    const r = rooms[i];
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return r.id;
  }
  return null;
};

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding box of everything on a floor, or null when it is empty. */
export const contentBounds = (
  rooms: Room[],
  placements: { x: number; y: number }[] = []
): Bounds | null => {
  if (!rooms.length && !placements.length) return null;

  // Staff markers are a circle plus a name label, so pad around their anchor point.
  const MARKER = 40;
  const xs = [
    ...rooms.flatMap((r) => [r.x, r.x + r.width]),
    ...placements.flatMap((p) => [p.x - MARKER, p.x + MARKER]),
  ];
  const ys = [
    ...rooms.flatMap((r) => [r.y, r.y + r.height]),
    ...placements.flatMap((p) => [p.y - MARKER, p.y + MARKER]),
  ];

  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};
