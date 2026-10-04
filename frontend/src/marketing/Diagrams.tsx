// Hairline diagrams. Strokes use pathLength=1 + .eh-draw so they draw themselves when the
// parent gets `is-in` (see useRevealAll). Cells with .eh-light switch on after their line lands.

const TOOLS: [tool: string, module: string][] = [
  ["Spreadsheet", "Run-of-show"],
  ["Group chat", "Assistant"],
  ["Email threads", "Vendors"],
  ["Shared drive", "Documents"],
  ["Floor plan PDF", "Floor Plan"],
  ["Incident log", "Incidents"],
  ["Purchase tracker", "Procurement"],
  ["Form builder", "Registration forms"],
];

const JITTER = [0, 40, 12, 56, 4, 32, 20, 48];

export function ConsolidationDiagram() {
  const desc =
    "Diagram: eight separate tools (spreadsheet, group chat, email threads, shared drive, floor plan PDF, incident log, purchase tracker, form builder) each connect by a line into a matching module inside one EventHQ workspace.";
  return (
    <div data-inview>
      {/* Desktop: tools on the left converge into the workspace on the right. */}
      <svg viewBox="0 0 1000 440" className="hidden w-full lg:block" role="img" aria-label={desc}>
        {TOOLS.map(([tool, mod], i) => {
          const x = JITTER[i];
          const y = 12 + i * 54;
          const cy = 96 + i * 37;
          return (
            <g key={tool} style={{ "--i": i } as React.CSSProperties}>
              <rect x={x} y={y} width="168" height="34" rx="6" fill="var(--eh-surface)" stroke="var(--eh-line-strong)" strokeDasharray="3 3" />
              <text x={x + 14} y={y + 22} className="fill-ink-2 font-mono text-[13px]">{tool}</text>
              <path
                d={`M${x + 168} ${y + 17} C${x + 348} ${y + 17} ${464} ${cy + 15} ${624} ${cy + 15}`}
                pathLength={1}
                className="eh-draw"
                fill="none"
                stroke="var(--eh-accent)"
                strokeWidth="1"
              />
              <rect x="624" y={cy} width="352" height="30" rx="6" className="eh-light" fill="var(--eh-surface)" stroke="var(--eh-line)" />
              <text x="640" y={cy + 20} className="fill-ink text-[13px] font-medium">{mod}</text>
            </g>
          );
        })}
        <rect x="600" y="40" width="400" height="368" rx="10" fill="none" stroke="var(--eh-ink)" strokeWidth="1" />
        <text x="624" y="74" className="fill-ink text-[15px] font-semibold">EventHQ workspace</text>
      </svg>

      {/* Mobile/tablet: tools on top flow down into the workspace. */}
      <svg viewBox="0 0 360 640" className="mx-auto block w-full max-w-[420px] lg:hidden" role="img" aria-label={desc}>
        {TOOLS.map(([tool, mod], i) => {
          const x = (i % 2) * 184;
          const y = (i >> 1) * 44;
          const px = 28 + i * 43;
          const cy = 306 + i * 38;
          return (
            <g key={tool} style={{ "--i": i } as React.CSSProperties}>
              <rect x={x} y={y} width="176" height="32" rx="6" fill="var(--eh-surface)" stroke="var(--eh-line-strong)" strokeDasharray="3 3" />
              <text x={x + 12} y={y + 21} className="fill-ink-2 font-mono text-[12px]">{tool}</text>
              <path
                d={`M${x + 88} ${y + 32} C${x + 88} ${y + 120} ${px} ${170} ${px} ${260}`}
                pathLength={1}
                className="eh-draw"
                fill="none"
                stroke="var(--eh-accent)"
              />
              <rect x="16" y={cy} width="328" height="30" rx="6" className="eh-light" fill="var(--eh-surface)" stroke="var(--eh-line)" />
              <text x="30" y={cy + 20} className="fill-ink text-[13px] font-medium">{mod}</text>
            </g>
          );
        })}
        <rect x="0.5" y="260" width="359" height="372" rx="10" fill="none" stroke="var(--eh-ink)" />
        <text x="16" y="290" className="fill-ink text-[15px] font-semibold">EventHQ workspace</text>
      </svg>
    </div>
  );
}

const INTEGRATIONS = [
  "Google Calendar", "Outlook", "Stripe", "Salesforce", "HubSpot", "Slack",
  "Microsoft Teams", "Zoom", "Google Drive", "Zapier", "Mailchimp", "QuickBooks",
];

export function IntegrationHub() {
  const cx = 500;
  const cy = 210;
  return (
    <div data-inview>
      <svg
        viewBox="0 0 1000 420"
        className="hidden w-full md:block"
        role="img"
        aria-label={`Diagram: EventHQ at the center, connected to ${INTEGRATIONS.join(", ")}.`}
      >
        <ellipse cx={cx} cy={cy} rx="420" ry="170" fill="none" stroke="var(--eh-line)" strokeDasharray="2 6" />
        {INTEGRATIONS.map((name, i) => {
          const a = (i / INTEGRATIONS.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(a) * 420;
          const y = cy + Math.sin(a) * 170;
          const w = name.length * 8 + 28;
          return (
            <g key={name} style={{ "--i": i } as React.CSSProperties}>
              <path d={`M${cx} ${cy} L${x} ${y}`} pathLength={1} className="eh-draw" stroke="var(--eh-line-strong)" strokeWidth="1" />
              <rect x={x - w / 2} y={y - 16} width={w} height="32" rx="6" fill="var(--eh-bg)" stroke="var(--eh-line-strong)" />
              <text x={x} y={y + 5} textAnchor="middle" className="fill-ink-2 font-mono text-[13px]">{name}</text>
            </g>
          );
        })}
        <rect x={cx - 82} y={cy - 26} width="164" height="52" rx="10" fill="var(--eh-ink)" />
        <text x={cx} y={cy + 6} textAnchor="middle" className="fill-paper text-[17px] font-semibold">EventHQ</text>
      </svg>
      <ul className="flex flex-wrap gap-2 md:hidden" aria-label="Integrations">
        {INTEGRATIONS.map((n) => (
          <li key={n} className="rounded-control border border-line-strong px-3 py-1.5 font-mono text-[13px] text-ink-2">{n}</li>
        ))}
      </ul>
    </div>
  );
}
