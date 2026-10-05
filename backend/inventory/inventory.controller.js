const Inventory = require('./inventory.model');

const FIELDS = ['name', 'category', 'stock', 'maxStock', 'location', 'status'];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.list = async (req, res, next) => {
  try {
    const items = await Inventory.find({ event: req.event._id }).sort({ name: 1 });
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const item = await Inventory.create({ ...pick(req.body), event: req.event._id });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, event: req.event._id },
      pick(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndDelete({ _id: req.params.id, event: req.event._id });
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
