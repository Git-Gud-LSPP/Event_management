import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "./EventCard";
import DashboardHeader from "../../components/DashboardHeader";
import CreateEventModal from "./CreateEventModal";
import { eventsApi, type EventDTO } from "../../services/eventsApi";

const EventsDashboard = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsApi.list({ limit: 50 });
      setEvents(data.items);
    } catch (err: any) {
      setError(err.message || "Couldn't load events.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="p-8 bg-[#FBFBF9] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          title={"Event Operations"}
          subtitle={`${events.length} event${events.length === 1 ? "" : "s"} across all status`}
          label={"Create Event"}
          categoriesList={["All", "Live", "Upcoming", "At Risk", "Completed"]}
          onLabelClick={() => setIsCreateOpen(true)}
        />

        {isLoading && (
          <div className="mt-10 text-center text-sm text-gray-400">Loading events…</div>
        )}

        {!isLoading && error && (
          <div className="mt-10 text-center text-sm text-rose-500">
            {error}{" "}
            <button onClick={loadEvents} className="underline hover:text-rose-600 cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="mt-10 text-center text-sm text-gray-400">
            No events yet. Create your first one to get started.
          </div>
        )}

        {!isLoading && !error && events.length > 0 && (
          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                // Progress/task/incident counts depend on the schedule and
                // incident modules, which aren't built yet — showing 0
                // rather than fabricating numbers until those exist.
                progress={0}
                staffCount={event.staff?.length ?? 0}
                taskCount={0}
                incidentCount={0}
                onClick={() => navigate(`/events/${event._id}`)}
              />
            ))}
          </main>
        )}
      </div>

      {isCreateOpen && (
        <CreateEventModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newEvent) => {
            setEvents((prev) => [newEvent, ...prev]);
            setIsCreateOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default EventsDashboard;
