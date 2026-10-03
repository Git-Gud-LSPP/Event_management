export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  color: string;
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
}

export interface EventSummary {
  _id: string;
  title: string;
}
