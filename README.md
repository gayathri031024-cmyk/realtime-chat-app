# Real-Time Chat App

A full-stack chat application: **React** (web) frontend, **Node.js/Express** backend,
real-time messaging over **Socket.io**, and message persistence in **SQLite**.

```
chat-app/
├── backend/     Express + Socket.io + SQLite API server
└── frontend/    React (Vite) chat UI
```

## 1. Running it locally

### Prerequisites
- Node.js 18+
- npm

### Backend

```bash
cd backend
cp .env.example .env      # defaults are fine for local dev
npm install
npm run dev                # or: npm start
```

The server starts on **http://localhost:4000**. It exposes:

| Method | Endpoint            | Description                          |
|--------|----------------------|---------------------------------------|
| GET    | `/api/health`         | Health check                          |
| POST   | `/api/auth/login`     | Dummy username-only login             |
| GET    | `/api/messages`       | Fetch chat history (`?limit=200`)     |
| POST   | `/api/messages`       | Send a message (REST fallback)        |

Socket.io runs on the same server/port and handles the real-time events
(`message:send`, `message:new`, `typing:start/stop`, `user:join`, `presence:update`).

A SQLite file is created automatically at `backend/data/chat.db` on first run —
no separate database setup required.

### Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env      # points VITE_API_URL at the backend
npm install
npm run dev
```

Open **http://localhost:5173**, enter a username, and start chatting.
Open it in two browser tabs/windows to see real-time delivery, typing
indicators, and online presence working between "users".

## 2. Design decisions

- **Socket.io for real-time, REST for everything else.** Sending a message
  and receiving new messages happen over a Socket.io event (`message:send` /
  `message:new`), because it gives low-latency, bidirectional delivery with
  automatic reconnection and room support if the app grows. Fetching chat
  history on load is a plain REST `GET`, since that's a simple one-shot
  request that doesn't need a persistent connection. A REST `POST
  /api/messages` fallback also exists and broadcasts through the same
  Socket.io server, so the API is usable even from a client that isn't
  running the socket client (e.g. a script or Postman).
- **SQLite via `better-sqlite3`.** Zero external services to stand up,
  synchronous API (simpler code, no callback/promise plumbing for a small
  app), and the data survives server restarts, unlike a pure in-memory
  array. Swapping to MongoDB/Postgres later just means replacing `src/db.js`.
- **Single source of truth for broadcast.** Both the Socket.io handler and
  the REST POST route write to the same `saveMessage()` function and then
  `io.emit()` to all clients, so a message sent via either path is
  persisted once and shown to everyone consistently, with `id`-based
  de-duping on the client to avoid double-render race conditions.
- **Dummy auth.** Per the assignment, login is username-only — no
  passwords, no server-side session/token. The username is kept in
  `localStorage` on the client and passed with every socket event/REST
  call to identify the sender. This is intentionally not real
  authentication (see Assumptions).
- **Presence & typing are in-memory on the server** (`Map<socketId,
  username>`), not persisted — they're inherently ephemeral/live state,
  so keeping them in a DB would add complexity with no benefit.
- **React frontend, not React Native** (see below).

## 3. Assumptions

- **Single chat room.** All users share one global conversation; there's
  no concept of separate rooms/DMs. This matches the assignment's scope.
- **Web frontend chosen over React Native.** React Native was preferred
  by the brief but requires a native build toolchain (Android
  SDK/Xcode) and a physical/emulated device to produce an APK, which
  isn't available in this build environment. I built the frontend in
  React (web, via Vite) instead, which the brief explicitly allows.
  The component structure (`Login`, `ChatWindow`, `MessageList`,
  `MessageInput`) maps directly onto React Native components
  (`View`/`FlatList`/`TextInput`) if this needs to be ported later —
  the `api.js` and `socket.js` modules are UI-framework agnostic and
  could be reused as-is.
- **No APK / screen recording included in this submission** for the
  same reason — I don't have a way to build or run a mobile app or
  record a screen in this environment. Instructions above let you run
  and verify the whole app locally in two commands per service.
- **Message history limit.** The history endpoint returns the most
  recent 200 messages by default (configurable via `?limit=`) rather
  than the entire table, to keep initial load fast as the table grows.
- **Usernames are not unique/enforced.** Since there's no real auth,
  nothing stops two people from picking the same username — presence
  is tracked by socket connection, not by a unique account.

## 4. Bonus features implemented

- ✅ Dummy username-based login (`POST /api/auth/login`, stored in `localStorage`)
- ✅ Typing indicator (`typing:start` / `typing:stop` → `typing:update`)
- ✅ Online/offline user status (presence tracked per socket, broadcast on connect/disconnect)
- ✅ Message timestamps (stored server-side, rendered client-side)
- ✅ Persistence via SQLite (`better-sqlite3`, file at `backend/data/chat.db`)
- ⬜ Deployment — not deployed as part of this submission; see below for how to do it.

## 5. Deploying (Render/Railway example)

**Backend (Render):**
1. Push this repo to GitHub.
2. New Web Service → point at `backend/`.
3. Build command: `npm install`. Start command: `npm start`.
4. Set env var `CLIENT_ORIGIN` to your deployed frontend's URL (for CORS).
5. Render gives you a persistent disk if you need `data/chat.db` to survive
   redeploys — attach one mounted at `backend/data`, or swap to a managed
   Postgres/Mongo instance for production.

**Frontend (Vercel/Render Static Site):**
1. New Static Site → point at `frontend/`.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Set env var `VITE_API_URL` to your deployed backend's URL.

## 6. Error handling notes

- All REST routes validate input and return `{ success, error }` JSON with
  appropriate status codes (400 for bad input, 500 for server errors) rather
  than throwing raw stack traces.
- A global Express error-handling middleware catches anything unhandled.
- Socket.io message sends use an acknowledgement callback so the client
  knows immediately if a send failed, instead of silently dropping it.
- The frontend shows a banner if the initial history fetch fails, and a
  "Reconnecting..." status if the socket connection drops.
