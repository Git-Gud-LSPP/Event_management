require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectRedis } = require('./vendor/vendor.cache');

const app = express();
const PORT = process.env.PORT || 5000;
const eventsRoutes = require('./event/event.routes');
const vendorsRoutes = require('./vendor/vendor.routes');

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management', {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

connectRedis();

app.get('/', (req, res) => {
  res.send('Event Management API is running');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running successfully',
  });
});

app.use('/api/events', eventsRoutes);
app.use('/api/vendors', vendorsRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Shared error handler: bad input -> 400, everything else -> 500.
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError' || err.name === 'CastError' || err instanceof mongoose.Error) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
