import React from 'react';
import EventCard, { type EventModel } from './EventCard';
import EventsDashboardHeader from './EventsDashboardHeader';

// Interface extending EventModel with card statistics
interface DashboardEventItem {
  id: string;
  event: EventModel;
  category: string;
  progress: number;
  staffCount: number;
  taskCount: number;
  incidentCount: number;
}

// Array of event objects
const MOCK_EVENTS: DashboardEventItem[] = [
  {
    id: "1",
    event: {
      _id: "64f8a123b4c5d67890e1f2a3",
      title: "TechSummit 2026",
      description: "Annual technology summit with 5,000 attendees across 3 main stages and 12 breakout sessions.",
      location: "Moscone Center, SF",
      startsAt: new Date("2026-08-09T09:00:00.000Z"),
      endsAt: new Date("2026-08-09T18:00:00.000Z"),
      capacity: 5000,
      status: "published",
    },
    category: "Conference",
    progress: 62,
    staffCount: 48,
    taskCount: 12,
    incidentCount: 2,
  },
  {
    id: "2",
    event: {
      _id: "64f8a123b4c5d67890e1f2a4",
      title: "SXC Hackathon 2026",
      description: "48-hour competitive student hackathon focused on AI and web development innovations.",
      location: "Kathmandu, Nepal",
      startsAt: new Date("2026-09-15T08:00:00.000Z"),
      endsAt: new Date("2026-09-17T18:00:00.000Z"),
      capacity: 300,
      status: "published",
    },
    category: "Hackathon",
    progress: 25,
    staffCount: 15,
    taskCount: 30,
    incidentCount: 0,
  },
  {
    id: "3",
    event: {
      _id: "64f8a123b4c5d67890e1f2a5",
      title: "Design System Workshop",
      description: "Hands-on UI/UX masterclass on building accessible component libraries with React and Tailwind.",
      location: "Online / Zoom",
      startsAt: new Date("2026-10-01T10:00:00.000Z"),
      endsAt: new Date("2026-10-01T14:00:00.000Z"),
      capacity: 100,
      status: "draft",
    },
    category: "Workshop",
    progress: 10,
    staffCount: 4,
    taskCount: 8,
    incidentCount: 0,
  },
];

const EventsDashboard = (): React.JSX.Element => {
  return (
    <div className="p-8 bg-[#FBFBF9] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <EventsDashboardHeader />

        {/* Responsive Grid with Spacing */}
        <main className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
          {MOCK_EVENTS.map((item) => (
            <EventCard
              key={item.id}
              event={item.event}
              category={item.category}
              progress={item.progress}
              staffCount={item.staffCount}
              taskCount={item.taskCount}
              incidentCount={item.incidentCount}
            />
          ))}
        </main>
      </div>
    </div>
  );
};

export default EventsDashboard;