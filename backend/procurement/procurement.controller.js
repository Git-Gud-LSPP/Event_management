const EventVendor = require('./procurement.model');
const Document = require('../document/document.model');

const FIELDS = [
  'name', 'type', 'contactName', 'phone', 'email', 'website', 'address',
  'latitude', 'longitude', 'sourceId', 'stage', 'scope', 'quoteAmount', 'currency', 'notes',
];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.list = async (req, res, next) => {
  try {
    const items = await EventVendor.find({ event: req.event._id }).sort({ createdAt: 1 });
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const item = await EventVendor.create({ ...pick(req.body), event: req.event._id });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'This vendor is already on the event' });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const item = await EventVendor.findOneAndUpdate(
      { _id: req.params.id, event: req.event._id },
      pick(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Vendor not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Documents keep their content; they just stop pointing at the removed vendor.
exports.remove = async (req, res, next) => {
  try {
    const item = await EventVendor.findOneAndDelete({ _id: req.params.id, event: req.event._id });
    if (!item) return res.status(404).json({ message: 'Vendor not found' });
    await Document.updateMany({ vendor: item._id }, { vendor: null });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
