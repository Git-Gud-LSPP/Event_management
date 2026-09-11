import React from "react";
import { MapPin } from "lucide-react";

export type EventStatus = "draft" | "published" | "cancelled";

export interface EventModel {
  _id?: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string | Date;
  endsAt?: string | Date;
  capacity?: number;
  status?: EventStatus;
}

export interface EventCardProps {
  event: EventModel;
  category?: string;
  progress?: number;
  staffCount?: number;
  taskCount?: number;
  incidentCount?: number;
  onClick?: () => void;
}

const EventCard = ({
  event,
  category = "Conference",
  progress = 0,
  staffCount = 0,
  taskCount = 0,
  incidentCount = 0,
  onClick,
}: EventCardProps): React.JSX.Element => {
  const { title, description, location, startsAt, endsAt, status = "draft" } = event;

  const formatDate = (dateInput: string | Date): string => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} · ${timePart}`;
  };

  const isLive = (): boolean => {
    const now = new Date();
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;
    return now >= start && (!end || now <= end);
  };

  const renderStatusBadge = () => {
    if (isLive()) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      );
    }

    switch (status) {
      case "published":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Published</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Draft</span>;
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="relative w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 overflow-hidden cursor-pointer group select-none"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl" />

      <div className="pl-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-snug tracking-tight group-hover:text-emerald-600 transition-colors">
              {title}
            </h3>
            <p className="text-sm font-medium text-gray-400 mt-0.5">{formatDate(startsAt)}</p>
          </div>
          <div className="shrink-0">{renderStatusBadge()}</div>
        </div>

        {/* Description */}
        {description && <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">{description}</p>}

        {/* Badges */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {category && <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700">{category}</span>}
          {location && (
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate max-w-[180px]">{location}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-gray-400 tracking-wider uppercase">Progress</span>
            <span className="text-gray-900 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 my-3" />

        {/* Operations Stats Grid */}
        <div className="grid grid-cols-3 text-center pt-1">
          <div>
            <div className="text-base font-bold text-gray-900">{staffCount}</div>
            <div className="text-xs text-gray-400 font-medium">Staff</div>
          </div>
          <div>
            <div className="text-base font-bold text-emerald-500">{taskCount}</div>
            <div className="text-xs text-gray-400 font-medium">Tasks</div>
          </div>
          <div>
            <div className="text-base font-bold text-rose-500">{incidentCount}</div>
            <div className="text-xs text-gray-400 font-medium">Incidents</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;