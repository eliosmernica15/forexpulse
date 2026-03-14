

var showError = (window.ForexPulseUtils && window.ForexPulseUtils.showError) || function (id, message) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
};
var escapeHtml = (window.ForexPulseUtils && window.ForexPulseUtils.escapeHtml) || function (str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

var ADMIN_STORAGE_KEY = 'forex_admin_session';
const USERS_STORAGE_KEY = 'forex_dashboard_users';
const ACTIVITY_STORAGE_KEY = 'forex_admin_activity';
const ANNOUNCEMENTS_STORAGE_KEY = 'forex_admin_announcements';
const SITE_SETTINGS_KEY = 'forex_site_settings';
const MAINTENANCE_KEY = 'forex_maintenance_mode';
const ACTIVITY_MAX = 50;
const ADMIN_EMAIL = 'admin@forex.com';
const ADMIN_PASSWORD = 'admin123';

function getActivityLog() {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendActivity(message) {
  const log = getActivityLog();
  log.unshift({ message, timestamp: new Date().toISOString() });
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(log.slice(0, ACTIVITY_MAX)));
}

function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
}

function setAdminSession() {
  localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getAnnouncements() {
  try {
    var list = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) || '[]');
    var changed = false;
    list.forEach(function (a, i) {
      if (!a.id) {
        a.id = 'a' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 7);
        changed = true;
      }
    });
    if (changed) saveAnnouncements(list);
    return list;
  } catch {
    return [];
  }
}

function saveAnnouncements(announcements) {
  localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
}

function getSiteSettings() {
  try {
    var raw = localStorage.getItem(SITE_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { siteName: 'ForexPulse', timezone: 'UTC' };
  } catch {
    return { siteName: 'ForexPulse', timezone: 'UTC' };
  }
}

function saveSiteSettings(settings) {
  localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
}

function loadSiteSettingsIntoForm() {
  var s = getSiteSettings();
  var nameEl = document.getElementById('admin-site-name');
  var tzEl = document.getElementById('admin-timezone');
  if (nameEl) nameEl.value = s.siteName || 'ForexPulse';
  if (tzEl) tzEl.value = s.timezone || 'UTC';
}

function getMaintenanceMode() {
  return localStorage.getItem(MAINTENANCE_KEY) === 'true';
}

function setMaintenanceMode(on) {
  if (on) localStorage.setItem(MAINTENANCE_KEY, 'true');
  else localStorage.removeItem(MAINTENANCE_KEY);
}

function getRecentLogins(limit) {
  var log = getActivityLog();
  var prefix = 'User signed in: ';
  return log.filter(function (e) { return (e.message || '').indexOf(prefix) === 0; }).slice(0, limit || 10).map(function (e) {
    return { email: e.message.slice(prefix.length), timestamp: e.timestamp };
  });
}

function getSigninsToday() {
  var log = getActivityLog();
  var today = new Date().toISOString().slice(0, 10);
  var prefix = 'User signed in: ';
  return log.filter(function (e) {
    return (e.message || '').indexOf(prefix) === 0 && (e.timestamp || '').slice(0, 10) === today;
  }).length;
}

function getNewUsersToday() {
  var users = getUsers();
  var today = new Date().toISOString().slice(0, 10);
  return users.filter(function (u) { return (u.createdAt || '').slice(0, 10) === today; }).length;
}

function showAdminDashboard() {
  const login = document.getElementById('admin-login');
  const dash = document.getElementById('admin-dashboard');
  if (login) login.classList.add('hidden');
  if (dash) dash.classList.remove('hidden');
  appendActivity('Admin logged in');
  switchTab('overview');
  renderUsers();
  updateOverviewStat();
  loadSiteSettingsIntoForm();
}

function showAdminLogin() {
  const dash = document.getElementById('admin-dashboard');
  const login = document.getElementById('admin-login');
  if (dash) dash.classList.add('hidden');
  if (login) login.classList.remove('hidden');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.admin-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === 'panel-' + tabId);
  });
  if (tabId === 'users') renderUsers();
  if (tabId === 'activity') renderActivityLog();
  if (tabId === 'analytics') renderAnalytics();
  if (tabId === 'announcements') renderAnnouncements();
  if (tabId === 'settings') loadSiteSettingsIntoForm();
  if (tabId === 'system') loadMaintenanceToggle();
  updateOverviewStat();
}

function renderActivityLog() {
  const list = document.getElementById('activity-list');
  const empty = document.getElementById('activity-empty');
  if (!list) return;
  const log = getActivityLog();
  list.innerHTML = log.map((entry) => {
    const time = formatDate(entry.timestamp);
    return '<li class="flex items-center gap-3 py-3 text-sm"><span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span><span class="flex-1 text-gray-300">' + escapeHtml(entry.message) + '</span><span class="text-xs text-gray-500">' + time + '</span></li>';
  }).join('');
  if (empty) empty.classList.toggle('hidden', log.length > 0);
}

function updateOverviewStat() {
  var stat = document.getElementById('stat-users');
  if (stat) stat.textContent = getUsers().length;
  var signinsEl = document.getElementById('overview-signins-today');
  var newTodayEl = document.getElementById('overview-new-today');
  if (signinsEl) signinsEl.textContent = getSigninsToday();
  if (newTodayEl) newTodayEl.textContent = getNewUsersToday();
  renderOverviewRecentLogins();
}

function renderOverviewRecentLogins() {
  var list = document.getElementById('overview-recent-logins');
  var emptyEl = document.getElementById('overview-recent-logins-empty');
  if (!list) return;
  var logins = getRecentLogins(8);
  list.innerHTML = '';
  if (logins.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');
  logins.forEach(function (e) {
    var li = document.createElement('li');
    li.className = 'flex items-center justify-between gap-2 text-sm';
    li.innerHTML = '<span class="text-gray-300 truncate">' + escapeHtml(e.email) + '</span><span class="text-xs text-gray-500 flex-shrink-0">' + formatDate(e.timestamp) + '</span>';
    list.appendChild(li);
  });
}

function renderAnalytics() {
  var users = getUsers();
  var log = getActivityLog();
  var announcements = getAnnouncements();
  var now = new Date();
  var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  var newThisWeek = users.filter(function (u) {
    var d = u.createdAt ? new Date(u.createdAt) : null;
    return d && d >= weekAgo;
  }).length;

  var totalEl = document.getElementById('analytics-total-signups');
  var weekEl = document.getElementById('analytics-new-week');
  var activityEl = document.getElementById('analytics-activity-count');
  var announceEl = document.getElementById('analytics-announcements');
  if (totalEl) totalEl.textContent = users.length;
  if (weekEl) weekEl.textContent = newThisWeek;
  if (activityEl) activityEl.textContent = log.length;
  if (announceEl) announceEl.textContent = announcements.length;

  var tbody = document.getElementById('analytics-recent-tbody');
  var emptyEl = document.getElementById('analytics-recent-empty');
  if (!tbody) return;
  var recent = users.slice().sort(function (a, b) {
    var ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    var tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  }).slice(0, 10);
  tbody.innerHTML = '';
  recent.forEach(function (u) {
    var tr = document.createElement('tr');
    tr.className = 'border-b border-[#222228] hover:bg-white/[0.02] transition-colors';
    tr.innerHTML =
      '<td class="px-4 sm:px-6 py-3 text-white font-medium">' + escapeHtml(u.name || '—') + '</td>' +
      '<td class="px-4 sm:px-6 py-3 text-gray-400">' + escapeHtml(u.email || '') + '</td>' +
      '<td class="px-4 sm:px-6 py-3 text-gray-500 text-sm">' + formatDate(u.createdAt) + '</td>';
    tbody.appendChild(tr);
  });
  var wrap = document.getElementById('analytics-recent-wrap');
  if (emptyEl) emptyEl.classList.toggle('hidden', recent.length > 0);
  if (wrap) wrap.classList.toggle('hidden', recent.length === 0);
}

function renderAnnouncements() {
  var list = document.getElementById('announcements-list');
  var emptyEl = document.getElementById('announcements-empty');
  if (!list) return;
  var announcements = getAnnouncements();
  list.innerHTML = '';
  var now = new Date().toISOString().slice(0, 10);
  var active = announcements.filter(function (a) {
    return !a.until || a.until >= now;
  });
  if (active.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');
  active.forEach(function (a) {
    var id = a.id || 'legacy';
    var li = document.createElement('li');
    li.className = 'admin-announce-item flex flex-wrap items-start justify-between gap-3';
    li.innerHTML =
      '<div class="flex-1 min-w-0">' +
        '<p class="font-medium text-white">' + escapeHtml(a.title || 'Untitled') + '</p>' +
        (a.body ? '<p class="text-sm text-gray-400 mt-1">' + escapeHtml(a.body) + '</p>' : '') +
        (a.until ? '<p class="text-xs text-gray-500 mt-2">Show until ' + escapeHtml(a.until) + '</p>' : '') +
      '</div>' +
      '<button type="button" class="delete-announce px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0" data-id="' + escapeHtml(id) + '">Delete</button>';
    list.appendChild(li);
  });
  list.querySelectorAll('.delete-announce').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = this.dataset.id;
      var arr = getAnnouncements();
      var found = arr.find(function (a) { return (a.id || 'legacy') === id; });
      if (found) {
        appendActivity('Announcement removed: ' + (found.title || 'Untitled'));
        saveAnnouncements(arr.filter(function (a) { return (a.id || 'legacy') !== id; }));
        renderAnnouncements();
        var analyticsPanel = document.getElementById('panel-analytics');
        if (analyticsPanel && analyticsPanel.classList.contains('active')) renderAnalytics();
      }
    });
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function deleteUser(email) {
  if (!confirm('Remove user "' + email + '"?')) return;
  appendActivity('User "' + email + '" removed');
  const users = getUsers().filter((u) => u.email.toLowerCase() !== email.toLowerCase());
  saveUsers(users);
  renderUsers();
  updateOverviewStat();
}

function getFilteredUsers() {
  const users = getUsers();
  const q = (document.getElementById('users-search')?.value || '').trim().toLowerCase();
  if (!q) return users;
  return users.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
  );
}

function exportUsersCSV() {
  const users = getFilteredUsers();
  const headers = ['Name', 'Email', 'Joined'];
  const rows = users.map((u) => [
    (u.name || '—').replace(/"/g, '""'),
    (u.email || '').replace(/"/g, '""'),
    formatDate(u.createdAt),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => '"' + c + '"').join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'forex-dashboard-users-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function renderUsers() {
  const tbody = document.getElementById('users-tbody');
  const empty = document.getElementById('users-empty');
  if (!tbody) return;

  const users = getFilteredUsers();
  tbody.innerHTML = '';

  if (users.length === 0) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  users.forEach((user) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-[#222228] hover:bg-white/[0.02] transition-colors';
    tr.innerHTML =
      '<td class="px-4 sm:px-6 py-4 text-white font-medium">' +
      (user.name || '—') +
      '</td>' +
      '<td class="px-4 sm:px-6 py-4 text-gray-400">' +
      (user.email || '') +
      '</td>' +
      '<td class="px-4 sm:px-6 py-4 text-gray-500 text-sm">' +
      formatDate(user.createdAt) +
      '</td>' +
      '<td class="px-4 sm:px-6 py-4">' +
      '<button type="button" class="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/20 delete-user transition-colors" data-email="' +
      (user.email || '').replace(/"/g, '&quot;') +
      '">Remove</button>' +
      '</td>';
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.delete-user').forEach((btn) => {
    btn.addEventListener('click', function () {
      deleteUser(this.dataset.email);
    });
  });
}

function initAdmin() {
  const loginEl = document.getElementById('admin-login');
  const dashEl = document.getElementById('admin-dashboard');
  if (loginEl && dashEl) {
    if (isAdminLoggedIn()) {
      showAdminDashboard();
    } else {
      showAdminLogin();
    }
  }

  document.getElementById('admin-login-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('admin-email')?.value?.trim() || '';
    const password = document.getElementById('admin-password')?.value || '';
    showError('admin-login-error', '');

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setAdminSession();
      showAdminDashboard();
    } else {
      showError('admin-login-error', 'Invalid email or password.');
    }
  });

  document.getElementById('admin-logout')?.addEventListener('click', function () {
    clearAdminSession();
    showAdminLogin();
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });

  document.getElementById('users-refresh')?.addEventListener('click', function () {
    renderUsers();
    updateOverviewStat();
  });

  document.getElementById('users-search')?.addEventListener('input', function () {
    renderUsers();
  });

  document.getElementById('users-export')?.addEventListener('click', function () {
    exportUsersCSV();
  });

  function loadMaintenanceToggle() {
    var toggle = document.getElementById('admin-maintenance-toggle');
    var label = document.getElementById('admin-maintenance-label');
    if (toggle) toggle.checked = getMaintenanceMode();
    if (label) label.textContent = getMaintenanceMode() ? 'On' : 'Off';
  }
  loadMaintenanceToggle();

  document.getElementById('admin-maintenance-toggle')?.addEventListener('change', function () {
    var on = this.checked;
    setMaintenanceMode(on);
    var label = document.getElementById('admin-maintenance-label');
    if (label) label.textContent = on ? 'On' : 'Off';
    appendActivity(on ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
  });

  document.getElementById('admin-save-settings')?.addEventListener('click', function () {
    var nameEl = document.getElementById('admin-site-name');
    var tzEl = document.getElementById('admin-timezone');
    var siteName = (nameEl && nameEl.value || '').trim() || 'ForexPulse';
    var timezone = (tzEl && tzEl.value) || 'UTC';
    saveSiteSettings({ siteName: siteName, timezone: timezone });
    appendActivity('Site settings updated');
  });

  document.getElementById('reports-export-activity')?.addEventListener('click', function () {
    var log = getActivityLog();
    var headers = ['Message', 'Timestamp'];
    var rows = log.map(function (e) { return ['"' + (e.message || '').replace(/"/g, '""') + '"', '"' + (e.timestamp || '') + '"']; });
    var csv = headers.join(',') + '\n' + rows.map(function (r) { return r.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'forex-activity-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('reports-export-json')?.addEventListener('click', function () {
    var data = {
      exportedAt: new Date().toISOString(),
      users: getUsers(),
      announcements: getAnnouncements(),
      siteSettings: getSiteSettings(),
      activity: getActivityLog(),
      maintenanceMode: getMaintenanceMode()
    };
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'forex-admin-snapshot-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('reports-export-users')?.addEventListener('click', function () {
    exportUsersCSV();
  });

  document.getElementById('announcement-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    var title = (document.getElementById('announce-title')?.value || '').trim();
    var body = (document.getElementById('announce-body')?.value || '').trim();
    var until = (document.getElementById('announce-until')?.value || '').trim() || null;
    if (!title) return;
    var list = getAnnouncements();
    list.push({ id: 'a' + Date.now() + '-' + Math.random().toString(36).slice(2, 9), title: title, body: body || null, until: until, createdAt: new Date().toISOString() });
    saveAnnouncements(list);
    appendActivity('Announcement added: ' + title);
    renderAnnouncements();
    var panel = document.getElementById('panel-analytics');
    if (panel && panel.classList.contains('active')) renderAnalytics();
    document.getElementById('announce-title').value = '';
    document.getElementById('announce-body').value = '';
    document.getElementById('announce-until').value = '';
  });
}

window.showAdminDashboard = showAdminDashboard;
window.showAdminLogin = showAdminLogin;
window.isAdminLoggedIn = isAdminLoggedIn;
window.getSiteSettings = getSiteSettings;
window.getActiveAnnouncements = function () {
  try {
    var raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    var list = raw ? JSON.parse(raw) : [];
    var now = new Date().toISOString().slice(0, 10);
    return list.filter(function (a) { return !a.until || a.until >= now; });
  } catch {
    return [];
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}
