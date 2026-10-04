const Event = require('../event/event.model');

const authorizeEventAccess = (requiredRole = 'staff') => {
  return async (req, res, next) => {
    try {
      const eventId = req.params.id;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const isOrganizer = event.organizer.toString() === userId;
      const isStaff = event.staff.some((staffId) => staffId.toString() === userId);

      if (requiredRole === 'organizer') {
        if (!isOrganizer) {
          return res.status(403).json({ message: 'Only the organizer can perform this action' });
        }
      } else if (requiredRole === 'staff') {
        if (!isOrganizer && !isStaff) {
          return res.status(403).json({ message: 'You do not have access to this event' });
        }
      }

      req.event = event;
      req.isOrganizer = isOrganizer;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
};

const canCreateEvent = (req, res, next) => {
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ message: 'Only organizers can create events' });
  }
  next();
};

module.exports = { authorizeEventAccess, canCreateEvent };