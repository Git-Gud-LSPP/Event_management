require('dotenv').config();

const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');

const eventsRoutes = require('./event/event.routes');
const authRoutes = require('./auth/auth.route');
const scheduleRoutes = require('./schedule/schedule.routes');
const floorplanRoutes = require('./floorplan/floorplan.routes');
const vendorsRoutes = require('./vendor/vendor.routes');

const app = express();

app.use(cors());
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
app.use('/api/vendors', vendorsRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Shared error handler: bad input -> 400, everything else -> 500.
app.use((err, req, res, next) => {
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