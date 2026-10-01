# Login Authentication System — with a real backend

The front-end from before, now backed by a genuine Node.js + Express server with real password hashing and real sessions — not a client-side simulation.

## What changed from the client-side version

| | Before (client-side only) | Now (real backend) |
|---|---|---|
| Who hashes the password | The browser (`crypto.subtle`) | The server (`bcrypt`) |
| Where user data lives | `localStorage` — readable by anyone via DevTools | A server-side file, never sent to the browser |
| How "logged in" is tracked | A plain value in `localStorage` — fakeable with one console command | An **HTTP-only session cookie** — JavaScript in the browser cannot read or forge it |
| Can the dashboard be faked open? | Yes, trivially | No — the server itself checks the session before returning dashboard data |

This is the actual difference between a "demo" and a "working prototype": authentication decisions are now made by code the client doesn't control.

## Tech stack

- Node.js + Express (server, REST API)
- `bcryptjs` for password hashing (includes its own per-password salt automatically)
- `express-session` for session management via an HTTP-only cookie
- JSON file storage (`data/users.json`) — a lightweight stand-in for a real database, appropriate for a prototype/viva demo
- Same HTML5/CSS3 front-end as before, with `app.js` rewritten to call the API instead of hashing/storing anything itself

## REST API

| Method | Route | Does |
|---|---|---|
| POST | `/api/register` | Creates a user — body: `{ username, email, password }` |
| POST | `/api/login` | Logs in — body: `{ identifier, password }`, sets a session cookie on success |
| GET | `/api/session` | Returns whether the current request has a valid session |
| GET | `/api/dashboard` | Protected example route — returns 401 without a valid session |
| POST | `/api/logout` | Destroys the session |

## How to run

```bash
cd auth-app-backend
npm install
npm start
```

Then open **http://localhost:3001** in a browser. The server serves both the front-end and the API from the same place.

## Files

```
auth-app-backend/
├── server.js          — Express server, bcrypt hashing, sessions, REST API
├── package.json
├── data/
│   └── users.json      — auto-created/updated; username, email, password hash only (never the plain password)
└── public/
    ├── index.html
    ├── style.css
    └── app.js            — calls the API via fetch(); no hashing or storage logic lives here anymore
```

## For the viva

If asked "how is this actually secure now, unlike the first version":
- Open `data/users.json` and show that only a bcrypt hash is stored — never the plain password, and the hash is irreversible.
- Open DevTools → Application → Cookies and show the session cookie is marked `HttpOnly` — meaning `document.cookie` in the browser console cannot read it, unlike the old `localStorage` flag.
- Try visiting `/api/dashboard` directly without logging in (e.g. in an incognito window, or via `curl http://localhost:3001/api/dashboard`) — it returns a 401 error, proving the **server**, not just the UI, enforces the protection.

## Known limitations (useful to be upfront about)

- `express-session`'s default in-memory store resets if the server restarts — fine for a demo, not for production (a real deployment would use Redis or a database-backed store)
- User storage is a JSON file, not a proper database
- No email verification, password reset, or rate limiting on login attempts — all reasonable "future work" items to mention if asked what you'd add next
