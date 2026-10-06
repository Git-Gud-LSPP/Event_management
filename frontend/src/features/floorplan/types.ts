export type Kind =
  | "room" | "zone" | "stage" | "booth" | "registration"
  | "entrance" | "exit" | "firstaid" | "restroom" | "access";

export type Cat = "spaces" | "service" | "safety" | "staff";

/** Every item on the plan. Named Room for history: the API still calls the array `rooms`. */
export interface Room {
  id: string;
  kind?: Kind; // missing = room (plans saved before kinds existed)
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  color: string;
  rot?: number;
  locked?: boolean;
  owner?: string | null; // staff user id, service points only
}

export interface Placement {
  user: string; // User id
  roomId: string | null; // null = loose on the floor
  x: number;
  y: number;
}

export interface Floor {
  name: string;
  rooms: Room[];
  placements: Placement[];
}

export interface RosterMember {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export interface EventSummary {
  _id: string;
  title: string;
}

export const KINDS: Record<Kind, { cat: Cat; label: string; w: number; h: number; cap?: number; code?: string }> = {
  room: { cat: "spaces", label: "Room", w: 240, h: 160, cap: 20 },
  zone: { cat: "spaces", label: "Zone", w: 240, h: 168, cap: 50 },
  stage: { cat: "spaces", label: "Stage", w: 192, h: 72 },
  booth: { cat: "spaces", label: "Booth 3×3", w: 72, h: 72, cap: 4 },
  registration: { cat: "service", label: "Registration", w: 168, h: 44, code: "REG" },
  entrance: { cat: "safety", label: "Entrance", w: 32, h: 32, code: "IN" },
  exit: { cat: "safety", label: "Fire exit", w: 32, h: 32, code: "EX" },
  firstaid: { cat: "safety", label: "First aid", w: 32, h: 32, code: "+" },
  restroom: { cat: "safety", label: "Restrooms", w: 32, h: 32, code: "WC" },
  access: { cat: "safety", label: "Accessible entry", w: 32, h: 32, code: "A" },
};

export const CATS: [Cat, string][] = [
  ["spaces", "Spaces"],
  ["service", "Service points"],
  ["safety", "Safety & access"],
  ["staff", "Staff"],
];

export const kindOf = (r: Room): Kind => r.kind ?? "room";
export const catOf = (r: Room): Cat => KINDS[kindOf(r)].cat;
/** Rooms and zones hold people; everything else is a marker or fixture. */
export const isSpace = (r: Room) => kindOf(r) === "room" || kindOf(r) === "zone";
