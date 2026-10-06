require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

// Routes, middleware, 404 and the error handler all live in app.js.
// This file only connects the database and opens the port.
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

// Fail fast on a misconfigured deploy instead of running half-broken.
const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (isProd && missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set; login will fail. Set it in backend/.env.");
}

async function start() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event_management",
      { serverSelectionTimeoutMS: 10000 },
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // In production let the platform restart us; locally keep serving so /api/health works.
    if (isProd) process.exit(1);
  }

  // Bind to 0.0.0.0 so Render (and Docker) can route traffic in.
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Render sends SIGTERM on redeploy: finish in-flight requests, then exit.
  const shutdown = () => {
    server.close(() => {
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 10000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start();
