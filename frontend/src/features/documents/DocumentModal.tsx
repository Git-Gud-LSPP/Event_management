import { useEffect, useRef, useState } from "react";
import { X, Loader2, Download, Printer, Pencil, Trash2, Paperclip } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fileToAttachment, MAX_ATTACHMENT_BYTES } from "../agent/api";
import {
  DOC_ACCEPT,
  DOC_CATEGORIES,
  DOC_STATUSES,
  createDocument,
  deleteDocument,
  downloadDocument,
  getDocument,
  updateDocument,
  type DocCategory,
  type DocStatus,
  type DocumentInput,
  type DocumentRecord,
  type EventVendor,
} from "./api";

// One stylesheet for the modal preview and the print window (which can't see Tailwind).
const MD_CSS = `
.doc-md { font-size: 14px; line-height: 1.6; color: #1f2937; }
.doc-md h1 { font-size: 1.5em; font-weight: 700; margin: 0.6em 0 0.4em; }
.doc-md h2 { font-size: 1.25em; font-weight: 700; margin: 1em 0 0.4em; }
.doc-md h3 { font-size: 1.05em; font-weight: 600; margin: 1em 0 0.3em; }
.doc-md p, .doc-md ul, .doc-md ol { margin: 0.5em 0; }
.doc-md ul { list-style: disc; padding-left: 1.4em; }
.doc-md ol { list-style: decimal; padding-left: 1.4em; }
.doc-md table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 13px; }
.doc-md th, .doc-md td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
.doc-md th { background: #f9fafb; font-weight: 600; }
.doc-md hr { border: 0; border-top: 1px solid #e5e7eb; margin: 1.2em 0; }
.doc-md code { background: #f3f4f6; padding: 0 4px; border-radius: 4px; }
.doc-md blockquote { border-left: 3px solid #e5e7eb; padding-left: 0.8em; color: #6b7280; }
`;

const field =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500";
const label = "mb-1 block text-xs font-semibold text-gray-600";

export default function DocumentModal({
  eventId,
  doc,
  vendors,
  canEdit,
  initialVendorId,
  onClose,
  onSaved,
  onDeleted,
}: {
  eventId: string;
  doc: DocumentRecord | null; // null = create
  vendors: EventVendor[];
  canEdit: boolean;
  initialVendorId?: string;
  onClose: () => void;
  onSaved: (saved: DocumentRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const [full, setFull] = useState<DocumentRecord | null>(null);
  const [editing, setEditing] = useState(!doc);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(doc?.title ?? "");
  const [category, setCategory] = useState<DocCategory>(doc?.category ?? "Other");
  const [status, setStatus] = useState<DocStatus>(doc?.status ?? "Draft");
  const [vendor, setVendor] = useState(doc?.vendor?._id ?? initialVendorId ?? "");
  const [amount, setAmount] = useState(doc?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState(doc?.currency ?? "");
  const [dueDate, setDueDate] = useState(doc?.dueDate?.slice(0, 10) ?? "");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    getDocument(eventId, doc._id)
      .then((d) => {
        if (cancelled) return;
        setFull(d);
        setContent(d.content ?? "");
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [eventId, doc]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const payload: DocumentInput = {
        title,
        category,
        status,
        vendor: vendor || null,
        amount: amount === "" ? null : Number(amount),
        currency: currency || undefined,
        dueDate: dueDate || null,
        content,
      };
      if (!doc && file) {
        if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(`${file.name} is larger than 5 MB`);
        payload.file = await fileToAttachment(file);
        if (!content) delete payload.content; // let the server extract the file's text
      }
      const saved = doc ? await updateDocument(eventId, doc._id, payload) : await createDocument(eventId, payload);
      onSaved(saved);
      if (doc) {
        setFull(saved);
        setEditing(false);
      } else onClose();
    });
  };

  const remove = () => {
    if (!doc || !window.confirm(`Delete "${doc.title}"?`)) return;
    void run(async () => {
      await deleteDocument(eventId, doc._id);
      onDeleted(doc._id);
      onClose();
    });
  };

  const print = () => {
    const w = window.open("", "_blank");
    if (!w || !bodyRef.current) return;
    w.document.write(`<!doctype html><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;margin:40px}${MD_CSS}</style><div class="doc-md">${bodyRef.current.innerHTML}</div>`);
    w.document.title = doc?.title ?? "Document";
    w.document.close();
    w.print();
  };

  const shown = full ?? doc;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <style>{MD_CSS}</style>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-gray-900">
              {doc ? shown?.title : "New document"}
            </h2>
            {shown && (
              <p className="text-xs text-gray-500">
                {shown.category} · {shown.status}
                {shown.vendor && ` · ${shown.vendor.name}`}
                {shown.amount != null && ` · ${shown.currency ?? ""} ${shown.amount.toLocaleString()}`}
                {shown.dueDate && ` · due ${new Date(shown.dueDate).toLocaleDateString()}`}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {doc && !editing && (
              <>
                <IconButton title="Download" onClick={() => void run(() => downloadDocument(eventId, full ?? doc))}>
                  <Download size={16} />
                </IconButton>
                {full?.content && (
                  <IconButton title="Print / save as PDF" onClick={print}>
                    <Printer size={16} />
                  </IconButton>
                )}
                {canEdit && full && (
                  <IconButton title="Edit" onClick={() => setEditing(true)}>
                    <Pencil size={16} />
                  </IconButton>
                )}
                {canEdit && (
                  <IconButton title="Delete" onClick={remove}>
                    <Trash2 size={16} />
                  </IconButton>
                )}
              </>
            )}
            <IconButton title="Close" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
          )}

          {!editing ? (
            !full ? (
              <div className="flex items-center gap-2 py-10 text-sm text-gray-400">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : (
              <>
                {full.file && (
                  <p className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <Paperclip size={14} /> {full.file.name} ({Math.ceil(full.file.size / 1024)} KB)
                  </p>
                )}
                <div ref={bodyRef} className="doc-md">
                  {full.content ? (
                    <Markdown remarkPlugins={[remarkGfm]}>{full.content}</Markdown>
                  ) : (
                    <p className="text-gray-400">No text preview. Download the file to view it.</p>
                  )}
                </div>
              </>
            )
          ) : (
            <form id="doc-form" onSubmit={save} className="space-y-4">
              <div>
                <label className={label}>Title</label>
                <input className={field} required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>Category</label>
                  <select className={field} value={category} onChange={(e) => setCategory(e.target.value as DocCategory)}>
                    {DOC_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Status</label>
                  <select className={field} value={status} onChange={(e) => setStatus(e.target.value as DocStatus)}>
                    {DOC_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Vendor</label>
                  <select className={field} value={vendor} onChange={(e) => setVendor(e.target.value)}>
                    <option value="">None</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>Amount</label>
                  <input className={field} type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className={label}>Currency</label>
                  <input className={field} maxLength={3} placeholder="NPR" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={label}>Due date</label>
                  <input className={field} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              {!doc && (
                <div>
                  <label className={label}>Upload a file (optional)</label>
                  <input
                    type="file"
                    accept={DOC_ACCEPT}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-indigo-700"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setFile(f);
                      if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
                    }}
                  />
                </div>
              )}
              <div>
                <label className={label}>
                  Content (Markdown){!doc && file ? " — leave empty to use the file's text" : ""}
                </label>
                <textarea
                  className={`${field} font-mono`}
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </form>
          )}
        </div>

        {editing && (
          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={() => (doc ? setEditing(false) : onClose())}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="doc-form"
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function IconButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    >
      {children}
    </button>
  );
}
