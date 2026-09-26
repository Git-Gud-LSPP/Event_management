import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
// Incidents, inventory and dependency chains have no backend yet, so those panels
// still read the sample file. Everything else on this page is live.
import { incidents, dependencyChains } from './data'
import type { DependencyChain } from './data'
import { getEvent, type EventRecord } from './api'
import { listSchedule, toTask } from '../schedule/api'
import type { Task } from '../schedule/data'

export default function EventDetail({ eventId: propEventId }: { eventId?: string } = {}) {
  // Extract route parameter from URL
  const { eventId: paramEventId } = useParams<{ eventId: string }>()

  // Fall back to prop if provided, otherwise route parameter
  const eventId = propEventId || paramEventId || ''

  const [event, setEvent] = useState<EventRecord | null>(null)
  const [eventTasks, setEventTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    Promise.all([getEvent(eventId), listSchedule(eventId)])
      .then(([ev, schedule]) => {
        setEvent(ev)
        setEventTasks(schedule.items.map(toTask))
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-mist">
        <Loader2 size={16} className="animate-spin" /> Loading event…
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="p-8">
        <p className="rounded-xl bg-[#fee2e2] px-4 py-3 text-sm font-medium text-[#dc2626]">
          {error || 'Event not found.'}
        </p>
        <Link to="/events" className="mt-4 inline-block text-sm text-lichen-gray hover:underline">
          ← Back to events
        </Link>
      </div>
    )
  }

  const eventStaff = event.staff ?? []
  const eventIncidents = incidents
  const eventChains = dependencyChains

  const doneTasks = eventTasks.filter(t => t.status === 'Done').length
  const blockedTasks = eventTasks.filter(t => t.status === 'Blocked').length
  const openIncidents = eventIncidents.filter(i => i.status !== 'Resolved').length
  const criticalIncidents = eventIncidents.filter(i => i.severity === 'Critical').length

  const start = new Date(event.startsAt)
  const end = event.endsAt ? new Date(event.endsAt) : null
  const now = Date.now()
  const timeLabel = now < start.getTime() ? 'Upcoming' : end && now > end.getTime() ? 'Completed' : 'Live'
  const progress = eventTasks.length
    ? Math.round((doneTasks / eventTasks.length) * 100)
    : 0

  const needsAttention = [
    ...eventTasks.filter(t => t.status === 'Blocked').map(t => ({
      id: t.id, type: 'task' as const, label: `${t.name} blocked`, person: t.owner, time: t.start, severity: 'High' as const,
    })),
    ...eventIncidents.filter(i => i.status !== 'Resolved').map(i => ({
      id: i.id, type: 'incident' as const, label: i.title, person: i.who.split(' ·')[0], time: i.timeAgo, severity: i.severity,
    })),
  ].slice(0, 5)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusDot status={timeLabel} />
            <span className="text-[11px] font-medium text-lichen-gray uppercase tracking-[0.08em]">{event.status} · {timeLabel}</span>
          </div>
          <h1 className="text-[28px] font-semibold text-forest-ink leading-tight tracking-[-0.4px]">{event.title}</h1>
          <p className="text-stone text-sm mt-0.5">
            {start.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            {event.location ? ` · ${event.location}` : ''}
          </p>
          {event.description && <p className="text-stone text-sm mt-2 max-w-2xl">{event.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {event.capacity != null && (
            <span className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-meadow text-forest-ink border border-forest-ink/10">
              Capacity {event.capacity}
            </span>
          )}
          <Link
            to="/schedule"
            className="flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-full border border-forest-ink/15 text-forest-ink hover:bg-forest-ink/5 transition-colors"
          >
            Manage schedule
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Task Progress" value={`${progress}%`} sub={`${doneTasks}/${eventTasks.length} tasks done`} surface="bg-mint-surface" accent="#003d3d" progress={progress} />
        <KpiCard label="Active Tasks" value={String(eventTasks.filter(t => t.status === 'In Progress').length)} sub={`${blockedTasks} blocked`} surface="bg-lime-surface" accent="#515c0b" alertCount={blockedTasks} />
        <KpiCard label="Staff Assigned" value={String(eventStaff.length)} sub={eventStaff.length ? 'On this event' : 'Add staff on the Staff page'} surface="bg-lavender-surface" accent="#652ea3" />
        <KpiCard label="Open Incidents" value={String(openIncidents)} sub={criticalIncidents > 0 ? `${criticalIncidents} critical` : 'No critical alerts'} surface="bg-blush-surface" accent="#7a2251" alertCount={criticalIncidents} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs Attention */}
        <div className="lg:col-span-2 bg-white rounded-[14px] shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-forest-ink text-[15px]">Needs Attention</h2>
            <span className="text-[11px] font-medium text-mist uppercase tracking-[0.06em]">Live</span>
          </div>
          {needsAttention.length === 0 ? (
            <div className="text-center py-10 text-mist text-sm">All clear — no issues right now.</div>
          ) : (
            <div className="space-y-2">
              {needsAttention.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-[10px] hover:bg-parchment transition-colors group">
                  <SeverityIcon severity={item.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-forest-ink truncate">{item.label}</p>
                    <p className="text-[12px] text-mist">{item.person} · {item.time}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${severityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff on this event */}
        <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] p-6">
          <h2 className="font-semibold text-forest-ink text-[15px] mb-5">Staff on this Event</h2>
          {eventStaff.length === 0 ? (
            <p className="text-[13px] text-mist">Nobody assigned yet.</p>
          ) : (
            <div className="space-y-2.5">
              {eventStaff.slice(0, 6).map(s => (
                <div key={s._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-meadow flex items-center justify-center text-[11px] font-semibold text-forest-ink flex-shrink-0">
                    {initialsOf(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-forest-ink truncate">{s.name}</p>
                    <p className="text-[11px] text-mist truncate">{s.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/staffs" className="block w-full mt-4 text-[12px] font-medium text-lichen-gray hover:text-forest-ink transition-colors py-1">
            Manage staff →
          </Link>
        </div>
      </div>

      {/* Dependency alert chains */}
      {eventChains.length > 0 && (
        <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="font-semibold text-forest-ink text-[15px]">Dependency Alert Chains</h2>
            <SampleBadge />
          </div>
          <div className="space-y-4">
            {eventChains.slice(0, 2).map(chain => (
              <DependencyChainCard key={chain.id} chain={chain} />
            ))}
          </div>
        </div>
      )}

      {/* Vendor status mini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-forest-ink text-[15px]">Vendor Status</h2>
            <SampleBadge />
          </div>
          <div className="space-y-2">
            {[
              { name: 'SoundWave Productions', service: 'AV & Sound', status: 'Confirmed' },
              { name: 'Harvest Table Catering', service: 'Catering', status: 'At Risk' },
              { name: 'BrightLux Lighting', service: 'Lighting', status: 'Confirmed' },
              { name: 'Citywide Security', service: 'Security', status: 'Confirmed' },
            ].map((v, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-forest-ink/5 last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-forest-ink">{v.name}</p>
                  <p className="text-[11px] text-mist">{v.service}</p>
                </div>
                <VendorStatusBadge status={v.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-forest-ink text-[15px]">Inventory Alerts</h2>
            <SampleBadge />
          </div>
          <div className="space-y-2">
            {[
              { name: 'Wireless Lavalier Mic', stock: '2 of 12', status: 'Low Stock', color: 'text-[#d97706]' },
              { name: 'HDMI to USB-C Adapter', stock: '1 of 8', status: 'Damaged', color: 'text-[#dc2626]' },
              { name: 'First Aid Kits', stock: '3 of 10', status: 'Low Stock', color: 'text-[#d97706]' },
              { name: 'Power Extension Cables', stock: '0 of 20', status: 'Ordered', color: 'text-[#6b7280]' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-forest-ink/5 last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-forest-ink">{item.name}</p>
                  <p className="text-[11px] text-mist">Stock: {item.stock}</p>
                </div>
                <span className={`text-[11px] font-medium ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const initialsOf = (name: string) =>
  name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { Live: 'bg-[#16a34a]', Upcoming: 'bg-[#4f46e5]', Completed: 'bg-[#889494]', 'At Risk': 'bg-[#dc2626]' }
  return <span className={`w-2 h-2 rounded-full ${colors[status] || 'bg-mist'} ${status === 'Live' ? 'animate-pulse' : ''}`} />
}

function KpiCard({ label, value, sub, surface, accent, progress, alertCount }: {
  label: string; value: string; sub: string; surface: string; accent: string; progress?: number; alertCount?: number;
}) {
  return (
    <div className={`${surface} rounded-[14px] p-5`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: accent }}>{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-[28px] font-semibold leading-none" style={{ color: accent }}>{value}</span>
        {alertCount != null && alertCount > 0 && (
          <span className="mb-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626]">{alertCount} blocked</span>
        )}
      </div>
      {progress !== undefined && (
        <div className="h-1 bg-white/60 rounded-full mt-3 mb-1.5 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accent }} />
        </div>
      )}
      <p className="text-[12px] mt-2" style={{ color: accent + 'aa' }}>{sub}</p>
    </div>
  )
}

function SeverityIcon({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    Critical: 'bg-[#fee2e2] text-[#dc2626]',
    High: 'bg-[#fff7ed] text-[#ea580c]',
    Medium: 'bg-buttercream text-saffron',
    Low: 'bg-parchment text-mist',
  }
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] ${colors[severity]}`}>
      {severity === 'Critical' ? '🔴' : severity === 'High' ? '🟠' : severity === 'Medium' ? '🟡' : 'ℹ'}
    </div>
  )
}

function severityBadge(s: string) {
  return {
    Critical: 'bg-[#fee2e2] text-[#dc2626]',
    High: 'bg-[#fff7ed] text-[#ea580c]',
    Medium: 'bg-buttercream text-saffron',
    Low: 'bg-parchment text-mist',
  }[s] || 'bg-parchment text-mist'
}

function SampleBadge() {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-parchment text-mist">
      Sample data
    </span>
  )
}

function VendorStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmed: 'text-[#16a34a]',
    'At Risk': 'text-[#dc2626]',
    Pending: 'text-[#4f46e5]',
    Delayed: 'text-[#d97706]',
  }
  return <span className={`text-[12px] font-medium ${map[status] || 'text-mist'}`}>{status}</span>
}

function DependencyChainCard({ chain }: { chain: DependencyChain }) {
  const triggerColors = { delay: 'bg-buttercream text-saffron', risk: 'bg-[#fff7ed] text-[#ea580c]', blocked: 'bg-[#fee2e2] text-[#dc2626]' }
  return (
    <div className="border border-forest-ink/8 rounded-[10px] p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${triggerColors[chain.trigger.type as keyof typeof triggerColors]}`}>
          TRIGGER
        </span>
        <div>
          <p className="text-[13px] font-medium text-forest-ink">{chain.trigger.label}</p>
          <p className="text-[11px] text-mist">{chain.trigger.time}</p>
        </div>
      </div>
      <div className="ml-4 space-y-2 mb-3">
        {chain.chain.map((item) => {
          const sevColors = { critical: 'border-[#fecaca] bg-[#fff5f5]', high: 'border-[#fed7aa] bg-[#fffbf5]', medium: 'border-[#fde68a] bg-[#fffdf0]' }
          return (
            <div key={item.id} className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <div className="w-px h-2 bg-forest-ink/15 mt-0.5" />
                <div className="w-1.5 h-1.5 rounded-full bg-forest-ink/30 flex-shrink-0" />
              </div>
              <div className={`flex-1 border rounded-[8px] px-3 py-2 ${sevColors[item.severity as keyof typeof sevColors]}`}>
                <p className="text-[12px] font-medium text-forest-ink">{item.label}</p>
                <p className="text-[11px] text-stone">{item.impact}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="bg-sage-glow rounded-[8px] px-3 py-2.5 flex items-start gap-2">
        <span className="text-[11px] font-semibold text-deep-forest uppercase tracking-wide flex-shrink-0 mt-0.5">→ Action</span>
        <p className="text-[12px] text-deep-forest">{chain.suggestedAction}</p>
      </div>
    </div>
  )
}