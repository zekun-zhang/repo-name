# Habit Garden

A habit tracking app with a React/TypeScript frontend and an Express backend.

## Getting started

### Prerequisites
- Node.js 18+

### Install dependencies

```bash
# Root (frontend)
npm install

# Backend
cd server && npm install
```

### Run in development

```bash
# From the repo root — starts both frontend and backend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4001

### Build for production

```bash
npm run build
```

---

## Project structure

```
/
├── src/                  # React/TypeScript frontend
│   ├── components/       # UI components
│   ├── hooks/            # Custom React hooks
│   ├── api.ts            # API client
│   ├── constants.ts      # Shared constants
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── server/               # Express API
│   ├── app.js            # Express app & routes
│   ├── index.js          # Server entry point
│   ├── data.json         # JSON data store
│   └── __tests__/        # Jest tests
└── .env.example          # Environment variable reference
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/habits` | Fetch all habits and logs |
| `POST` | `/api/habits` | Create a habit |
| `POST` | `/api/habits/:id/archive` | Archive a habit |
| `DELETE` | `/api/habits/:id` | Delete a habit and its logs |
| `POST` | `/api/logs/toggle` | Toggle a log entry for a date |

---

## Environment variables

Copy `.env.example` and adjust as needed:

```bash
cp .env.example .env
```

See `.env.example` for all available variables.

---

## Running tests

```bash
cd server && npm test
```
