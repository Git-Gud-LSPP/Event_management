const Schedule = require('./schedule.model');
const Event = require('../event/event.model');

// Organizer of the event, or staff assigned to it.
const eventAccess = (event, userId) => ({
  isOrganizer: event.organizer.toString() === userId,
  isStaff: event.staff.some((staffId) => staffId.toString() === userId),
});

// Item-level guard, for the /:id routes.
const authorizeScheduleAccess = (requiredRole = 'staff') => {
  return async (req, res, next) => {
    try {
      const item = await Schedule.findById(req.params.id).populate('event');
      if (!item) {
        return res.status(404).json({ message: 'Schedule item not found' });
      }

      const event = item.event;
      if (!event) {
        return res.status(404).json({ message: 'Associated event not found' });
      }

      const { isOrganizer, isStaff } = eventAccess(event, req.user.userId);

      if (requiredRole === 'organizer' && !isOrganizer) {
        return res.status(403).json({ message: 'Only the organizer can perform this action' });
      }
      if (requiredRole === 'staff' && !isOrganizer && !isStaff) {
        return res.status(403).json({ message: 'You do not have access to this schedule item' });
      }

      req.scheduleItem = item;
      req.isOrganizer = isOrganizer;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
};

// Event-level guard, for the collection routes where there is no :id yet.
const canViewSchedule = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { isOrganizer, isStaff } = eventAccess(event, req.user.userId);
    if (!isOrganizer && !isStaff) {
      return res.status(403).json({ message: "You do not have access to this event's schedule" });
    }

    req.event = event;
    req.isOrganizer = isOrganizer;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization error' });
  }
};

const canManageSchedule = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role !== 'organizer' || event.organizer.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: 'Only the event organizer can manage schedule items' });
    }

    req.event = event;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = { authorizeScheduleAccess, canViewSchedule, canManageSchedule };
