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

const app = express();

app.use(cors());
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
app.use('/api/events/:eventId/floorplan', floorplanRoutes);
app.use('/api/events/:eventId/incidents', incidentRoutes);
app.use('/api/events/:eventId/inventory', inventoryRoutes);
app.use('/api/events/:eventId/documents', documentRoutes);
app.use('/api/events/:eventId/vendors', procurementRoutes);
app.use('/api/vendors', vendorsRoutes);
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