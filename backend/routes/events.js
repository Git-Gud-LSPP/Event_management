const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Events endpoint is ready',
    events: [],
  });
});

router.post('/', (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  res.status(201).json({
    message: 'Event created successfully',
    event: { title, description: description || '' },
  });
});

module.exports = router;
