/* ============================================
   TO-DO APP — Real backend (Node.js + Express)
   Replaces localStorage with a genuine server + persistent
   file-based data store, exposed as a REST API.

   Data lives in data/tasks.json on the SERVER, not the browser.
   Any client (this front-end, curl, Postman, another app) can
   read/write the same data through these HTTP endpoints — that's
   the actual difference between this and localStorage: the data
   now lives in one place, independent of any single browser.
   ============================================ */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

app.use(express.json()); // parses JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // serves index.html/style.css/script.js

// ---- DATA HELPERS ----
// Simple JSON-file "database". Good enough for a prototype/viva demo;
// a production app would use a real database (Postgres, MongoDB, etc.)
function readTasks() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read tasks.json:', err);
    return [];
  }
}

function writeTasks(tasks) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// ---- REST API ----

// GET /api/tasks — return every task
app.get('/api/tasks', (req, res) => {
  res.json(readTasks());
});

// POST /api/tasks — create a task from { text }
app.post('/api/tasks', (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'Task text is required.' });
  }

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2), // simple unique id
    text,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// PATCH /api/tasks/:id — update a task's text and/or completed state
app.patch('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find((t) => t.id === req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  if (typeof req.body.text === 'string') {
    const trimmed = req.body.text.trim();
    if (trimmed) task.text = trimmed; // ignore attempts to save an empty task
  }

  if (typeof req.body.completed === 'boolean') {
    task.completed = req.body.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
  }

  writeTasks(tasks);
  res.json(task);
});

// DELETE /api/tasks/:id — remove a task permanently
app.delete('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const filtered = tasks.filter((t) => t.id !== req.params.id);

  if (filtered.length === tasks.length) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  writeTasks(filtered);
  res.status(204).end(); // 204 = success, no content to return
});

app.listen(PORT, () => {
  console.log(`To-Do backend running at http://localhost:${PORT}`);
});
