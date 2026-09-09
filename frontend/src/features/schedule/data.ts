export type TaskStatus = "Done" | "In Progress" | "Blocked" | "Pending";

export interface Task {
  id: number;
  name: string;
  owner: string;
  initials: string;
  start: string;
  duration: string;
  status: TaskStatus;
  dependsOn?: string;
  delayed?: boolean;

  // Used for Gantt positioning
  startMinutes: number;
  durationMinutes: number;
  delayMinutes?: number;
}

export const tasks: Task[] = [
  {
    id: 1,
    name: "Sponsor Booth Assembly",
    owner: "James",
    initials: "JL",
    start: "6:30",
    duration: "120m",
    status: "Done",
    startMinutes: 30,
    durationMinutes: 120,
  },
  {
    id: 2,
    name: "AV System Check — Main Stage",
    owner: "Marcus",
    initials: "MC",
    start: "7:00",
    duration: "60m",
    status: "In Progress",
    delayed: true,
    startMinutes: 60,
    durationMinutes: 60,
    delayMinutes: 15,
  },
  {
    id: 3,
    name: "Stage Lighting Test — All Zones",
    owner: "Marcus",
    initials: "MC",
    start: "7:00",
    duration: "60m",
    status: "Done",
    startMinutes: 60,
    durationMinutes: 60,
  },
  {
    id: 4,
    name: "Speaker Green Room Setup",
    owner: "Priya",
    initials: "PN",
    start: "7:30",
    duration: "45m",
    status: "Done",
    startMinutes: 90,
    durationMinutes: 45,
  },
  {
    id: 5,
    name: "Registration Desk Open",
    owner: "Aisha",
    initials: "AO",
    start: "7:45",
    duration: "30m",
    status: "Done",
    startMinutes: 105,
    durationMinutes: 30,
  },
  {
    id: 6,
    name: "Media Credentials Distribution",
    owner: "Fatima",
    initials: "FH",
    start: "8:00",
    duration: "60m",
    status: "In Progress",
    startMinutes: 120,
    durationMinutes: 60,
  },
  {
    id: 7,
    name: "Sound Check — Keynote Stage",
    owner: "Marcus",
    initials: "MC",
    start: "8:30",
    duration: "45m",
    status: "Blocked",
    dependsOn: "AV System Check — Main Stage",
    delayed: true,
    startMinutes: 150,
    durationMinutes: 45,
    delayMinutes: 20,
  },
  {
    id: 8,
    name: "Keynote Rehearsal",
    owner: "Priya",
    initials: "PN",
    start: "9:30",
    duration: "30m",
    status: "Blocked",
    dependsOn: "Sound Check — Keynote Stage",
    delayed: true,
    startMinutes: 210,
    durationMinutes: 30,
    delayMinutes: 30,
  },
  {
    id: 9,
    name: "Venue Clearance Checkpoint",
    owner: "James",
    initials: "JL",
    start: "9:30",
    duration: "30m",
    status: "In Progress",
    startMinutes: 210,
    durationMinutes: 30,
  },
  {
    id: 10,
    name: "Catering Delivery — Lunch Service",
    owner: "Tomas",
    initials: "TV",
    start: "10:00",
    duration: "90m",
    status: "Pending",
    dependsOn: "Venue Clearance Checkpoint",
    startMinutes: 240,
    durationMinutes: 90,
  },
];

export const timelineHours = [
  "6:00",
  "7:00",
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
];