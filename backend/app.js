require('dotenv').config();

const express = require('express');
const cors = require('cors');

const eventsRoutes = require('./event/event.routes');
const authRoutes = require('./auth/auth.route');
const scheduleRoutes = require('./schedule/schedule.routes');
const floorplanRoutes = require('./floorplan/floorplan.routes');

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

module.exports = app;