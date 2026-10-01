# To-Do App — with a real backend

The front-end from before, now backed by a genuine Node.js + Express server instead of `localStorage`.

## What changed from the client-side version

| | Before (localStorage) | Now (real backend) |
|---|---|---|
| Where data lives | In the browser only | In a file on the server (`data/tasks.json`) |
| Who can access it | Only that one browser | Any client that calls the API |
| How the front-end talks to it | Direct `localStorage.setItem()` calls | HTTP requests (`fetch`) to a REST API |
| Survives clearing browser data? | No | Yes — data lives on the server, not the browser |

## Tech stack

- Node.js + Express (server, REST API)
- JSON file storage (`data/tasks.json`) — a lightweight stand-in for a real database, appropriate for a prototype/viva demo
- Same HTML5/CSS3 front-end as before, with `script.js` rewritten to use `fetch()` instead of `localStorage`

## REST API

| Method | Route | Does |
|---|---|---|
| GET | `/api/tasks` | Returns all tasks |
| POST | `/api/tasks` | Creates a task — body: `{ "text": "..." }` |
| PATCH | `/api/tasks/:id` | Updates a task's text and/or completed state |
| DELETE | `/api/tasks/:id` | Deletes a task |

## How to run

```bash
cd todo-app-backend
npm install
npm start
```

Then open **http://localhost:3000** in a browser. The server serves both the front-end and the API from the same place, so there's nothing else to configure.

## Files

```
todo-app-backend/
├── server.js          — Express server + REST API + file storage
├── package.json
├── data/
│   └── tasks.json      — auto-created/updated; the actual data store
└── public/
    ├── index.html
    ├── style.css
    └── script.js        — now calls the API via fetch() instead of localStorage
```

## For the viva

If asked "why is this a real backend and not just localStorage again":
- The data lives in a file on the **server's** disk, not the browser's storage — open the app in two different browsers and you'll see the same tasks in both, since they're both talking to the same server.
- All reads/writes go through HTTP endpoints (`GET`/`POST`/`PATCH`/`DELETE`), which is the standard REST pattern used by real production APIs.
- You can prove it's server-side by running `curl http://localhost:3000/api/tasks` in a terminal — it returns the same data the browser sees, without a browser involved at all.

## Known limitations (useful to be upfront about)

- Data storage is a JSON file, not a proper database — fine for a prototype, not for concurrent multi-user production use
- No authentication — anyone who can reach the server can read/write all tasks (pairing this with the auth-app-backend's login system would be the natural next step)
