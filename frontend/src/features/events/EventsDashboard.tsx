import React from "react";
import { useNavigate } from "react-router-dom";
import EventCard, { type EventModel } from "./EventCard";
import DashboardHeader from "../../components/DashboardHeader";

interface DashboardEventItem {
  id: string;
  event: EventModel;
  category: string;
  progress: number;
  staffCount: number;
  taskCount: number;
  incidentCount: number;
}

const MOCK_EVENTS: DashboardEventItem[] = [
  {
    id: "evt-1",
    event: {
      _id: "evt-1", // Standardized ID
      title: "TechSummit 2026",
      description: "Annual technology summit with 5,000 attendees across 3 main stages.",
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
    id: "evt-2",
    event: {
      _id: "evt-2",
      title: "SXC Hackathon 2026",
      description: "48-hour competitive student hackathon focused on AI and web development.",
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
];

const EventsDashboard = (): React.JSX.Element => {
  const navigate = useNavigate();

  return (
    <div className="p-8 bg-[#FBFBF9] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader title={"Event Operations"} subtitle={"6 events across all status"} label={"Create Event"} categoriesList={["All", "Live", "Upcoming", "At Risk", "Completed"]} />

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {MOCK_EVENTS.map((item) => {
            const targetId = item.event._id || item.id;
            return (
              <EventCard
                key={item.id}
                event={item.event}
                category={item.category}
                progress={item.progress}
                staffCount={item.staffCount}
                taskCount={item.taskCount}
                incidentCount={item.incidentCount}
                onClick={() => navigate(`/events/${targetId}`)}
              />
            );
          })}
        </main>
      </div>
    </div>
  );
};

export default EventsDashboard;