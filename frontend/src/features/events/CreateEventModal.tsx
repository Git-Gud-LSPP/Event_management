import { useState } from "react";
import { X } from "lucide-react";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateEventModal = ({ isOpen, onClose }: CreateEventModalProps) => {
  const [name, setName] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [type, setType] = useState("Conference");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Backend integration comes later — just logging for now
    console.log({ name, dateTime, type, location, description });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-[#f7f6f2] rounded-[14px] shadow-lg w-full max-w-md p-6 border border-[#cdface]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-medium text-[#001f1f]">
            Create Event
          </h2>
          <button
            onClick={onClose}
            className="text-[#5c7070] hover:text-[#001f1f]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
              Event Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Summit 2027"
              className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] placeholder:text-[#889494] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
                Date & Time
              </label>
              <input
                type="text"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                placeholder="Aug 10, 2026 · 9:00 AM"
                className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] placeholder:text-[#889494] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#5c7070] uppercase tracking-wide">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full bg-white border border-[#cdface] rounded-[12px] px-3 py-2 text-[#001f1f] focus:outline-none focus:ring-2 focus:ring-[#2a4e1c]"
              >
                <option>Conference</option>
                <option>Festival</option>
                <option>Corporate</option>
                <option>Exhibition</option>
                <option>Workshop</option>
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
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[29px] border border-[#2a4e1c] text-[#2a4e1c] hover:bg-[#eff5ce]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-[29px] bg-[#2a4e1c] text-white hover:bg-[#001f1f]"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
