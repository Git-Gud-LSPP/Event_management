const Timeline = require('./timeline.model');
const Event = require('../event/event.model');

const authorizeTimelineAccess = (requiredRole = 'staff') => {
  return async (req, res, next) => {
    try {
      const timelineId = req.params.id;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const timeline = await Timeline.findById(timelineId).populate('event');
      if (!timeline) {
        return res.status(404).json({ message: 'Timeline item not found' });
      }

      const event = timeline.event;
      if (!event) {
        return res.status(404).json({ message: 'Associated event not found' });
      }

      const isOrganizer = event.organizer.toString() === userId;
      const isStaff = event.staff.some((staffId) => staffId.toString() === userId);

      if (requiredRole === 'organizer') {
        if (!isOrganizer) {
          return res.status(403).json({ message: 'Only the organizer can perform this action' });
        }
      } else if (requiredRole === 'staff') {
        if (!isOrganizer && !isStaff) {
          return res.status(403).json({ message: 'You do not have access to this timeline item' });
        }
      }

      req.timeline = timeline;
      req.isOrganizer = isOrganizer;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
};

const canManageTimeline = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can manage timeline items' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isOrganizer = event.organizer.toString() === userId;
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Only the event organizer can manage timeline items' });
    }

    req.event = event;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = { authorizeTimelineAccess, canManageTimeline };