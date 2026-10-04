const Incident = require('./incident.model');
const Event = require('../event/event.model');

// Organizer of the event, or staff assigned to it.
const eventAccess = (event, userId) => ({
  isOrganizer: event.organizer.toString() === userId,
  isStaff: event.staff.some((staffId) => staffId.toString() === userId),
});

// Item-level guard, for the /:id routes.
const authorizeIncidentAccess = (requiredRole = 'staff') => {
  return async (req, res, next) => {
    try {
      const incident = await Incident.findById(req.params.id).populate('event');
      if (!incident) {
        return res.status(404).json({ message: 'Incident not found' });
      }

      const event = incident.event;
      if (!event) {
        return res.status(404).json({ message: 'Associated event not found' });
      }

      const { isOrganizer, isStaff } = eventAccess(event, req.user.userId);

      if (requiredRole === 'organizer' && !isOrganizer) {
        return res.status(403).json({ message: 'Only the organizer can perform this action' });
      }
      if (requiredRole === 'staff' && !isOrganizer && !isStaff) {
        return res.status(403).json({ message: 'You do not have access to this incident' });
      }

      req.incident = incident;
      req.isOrganizer = isOrganizer;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
};

// Event-level guard, for the collection routes where there is no :id yet.
const canViewIncidents = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { isOrganizer, isStaff } = eventAccess(event, req.user.userId);
    if (!isOrganizer && !isStaff) {
      return res.status(403).json({ message: "You do not have access to this event's incidents" });
    }

    req.event = event;
    req.isOrganizer = isOrganizer;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization error' });
  }
};

// Reporting an incident is organizer-only, same gate the frontend already applies
// (IncidentsPage only shows "Report Incident" to organizers).
const canManageIncidents = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role !== 'organizer' || event.organizer.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: 'Only the event organizer can manage incidents' });
    }

    req.event = event;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization error' });
  }
};

// Status changes are allowed for the organizer OR the currently assigned staff
// member — matches IncidentDetailModal's `canChangeStatus = isOrganizer || isAssignee`.
const canUpdateIncidentStatus = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('event');
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const event = incident.event;
    if (!event) {
      return res.status(404).json({ message: 'Associated event not found' });
    }

    const userId = req.user.userId;
    const isOrganizer = event.organizer.toString() === userId;
    const isAssignee = Boolean(incident.assignedTo) && incident.assignedTo.toString() === userId;

    if (!isOrganizer && !isAssignee) {
      return res
        .status(403)
        .json({ message: 'Only the organizer or the assigned staff member can update this incident' });
    }

    req.incident = incident;
    req.isOrganizer = isOrganizer;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = {
  authorizeIncidentAccess,
  canViewIncidents,
  canManageIncidents,
  canUpdateIncidentStatus,
};
