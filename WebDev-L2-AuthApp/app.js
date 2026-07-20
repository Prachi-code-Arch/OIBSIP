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

function showView(view) {
  viewRegister.hidden = view !== 'register';
  viewLogin.hidden = view !== 'login';
  viewDashboard.hidden = view !== 'dashboard';
}

function renderInitialView() {
  if (isAuthenticated()) {
    dashboardUsername.textContent = getSession();
    showView('dashboard');
  } else {
    showView('login');
  }
}
function setError(el, message) {
  el.textContent = message;
  el.classList.toggle('visible', Boolean(message));
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setError(registerError, ''); // clear any previous error

  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  if (!username.trim() || !email.trim() || !password) {
    setError(registerError, 'Please fill in all fields.');
    return;
  }

  const result = await registerUser({ username, email, password });

  if (!result.ok) {
    setError(registerError, result.message);
    return;
  }

  registerForm.reset();
  showView('login');
  setError(loginError, '');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setError(loginError, '');

  const identifier = document.getElementById('login-identifier').value;
  const password = document.getElementById('login-password').value;

  if (!identifier.trim() || !password) {
    setError(loginError, 'Please fill in all fields.');
    return;
  }

  const result = await loginUser({ identifier, password });

  if (!result.ok) {
    setError(loginError, result.message);
    return;
  }

  loginForm.reset();
  dashboardUsername.textContent = result.username;
  showView('dashboard');
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  showView('login');
});

goToLoginBtn.addEventListener('click', () => {
  setError(registerError, '');
  showView('login');
});

goToRegisterBtn.addEventListener('click', () => {
  setError(loginError, '');
  showView('register');
});

renderInitialView();