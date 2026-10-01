/* ============================================
   LOGIN AUTH SYSTEM — Real backend (Node.js + Express)
   This replaces the earlier client-side-only version. The key
   differences that make this "real" authentication instead of
   a demo:
     1. Password hashing happens on the SERVER (bcrypt), so the
        browser never computes or even sees a password hash.
     2. User data lives in a server-side JSON file, not localStorage
        — the browser can't read it directly.
     3. "Being logged in" is tracked with an HTTP-only session
        cookie (via express-session), which client-side JavaScript
        cannot read or forge. Compare this to the old version,
        where anyone could fake login with one DevTools command.

   Still worth knowing: express-session's default MemoryStore
   (used here) resets if the server restarts, and isn't meant for
   a real production deployment with multiple users at scale —
   fine for a prototype/viva demo, not for a live product. A real
   deployment would use a persistent session store (e.g. Redis)
   and a proper database instead of a JSON file.
   ============================================ */

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret-before-deploying',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // JavaScript in the browser cannot read this cookie
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  })
);
app.use(express.static(path.join(__dirname, 'public')));

// ---- DATA HELPERS ----
function readUsers() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read users.json:', err);
    return [];
  }
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// ---- VALIDATION ----
function isPasswordValid(password) {
  return typeof password === 'string' && password.length >= 8 && /\d/.test(password);
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- ROUTES ----

// POST /api/register
app.post('/api/register', async (req, res) => {
  let { username, email, password } = req.body;
  username = (username || '').trim();
  email = (email || '').trim().toLowerCase();

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }
  if (!isEmailValid(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!isPasswordValid(password)) {
    return res.status(400).json({ error: 'Password needs 8+ characters and at least 1 number.' });
  }

  const users = readUsers();
  const duplicate = users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email === email
  );
  if (duplicate) {
    return res.status(409).json({ error: 'That username or email is already registered.' });
  }

  // bcrypt generates and stores its own salt inside the hash string,
  // so there's no separate salt field to manage here.
  const passwordHash = await bcrypt.hash(password, 10);

  users.push({ username, email, passwordHash });
  writeUsers(users);

  res.status(201).json({ ok: true });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  let { identifier, password } = req.body;
  identifier = (identifier || '').trim().toLowerCase();

  const genericError = 'Incorrect username/email or password.';

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }

  const users = readUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === identifier || u.email === identifier
  );

  // Same generic error whether the identifier or the password was
  // wrong -- and we still run bcrypt.compare() even on a "no such
  // user" path in a real system to avoid timing differences leaking
  // which case occurred. For this prototype's purposes, returning
  // early is fine, but it's worth knowing that's the trade-off.
  if (!user) {
    return res.status(401).json({ error: genericError });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: genericError });
  }

  req.session.username = user.username; // this is what "logs the user in"
  res.json({ ok: true, username: user.username });
});

// GET /api/session — lets the front-end ask "am I logged in?"
app.get('/api/session', (req, res) => {
  if (req.session.username) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/dashboard — a protected route used only to prove the
// server itself blocks unauthenticated access, not just the UI.
// (The front-end routes around this with /api/session, but a real
// app would protect every sensitive API route this way too.)
app.get('/api/dashboard', (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  res.json({ message: `Welcome, ${req.session.username}.` });
});

app.listen(PORT, () => {
  console.log(`Auth backend running at http://localhost:${PORT}`);
});
