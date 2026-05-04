# ClaudePractice

# Smart Study Planner

A full-stack web application that generates optimized study schedules based on your tasks, deadlines, difficulty, and daily availability. Instead of just storing tasks, it runs a real scheduling algorithm to distribute your study sessions intelligently across available days.

## Features

- **JWT Authentication** — register, login, and keep your data private
- **Task Management** — create, edit, and delete tasks with deadlines, estimated hours, difficulty (1–5), and priority (low/medium/high)
- **Scheduling Algorithm** — automatically distributes study sessions across days using an urgency score: `(priority weight × difficulty) / days until deadline`
- **Weekly Calendar View** — see all scheduled sessions at a glance, color-coded by priority
- **Session Tracking** — mark sessions complete/incomplete directly on the calendar
- **Progress Tracking** — per-task progress bars and a dashboard with overall completion stats
- **Adaptive Rescheduling** — regenerate the schedule at any time; completed sessions are preserved, remaining hours are redistributed

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL via Prisma ORM |
| Auth | JSON Web Tokens (JWT) |

## Project Structure

```
smart-study-planner/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # User, Task, StudySession models
│   ├── src/
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/            # JWT auth, error handling
│   │   ├── routes/                # Express routers
│   │   └── services/
│   │       └── scheduler.js       # Core scheduling algorithm
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── Dashboard.jsx      # Stats and upcoming sessions
        │   ├── TaskForm.jsx       # Create/edit modal
        │   ├── TaskList.jsx       # Task list with progress bars
        │   └── CalendarView.jsx   # Weekly calendar
        ├── contexts/
        │   └── AuthContext.jsx    # Global auth state
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── Home.jsx
        └── services/
            └── api.js             # All API calls
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Docker](https://www.docker.com/) (for PostgreSQL) **or** a PostgreSQL instance you already have

## Setup

### 1. Start the Database

If you have Docker, the easiest option is:

```bash
docker run -d \
  --name study-planner-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=smart_study_planner \
  -p 5432:5432 \
  postgres:16
```

> If you have PostgreSQL installed locally, just create a database named `smart_study_planner`.

### 2. Configure the Backend

```bash
cd smart-study-planner/backend
cp .env.example .env
```

Open `.env` and fill in your values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_study_planner"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
```

### 3. Install & Migrate

```bash
# Backend
cd smart-study-planner/backend
npm install
npx prisma migrate dev --name init   # creates all tables
npm run dev                           # starts on http://localhost:4000

# Frontend (new terminal)
cd smart-study-planner/frontend
npm install
npm run dev                           # starts on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Register
Create an account and set your **daily available hours** — the maximum number of hours the scheduler will book for you on any single day.

### Add Tasks
Click **+ Add Task** and fill in:
- **Title** — what you need to study
- **Deadline** — the due date
- **Estimated hours** — total time you expect the task to take
- **Priority** — low, medium, or high (affects scheduling order)
- **Difficulty** — 1 (easy) to 5 (very hard) (combined with priority to determine urgency)

### Generate a Schedule
Click **Generate Schedule**. The algorithm will:
1. Score every task by urgency: `(priority weight × difficulty) / days until deadline`
2. Sort tasks from most to least urgent
3. Fill your available days with 1–2 hour study sessions, never exceeding your daily hours cap
4. Save all sessions to the database

### Use the Calendar
Switch to the **Calendar** tab to see your week. Sessions are color-coded:
- 🔴 Red — high priority
- 🟡 Amber — medium priority
- 🟢 Green — low priority

Click any session to mark it complete. Click again to mark it incomplete.

### Track Progress
The **Dashboard** shows:
- Total tasks, sessions completed, hours scheduled today, and overall % progress
- A progress bar per task
- Your next upcoming sessions

### Reschedule
If you fall behind or add new tasks, click **Generate Schedule** again. The algorithm will keep your completed sessions and redistribute only the remaining hours.

## API Reference

All endpoints (except auth) require the header: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, daily_available_hours }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Get JWT token |

### Tasks
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/tasks` | — | List all tasks |
| POST | `/api/tasks` | `{ title, deadline, estimated_hours, difficulty, priority }` | Create task |
| PUT | `/api/tasks/:id` | Any task fields | Update task |
| DELETE | `/api/tasks/:id` | — | Delete task |

### Schedule
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/generate-schedule` | — | Run scheduler, save sessions |
| GET | `/api/schedule` | — | Get all sessions |
| PATCH | `/api/sessions/:id/complete` | `{ completed: true/false }` | Toggle session |

## Scheduling Algorithm

The core logic lives in [backend/src/services/scheduler.js](smart-study-planner/backend/src/services/scheduler.js).

**Urgency score** for each task:
```
urgency = (priority_weight × difficulty) / days_until_deadline

priority_weight: high = 3, medium = 2, low = 1
```

Tasks are sorted by urgency (highest first). The scheduler then walks from today to each task's deadline, filling day-slots with chunks of 1–2 hours, never exceeding the user's `daily_available_hours` cap. Already-completed session hours are subtracted before scheduling so finished work is never overwritten.

## Stopping and Restarting

```bash
# Stop the DB container
docker stop study-planner-db

# Start it again later
docker start study-planner-db
```

The backend and frontend dev servers can be stopped with `Ctrl+C` in their respective terminals and restarted with `npm run dev`.