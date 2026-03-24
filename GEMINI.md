# Habit Tracker - Gemini Context

This project is a full-stack habit tracking application built with React, TypeScript, and Node.js. It features a responsive frontend and a lightweight Express backend that persists data in a local JSON file.

## Project Overview

- **Frontend:** React 19, TypeScript, Vite.
- **Backend:** Node.js, Express 5.
- **Database:** Simple JSON file (`server/data.json`) with an async mutex for concurrency control.
- **Architecture:** Client-Server. The React frontend communicates with the Express backend via a REST API.

### Main Components
- **Frontend (`src/`):**
  - `App.tsx`: Main application container.
  - `components/`: UI components like `HabitForm`, `HabitTable`, and `HabitRow`.
  - `hooks/useHabits.ts`: Custom hook for state management and API interaction.
  - `api.ts`: API client for backend communication.
- **Backend (`server/`):**
  - `index.js`: Server entry point.
  - `app.js`: Express application setup and route definitions.
  - `data.json`: Local data storage.
  - `__tests__/`: Integration tests using Jest and Supertest.

## Building and Running

### Prerequisites
- Node.js (Latest LTS recommended)
- npm

### Installation
```bash
# Install root dependencies (frontend & development tools)
npm install

# Install server dependencies
cd server && npm install
cd ..
```

### Development
```bash
# Run both frontend and backend concurrently
npm run dev:full

# Run frontend only (Vite)
npm run dev

# Run backend only (Node)
npm run server
```

### Production
```bash
# Build the frontend
npm run build

# Preview the build
npm run preview
```

### Testing
```bash
# Run backend tests
cd server
npm test
```

## Development Conventions

### Frontend
- **Framework:** React 19 (Functional Components & Hooks).
- **Styling:** CSS (App.css).
- **Type Safety:** TypeScript for all source files.
- **State Management:** Logic encapsulated in the `useHabits` custom hook.
- **ID Generation:** Managed by `src/utils.ts`.

### Backend
- **Framework:** Express 5 (CommonJS).
- **API Endpoints:**
  - `GET /api/habits`: Fetch all habits and logs.
  - `POST /api/habits`: Create a new habit.
  - `POST /api/logs/toggle`: Toggle a habit completion for a specific date.
  - `POST /api/habits/:id/archive`: Archive a habit.
  - `DELETE /api/habits/:id`: Delete a habit and its logs.
- **Concurrency:** Uses an async mutex (`withLock`) in `server/app.js` to prevent race conditions during file I/O.

### Code Style
- Follow existing ESLint rules (`eslint.config.js`).
- Use camelCase for variables/functions and PascalCase for React components.
- Ensure all API calls are handled gracefully with error states in the UI.
