/* ============================================
   APP.JS — DOM & UI wiring, now talking to a real backend
   All password hashing, validation, duplicate checks, and session
   tracking now happen in server.js. This file's only job is to
   call the API and update the screen based on the response --
   it never touches localStorage or computes a hash.
   ============================================ */

// ---- DOM REFERENCES ----
const viewRegister = document.getElementById('view-register');
const viewLogin = document.getElementById('view-login');
const viewDashboard = document.getElementById('view-dashboard');

const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const registerError = document.getElementById('register-error');
const loginError = document.getElementById('login-error');

const dashboardUsername = document.getElementById('dashboard-username');
const logoutBtn = document.getElementById('logout-btn');

const goToLoginBtn = document.getElementById('go-to-login');
const goToRegisterBtn = document.getElementById('go-to-register');

// ---- VIEW ROUTER ----
function showView(view) {
  viewRegister.hidden = view !== 'register';
  viewLogin.hidden = view !== 'login';
  viewDashboard.hidden = view !== 'dashboard';
}

function setError(el, message) {
  el.textContent = message;
  el.classList.toggle('visible', Boolean(message));
}

// ---- API LAYER ----
// `credentials: 'include'` is what tells the browser to send/receive
// the session cookie on each request -- without it, the server would
// never see that the user is logged in on follow-up requests.
const api = {
  async register(payload) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, data: await res.json() };
  },
  async login(payload) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, data: await res.json() };
  },
  async logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  },
  async session() {
    const res = await fetch('/api/session', { credentials: 'include' });
    return res.json();
  },
};

// ---- INITIAL ROUTE: ask the server if a session already exists ----
// This is what makes the dashboard genuinely "protected": the server,
// not just the UI, decides whether a valid session exists.
async function renderInitialView() {
  const session = await api.session();
  if (session.authenticated) {
    dashboardUsername.textContent = session.username;
    showView('dashboard');
  } else {
    showView('login');
  }
}

// ---- REGISTER FLOW ----
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setError(registerError, '');

  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  if (!username.trim() || !email.trim() || !password) {
    setError(registerError, 'Please fill in all fields.');
    return;
  }

  const { ok, data } = await api.register({ username, email, password });

  if (!ok) {
    setError(registerError, data.error);
    return;
  }

  registerForm.reset();
  showView('login');
  setError(loginError, '');
});

// ---- LOGIN FLOW ----
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setError(loginError, '');

  const identifier = document.getElementById('login-identifier').value;
  const password = document.getElementById('login-password').value;

  if (!identifier.trim() || !password) {
    setError(loginError, 'Please fill in all fields.');
    return;
  }

  const { ok, data } = await api.login({ identifier, password });

  if (!ok) {
    setError(loginError, data.error);
    return;
  }

  loginForm.reset();
  dashboardUsername.textContent = data.username;
  showView('dashboard');
});

// ---- LOGOUT ----
logoutBtn.addEventListener('click', async () => {
  await api.logout();
  showView('login');
});

// ---- VIEW SWITCH LINKS ----
goToLoginBtn.addEventListener('click', () => {
  setError(registerError, '');
  showView('login');
});

goToRegisterBtn.addEventListener('click', () => {
  setError(loginError, '');
  showView('register');
});

// ---- INITIAL LOAD ----
renderInitialView();
