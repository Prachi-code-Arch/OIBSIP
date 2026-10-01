/* ============================================
   TO-DO APP — front-end, now talking to a real backend
   Same UI and structure as before, but every action now calls
   the Express API (see server.js) instead of localStorage.
   The `tasks` array is now a CACHE of what the server has,
   refreshed after every change -- the server is the real
   source of truth.
   ============================================ */

// ---- 1. DOM REFERENCES ----
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');
const pendingCounter = document.getElementById('pending-counter');
const completedCounter = document.getElementById('completed-counter');
const pendingEmpty = document.getElementById('pending-empty');
const completedEmpty = document.getElementById('completed-empty');
const taskTemplate = document.getElementById('task-template');

const API_BASE = '/api/tasks';

// ---- 2. STATE ----
// Local cache of whatever the server last returned. Every action
// hits the API, then re-fetches and re-renders from the response.
let tasks = [];

function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---- 3. API LAYER ----
// All fetch() calls live here, isolated from rendering logic.
const api = {
  async getAll() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to load tasks');
    return res.json();
  },
  async create(text) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },
  async update(id, changes) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },
  async remove(id) {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Failed to delete task');
  },
};

// ---- 4. RENDER ----
async function loadAndRender() {
  try {
    tasks = await api.getAll();
    render();
  } catch (err) {
    console.error(err);
    pendingList.innerHTML = '';
    completedList.innerHTML = '';
    pendingEmpty.textContent = 'Could not reach the server. Is server.js running?';
    pendingEmpty.classList.add('visible');
  }
}

function render() {
  pendingList.innerHTML = '';
  completedList.innerHTML = '';

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  pending.forEach((task) => pendingList.appendChild(buildTaskCard(task)));
  completed.forEach((task) => completedList.appendChild(buildTaskCard(task)));

  pendingCounter.textContent = `${pending.length} pending`;
  completedCounter.textContent = `${completed.length} completed`;

  pendingEmpty.textContent = 'Nothing pending — add a task above.';
  pendingEmpty.classList.toggle('visible', pending.length === 0);
  completedEmpty.classList.toggle('visible', completed.length === 0);
}

function buildTaskCard(task) {
  const node = taskTemplate.content.firstElementChild.cloneNode(true);

  node.dataset.id = task.id;
  node.classList.toggle('is-complete', task.completed);

  const textEl = node.querySelector('.task-text');
  const editInput = node.querySelector('.task-edit-input');
  const checkBtn = node.querySelector('.task-check');
  const editBtn = node.querySelector('.task-edit-btn');
  const deleteBtn = node.querySelector('.task-delete-btn');
  const timeEl = node.querySelector('.task-time');

  textEl.textContent = task.text;
  editInput.value = task.text;

  if (task.completed && task.completedAt) {
    timeEl.textContent = `Completed ${formatTimestamp(task.completedAt)}`;
  } else {
    timeEl.textContent = `Added ${formatTimestamp(task.createdAt)}`;
  }

  checkBtn.addEventListener('click', () => toggleTask(task.id, !task.completed));
  editBtn.addEventListener('click', () => enterEditMode(node, editInput));
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit(task.id, editInput.value);
    else if (e.key === 'Escape') render();
  });

  editInput.addEventListener('blur', () => {
    if (node.classList.contains('is-editing')) commitEdit(task.id, editInput.value);
  });

  return node;
}

// ---- 5. ACTIONS ----
// Each action calls the API, then reloads from the server so the
// UI always reflects what's actually persisted.

async function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await api.create(trimmed);
  await loadAndRender();
}

async function toggleTask(id, completed) {
  await api.update(id, { completed });
  await loadAndRender();
}

async function deleteTask(id) {
  await api.remove(id);
  await loadAndRender();
}

function enterEditMode(cardNode, editInput) {
  cardNode.classList.add('is-editing');
  editInput.focus();
  editInput.select();
}

async function commitEdit(id, newText) {
  const trimmed = newText.trim();
  if (trimmed) {
    await api.update(id, { text: trimmed });
  }
  await loadAndRender();
}

// ---- 6. EVENT WIRING ----
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
});

// ---- 7. INITIAL LOAD ----
loadAndRender();
