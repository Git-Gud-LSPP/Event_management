import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Check,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  ShieldAlert,
  Square,
  X,
} from "lucide-react";
import { getSelectedEventId, setSelectedEventId } from "../../services/selectedEvent";
import {
  ATTACH_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  cancelAction,
  confirmAction,
  fileToAttachment,
  getConversation,
  resetConversation,
  streamChat,
  type AgentAction,
  type AgentEvent,
  type ToolStatus,
} from "./api";

type Item =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "tool"; id: string; name: string; status: ToolStatus }
  | { kind: "confirm"; action: AgentAction; busy?: boolean }
  | { kind: "error"; text: string };

const SUGGESTIONS = [
  "What's coming up at my next event?",
  "Which tasks in this event are blocked?",
  "Summarize the open critical incidents",
  "Find caterers near this event's venue",
];

const EVENT_IN_PATH = /^\/events\/([a-f\d]{24})/i;

const toolLabel = (name: string) => {
  const words = name.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const ACTION_STATUS_TEXT: Record<AgentAction["status"], string> = {
  pending: "Waiting for your confirmation",
  running: "Running…",
  done: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

function ItemView({
  item,
  onResolve,
}: {
  item: Item;
  onResolve: (id: string, confirm: boolean) => void;
}) {
  switch (item.kind) {
    case "user":
      return (
        <div className="flex justify-end">
          <p className="max-w-[85%] whitespace-pre-wrap rounded-[14px] bg-ink px-3.5 py-[11px] text-[13.5px] leading-normal text-paper">
            {item.text}
          </p>
        </div>
      );
    case "assistant":
      return (
        <p className="max-w-[90%] whitespace-pre-wrap rounded-[14px] border border-line bg-surface px-3.5 py-[11px] text-[13.5px] leading-normal text-ink">
          {item.text}
        </p>
      );
    case "tool":
      return (
        <p className="flex items-center gap-1.5 pl-1 text-xs text-ink-3">
          {item.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {item.status === "done" && <Check className="h-3.5 w-3.5 text-accent" />}
          {item.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-warn" />}
          {toolLabel(item.name)}
        </p>
      );
    case "error":
      return (
        <p className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {item.text}
        </p>
      );
    case "confirm": {
      const { action } = item;
      return (
        <div className="rounded-xl border border-warn/30 bg-warn-soft p-3">
          <p className="flex items-start gap-2 text-sm font-medium text-ink">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            {action.summary}
          </p>
          {action.status === "pending" ? (
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                disabled={item.busy}
                onClick={() => onResolve(action.id, true)}
                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink-2 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                type="button"
                disabled={item.busy}
                onClick={() => onResolve(action.id, false)}
                className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-soft disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p
              className={`mt-1.5 pl-6 text-xs ${
                action.status === "done" ? "text-accent" : action.status === "failed" ? "text-danger" : "text-ink-3"
              }`}
            >
              {ACTION_STATUS_TEXT[action.status]}
              {action.error ? `: ${action.error}` : ""}
            </p>
          )}
        </div>
      );
    }
  }
}

export default function AgentPanel({
  open,
  onClose,
  onDataChanged,
}: {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // History loads the first time the panel opens; the panel then stays mounted.
  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    getConversation()
      .then(({ messages, pendingActions }) =>
        setItems([
          ...messages.map((m) => ({ kind: m.role, text: m.text }) as Item),
          ...pendingActions.map((action) => ({ kind: "confirm", action }) as Item),
        ])
      )
      .catch((e: Error) => setItems([{ kind: "error", text: e.message }]));
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [items]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateAction = (id: string, update: (item: Extract<Item, { kind: "confirm" }>) => Item) =>
    setItems((prev) => prev.map((i) => (i.kind === "confirm" && i.action.id === id ? update(i) : i)));

  const handleEvent = (event: AgentEvent) => {
    switch (event.type) {
      case "text":
        setItems((prev) => {
          const last = prev[prev.length - 1];
          return last?.kind === "assistant"
            ? [...prev.slice(0, -1), { ...last, text: last.text + event.text }]
            : [...prev, { kind: "assistant", text: event.text }];
        });
        break;
      case "tool":
        setItems((prev) =>
          prev.some((i) => i.kind === "tool" && i.id === event.id)
            ? prev.map((i) => (i.kind === "tool" && i.id === event.id ? { ...i, status: event.status } : i))
            : [...prev, { kind: "tool", id: event.id, name: event.name, status: event.status }]
        );
        break;
      case "confirm":
        setItems((prev) => [...prev, { kind: "confirm", action: event.action }]);
        break;
      case "ui":
        if (event.eventId) setSelectedEventId(event.eventId);
        navigate(event.path);
        onDataChanged(); // remount even if we were already on that page
        break;
      case "changed":
        onDataChanged();
        break;
      case "error":
        setItems((prev) => [...prev, { kind: "error", text: event.message }]);
        break;
      case "done":
        break;
    }
  };

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const ext = (n: string) => n.slice(n.lastIndexOf(".")).toLowerCase();
    const allowed = ATTACH_ACCEPT.split(",");
    const problems: string[] = [];
    const ok = Array.from(picked).filter((f) => {
      if (!allowed.includes(ext(f.name))) problems.push(`${f.name}: unsupported type`);
      else if (f.size > MAX_ATTACHMENT_BYTES) problems.push(`${f.name}: larger than 5 MB`);
      else return true;
      return false;
    });
    setFiles((prev) => {
      const next = [...prev, ...ok];
      if (next.length > MAX_ATTACHMENTS) problems.push(`Only ${MAX_ATTACHMENTS} files per message`);
      return next.slice(0, MAX_ATTACHMENTS);
    });
    if (problems.length) setItems((prev) => [...prev, { kind: "error", text: problems.join("\n") }]);
    inputRef.current?.focus();
  };

  const send = async (text: string) => {
    const typed = text.trim();
    if ((!typed && files.length === 0) || busy) return;
    const sending = files;
    const message = typed || "Please review the attached file(s).";
    setInput("");
    setFiles([]);
    setItems((prev) => [
      ...prev,
      { kind: "user", text: [message, ...sending.map((f) => `📎 ${f.name}`)].join("\n") },
    ]);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const attachments = await Promise.all(sending.map(fileToAttachment));
      await streamChat(
        message,
        {
          path: location.pathname,
          eventId: EVENT_IN_PATH.exec(location.pathname)?.[1] || getSelectedEventId() || null,
          now: new Date().toString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        handleEvent,
        controller.signal,
        attachments
      );
    } catch (e) {
      const text = controller.signal.aborted ? "Stopped." : (e as Error).message;
      setItems((prev) => [...prev, { kind: "error", text }]);
    } finally {
      abortRef.current = null;
      setBusy(false);
      // A tool cut off mid-call should not spin forever.
      setItems((prev) =>
        prev.map((i) => (i.kind === "tool" && i.status === "running" ? { ...i, status: "error" } : i))
      );
    }
  };

  const resolveAction = async (id: string, confirm: boolean) => {
    updateAction(id, (i) => ({ ...i, busy: true }));
    try {
      const action = await (confirm ? confirmAction(id) : cancelAction(id));
      updateAction(id, () => ({ kind: "confirm", action }));
      if (action.status === "done") onDataChanged();
    } catch (e) {
      updateAction(id, (i) => ({
        kind: "confirm",
        action: { ...i.action, status: "failed", error: (e as Error).message },
      }));
    }
  };

  const newChat = async () => {
    abortRef.current?.abort();
    try {
      await resetConversation();
      setItems([]);
    } catch (e) {
      setItems((prev) => [...prev, { kind: "error", text: (e as Error).message }]);
    }
  };

  const last = items[items.length - 1];
  const thinking = busy && last?.kind !== "assistant";

  return (
    <>
    {open && <div onClick={onClose} aria-hidden="true" className="fixed inset-0 z-60 bg-[rgba(22,35,28,.28)]" />}
    <aside
      aria-label="AI assistant"
      inert={!open}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
      className={`fixed inset-y-0 right-0 z-[61] flex w-full max-w-[440px] flex-col border-l border-line bg-[#F9FBF8] shadow-[-30px_0_60px_-30px_rgba(20,45,30,.35)] transition-transform duration-200 motion-reduce:transition-none ${
        open ? "translate-x-0" : "translate-x-full"
      } ${dragging ? "ring-4 ring-inset ring-line" : ""}`}
    >
      <header className="flex h-[60px] items-center gap-3 border-b border-line px-[18px]">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[15px] font-medium text-ink"><span className="size-2 rounded-full bg-live" aria-hidden="true" />EventOps AI</p>
        </div>
        <button
          type="button"
          onClick={newChat}
          aria-label="Start a new chat"
          title="New chat"
          className="rounded-lg p-2 text-ink-3 hover:bg-sunken hover:text-ink-2"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="rounded-lg p-2 text-ink-3 hover:bg-sunken hover:text-ink-2"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {items.length === 0 && (
          <div className="space-y-2 pt-6">
            <p className="text-sm text-ink-3">
              I can look things up and make changes across events, schedules, staff, incidents, floor plans and vendors.
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="block w-fit cursor-pointer rounded-full bg-surface px-[11px] py-1.5 text-left text-[12.5px] text-ink-2 ring-1 ring-transparent hover:ring-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {items.map((item, i) => (
          <ItemView key={i} item={item} onResolve={resolveAction} />
        ))}
        {thinking && (
          <p className="flex items-center gap-1.5 pl-1 text-xs text-ink-3">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line px-[18px] pt-3.5 pb-[18px]"
      >
        {files.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Attached files">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex max-w-full items-center gap-1 rounded-lg border border-line bg-accent-soft py-1 pl-2 pr-1 text-xs text-accent"
              >
                <Paperclip className="h-3 w-3 shrink-0" />
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove ${f.name}`}
                  className="rounded p-0.5 hover:bg-accent-soft"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-end gap-2 rounded-[22px] border border-line-strong/60 bg-surface px-3 py-2 focus-within:border-ink">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACH_ACCEPT}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = ""; // allow picking the same file again
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || files.length >= MAX_ATTACHMENTS}
            aria-label="Attach files"
            title="Attach PDF, Word, Excel, CSV or text (or drop files here)"
            className="rounded-lg p-1.5 text-ink-3 hover:bg-sunken hover:text-ink-2 disabled:opacity-40"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            maxLength={4000}
            placeholder={
              files.length
                ? "What should I do with these files? e.g. Add these items to inventory"
                : "e.g. Add Sita to TechConf staff and give her the sound check"
            }
            aria-label="Message the assistant"
            className="field-sizing-content max-h-40 min-h-6 flex-1 resize-none bg-transparent py-0.5 text-sm text-ink outline-none focus-visible:outline-none placeholder:text-ink-3"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              aria-label="Stop"
              className="rounded-lg bg-ink p-2 text-white hover:bg-ink-2"
            >
              <Square className="h-3.5 w-3.5" fill="white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && files.length === 0}
              aria-label="Send"
              className="rounded-full bg-ink p-2 text-paper hover:bg-ink-hover disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-2.5 text-[11.5px] text-ink-3">Deletes and floor-plan saves wait for your confirmation.</p>
      </form>
    </aside>
    </>
  );
}
