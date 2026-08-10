import React from 'react';
import EventCard, { type EventModel } from './EventCard';
import { Sidebar } from 'lucide-react';

const EventDashboard = (): React.JSX.Element => {
  // Mock event object conforming to EventModel interface
  const mockEvent: EventModel = {
    _id: "64f8a123b4c5d67890e1f2a3",
    title: "TechSummit 2026",
    description: "Annual technology summit with 5,000 attendees across 3 main stages and 12 breakout sessions.",
    location: "Moscone Center, SF",
    startsAt: new Date("2026-08-09T09:00:00.000Z"),
    endsAt: new Date("2026-08-09T18:00:00.000Z"),
    capacity: 5000,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
<div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
      <EventCard
        event={mockEvent}
        category="Conference"
        progress={62}
        staffCount={48}
        taskCount={12}
        incidentCount={2}
      />
      <EventCard
        event={mockEvent}
        category="Conference"
        progress={62}
        staffCount={48}
        taskCount={12}
        incidentCount={2}
      />
      <EventCard
        event={mockEvent}
        category="Conference"
        progress={62}
        staffCount={48}
        taskCount={12}
        incidentCount={2}
      />
    </div>
  )
}
export default EventDashboard;
