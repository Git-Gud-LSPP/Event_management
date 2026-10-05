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
