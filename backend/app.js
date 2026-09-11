require('dotenv').config();

const express = require('express');
const cors = require('cors');

const eventsRoutes = require('./event/event.routes');
const authRoutes = require('./auth/auth.route');
const timelineRoutes = require('./timeline/timeline.routes');

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
app.use('/api/events/:eventId/timeline', timelineRoutes);

module.exports = app;