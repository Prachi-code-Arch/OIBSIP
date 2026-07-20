
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');
const pendingCounter = document.getElementById('pending-counter');
const completedCounter = document.getElementById('completed-counter');
const pendingEmpty = document.getElementById('pending-empty');
const completedEmpty = document.getElementById('completed-empty');
const taskTemplate = document.getElementById('task-template');

const STORAGE_KEY = 'todo-app-tasks';

const storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      // Corrupted or blocked storage shouldn't crash the app
      console.error('Failed to load tasks from storage:', err);
      return [];
    }
  },
  save(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to save tasks to storage:', err);
    }
  },
};


let tasks = storage.load();

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

function render() {
  pendingList.innerHTML = '';
  completedList.innerHTML = '';

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  pending.forEach((task) => pendingList.appendChild(buildTaskCard(task)));
  completed.forEach((task) => completedList.appendChild(buildTaskCard(task)));


  pendingCounter.textContent = `${pending.length} pending`;
  completedCounter.textContent = `${completed.length} completed`;

  pendingEmpty.classList.toggle('visible', pending.length === 0);
  completedEmpty.classList.toggle('visible', completed.length === 0);

  storage.save(tasks);
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

  textEl.textContent = task.text;
  editInput.value = task.text;

  const timeEl = node.querySelector('.task-time');
  if (task.completed && task.completedAt) {
    timeEl.textContent = `Completed ${formatTimestamp(task.completedAt)}`;
  } else {
    timeEl.textContent = `Added ${formatTimestamp(task.createdAt)}`;
  }

  checkBtn.addEventListener('click', () => toggleTask(task.id));

  editBtn.addEventListener('click', () => enterEditMode(node, editInput));

  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      commitEdit(task.id, editInput.value);
    } else if (e.key === 'Escape') {
      render(); 
    }
  });

  editInput.addEventListener('blur', () => {
    if (node.classList.contains('is-editing')) {
      commitEdit(task.id, editInput.value);
    }
  });

  return node;
}


function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return; 

  tasks.push({
    id: crypto.randomUUID(), 
    text: trimmed,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  });

  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
  }
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  render();
}

function enterEditMode(cardNode, editInput) {
  cardNode.classList.add('is-editing');
  editInput.focus();
  editInput.select();
}

function commitEdit(id, newText) {
  const trimmed = newText.trim();
  const task = tasks.find((t) => t.id === id);

  if (task) {

    task.text = trimmed || task.text;
  }

  render();
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault(); 
  addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
});

render();