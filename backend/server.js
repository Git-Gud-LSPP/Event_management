require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

// Routes, middleware, 404 and the error handler all live in app.js.
// This file only connects the database and opens the port.
const PORT = process.env.PORT || 5000;

mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event_management",
    {},
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
