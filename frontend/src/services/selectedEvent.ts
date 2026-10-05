// The event chosen in the event pickers survives page switches and remounts, and the
// AI agent reads it as "this event". Only this file knows the storage key.
const SELECTED_EVENT_KEY = "selectedEventId";

export const getSelectedEventId = () => localStorage.getItem(SELECTED_EVENT_KEY) || "";
export const setSelectedEventId = (id: string) => localStorage.setItem(SELECTED_EVENT_KEY, id);
