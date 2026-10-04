const Document = require('./document.model');
const EventVendor = require('../procurement/procurement.model');
const { readFileText, extOf, AttachmentError, MAX_FILE_BYTES } = require('../agent/agent.documents');

const FIELDS = ['title', 'category', 'status', 'vendor', 'amount', 'currency', 'dueDate', 'content'];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  txt: 'text/plain',
  md: 'text/markdown',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const withRefs = (q) =>
  q.populate('vendor', 'name type stage').populate('createdBy', 'name email');

// Scoped to the event so an id from another event 404s instead of leaking.
const findInEvent = (req) => Document.findOne({ _id: req.params.id, event: req.event._id });

// A vendor id from the client (or the agent) must be one of this event's vendors.
async function vendorError(req, fields) {
  if (!('vendor' in fields)) return null;
  if (!fields.vendor) {
    fields.vendor = null;
    return null;
  }
  const ok = await EventVendor.exists({ _id: fields.vendor, event: req.event._id });
  return ok ? null : "Vendor must be one of this event's vendors";
}

// { name, data(base64) } -> stored file. Throws AttachmentError on bad input.
function readUpload(raw) {
  const name = typeof raw?.name === 'string' ? raw.name.replace(/[\\/"<>\r\n]/g, '_').slice(0, 150) : '';
  if (!name || typeof raw.data !== 'string') throw new AttachmentError('file needs a name and base64 data');
  const mime = MIME[extOf(name)];
  if (!mime) throw new AttachmentError(`${name}: unsupported file type (use ${Object.keys(MIME).join(', ')})`);
  const data = Buffer.from(raw.data, 'base64');
  if (!data.length) throw new AttachmentError(`${name} is empty`);
  if (data.length > MAX_FILE_BYTES) throw new AttachmentError(`${name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB`);
  return { name, mime, size: data.length, data };
}

exports.list = async (req, res, next) => {
  try {
    const filter = { event: req.event._id };
    for (const f of ['category', 'status', 'vendor']) {
      if (typeof req.query[f] === 'string' && req.query[f]) filter[f] = req.query[f];
    }
    // Content can be long; the list only needs the metadata.
    const items = await withRefs(Document.find(filter).select('-content').sort({ updatedAt: -1 }));
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await withRefs(findInEvent(req));
    if (!item) return res.status(404).json({ message: 'Document not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const fields = pick(req.body);
    const bad = await vendorError(req, fields);
    if (bad) return res.status(400).json({ message: bad });
    if (req.body.file) {
      fields.file = readUpload(req.body.file);
      // Uploaded files get their text extracted so search and the agent can read them.
      if (!fields.content) {
        fields.content = (await readFileText(fields.file.name, fields.file.data)).slice(0, Document.MAX_CONTENT);
      }
    }
    const created = await Document.create({ ...fields, event: req.event._id, createdBy: req.user.userId });
    res.status(201).json(await withRefs(Document.findById(created._id)));
  } catch (err) {
    if (err instanceof AttachmentError) return res.status(400).json({ message: err.message });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const fields = pick(req.body);
    const bad = await vendorError(req, fields);
    if (bad) return res.status(400).json({ message: bad });
    const item = await withRefs(
      Document.findOneAndUpdate({ _id: req.params.id, event: req.event._id }, fields, {
        new: true,
        runValidators: true,
      })
    );
    if (!item) return res.status(404).json({ message: 'Document not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Document.findOneAndDelete({ _id: req.params.id, event: req.event._id });
    if (!item) return res.status(404).json({ message: 'Document not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// GET /:id/file - the original upload.
exports.download = async (req, res, next) => {
  try {
    const item = await findInEvent(req).select('+file.data');
    if (!item?.file?.data) return res.status(404).json({ message: 'This document has no file' });
    res.set({
      'Content-Type': item.file.mime,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(item.file.name)}`,
    });
    res.send(item.file.data);
  } catch (err) {
    next(err);
  }
};
