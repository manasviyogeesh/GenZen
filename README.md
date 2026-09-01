# GenZen

GenZen is a campus platform that helps college students find teammates, discover events and clubs, get senior advice, and ask an AI assistant questions grounded in live campus data.

The frontend is a React + TypeScript + Vite single-page app; the backend is an Express + TypeScript API backed by Databricks Lakebase (Postgres) and Databricks Genie (natural-language querying).

## Features

- **Home** — personalized dashboard with campus signals and quick actions.
- **Connect** — swipe-style matching to find and connect with other students/teammates, plus a Team Builder for assembling a project team.
- **Campus Pulse** — a feed of campus activity/signals.
- **Events** — browse, filter (by date/category), and create campus events.
- **Clubs** — discover student clubs.
- **Senior POV** — ask questions and get advice/answers from senior students, with upvoting and saved questions.
- **GenZen AI** — a live chat assistant backed by Databricks Genie that answers natural-language questions over campus data (with markdown-formatted responses).
- **Auth & Profiles** — sign up/login, guided profile setup, and profile editing.

## Tech stack

**Frontend**
- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (animations)
- Lucide React (icons)

**Backend**
- Node.js + Express + TypeScript (run via `tsx` in dev, compiled with `tsc` for production)
- PostgreSQL via `pg`, targeting **Databricks Lakebase** (with OAuth-based credential exchange for production, or a local `PGPASSWORD` for development)
- **Databricks Genie API** (via `axios`) for the AI assistant
- Deployed as a **Databricks App** (`app.yaml`)

## Project structure

```
GenZen
├─ app.yaml                     # Databricks App deployment config
├─ index.html
├─ server.js                    # standalone JS server entry point
├─ src
│  ├─ App.tsx                   # top-level routing/state for all screens
│  ├─ components
│  │  ├─ modals/                # CreateEvent, EditProfile, TeamBuilder
│  │  ├─ screens/                # Home, Connect, CampusPulse, Events,
│  │  │                          # GenZenAI, SeniorPOV, Clubs, Login,
│  │  │                          # ProfileSetup(Success)
│  │  ├─ NavigationSidebar.tsx
│  │  └─ TopAppBar.tsx
│  ├─ services/                  # apiClient, auth, students, connections,
│  │                              # matching, events, seniorPov, storage
│  ├─ data.ts
│  └─ types.ts
├─ server
│  ├─ index.ts                   # Express app, middleware, route mounting
│  ├─ db.ts                      # Postgres pool + Lakebase OAuth credentials
│  ├─ databricks.ts
│  └─ routes/                    # auth, students, connections, events,
│                                 # seniorPov, genie (Genie AI proxy)
├─ tsconfig.json / tsconfig.server.json
└─ vite.config.ts
```

## Getting started

### Prerequisites
- Node.js 18+
- A Databricks workspace with:
  - A Lakebase (Postgres) instance, or your own Postgres for local dev
  - A Genie Space for the AI assistant

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `PORT` | Port for the Express API server (defaults to `4000`/`3001`) |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Postgres/Lakebase connection details (`PGPASSWORD` is for local dev only — production uses OAuth) |
| `PGSSLMODE` | SSL mode for the Postgres connection |
| `DATABRICKS_HOST` | Your Databricks workspace URL |
| `DATABRICKS_TOKEN` | A Databricks personal access token |
| `GENIE_SPACE_ID` | The Genie Space ID to query for the AI assistant |
| `GEMINI_API_KEY` | Used for Gemini API calls (AI Studio injects this automatically) |
| `APP_URL` | The URL this app is hosted at |

### Run in development

Runs the Vite dev server and the Express API concurrently:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000 (proxied under `/api`)

### Build & run for production

```bash
npm run build
npm start
```

## API overview

All routes are mounted under `/api`:

| Route | Purpose |
| --- | --- |
| `GET /api/health`, `/api/health/db` | Service and database health checks |
| `/api/auth` | Session/login |
| `/api/students` | Student profiles (CRUD, activity tracking) |
| `/api/connections` | Connection requests (send, accept, list) |
| `/api/events` | Campus events (list, filter by date/category, create) |
| `/api/senior-pov` | Senior POV questions, answers, votes, saves |
| `/api/genzen` | Genie AI proxy (`/ask`) for the GenZen AI chat assistant |

## Deployment

The app is deployed as a **Databricks App** using `app.yaml`, which starts the compiled server (`build-server/index.js`) and injects the Lakebase Postgres endpoint and Genie configuration as environment variables.

## Contributors

Built collaboratively as a campus platform project, including Lakebase/Postgres backend integration, the Databricks Genie-powered AI assistant, Senior POV, and Events features.
