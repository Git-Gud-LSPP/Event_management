const { AgentConversation, AgentAction } = require('./agent.model');
const { runAgent, makeCall, isErrorResult } = require('./agent.service');
const { extractAttachments, hideAttachments, AttachmentError } = require('./agent.documents');

const MAX_MESSAGE_CHARS = 4000;
const OBJECT_ID = /^[a-f\d]{24}$/i;
const CONTEXT_RE = /^<context>[\s\S]*?<\/context>\s*/;

// ponytail: in-memory, so it only holds within one Node process. One run per user stops
// double-sends and cheap abuse; move to a Mongo/Redis lock if the backend is scaled out.
const activeRuns = new Set();

// Loop back to whatever port this server is actually listening on (also works under
// supertest). Never derived from the Host header, which the client controls.
const baseUrlFor = (req) => `http://127.0.0.1:${req.socket.localPort}/api`;
const tokenOf = (req) => req.headers.authorization.split(' ')[1];

const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

const actionView = (a) => {
  let error = null;
  if (a.status === 'failed') {
    try {
      error = JSON.parse(a.result).error;
    } catch {
      error = a.result;
    }
  }
  return { id: a._id, summary: a.summary, status: a.status, error };
};

// Volatile, per-message facts go in the user turn (not the system prompt), so the
// system prompt and tool list stay byte-identical across turns.
function buildContext(req, resolved) {
  const ctx = req.body.context || {};
  const eventId = OBJECT_ID.test(ctx.eventId) ? ctx.eventId : null;
  const lines = [
    `Now: ${clip(ctx.now, 40) || new Date().toISOString()}${ctx.timezone ? ` (${clip(ctx.timezone, 60)})` : ''}`,
    `User: id ${req.user.userId}, ${req.user.email}, role ${req.user.role}`,
    `Current page: ${clip(ctx.path, 200) || 'unknown'}`,
    `Selected event id: ${eventId || 'none'}`,
  ];
  if (resolved.length) {
    lines.push('Queued actions resolved since your last reply:');
    for (const a of resolved) {
      lines.push(`- ${a.summary}: ${a.status}${a.status === 'failed' ? ` (${actionView(a).error})` : ''}`);
    }
  }
  return `<context>\n${lines.join('\n')}\n</context>\n\n`;
}

const textOf = (content) =>
  typeof content === 'string'
    ? content
    : (content || []).filter((p) => p.type === 'text').map((p) => p.text).join('');

// Saved ModelMessages -> chat bubbles. Tool traffic is hidden; consecutive assistant
// steps of one turn merge into one bubble.
function toDisplay(messages) {
  const out = [];
  for (const m of messages) {
    if (m.role === 'user') {
      out.push({ role: 'user', text: hideAttachments(textOf(m.content).replace(CONTEXT_RE, '')) });
    } else if (m.role === 'assistant') {
      const text = textOf(m.content);
      if (!text.trim()) continue;
      const last = out[out.length - 1];
      if (last?.role === 'assistant') last.text += `\n\n${text}`;
      else out.push({ role: 'assistant', text });
    }
  }
  return out;
}

// POST /api/agent/chat  { message, context: { path, eventId, now, timezone }, attachments?: [{ name, data(base64) }] }
// Responds with a Server-Sent Events stream of:
//   {type:'text', text} | {type:'tool', id, name, status} | {type:'confirm', action}
//   {type:'ui', action:'navigate', path, eventId} | {type:'changed'} | {type:'error', message} | {type:'done'}
exports.chat = async (req, res) => {
  const userId = req.user.userId;
  const hasFiles = Array.isArray(req.body.attachments) && req.body.attachments.length > 0;
  const message =
    (typeof req.body.message === 'string' ? req.body.message.trim() : '') ||
    (hasFiles ? 'Please review the attached file(s).' : '');
  if (!message) return res.status(400).json({ message: 'message is required' });
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ message: `message must be at most ${MAX_MESSAGE_CHARS} characters` });
  }
  if (activeRuns.has(userId)) {
    return res.status(429).json({ message: 'The assistant is still working on your previous message' });
  }
  activeRuns.add(userId);

  // Parse files before the stream opens, so a bad file is a plain 400.
  let attachments;
  try {
    attachments = await extractAttachments(req.body.attachments);
  } catch (err) {
    activeRuns.delete(userId);
    if (err instanceof AttachmentError) return res.status(400).json({ message: err.message });
    console.error('Attachment extraction failed:', err);
    return res.status(500).json({ message: 'Could not read the attached files' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const emit = (event) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Stop spending tokens if the user closes the panel or the tab mid-run.
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) abort.abort();
  });

  let convo;
  let userContent;
  try {
    convo = await AgentConversation.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, messages: [] } },
      { upsert: true, new: true }
    );
    const resolved = await AgentAction.find({
      user: userId,
      reported: false,
      status: { $in: ['done', 'failed', 'cancelled'] },
    }).sort({ updatedAt: 1 });
    userContent = buildContext(req, resolved) + message + attachments.text;

    const queueConfirm = async ({ method, path, body, summary }) => {
      const action = await AgentAction.create({ user: userId, method, path, body: body ?? null, summary });
      emit({ type: 'confirm', action: actionView(action) });
      return JSON.stringify({
        queued: true,
        actionId: action._id,
        note: 'Nothing has happened yet. The user must click Confirm in the chat panel. Do not queue this again.',
      });
    };

    const { messages, wroteData } = await runAgent({
      baseUrl: baseUrlFor(req),
      token: tokenOf(req),
      history: convo.messages,
      userContent,
      emit,
      queueConfirm,
      abortSignal: abort.signal,
    });

    await AgentConversation.updateOne(
      { _id: convo._id },
      // JSON round trip drops undefined fields, which Mongo would otherwise save as null.
      { $push: { messages: { $each: JSON.parse(JSON.stringify([{ role: 'user', content: userContent }, ...messages])) } } }
    );
    if (resolved.length) {
      await AgentAction.updateMany({ _id: { $in: resolved.map((a) => a._id) } }, { reported: true });
    }
    if (wroteData) emit({ type: 'changed' });
    emit({ type: 'done' });
  } catch (err) {
    console.error('Agent run failed:', err);
    // Keep user/assistant turns alternating so the next request is still valid. Tool
    // side effects of the failed run are already in the DB; the model can re-read them.
    if (convo && userContent) {
      await AgentConversation.updateOne(
        { _id: convo._id },
        {
          $push: {
            messages: {
              $each: [
                { role: 'user', content: userContent },
                { role: 'assistant', content: '[This reply was interrupted before it finished.]' },
              ],
            },
          },
        }
      ).catch((e) => console.error('Could not save interrupted turn:', e));
    }
    emit({
      type: 'error',
      message: abort.signal.aborted ? 'Stopped.' : `The assistant failed: ${err?.message || 'unknown error'}`,
    });
  } finally {
    activeRuns.delete(userId);
    res.end();
  }
};

// GET /api/agent/conversation
exports.getConversation = async (req, res, next) => {
  try {
    const [convo, pending] = await Promise.all([
      AgentConversation.findOne({ user: req.user.userId }).lean(),
      AgentAction.find({ user: req.user.userId, status: 'pending' }).sort({ createdAt: 1 }),
    ]);
    res.json({ messages: toDisplay(convo?.messages || []), pendingActions: pending.map(actionView) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/agent/conversation - start over; open confirmation cards die with it.
exports.resetConversation = async (req, res, next) => {
  try {
    await Promise.all([
      AgentConversation.deleteOne({ user: req.user.userId }),
      AgentAction.updateMany(
        { user: req.user.userId, status: 'pending' },
        { status: 'cancelled', reported: true }
      ),
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// POST /api/agent/actions/:id/confirm - the only way a queued risky call ever runs.
exports.confirmAction = async (req, res, next) => {
  try {
    // Atomic pending -> running, so a double click cannot run it twice.
    const action = await AgentAction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId, status: 'pending' },
      { status: 'running' },
      { new: true }
    );
    if (!action) return res.status(404).json({ message: 'No pending action with that id' });

    // Runs with the confirming user's own token, so the route guards still apply.
    const out = await makeCall(baseUrlFor(req), tokenOf(req))(action.method, action.path, action.body ?? undefined);
    action.status = isErrorResult(out) ? 'failed' : 'done';
    action.result = out.slice(0, 2000);
    await action.save();
    res.json(actionView(action));
  } catch (err) {
    next(err);
  }
};

// POST /api/agent/actions/:id/cancel
exports.cancelAction = async (req, res, next) => {
  try {
    const action = await AgentAction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );
    if (!action) return res.status(404).json({ message: 'No pending action with that id' });
    res.json(actionView(action));
  } catch (err) {
    next(err);
  }
};
