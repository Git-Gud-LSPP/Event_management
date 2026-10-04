import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Loader2, Paperclip, Plus, Sparkles, Trash2 } from "lucide-react";
import EventPicker, { useEventSelection } from "../../components/EventPicker";
import DashboardHeader from "../../components/DashboardHeader";
import { getStoredUser } from "../../services/authApi";
import DocumentModal from "./DocumentModal";
import {
  DOC_CATEGORIES,
  VENDOR_STAGES,
  addEventVendor,
  listDocuments,
  listEventVendors,
  removeEventVendor,
  updateEventVendor,
  type DocumentRecord,
  type EventVendor,
  type VendorStage,
} from "./api";

const FILTERS = ["All", ...DOC_CATEGORIES];

const STATUS_STYLE: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Sent: "bg-blue-50 text-blue-700",
  Received: "bg-blue-50 text-blue-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Signed: "bg-emerald-50 text-emerald-700",
  Paid: "bg-emerald-100 text-emerald-800",
  Void: "bg-red-50 text-red-600",
};

const money = (amount?: number, currency?: string) =>
  amount == null ? "—" : `${currency ?? ""} ${amount.toLocaleString()}`.trim();

// "modal" is null when closed, "new" (optionally for a vendor) or an existing document.
type ModalState = null | { doc: DocumentRecord | null; vendorId?: string };

export default function DocumentsPage() {
  const { events, selected, selectedId, setSelectedId, loading: eventsLoading, error: eventsError } =
    useEventSelection();
  const isOrganizer = getStoredUser()?.role === "organizer";

  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [vendors, setVendors] = useState<EventVendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [newVendor, setNewVendor] = useState<null | { name: string; type: string; phone: string; email: string }>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [d, v] = await Promise.all([listDocuments(selectedId), listEventVendors(selectedId)]);
        if (cancelled) return;
        setDocs(d);
        setVendors(v);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const act = (fn: () => Promise<void>) => fn().catch((e: Error) => setError(e.message));

  const upsertDoc = (saved: DocumentRecord) =>
    setDocs((prev) => [saved, ...prev.filter((d) => d._id !== saved._id)]);

  const setStage = (v: EventVendor, stage: VendorStage) =>
    act(async () => {
      const saved = await updateEventVendor(selectedId, v._id, { stage });
      setVendors((prev) => prev.map((x) => (x._id === saved._id ? saved : x)));
    });

  const removeVendor = (v: EventVendor) => {
    if (!window.confirm(`Remove ${v.name} from this event? Its documents are kept.`)) return;
    void act(async () => {
      await removeEventVendor(selectedId, v._id);
      setVendors((prev) => prev.filter((x) => x._id !== v._id));
      setDocs((prev) => prev.map((d) => (d.vendor?._id === v._id ? { ...d, vendor: null } : d)));
    });
  };

  const saveNewVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor) return;
    void act(async () => {
      const saved = await addEventVendor(selectedId, {
        name: newVendor.name,
        type: newVendor.type || undefined,
        phone: newVendor.phone || undefined,
        email: newVendor.email || undefined,
      });
      setVendors((prev) => [...prev, saved]);
      setNewVendor(null);
    });
  };

  const counts: Record<string, number> = { All: docs.length };
  for (const d of docs) counts[d.category] = (counts[d.category] ?? 0) + 1;

  const q = search.toLowerCase();
  const visible = docs
    .filter((d) => filter === "All" || d.category === filter)
    .filter((d) => d.title.toLowerCase().includes(q) || (d.vendor?.name ?? "").toLowerCase().includes(q));

  const booked = vendors.filter((v) => v.stage === "Booked" || v.stage === "Paid");
  const vendorCell = "px-3 py-2.5";

  return (
    <div className="min-h-screen bg-[#FBFBF9]">
      <div className="mb-6">
        <EventPicker events={events} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <DashboardHeader
        title="Documents"
        subtitle={
          selected ? `${docs.length} documents · ${vendors.length} vendors on ${selected.title}` : "Pick an event to see its documents"
        }
        label="New Document"
        categoriesList={FILTERS}
        counts={counts}
        activeCategory={filter}
        onCategoryChange={setFilter}
        onAction={isOrganizer && selectedId ? () => setModal({ doc: null }) : undefined}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search documents or vendors..."
      />

      {(error || eventsError) && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error || eventsError}</p>
      )}

      {eventsLoading || loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading documents…
        </div>
      ) : !selectedId ? (
        <p className="py-16 text-center text-sm text-gray-400">No events yet — create one on the Events page first.</p>
      ) : (
        <div className="space-y-8">
          {/* Procurement pipeline */}
          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">Procurement</h2>
                <p className="text-xs text-gray-500">
                  {booked.length} booked · committed{" "}
                  {money(booked.reduce((s, v) => s + (v.quoteAmount ?? 0), 0), booked[0]?.currency)}
                  {" · "}find vendors on the <Link to="/vendors" className="text-indigo-600 hover:underline">Vendors page</Link>{" "}
                  and use “Add to event”
                </p>
              </div>
              {isOrganizer && (
                <button
                  onClick={() => setNewVendor({ name: "", type: "", phone: "", email: "" })}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus size={14} /> Add vendor
                </button>
              )}
            </div>

            {newVendor && (
              <form onSubmit={saveNewVendor} className="grid grid-cols-2 gap-2 border-b border-gray-100 px-5 py-3 md:grid-cols-5">
                {(["name", "type", "phone", "email"] as const).map((k) => (
                  <input
                    key={k}
                    required={k === "name"}
                    type={k === "email" ? "email" : "text"}
                    placeholder={k === "type" ? "Type (e.g. catering)" : k[0].toUpperCase() + k.slice(1)}
                    value={newVendor[k]}
                    onChange={(e) => setNewVendor({ ...newVendor, [k]: e.target.value })}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                  />
                ))}
                <div className="flex gap-2">
                  <button className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">Add</button>
                  <button type="button" onClick={() => setNewVendor(null)} className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {vendors.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">
                No vendors yet. Ask the assistant <Sparkles size={13} className="inline" /> to “plan procurement for this event”.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-gray-400">
                    <tr>
                      <th className={vendorCell}>Vendor</th>
                      <th className={vendorCell}>Contact</th>
                      <th className={vendorCell}>Stage</th>
                      <th className={vendorCell}>Quote</th>
                      <th className={vendorCell}>Docs</th>
                      <th className={vendorCell} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vendors.map((v) => (
                      <tr key={v._id}>
                        <td className={vendorCell}>
                          <p className="font-medium text-gray-900">{v.name}</p>
                          <p className="text-xs capitalize text-gray-500">{[v.type, v.scope].filter(Boolean).join(" · ")}</p>
                        </td>
                        <td className={`${vendorCell} text-xs text-gray-600`}>
                          {[v.contactName, v.phone, v.email].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className={vendorCell}>
                          {isOrganizer ? (
                            <select
                              value={v.stage}
                              onChange={(e) => void setStage(v, e.target.value as VendorStage)}
                              className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                            >
                              {VENDOR_STAGES.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs">{v.stage}</span>
                          )}
                        </td>
                        <td className={`${vendorCell} text-xs`}>{money(v.quoteAmount, v.currency)}</td>
                        <td className={`${vendorCell} text-xs`}>
                          <button onClick={() => setSearch(v.name)} className="text-indigo-600 hover:underline">
                            {docs.filter((d) => d.vendor?._id === v._id).length}
                          </button>
                        </td>
                        <td className={`${vendorCell} whitespace-nowrap text-right`}>
                          {isOrganizer && (
                            <>
                              <button
                                onClick={() => setModal({ doc: null, vendorId: v._id })}
                                className="mr-2 text-xs font-medium text-indigo-600 hover:underline"
                              >
                                New doc
                              </button>
                              <button onClick={() => removeVendor(v)} title="Remove vendor" aria-label={`Remove ${v.name}`} className="text-gray-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Document list */}
          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              {docs.length ? "No documents match." : "No documents yet. Upload one, write one, or ask the assistant to draft an RFQ, PO or contract."}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((d) => (
                <button
                  key={d._id}
                  onClick={() => setModal({ doc: d })}
                  className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {d.file ? <Paperclip size={16} className="shrink-0 text-gray-400" /> : <FileText size={16} className="shrink-0 text-indigo-500" />}
                      <p className="truncate font-medium text-gray-900">{d.title}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[d.status]}`}>{d.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {d.category}
                    {d.vendor && ` · ${d.vendor.name}`}
                    {d.amount != null && ` · ${money(d.amount, d.currency)}`}
                  </p>
                  <p className="mt-2 text-[11px] text-gray-400">
                    Updated {new Date(d.updatedAt).toLocaleDateString()} by {d.createdBy?.name ?? "unknown"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {modal && selectedId && (
        <DocumentModal
          eventId={selectedId}
          doc={modal.doc}
          vendors={vendors}
          canEdit={isOrganizer}
          initialVendorId={modal.vendorId}
          onClose={() => setModal(null)}
          onSaved={upsertDoc}
          onDeleted={(id) => setDocs((prev) => prev.filter((d) => d._id !== id))}
        />
      )}
    </div>
  );
}
