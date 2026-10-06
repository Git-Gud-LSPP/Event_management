# EventHQ — Event Management

A full-stack (MERN + TypeScript) workspace for planning and running events. Organizers create events and plan them end to end — schedules, floor plans, vendors, staff and tasks — from one place. Built under the LSP program.

## Features

- **Auth** — JWT-based sign up / login with role-aware access (organizer, staff).
- **Events** — create, edit and manage events.
- **Schedule** — per-event timeline with a Gantt-style view.
- **Floor plan** — drag-and-drop venue layout editor (Konva).
- **Vendors** — vendor directory and search, with map view (Leaflet).
- **My Tasks** — draggable Kanban board for personal tasks.
- **Staff** — staff management and assignments.
- **Incidents** — log and track on-site incidents *(frontend, mock data for now)*.

## Tech stack

| Layer    | Stack |
|----------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Konva, Leaflet |
| Backend  | Node.js, Express, Mongoose, JWT, bcrypt |
| Database | MongoDB 7 |
| Testing  | Jest + Supertest (backend), Vitest (frontend) |

## Getting started

### With Docker (recommended)

```bash
make up        # start mongo, backend, frontend
make logs      # follow logs
make health    # check the API
make test      # run backend + frontend tests
make down      # stop  (make clean also wipes the DB volume)
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

### Without Docker

Requires Node 22+ and a running MongoDB.

```bash
# backend
cd backend
cp .env.example .env   # set MONGO_URI, JWT_SECRET
npm install
npm run dev

# frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Deployment (Vercel + Render + MongoDB Atlas)

The frontend is a static Vite build on **Vercel**, the API runs on **Render**, and the database is **MongoDB Atlas** (Render has no managed MongoDB).

### 1. Database: MongoDB Atlas
1. Create a free M0 cluster and a database user.
2. Network Access: allow `0.0.0.0/0` (Render's outbound IPs aren't fixed on the free plan).
3. Copy the connection string and add the database name, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/event_management?retryWrites=true&w=majority`

### 2. Backend: Render
Option A: **Blueprint**. In Render, go to *New → Blueprint* and pick this repo. `render.yaml` sets up the service.
Option B: **Manual web service**. Use root directory `backend`, build `npm ci`, start `npm start`, health check path `/api/health`.

Environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | long random string (the Blueprint generates one) |
| `JWT_EXPIRES_IN` | `1h` |
| `CORS_ORIGIN` | your Vercel URL, e.g. `https://eventhq.vercel.app` (comma-separate several, no trailing slash) |
| `CORS_VERCEL_PREVIEW_PREFIX` | *(optional)* e.g. `eventhq` to also allow `https://eventhq-*.vercel.app` preview deploys |
| `AGENT_MODEL` + provider key | e.g. `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` for the AI assistant |

Render sets `PORT` itself. Check `https://<your-service>.onrender.com/api/health` once it's deployed.
On the free plan the service sleeps after ~15 min idle, so the first request takes a little longer.

### 3. Frontend: Vercel
1. *Add New → Project*, import the repo, and set **Root Directory** to `frontend` (the framework is detected as Vite).
2. Environment variable: `VITE_API_BASE` = `https://<your-service>.onrender.com/api`
3. Deploy. `frontend/vercel.json` rewrites all routes to `index.html` so React Router deep links work on refresh.

`VITE_API_BASE` is baked in at build time, so **redeploy** the frontend after changing it.
After you have the Vercel URL, put it in `CORS_ORIGIN` on Render (Render redeploys automatically).

## Project structure

```
backend/
  auth/ event/ schedule/ floorplan/ vendor/   # feature modules (routes, models, controllers)
  app.js, server.js
  test/
frontend/
  src/features/   # auth, events, schedule, floorplan, vendors, mytask, staff, incidents
  src/services/   # API client
DESIGN.md         # visual design system ("Lattice")
```

## API routes

| Base path | Purpose |
|-----------|---------|
| `/api/auth` | Register, login |
| `/api/events` | Event CRUD |
| `/api/events/:eventId/schedule` | Event schedule |
| `/api/events/:eventId/floorplan` | Event floor plan |
| `/api/vendors` | Vendors |
| `/api/health` | Health check |

## Design

UI follows the **Lattice** style guide in [DESIGN.md](DESIGN.md) — warm parchment canvas, forest-ink text and pastel, color-coded module cards.
