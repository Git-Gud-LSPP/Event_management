require('dotenv').config();

const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');

const eventsRoutes = require('./event/event.routes');
const authRoutes = require('./auth/auth.route');
const scheduleRoutes = require('./schedule/schedule.routes');
const floorplanRoutes = require('./floorplan/floorplan.routes');
const vendorsRoutes = require('./vendor/vendor.routes');
const incidentRoutes = require('./incident/incident.routes');
const agentRoutes = require('./agent/agent.routes');
const inventoryRoutes = require('./inventory/inventory.routes');
const documentRoutes = require('./document/document.routes');
const procurementRoutes = require('./procurement/procurement.routes');
const budgetRoutes = require('./budget/budget.routes');
const lostFoundRoutes = require('./lostfound/lostfound.routes');
const integrations = require('./integration/integration');
const analytics = require('./analytics/analytics');
const { authenticate } = require('./auth/auth.middleware');
const billing = require('./billing/billing');

const app = express();

// CORS: in production set CORS_ORIGIN to your Vercel URL(s), comma-separated,
// e.g. "https://eventhq.vercel.app,https://eventhq-git-main-you.vercel.app".
// Unset = allow any origin (local dev). Auth is a Bearer token, not cookies,
// so no credentials mode is needed.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
// Optional: also allow this project's Vercel preview deployments (*.vercel.app
// URLs that start with the given prefix), e.g. CORS_VERCEL_PREVIEW_PREFIX=eventhq
const previewPrefix = (process.env.CORS_VERCEL_PREVIEW_PREFIX || '').trim();

app.set('trust proxy', 1); // Render terminates TLS in front of the app
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (previewPrefix && new RegExp(`^https://${previewPrefix}[a-z0-9-]*\\.vercel\\.app$`).test(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
  }),
);
// Chat messages can carry base64 file attachments (see agent/agent.documents.js);
// everything else keeps the small default limit. The global parser skips parsed bodies.
app.use('/api/agent/chat', express.json({ limit: '40mb' }));
// Document uploads: one base64 file of up to 5 MB.
app.use('/api/events/:eventId/documents', express.json({ limit: '8mb' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Event Management API is running');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running successfully',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/events/:eventId/schedule', scheduleRoutes);
// Add-on modules: off on the workspace's plan = 403, matching <Gate> in the frontend.
app.use('/api/events/:eventId/floorplan', authenticate, billing.requireModule('floor-plan'), floorplanRoutes);
app.use('/api/events/:eventId/incidents', authenticate, billing.requireModule('incidents'), incidentRoutes);
app.use('/api/events/:eventId/inventory', inventoryRoutes);
app.use('/api/events/:eventId/documents', documentRoutes);
app.use('/api/events/:eventId/vendors', procurementRoutes);
app.use('/api/events/:eventId/budget', authenticate, billing.requireModule('budget-planner'), budgetRoutes);
app.use('/api/events/:eventId/lost-found', authenticate, billing.requireModule('lost-and-found'), lostFoundRoutes);
app.use('/api/events/:eventId/analytics', authenticate, billing.requireModule('analytics'), analytics.router);
app.use('/api/vendors', authenticate, billing.requireModule('vendors'), vendorsRoutes);
app.use('/api/billing', billing.router);
// Slack, Zapier and the calendar feed. The feed route inside is public (token-based).
app.use('/api/integrations', integrations.router);
app.use('/api/agent', agentRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Shared error handler: bad input -> 400, everything else -> 500.
app.use((err, req, res, next) => {
  // body-parser errors (oversized or malformed JSON) carry their own 4xx status.
  if (err.type && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.type === 'entity.too.large' ? 'Request is too large' : err.message });
  }
  if (
    err.name === 'ValidationError' ||
    err.name === 'CastError' ||
    err instanceof mongoose.Error
  ) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;