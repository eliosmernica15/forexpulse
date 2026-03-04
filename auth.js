/**
 * Auth page logic — localStorage session. Replace with real API when you add a backend.
 */

const AUTH_STORAGE_KEY = 'forex_dashboard_user';
const ADMIN_ACTIVITY_KEY = 'forex_admin_activity';
const ADMIN_ACTIVITY_MAX = 50;

// Avoid duplicate declaration when admin.js loads first (auth.html). Use window and set only if missing.
if (typeof window !== 'undefined') {
  if (window.ADMIN_STORAGE_KEY === undefined) window.ADMIN_STORAGE_KEY = 'forex_admin_session';
  if (window.ADMIN_EMAIL === undefined) window.ADMIN_EMAIL = 'admin@forex.com';
  if (window.ADMIN_PASSWORD === undefined) window.ADMIN_PASSWORD = 'admin123';
}

/** Append a message to the admin activity log (same storage as admin dashboard). */
function appendAdminActivity(message) {
  try {
    const raw = localStorage.getItem(ADMIN_ACTIVITY_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift({ message, timestamp: new Date().toISOString() });
    localStorage.setItem(ADMIN_ACTIVITY_KEY, JSON.stringify(log.slice(0, ADMIN_ACTIVITY_MAX)));
  } catch (e) {}
}

/**
 * Get current user from storage (localStorage first, then sessionStorage). Returns null if not logged in.
 * Also returns a synthetic admin user when admin is signed in (forex_admin_session).
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const adminKey = typeof window !== 'undefined' ? window.ADMIN_STORAGE_KEY : 'forex_admin_session';
    if (adminKey && localStorage.getItem(adminKey) === 'true') {
      return { role: 'admin', email: 'admin@forex.com', name: 'Admin' };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated.
 */
function isAuthenticated() {
  return !!getCurrentUser();
}

/**
 * Save user session. If rememberMe is true, use localStorage (persists after close); else sessionStorage (logout when tab closes).
 * role: 'user' | 'admin' (default 'user').
 */
function setSession(user, rememberMe, role) {
  const payload = JSON.stringify({
    email: user.email,
    name: user.name || user.email,
    createdAt: user.createdAt || new Date().toISOString(),
    role: role || 'user',
  });
  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEY, payload);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEY, payload);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Clear session (logout) from both storages. Also clears admin session when signing out.
 */
function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  try {
    if (typeof window !== 'undefined' && window.ADMIN_STORAGE_KEY) {
      localStorage.removeItem(window.ADMIN_STORAGE_KEY);
    }
  } catch (e) {}
}

/**
 * Register — store user and set session. Replace with API call in production.
 */
function register(name, email, password) {
  const users = JSON.parse(localStorage.getItem('forex_dashboard_users') || '[]');
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'An account with this email already exists.' };
  }
  users.push({ name, email: email.toLowerCase(), password, createdAt: new Date().toISOString() });
  localStorage.setItem('forex_dashboard_users', JSON.stringify(users));
  setSession({ name, email: email.toLowerCase(), createdAt: new Date().toISOString() }, true, 'user');
  appendAdminActivity('New user registered: ' + email.toLowerCase());
  return { ok: true };
}

/**
 * Login — check credentials and set session. rememberMe: use localStorage so session persists after closing browser.
 * role: 'user' | 'admin' (default 'user').
 */
function login(email, password, rememberMe, role) {
  const users = JSON.parse(localStorage.getItem('forex_dashboard_users') || '[]');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  const effectiveRole = role || 'user';
  setSession({ name: user.name, email: user.email, createdAt: user.createdAt }, rememberMe !== false, effectiveRole);
  if (effectiveRole === 'user') appendAdminActivity('User signed in: ' + user.email);
  return { ok: true };
}

/**
 * Check if an account exists for the given email (for forgot password flow).
 * Returns { ok: true } if found, { ok: false, error } otherwise.
 */
function requestPasswordReset(email) {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'Please enter your email.' };
  const users = JSON.parse(localStorage.getItem('forex_dashboard_users') || '[]');
  const found = users.some((u) => u.email.toLowerCase() === trimmed);
  if (!found) return { ok: false, error: 'No account found with this email.' };
  return { ok: true };
}

/**
 * Set a new password for the user with the given email.
 * Returns { ok: true } on success, { ok: false, error } otherwise.
 */
function resetPassword(email, newPassword) {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'Email is required.' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  const users = JSON.parse(localStorage.getItem('forex_dashboard_users') || '[]');
  const idx = users.findIndex((u) => u.email.toLowerCase() === trimmed);
  if (idx === -1) return { ok: false, error: 'Account not found.' };
  users[idx].password = newPassword;
  localStorage.setItem('forex_dashboard_users', JSON.stringify(users));
  return { ok: true };
}

/**
 * Change password for the currently signed-in user.
 * currentPassword: existing password; newPassword: new password (min 6 chars).
 * Returns { ok: true } on success, { ok: false, error } otherwise.
 */
function changePassword(currentPassword, newPassword) {
  const user = getCurrentUser();
  if (!user || !user.email) return { ok: false, error: 'You must be signed in to change your password.' };
  if (!currentPassword) return { ok: false, error: 'Please enter your current password.' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
  const users = JSON.parse(localStorage.getItem('forex_dashboard_users') || '[]');
  const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx === -1) return { ok: false, error: 'Account not found.' };
  if (users[idx].password !== currentPassword) return { ok: false, error: 'Current password is incorrect.' };
  users[idx].password = newPassword;
  localStorage.setItem('forex_dashboard_users', JSON.stringify(users));
  return { ok: true };
}

/**
 * Update the current user's display name. Updates session and stored user list.
 * Returns true if updated, false if not logged in.
 */
function updateDisplayName(newName) {
  const user = getCurrentUser();
  if (!user || !user.email) return false;
  const name = (newName || '').trim();
  if (!name) return false;
  const inLocal = !!localStorage.getItem(AUTH_STORAGE_KEY);
  setSession(
    { email: user.email, name, createdAt: user.createdAt },
    inLocal,
    user.role || 'user'
  );
  const users = JSON.parse(localStorage.getItem('forex_dashboard_users') || '[]');
  const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx !== -1) {
    users[idx].name = name;
    localStorage.setItem('forex_dashboard_users', JSON.stringify(users));
  }
  return true;
}

/**
 * Redirect after login: admin -> admin.html, user -> home.html.
 * Sidebar will open by default on the next page (see fp-sidebar-open-after-login in app pages).
 */
function redirectToDashboard() {
  const user = getCurrentUser();
  const isAdmin = user && user.role === 'admin';
  if (!isAdmin) sessionStorage.setItem('fp-sidebar-open-after-login', '1');
  window.location.href = isAdmin ? 'admin.html' : 'home.html';
}

/**
 * Show error message in the given element. Uses ForexPulseUtils.showError when utils.js is loaded (e.g. auth.html).
 */
function showError(elementId, message) {
  if (window.ForexPulseUtils && window.ForexPulseUtils.showError) {
    window.ForexPulseUtils.showError(elementId, message);
    return;
  }
  var el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
}

function switchAuthTab(mode) {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  if (!loginForm || !registerForm) return;

  if (mode === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    if (tabLogin) { tabLogin.classList.add('bg-orange', 'text-white'); tabLogin.classList.remove('text-gray-500'); }
    if (tabRegister) { tabRegister.classList.remove('bg-orange', 'text-white'); tabRegister.classList.add('text-gray-500'); }
  } else {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    if (tabRegister) { tabRegister.classList.add('bg-orange', 'text-white'); tabRegister.classList.remove('text-gray-500'); }
    if (tabLogin) { tabLogin.classList.remove('bg-orange', 'text-white'); tabLogin.classList.add('text-gray-500'); }
  }
  showError('login-error', '');
  showError('register-error', '');
}

function bindAuthPage() {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (!formLogin || !formRegister) return;

  if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchAuthTab('register'));

  function setupPasswordToggle(inputId, toggleBtnId, showId, hideId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(toggleBtnId);
    const showIcon = document.getElementById(showId);
    const hideIcon = document.getElementById(hideId);
    if (!input || !btn) return;
    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      if (showIcon && hideIcon) {
        showIcon.classList.toggle('hidden', !isPassword);
        hideIcon.classList.toggle('hidden', isPassword);
      }
    });
  }
  setupPasswordToggle('login-password', 'login-password-toggle', 'login-password-show', 'login-password-hide');
  setupPasswordToggle('register-password', 'register-password-toggle', 'register-password-show', 'register-password-hide');

  function getPasswordStrength(password) {
    if (!password || password.length < 6) return { label: 'Too short (min 6)', color: 'text-red-500' };
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const length = password.length;
    if (length >= 10 && hasLetter && (hasNumber || hasSpecial)) return { label: 'Strong', color: 'text-green-600' };
    if (length >= 8 && hasLetter) return { label: 'Medium', color: 'text-orange-500' };
    return { label: 'Weak', color: 'text-amber-600' };
  }
  const regPasswordEl = document.getElementById('register-password');
  const strengthEl = document.getElementById('password-strength');
  if (regPasswordEl && strengthEl) {
    regPasswordEl.addEventListener('input', function () {
      const s = getPasswordStrength(this.value);
      strengthEl.textContent = 'Strength: ' + s.label;
      strengthEl.className = 'text-xs mt-1 ' + s.color;
      strengthEl.classList.toggle('hidden', !this.value);
    });
  }

  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showError('login-error', '');
    try {
      const emailEl = document.getElementById('login-email');
      const passwordEl = document.getElementById('login-password');
      const rememberEl = document.getElementById('login-remember');
      const roleEl = document.getElementById('login-role');
      const emailVal = (emailEl && emailEl.value ? emailEl.value.trim() : '') || '';
      const passwordVal = (passwordEl && passwordEl.value ? passwordEl.value : '') || '';
      const role = (roleEl && roleEl.value === 'admin') ? 'admin' : 'user';

      if (role === 'admin') {
        if (emailVal.toLowerCase() === window.ADMIN_EMAIL && passwordVal === window.ADMIN_PASSWORD) {
          localStorage.setItem(window.ADMIN_STORAGE_KEY, 'true');
          if (typeof window.showAdminDashboard === 'function') {
            window.showAdminDashboard();
          } else {
            var al = document.getElementById('admin-login');
            var ad = document.getElementById('admin-dashboard');
            if (al) al.classList.add('hidden');
            if (ad) ad.classList.remove('hidden');
          }
          return;
        }
        showError('login-error', 'Invalid email or password.');
        return;
      }

      const rememberMe = rememberEl ? (rememberEl.checked !== false) : true;
      const result = login(emailVal, passwordVal, rememberMe, role);
      if (result && result.ok) {
        redirectToDashboard();
      } else {
        showError('login-error', (result && result.error) ? result.error : 'Sign in failed.');
      }
    } catch (err) {
      showError('login-error', 'Something went wrong. Please try again.');
      if (typeof console !== 'undefined' && console.error) console.error(err);
    }
  });

  formRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showError('register-error', '');
    try {
      const nameEl = document.getElementById('register-name');
      const emailEl = document.getElementById('register-email');
      const passwordEl = document.getElementById('register-password');
      const name = (nameEl && nameEl.value ? nameEl.value.trim() : '') || '';
      const email = (emailEl && emailEl.value ? emailEl.value.trim() : '') || '';
      const password = (passwordEl && passwordEl.value ? passwordEl.value : '') || '';
      if (password.length < 6) {
        showError('register-error', 'Password must be at least 6 characters.');
        return;
      }
      const result = register(name, email, password);
      if (result && result.ok) {
        redirectToDashboard();
      } else {
        showError('register-error', (result && result.error) ? result.error : 'Registration failed.');
      }
    } catch (err) {
      showError('register-error', 'Something went wrong. Please try again.');
      if (typeof console !== 'undefined' && console.error) console.error(err);
    }
  });

  bindForgotPassword();
}

function bindForgotPassword() {
  const forgotLink = document.getElementById('forgot-password-link');
  const forgotPanel = document.getElementById('forgot-password-panel');
  const formLogin = document.getElementById('form-login');
  const backLink = document.getElementById('forgot-back-link');
  const step1 = document.getElementById('forgot-step1');
  const step2 = document.getElementById('forgot-step2');
  const forgotEmailInput = document.getElementById('forgot-email');
  const continueBtn = document.getElementById('forgot-continue-btn');
  const newPasswordInput = document.getElementById('forgot-new-password');
  const confirmPasswordInput = document.getElementById('forgot-confirm-password');
  const resetBtn = document.getElementById('forgot-reset-btn');
  const step1Error = document.getElementById('forgot-step1-error');
  const step2Error = document.getElementById('forgot-step2-error');

  if (!forgotPanel || !formLogin) return;

  let forgotEmail = '';

  function showForgotPanel() {
    formLogin.classList.add('hidden');
    forgotPanel.classList.remove('hidden');
    forgotEmail = '';
    if (step1) step1.classList.remove('hidden');
    if (step2) step2.classList.add('hidden');
    if (forgotEmailInput) forgotEmailInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    if (step1Error) { step1Error.textContent = ''; step1Error.classList.add('hidden'); }
    if (step2Error) { step2Error.textContent = ''; step2Error.classList.add('hidden'); }
  }

  function hideForgotPanel(message) {
    forgotPanel.classList.add('hidden');
    formLogin.classList.remove('hidden');
    if (message) showError('login-error', message);
  }

  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotPanel();
    });
  }

  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      hideForgotPanel('');
    });
  }

  if (continueBtn && forgotEmailInput && step1 && step2 && step1Error) {
    continueBtn.addEventListener('click', () => {
      const email = forgotEmailInput.value.trim().toLowerCase();
      step1Error.textContent = '';
      step1Error.classList.add('hidden');
      const result = requestPasswordReset(email);
      if (result.ok) {
        forgotEmail = email;
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
      } else {
        step1Error.textContent = result.error || 'Invalid email.';
        step1Error.classList.remove('hidden');
      }
    });
  }

  if (resetBtn && newPasswordInput && confirmPasswordInput && step2Error) {
    resetBtn.addEventListener('click', () => {
      const newPass = newPasswordInput.value;
      const confirmPass = confirmPasswordInput.value;
      step2Error.textContent = '';
      step2Error.classList.remove('hidden');
      if (newPass.length < 6) {
        step2Error.textContent = 'Password must be at least 6 characters.';
        return;
      }
      if (newPass !== confirmPass) {
        step2Error.textContent = 'Passwords do not match.';
        return;
      }
      const result = resetPassword(forgotEmail, newPass);
      if (result.ok) {
        step2Error.style.color = 'var(--fp-chart-up)';
        step2Error.textContent = 'Password updated. Sign in with your new password.';
        setTimeout(() => hideForgotPanel('Password reset. You can sign in with your new password.'), 1500);
      } else {
        step2Error.style.color = 'var(--fp-red-500)';
        step2Error.textContent = result.error || 'Reset failed.';
      }
    });
  }
}

// Expose for guards and other pages
if (typeof window !== 'undefined') {
  window.getCurrentUser = getCurrentUser;
  window.isAuthenticated = isAuthenticated;
  window.setSession = setSession;
  window.clearSession = clearSession;
}

// Run on auth page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAuthPage);
  } else {
    bindAuthPage();
  }
}
