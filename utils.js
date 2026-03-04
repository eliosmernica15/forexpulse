/**
 * ForexPulse — shared utilities (formatting, pagination)
 */

function formatCurrency(value, digits, currency, showSymbol) {
  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol !== false ? '$0.00' : '0.00';
  }
  if (showSymbol === undefined || showSymbol === true) {
    return value.toLocaleString(undefined, {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase(),
      minimumFractionDigits: digits ?? 2,
      maximumFractionDigits: digits ?? 2,
    });
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits ?? 2,
    maximumFractionDigits: digits ?? 2,
  });
}

function formatPercentage(change) {
  if (change === null || change === undefined || isNaN(change)) {
    return '0.0%';
  }
  return change.toFixed(1) + '%';
}

function timeAgo(date) {
  var now = new Date();
  var past = new Date(date);
  var diff = now.getTime() - past.getTime();
  var seconds = Math.floor(diff / 1000);
  var minutes = Math.floor(seconds / 60);
  var hours = Math.floor(minutes / 60);
  var days = Math.floor(hours / 24);
  var weeks = Math.floor(days / 7);
  if (seconds < 60) return 'just now';
  if (minutes < 60) return minutes + ' min';
  if (hours < 24) return hours + ' hour' + (hours > 1 ? 's' : '');
  if (days < 7) return days + ' day' + (days > 1 ? 's' : '');
  if (weeks < 4) return weeks + ' week' + (weeks > 1 ? 's' : '');
  return past.toISOString().split('T')[0];
}

var ELLIPSIS = 'ellipsis';

function buildPageNumbers(currentPage, totalPages) {
  var MAX_VISIBLE_PAGES = 5;
  var pages = [];
  if (totalPages <= MAX_VISIBLE_PAGES) {
    for (var i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  pages.push(1);
  var start = Math.max(2, currentPage - 1);
  var end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) {
    pages.push(ELLIPSIS);
  }
  for (var j = start; j <= end; j++) {
    pages.push(j);
  }
  if (end < totalPages - 1) {
    pages.push(ELLIPSIS);
  }
  pages.push(totalPages);
  return pages;
}

/**
 * Returns CSS class names for trend (up/down/neutral) — matches Next.js trending styling.
 * @param {number|null|undefined} change - Percentage change value
 * @returns {{ textClass: string, bgClass: string, badgeClass: string }}
 */
function trendingClasses(change) {
  if (change === null || change === undefined || isNaN(change)) {
    return { textClass: '', bgClass: '', badgeClass: '' };
  }
  if (Number(change) > 0) {
    return { textClass: 'fp-text-up', bgClass: '', badgeClass: 'fp-badge-up' };
  }
  if (Number(change) < 0) {
    return { textClass: 'fp-text-down', bgClass: '', badgeClass: 'fp-badge-down' };
  }
  return { textClass: '', bgClass: '', badgeClass: '' };
}

// --- Per-user storage and UI helpers (shared with tools page) ---
var ALERTS_KEY_PREFIX = 'forex_price_alerts_';
var DEMO_BALANCE_PREFIX = 'forex_demo_balance_';
var DEFAULT_DEMO_BALANCE = 10000;

function getUserStorageId() {
  var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  return user && user.email ? user.email.toLowerCase().replace(/[^a-z0-9@._+-]/g, '_') : 'anonymous';
}

function getAlertsStorageKey() {
  return ALERTS_KEY_PREFIX + getUserStorageId();
}

function getDemoBalanceKey() {
  return DEMO_BALANCE_PREFIX + getUserStorageId();
}

function getDemoBalance() {
  try {
    var raw = localStorage.getItem(getDemoBalanceKey());
    if (raw == null) return DEFAULT_DEMO_BALANCE;
    var n = parseFloat(raw);
    return isNaN(n) || n < 0 ? DEFAULT_DEMO_BALANCE : n;
  } catch (e) {
    return DEFAULT_DEMO_BALANCE;
  }
}

function setDemoBalance(value) {
  var n = Math.max(0, parseFloat(value));
  if (!isNaN(n)) localStorage.setItem(getDemoBalanceKey(), String(n));
}

function getAlerts() {
  try {
    return JSON.parse(localStorage.getItem(getAlertsStorageKey()) || '[]');
  } catch (e) {
    return [];
  }
}

function saveAlerts(alerts) {
  localStorage.setItem(getAlertsStorageKey(), JSON.stringify(alerts));
}

function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(function () { el.classList.add('hidden'); }, 3000);
}

function escapeHtml(s) {
  var div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function showError(id, message) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
}

// Export for use in other scripts (global or module)
if (typeof window !== 'undefined') {
  window.ForexPulseUtils = {
    formatCurrency: formatCurrency,
    formatPercentage: formatPercentage,
    timeAgo: timeAgo,
    buildPageNumbers: buildPageNumbers,
    trendingClasses: trendingClasses,
    ELLIPSIS: ELLIPSIS,
    getUserStorageId: getUserStorageId,
    getAlertsStorageKey: getAlertsStorageKey,
    getDemoBalanceKey: getDemoBalanceKey,
    getDemoBalance: getDemoBalance,
    setDemoBalance: setDemoBalance,
    getAlerts: getAlerts,
    saveAlerts: saveAlerts,
    showToast: showToast,
    escapeHtml: escapeHtml,
    showError: showError,
  };
}

/**
 * Mobile sidebar: inject hamburger button and overlay, toggle sidebar on small screens.
 * Run after DOM ready; only when .fp-app-layout and .fp-sidebar exist.
 * Sidebar is never auto-opened on load or when navigating.
 */
(function initMobileSidebar() {
  function run() {
    var layout = document.querySelector('.fp-app-layout');
    var sidebar = document.getElementById('fp-sidebar');
    var topbarLeft = document.querySelector('.fp-topbar-left');
    if (!layout || !sidebar || !topbarLeft) return;
    if (document.getElementById('fp-sidebar-mobile-toggle-btn')) return;

    layout.classList.remove('fp-sidebar-open');
    if (window.matchMedia('(max-width: 1023px)').matches) {
      layout.classList.add('fp-sidebar-navigating');
    } else {
      layout.classList.remove('fp-sidebar-navigating');
    }

    var overlay = document.createElement('div');
    overlay.className = 'fp-sidebar-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'button');
    overlay.tabIndex = -1;
    layout.insertBefore(overlay, sidebar.nextSibling);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fp-sidebar-mobile-toggle';
    btn.id = 'fp-sidebar-mobile-toggle-btn';
    btn.setAttribute('aria-label', 'Open menu');
    btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
    topbarLeft.insertBefore(btn, topbarLeft.firstChild);

    function open() {
      layout.classList.add('fp-sidebar-open');
      layout.classList.remove('fp-sidebar-navigating');
      overlay.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-label', 'Close menu');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      layout.classList.remove('fp-sidebar-open');
      overlay.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    }
    function toggle() {
      if (layout.classList.contains('fp-sidebar-open')) close(); else open();
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      layout.classList.remove('fp-sidebar-navigating');
      toggle();
    });
    overlay.addEventListener('click', function (e) {
      e.preventDefault();
      close();
    });
    overlay.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } });

    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href') || '';
        if (href && href !== '#' && !/^https?:\/\//i.test(href)) {
          try {
            sessionStorage.setItem('fp-sidebar-was-expanded', sidebar.classList.contains('fp-sidebar--collapsed') ? '0' : '1');
          } catch (err) {}
        }
        if (window.matchMedia('(max-width: 1023px)').matches) {
          layout.classList.add('fp-sidebar-navigating');
          layout.classList.remove('fp-sidebar-open');
          overlay.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }
      });
    });

    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        layout.classList.remove('fp-sidebar-open', 'fp-sidebar-navigating');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });

    window.addEventListener('pageshow', function (e) {
      if (window.matchMedia('(max-width: 1023px)').matches) {
        layout.classList.remove('fp-sidebar-open');
        layout.classList.add('fp-sidebar-navigating');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
