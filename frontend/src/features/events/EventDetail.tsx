import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import {
  getEvent, deleteEvent, listInventory, listDependencyChains,
  type EventRecord, type InventoryRecord, type DependencyChainRecord,
} from './api'
import { listIncidents, type IncidentRecord } from '../incidents/api'
import { listSchedule, toTask } from '../schedule/api'
import type { Task } from '../schedule/data'
import { listEventVendors, type EventVendor } from '../documents/api'
import { getStoredUser } from '../../services/authApi'
import EventFormModal from './EventFormModal'
import { STATUS_PILL, fmtDate } from './format'
import { card, cardHead, mono, pill, pillOf, initialsOf } from '../../components/ui'


export default function EventDetail({ eventId: propEventId }: { eventId?: string } = {}) {
  const { eventId: paramEventId } = useParams<{ eventId: string }>()
  const eventId = propEventId || paramEventId || ''

  const [event, setEvent] = useState<EventRecord | null>(null)
  const [eventTasks, setEventTasks] = useState<Task[]>([])
  const [eventIncidents, setEventIncidents] = useState<IncidentRecord[]>([])
  const [inventory, setInventory] = useState<InventoryRecord[]>([])
  const [eventChains, setEventChains] = useState<DependencyChainRecord[]>([])
  const [vendors, setVendors] = useState<EventVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    Promise.all([
      getEvent(eventId), listSchedule(eventId), listIncidents(eventId),
      listInventory(eventId), listDependencyChains(eventId),
      // Vendors are a nice-to-have here; don't fail the whole page over them.
      listEventVendors(eventId).catch(() => [] as EventVendor[]),
    ])
      .then(([ev, schedule, inc, inv, chains, vend]) => {
        setEvent(ev)
        setEventTasks(schedule.items.map(toTask))
        setEventIncidents(inc.items)
        setInventory(inv.items)
        setEventChains(chains.items)
        setVendors(vend)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-ink-3">
        <Loader2 size={16} className="animate-spin" /> Loading event…
      </div>
    )
  }

  if (error || !event) {
    return (
      <div>
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || 'Event not found.'}</p>
        <Link to="/events" className="mt-4 inline-block text-sm text-ink-3 hover:underline">← Back to events</Link>
      </div>
    )
  }

  const isOrganizer = getStoredUser()?.id === event.organizer

  const remove = async () => {
    if (!confirm(`Delete "${event.title}"? Its schedule, floor plan, incidents, inventory and documents go with it. This can't be undone.`)) return
    setDeleting(true)
    try {
      await deleteEvent(event._id)
      navigate('/events', { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setDeleting(false)
    }
  }
  const eventStaff = event.staff ?? []
  const inventoryAlerts = inventory.filter(i => i.status !== 'Available')

  const doneTasks = eventTasks.filter(t => t.status === 'Done').length
  const blockedTasks = eventTasks.filter(t => t.status === 'Blocked').length
  const openIncidents = eventIncidents.filter(i => i.status !== 'Resolved').length
  const criticalIncidents = eventIncidents.filter(i => i.priority === 'Critical' && i.status !== 'Resolved').length

  const start = new Date(event.startsAt).getTime()
  const end = event.endsAt ? new Date(event.endsAt).getTime() : null
  const now = Date.now()
  const timeLabel = event.status === 'cancelled' ? 'Cancelled' : now < start ? 'Upcoming' : end && now > end ? 'Completed' : 'Live'
  const progress = eventTasks.length ? Math.round((doneTasks / eventTasks.length) * 100) : 0

  const needsAttention = [
    ...eventTasks.filter(t => t.status === 'Blocked').map(t => ({
      id: t.id, tag: 'BLOCKED', sev: 'High', label: t.name, sub: `${t.owner} · ${t.start}`,
    })),
    ...eventIncidents.filter(i => i.status !== 'Resolved').map(i => ({
      id: i._id, tag: i.priority.toUpperCase(), sev: i.priority, label: i.title,
      sub: `${i.reportedBy?.name ?? '—'} · ${new Date(i.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
    })),
  ].slice(0, 6)

  const kpis = [
    { l: 'Task progress', v: `${progress}%`, s: `${doneTasks} of ${eventTasks.length} tasks done`, c: '' },
    { l: 'In progress', v: eventTasks.filter(t => t.status === 'In Progress').length, s: `${blockedTasks} blocked`, c: '' },
    { l: 'Staff assigned', v: eventStaff.length, s: eventStaff.length ? 'On this event' : 'Add staff on the Staff page', c: '' },
    { l: 'Open incidents', v: openIncidents, s: criticalIncidents ? `${criticalIncidents} critical` : 'No critical alerts', c: criticalIncidents ? 'text-danger' : '' },
  ]

  return (
    <div>
      <Link to="/events" className="mb-[18px] inline-block text-[13px] text-ink-3 hover:text-ink">← All events</Link>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 font-mono text-xs tracking-[.04em] text-ink-3">
            EVENT · {event.status.toUpperCase()}
            <span className={`${pill} ${STATUS_PILL[timeLabel]}`}>{timeLabel.toUpperCase()}</span>
          </div>
          <h1 className="mt-2.5 mb-1.5 text-[clamp(30px,3.4vw,44px)] leading-none font-medium tracking-[-0.045em]">{event.title}</h1>
          <div className="text-[15px] text-ink-3">
            {fmtDate(event.startsAt)}
            {event.location ? ` · ${event.location}` : ''}
            {event.capacity != null ? ` · capacity ${event.capacity}` : ''}
          </div>
          {event.description && <p className="mt-2 max-w-2xl text-sm text-ink-3">{event.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {isOrganizer && (
            <button type="button" onClick={() => setEditing(true)} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface px-4 py-2.5 text-sm ring-1 ring-transparent hover:ring-ink">
              <Pencil size={14} aria-hidden="true" /> Edit
            </button>
          )}
          {isOrganizer && (
            <button type="button" onClick={remove} disabled={deleting} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface px-4 py-2.5 text-sm text-danger ring-1 ring-transparent hover:ring-danger disabled:opacity-50">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} aria-hidden="true" />} Delete
            </button>
          )}
          <Link to="/schedule" className="rounded-full bg-surface px-4 py-2.5 text-sm ring-1 ring-transparent hover:ring-ink">Open schedule</Link>
          <Link to="/floorplan" className="rounded-full bg-ink px-4 py-2.5 text-sm text-paper hover:bg-ink-hover">Floor plan</Link>
        </div>
      </div>

      <div className="mb-6 grid gap-px overflow-hidden rounded-2xl bg-line [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
        {kpis.map(k => (
          <div key={k.l} className="bg-surface px-5 py-[18px]">
            <div className="text-[12.5px] text-ink-3">{k.l}</div>
            <div className={`mt-1.5 text-[34px] font-medium tracking-[-0.045em] ${k.c}`}>{k.v}</div>
            <div className="mt-0.5 text-xs text-[#6E7C73]">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))]">
        <div className="flex flex-col gap-4">
          {eventChains.length > 0 && (
            <section className={card}>
              <div className={cardHead}>
                <h2 className="text-[15px] font-medium">Dependency alert chains</h2>
                <span className={`${mono} text-accent`}>FROM SCHEDULE</span>
              </div>
              {eventChains.slice(0, 3).map(c => (
                <div key={c.id} className="border-b border-line-soft px-[18px] py-4 last:border-0">
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className={`${pill} bg-danger-soft text-danger`}>{c.trigger.type.toUpperCase()}</span>
                      {c.trigger.label}
                    </span>
                    <span className={`${mono} text-[#6E7C73]`}>{new Date(c.trigger.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <ol className="mt-3 ml-1.5 flex flex-col gap-2.5 border-l border-dashed border-[#CBD6CC] pl-4">
                    {c.chain.map(s => (
                      <li key={s.id} className="relative text-[13px]">
                        <span aria-hidden="true" className={`absolute top-[5px] -left-[21px] size-[9px] rounded-full shadow-[0_0_0_3px_#fff] ${s.severity === 'critical' ? 'bg-[#C9668E]' : 'bg-[#C9A54A]'}`} />
                        <div>{s.label}</div>
                        <div className="mt-px text-[12.5px] text-ink-3">{s.impact}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}

          <section className={card}>
            <div className={cardHead}>
              <h2 className="text-[15px] font-medium">Needs attention</h2>
              <span className={`${mono} text-[#6E7C73]`}>{needsAttention.length} ITEMS</span>
            </div>
            {needsAttention.length === 0 ? (
              <p className="px-[18px] py-8 text-center text-sm text-ink-3">All clear: no blocked tasks or open incidents.</p>
            ) : (
              needsAttention.map(item => (
                <div key={item.id} className="flex items-center gap-3 border-b border-line-soft px-[18px] py-3 text-[13.5px] last:border-0">
                  <span className={`${pill} ${SEVERITY_PILL[item.sev] ?? 'bg-sunken text-ink-2'}`}>{item.tag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{item.label}</div>
                    <div className="mt-px text-xs text-[#6E7C73]">{item.sub}</div>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className={card}>
            <div className={cardHead}>
              <h2 className="text-[15px] font-medium">Staff on this event</h2>
              <Link to="/staffs" className="text-[12.5px] text-ink-3 hover:text-ink">View all →</Link>
            </div>
            {eventStaff.length === 0 ? (
              <p className="px-[18px] py-6 text-[13px] text-ink-3">Nobody assigned yet.</p>
            ) : (
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                {eventStaff.slice(0, 8).map(s => (
                  <div key={s._id} className="flex items-center gap-2.5 border-b border-line-soft px-[18px] py-[11px]">
                    <span className="grid size-[30px] flex-none place-items-center rounded-full bg-[#E4EEE6] text-[10.5px]">{initialsOf(s.name)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium">{s.name}</div>
                      <div className="truncate text-[11.5px] text-[#6E7C73]">{s.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={card}>
            <div className={cardHead}>
              <h2 className="text-[15px] font-medium">Vendor status</h2>
              <Link to="/vendors" className="text-[12.5px] text-ink-3 hover:text-ink">Find vendors →</Link>
            </div>
            {vendors.length === 0 ? (
              <p className="px-[18px] py-6 text-[13px] text-ink-3">No vendors on this event yet.</p>
            ) : (
              vendors.slice(0, 6).map(v => (
                <div key={v._id} className="flex items-center gap-3 border-b border-line-soft px-[18px] py-3 text-[13.5px] last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{v.name}</div>
                    <div className="mt-px truncate text-xs text-[#6E7C73]">{[v.type, v.scope].filter(Boolean).join(' · ') || '—'}</div>
                  </div>
                  <span className={pillOf(v.stage)}>{v.stage.toUpperCase()}</span>
                </div>
              ))
            )}
          </section>

          <section className={card}>
            <div className={cardHead}>
              <h2 className="text-[15px] font-medium">Inventory alerts</h2>
              <span className={`${mono} text-[#6E7C73]`}>{inventoryAlerts.length} ITEMS</span>
            </div>
            {inventoryAlerts.length === 0 ? (
              <p className="px-[18px] py-6 text-[13px] text-ink-3">No inventory alerts.</p>
            ) : (
              inventoryAlerts.slice(0, 6).map(i => (
                <div key={i._id} className="border-b border-line-soft px-[18px] py-3 text-[13.5px] last:border-0">
                  <div className="flex justify-between gap-2.5">
                    <span>{i.name}</span>
                    <span className={`${pill} ${INVENTORY_PILL[i.status] ?? 'bg-sunken text-ink-2'}`}>{i.status.toUpperCase()}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-sm bg-line-soft">
                      <div
                        className={`h-full ${i.status === 'Damaged' ? 'bg-[#C9668E]' : i.status === 'Low Stock' ? 'bg-[#C9A54A]' : 'bg-ink'}`}
                        style={{ width: `${i.maxStock ? Math.round((i.stock / i.maxStock) * 100) : 0}%` }}
                      />
                    </div>
                    <span className={`${mono} text-[#6E7C73]`}>{i.stock}/{i.maxStock}{i.location ? ` · ${i.location}` : ''}</span>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>

      {editing && (
        <EventFormModal
          event={event}
          onClose={() => setEditing(false)}
          // PATCH returns staff as bare ids; keep the populated list we already have.
          onSaved={(saved) => setEvent((prev) => ({ ...saved, staff: prev?.staff ?? [] }))}
        />
      )}
    </div>
  )
}

const SEVERITY_PILL: Record<string, string> = {
  Critical: 'bg-danger-soft text-danger',
  High: 'bg-warn-soft text-warn',
  Medium: 'bg-[#D6E4F5] text-[#24518A]',
  Low: 'bg-sunken text-ink-2',
}

const INVENTORY_PILL: Record<string, string> = {
  'Low Stock': 'bg-warn-soft text-warn', Damaged: 'bg-danger-soft text-danger', Ordered: 'bg-[#D6E4F5] text-[#24518A]', 'Checked Out': 'bg-sunken text-ink-2',
}


