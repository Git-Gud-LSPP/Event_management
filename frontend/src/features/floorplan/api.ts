import { apiFetch } from "../../services/api";
import type { EventSummary, Floor, RosterMember } from "./types";

export const listEvents = () =>
  apiFetch<{ items: EventSummary[] }>("/events?limit=100").then((r) => r.items);

export const getFloorPlan = (eventId: string) =>
  apiFetch<{ floors: Floor[]; roster: RosterMember[] }>(`/events/${eventId}/floorplan`);

export const saveFloorPlan = (eventId: string, floors: Floor[]) =>
  apiFetch<{ floors: Floor[] }>(`/events/${eventId}/floorplan`, {
    method: "PUT",
    body: JSON.stringify({ floors }),
  });
