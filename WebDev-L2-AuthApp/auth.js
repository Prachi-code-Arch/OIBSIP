
const USERS_KEY = 'auth_users';
const SESSION_KEY = 'auth_session';

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read users from storage:', err);
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to storage:', err);
  }
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt() {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  return bufferToHex(saltBytes.buffer);
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

function isPasswordValid(password) {
  return password.length >= 8 && /\d/.test(password);
}

function isEmailValid(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function registerUser({ username, email, password }) {
  username = username.trim();
  email = email.trim().toLowerCase();

  if (!username || !email) {
    return { ok: false, message: 'Username and email are required.' };
  }
  if (!isEmailValid(email)) {
    return { ok: false, message: 'Enter a valid email address.' };
  }
  if (!isPasswordValid(password)) {
    return { ok: false, message: 'Password needs 8+ characters and at least 1 number.' };
  }

  const users = getUsers();

  const duplicate = users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email === email
  );
  if (duplicate) {
    return { ok: false, message: 'That username or email is already registered.' };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  users.push({ username, email, salt, passwordHash });
  saveUsers(users);

  return { ok: true };
}

async function loginUser({ identifier, password }) {
  identifier = identifier.trim().toLowerCase();
  const users = getUsers();

  const user = users.find(
    (u) => u.username.toLowerCase() === identifier || u.email === identifier
  );

  const genericError = 'Incorrect username/email or password.';

  if (!user) {
    return { ok: false, message: genericError };
  }

  const attemptedHash = await hashPassword(password, user.salt);
  if (attemptedHash !== user.passwordHash) {
    return { ok: false, message: genericError };
  }

  setSession(user.username);
  return { ok: true, username: user.username };
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}

function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isAuthenticated() {
  return getSession() !== null;
}