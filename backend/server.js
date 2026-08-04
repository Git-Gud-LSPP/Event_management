require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const eventsRoutes = require('./routes/events');

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management', {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
