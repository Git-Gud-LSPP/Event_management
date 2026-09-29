import React, { useState } from "react";
import { X } from "lucide-react";
import { eventsApi, type EventDTO, type EventStatusDTO } from "../../services/eventsApi";

interface CreateEventModalProps {
  onClose: () => void;
  onCreated: (event: EventDTO) => void;
}

const CreateEventModal = ({ onClose, onCreated }: CreateEventModalProps): React.JSX.Element => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState<EventStatusDTO>("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startsAt) {
      setError("Event name and date & time are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await eventsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        capacity: capacity ? Number(capacity) : undefined,
        status,
      });
      onCreated(created);
    } catch (err: any) {
      setError(err.message || "Couldn't create the event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#f7f6f2] rounded-[14px] shadow-lg w-full max-w-md p-6 border border-[#cdface] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-medium text-[#001f1f]">
            Create Event
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5c7070] hover:text-[#001f1f]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
              Event Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Summit 2027"
              className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] placeholder:text-[#889494] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
                Starts *
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
                Ends
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
                Capacity
              </label>
              <input
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="500"
                className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] placeholder:text-[#889494] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatusDTO)}
                className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Venue, City"
              className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] placeholder:text-[#889494] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the event..."
              rows={3}
              className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] placeholder:text-[#889494] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[29px] border border-[#2a4e1c] text-[#2a4e1c] hover:bg-[#eff5ce]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-[29px] bg-[#2a4e1c] text-white hover:bg-[#001f1f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating…" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
