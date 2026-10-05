const repo = require('./floorplan.repository');
const Event = require('../event/event.model');

const DEFAULT_FLOORS = () => [{ name: 'Floor 1', rooms: [], placements: [] }];

const num = (v) => typeof v === 'number' && Number.isFinite(v);

// The client sends the whole plan, so everything here is untrusted. Returns an error
// string, or null when the payload is clean.
const validate = (floors, staffIds) => {
  if (!Array.isArray(floors) || floors.length === 0) return 'floors must be a non-empty array';

  for (const floor of floors) {
    if (!floor || typeof floor.name !== 'string' || !floor.name.trim()) {
      return 'each floor needs a name';
    }

    const rooms = floor.rooms || [];
    const placements = floor.placements || [];
    if (!Array.isArray(rooms) || !Array.isArray(placements)) {
      return 'rooms and placements must be arrays';
    }

    const roomIds = new Set();
    for (const room of rooms) {
      if (!room || typeof room.id !== 'string' || !room.id) return 'each room needs an id';
      if (roomIds.has(room.id)) return `duplicate room id: ${room.id}`;
      roomIds.add(room.id);
      if (typeof room.name !== 'string' || !room.name.trim()) return 'each room needs a name';
      if (!num(room.x) || !num(room.y)) return `room ${room.id} has invalid position`;
      if (!num(room.width) || !num(room.height) || room.width < 1 || room.height < 1) {
        return `room ${room.id} has invalid size`;
      }
      if (room.capacity !== undefined && (!num(room.capacity) || room.capacity < 0)) {
        return `room ${room.id} has invalid capacity`;
      }
    }

    for (const p of placements) {
      if (!p || !p.user) return 'each placement needs a user';
      if (!staffIds.has(String(p.user))) {
        return `user ${p.user} is not staff on this event`;
      }
      if (!num(p.x) || !num(p.y)) return `placement for ${p.user} has invalid position`;
      if (p.roomId != null && !roomIds.has(p.roomId)) {
        return `placement for ${p.user} references unknown room ${p.roomId}`;
      }
    }
  }

  return null;
};

exports.get = async (req, res, next) => {
  try {
    // canViewEvent already loaded the event; repopulate for staff names.
    const event = await Event.findById(req.params.eventId).populate('staff', 'name email');
    const plan = await repo.findByEvent(req.params.eventId);

    res.json({
      floors: plan && plan.floors.length ? plan.floors : DEFAULT_FLOORS(),
      roster: event ? event.staff : [],
    });
  } catch (err) {
    next(err);
  }
};

exports.save = async (req, res, next) => {
  try {
    const staffIds = new Set(req.event.staff.map((id) => String(id)));
    const error = validate(req.body.floors, staffIds);
    if (error) return res.status(400).json({ message: error });

    const plan = await repo.upsert(req.params.eventId, req.body.floors);
    res.json({ floors: plan.floors });
  } catch (err) {
    next(err);
  }
};
