// Turns files uploaded in the chat into plain text for the model. Text, not provider
// file parts, keeps attachments model-agnostic: every provider (local models too) reads it.
// Parsers load lazily so app startup and Jest never pay for them.

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_CHARS = 40_000; // per file, after extraction
const MAX_TOTAL_CHARS = 80_000;
// ponytail: extracted text is saved in the conversation, so it is resent every turn until
// "New chat". Store files separately and inject on demand if token cost bites.

const csvCell = (v) => {
  const s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const EXTRACTORS = {
  pdf: async (buf) => {
    const { getDocumentProxy, extractText } = require('unpdf');
    const { text } = await extractText(await getDocumentProxy(new Uint8Array(buf)), { mergePages: true });
    return text;
  },
  docx: async (buf) => (await require('mammoth').extractRawText({ buffer: buf })).value,
  // Each sheet becomes CSV, which models read reliably.
  xlsx: async (buf) => {
    const sheets = await require('read-excel-file/node').default(buf);
    return sheets
      .map(({ sheet, data }) => `## Sheet: ${sheet}\n${data.map((row) => row.map(csvCell).join(',')).join('\n')}`)
      .join('\n\n');
  },
};
for (const ext of ['csv', 'txt', 'md', 'json', 'tsv']) EXTRACTORS[ext] = async (buf) => buf.toString('utf8');

const ACCEPTED = Object.keys(EXTRACTORS);

class AttachmentError extends Error {}

const extOf = (name) => (/\.([a-z0-9]+)$/i.exec(name)?.[1] || '').toLowerCase();

// Plain text of one file, or '' when there is no extractor for its type (e.g. images).
// Also used by the document hub to make uploaded files readable for the agent.
async function readFileText(name, buf) {
  const extractor = EXTRACTORS[extOf(name)];
  if (!extractor) return '';
  try {
    return (await extractor(buf)).trim();
  } catch (err) {
    throw new AttachmentError(`Could not read ${name}: ${err.message}`);
  }
}

// Names and file text are user-controlled; keep them from closing the wrapper tag early.
const safeName = (name) => name.replace(/["<>\n\r]/g, '_').slice(0, 120);
const fence = (text) => text.replace(/<\/?attachment/gi, (m) => m.replace('attachment', 'attachment_'));

/**
 * @param {unknown} raw  [{ name, data }] where data is base64 file content
 * @returns {Promise<{ text: string, names: string[] }>}  `text` is appended to the user turn
 */
async function extractAttachments(raw) {
  if (raw === undefined || raw === null) return { text: '', names: [] };
  if (!Array.isArray(raw)) throw new AttachmentError('attachments must be an array');
  if (raw.length > MAX_FILES) throw new AttachmentError(`Attach at most ${MAX_FILES} files at a time`);

  let budget = MAX_TOTAL_CHARS;
  const blocks = [];
  const names = [];
  for (const file of raw) {
    const name = typeof file?.name === 'string' ? safeName(file.name) : '';
    const ext = extOf(name);
    if (!name || typeof file.data !== 'string') throw new AttachmentError('Each attachment needs a name and data');
    if (ext === 'xls') throw new AttachmentError(`${name}: old .xls files are not supported, save it as .xlsx or .csv`);
    if (!EXTRACTORS[ext]) throw new AttachmentError(`${name}: unsupported file type (use ${ACCEPTED.join(', ')})`);

    const buf = Buffer.from(file.data, 'base64');
    if (buf.length > MAX_FILE_BYTES) throw new AttachmentError(`${name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB`);

    let text = await readFileText(name, buf);
    if (!text) text = '[No readable text. It may be a scanned image.]';

    const limit = Math.min(MAX_FILE_CHARS, Math.max(0, budget));
    const clipped = text.length > limit;
    text = text.slice(0, limit);
    budget -= text.length;
    blocks.push(
      `<attachment name="${name}"${clipped ? ' truncated="true"' : ''}>\n${fence(text)}\n</attachment>`
    );
    names.push(name);
  }
  return { text: blocks.length ? `\n\n${blocks.join('\n\n')}` : '', names };
}

// Chat bubbles show a paperclip line instead of the whole extracted document.
const ATTACHMENT_RE = /\n*<attachment name="([^"]*)"[^>]*>[\s\S]*?<\/attachment>/g;
const hideAttachments = (text) => text.replace(ATTACHMENT_RE, '\n📎 $1');

module.exports = { extractAttachments, readFileText, extOf, hideAttachments, AttachmentError, ACCEPTED, MAX_FILE_BYTES, MAX_FILES };
