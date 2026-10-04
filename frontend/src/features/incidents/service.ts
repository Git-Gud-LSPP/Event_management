// The Incident backend doesn't exist yet
export const USE_MOCK = true;

export type {
  IncidentRecord,
  IncidentInput,
  IncidentPriority,
  IncidentStatus,
} from "./api";
import * as real from "./api";
import * as mock from "./mockApi";

export const {
  listIncidents,
  getIncident,
  createIncident,
  updateIncidentStatus,
  assignIncident,
  deleteIncident,
} = USE_MOCK ? mock : real;

export const noteStaff = USE_MOCK ? mock.noteStaff : () => {};
