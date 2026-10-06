// List/create/update/remove for a simple event-scoped collection (budget lines, lost & found).
// Same shape as inventory.controller, which predates this helper.
module.exports = (Model, fields, label) => {
  const pick = (body) =>
    Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
  // Scoped to the event so an id from another event 404s instead of leaking.
  const scope = (req) => ({ _id: req.params.id, event: req.event._id });
  const missing = (res) => res.status(404).json({ message: `${label} not found` });

  return {
    list: async (req, res, next) => {
      try {
        const items = await Model.find({ event: req.event._id }).sort({ createdAt: -1 });
        res.json({ items, total: items.length });
      } catch (err) {
        next(err);
      }
    },
    create: async (req, res, next) => {
      try {
        res.status(201).json(await Model.create({ ...pick(req.body), event: req.event._id }));
      } catch (err) {
        next(err);
      }
    },
    update: async (req, res, next) => {
      try {
        const item = await Model.findOneAndUpdate(scope(req), pick(req.body), { new: true, runValidators: true });
        if (!item) return missing(res);
        res.json(item);
      } catch (err) {
        next(err);
      }
    },
    remove: async (req, res, next) => {
      try {
        if (!(await Model.findOneAndDelete(scope(req)))) return missing(res);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  };
};
