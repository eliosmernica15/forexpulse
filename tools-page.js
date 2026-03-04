/**
 * Tools page: select a tool (no dropdown), then display it.
 * Uses auth.js for getCurrentUser. Real data via Frankfurter API.
 * Storage, alerts, demo balance, toast, escapeHtml from utils.js (ForexPulseUtils).
 */

var RATES_API = 'https://api.frankfurter.app';

if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
  window.location.href = 'auth.html';
}

// Use shared helpers from utils.js (loaded before this script on tools.html)
var getAlertsStorageKey = window.ForexPulseUtils && window.ForexPulseUtils.getAlertsStorageKey;
var getDemoBalanceKey = window.ForexPulseUtils && window.ForexPulseUtils.getDemoBalanceKey;
var getDemoBalance = window.ForexPulseUtils && window.ForexPulseUtils.getDemoBalance;
var setDemoBalance = window.ForexPulseUtils && window.ForexPulseUtils.setDemoBalance;
var getAlerts = window.ForexPulseUtils && window.ForexPulseUtils.getAlerts;
var saveAlerts = window.ForexPulseUtils && window.ForexPulseUtils.saveAlerts;
var showToast = window.ForexPulseUtils && window.ForexPulseUtils.showToast;
var escapeHtml = window.ForexPulseUtils && window.ForexPulseUtils.escapeHtml;

// --- Tool selection (no dropdown: select page vs display page) ---
var toolSelect = document.getElementById('tool-select');
var toolDisplay = document.getElementById('tool-display');
var toolBack = document.getElementById('tool-back');

function showSelect() {
  if (toolSelect) toolSelect.classList.remove('hidden');
  if (toolDisplay) toolDisplay.classList.add('hidden');
}

function showTool(toolId) {
  if (toolSelect) toolSelect.classList.add('hidden');
  if (toolDisplay) toolDisplay.classList.remove('hidden');
  document.querySelectorAll('.tool-view').forEach(function (v) { v.classList.remove('active'); });
  var view = document.getElementById('view-' + toolId);
  if (view) view.classList.add('active');
  if (toolId === 'alerts') renderAlertsList();
  if (typeof history !== 'undefined' && history.replaceState) history.replaceState(null, '', '#' + toolId);
}

document.querySelectorAll('.tool-select-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { showTool(btn.dataset.tool); });
});

if (toolBack) toolBack.addEventListener('click', function () {
  if (history.replaceState) history.replaceState(null, '', window.location.pathname);
  showSelect();
});

// Hash on load: e.g. tools.html#alerts
var hash = (window.location.hash || '').replace(/^#/, '');
if (hash === 'pip' || hash === 'position' || hash === 'converter' || hash === 'alerts') {
  showTool(hash);
}

// --- User in header ---
var userEl = document.getElementById('tools-user');
if (userEl && typeof getCurrentUser === 'function') {
  var u = getCurrentUser();
  if (u && u.email) userEl.textContent = u.email;
}

// --- Pip value (real rate for USD/JPY from API) ---
var pipUsdJpyRate = null;
function fetchPipRate() {
  fetch(RATES_API + '/latest?from=USD&to=JPY')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      pipUsdJpyRate = data.rates && data.rates.JPY != null ? data.rates.JPY : 150;
      updatePip();
    })
    .catch(function () { pipUsdJpyRate = 150; updatePip(); });
}

function updatePip() {
  var lots = parseFloat(document.getElementById('pip-lots') && document.getElementById('pip-lots').value) || 1;
  var pair = (document.getElementById('pip-pair') && document.getElementById('pip-pair').value) || 'EUR/USD';
  var pipValue = 10 * lots;
  if (pair === 'USD/JPY') {
    var rate = pipUsdJpyRate || 150;
    pipValue = (100000 * lots * 0.01) / rate;
  }
  var result = document.getElementById('pip-result');
  if (result) result.textContent = pipValue.toFixed(2);
}

var pipLotsEl = document.getElementById('pip-lots');
if (pipLotsEl) pipLotsEl.addEventListener('input', updatePip);
var pipPairEl = document.getElementById('pip-pair');
if (pipPairEl) pipPairEl.addEventListener('change', updatePip);
fetchPipRate();

// --- Position size ---
var posBalanceEl = document.getElementById('pos-balance');
if (posBalanceEl) posBalanceEl.value = getDemoBalance();

function updatePosition() {
  var balance = parseFloat(document.getElementById('pos-balance') && document.getElementById('pos-balance').value) || 10000;
  setDemoBalance(balance);
  var risk = parseFloat(document.getElementById('pos-risk') && document.getElementById('pos-risk').value) || 1;
  var sl = parseFloat(document.getElementById('pos-sl') && document.getElementById('pos-sl').value) || 20;
  var riskAmount = balance * (risk / 100);
  var pipValue = 10;
  var lots = sl > 0 ? riskAmount / (sl * pipValue) : 0;
  var result = document.getElementById('pos-result');
  if (result) result.textContent = Math.max(0, Math.min(10, lots)).toFixed(2);
}

var posBalanceInput = document.getElementById('pos-balance');
if (posBalanceInput) posBalanceInput.addEventListener('input', updatePosition);
var posRiskInput = document.getElementById('pos-risk');
if (posRiskInput) posRiskInput.addEventListener('input', updatePosition);
var posSlInput = document.getElementById('pos-sl');
if (posSlInput) posSlInput.addEventListener('input', updatePosition);
updatePosition();

// --- Converter (Frankfurter) ---
var converterTimeout = null;
function fetchConverterResult() {
  var amount = parseFloat(document.getElementById('conv-amount') && document.getElementById('conv-amount').value) || 0;
  var from = (document.getElementById('conv-from') && document.getElementById('conv-from').value) || 'USD';
  var to = (document.getElementById('conv-to') && document.getElementById('conv-to').value) || 'EUR';
  var resultEl = document.getElementById('conv-result');
  if (from === to) {
    if (resultEl) resultEl.textContent = (to === 'JPY' ? amount.toFixed(0) : amount.toFixed(2)) + ' ' + to;
    return;
  }
  if (resultEl) resultEl.textContent = '…';
  fetch(RATES_API + '/latest?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var rate = data.rates && data.rates[to];
      var result = rate != null ? amount * rate : 0;
      if (resultEl) resultEl.textContent = (to === 'JPY' ? result.toFixed(0) : result.toFixed(2)) + ' ' + to;
    })
    .catch(function () { if (resultEl) resultEl.textContent = '—'; });
}

function updateConverter() {
  clearTimeout(converterTimeout);
  converterTimeout = setTimeout(fetchConverterResult, 300);
}

var convAmountEl = document.getElementById('conv-amount');
if (convAmountEl) convAmountEl.addEventListener('input', updateConverter);
var convFromEl = document.getElementById('conv-from');
if (convFromEl) convFromEl.addEventListener('change', updateConverter);
var convToEl = document.getElementById('conv-to');
if (convToEl) convToEl.addEventListener('change', updateConverter);
fetchConverterResult();

// --- Alerts ---
function renderAlertsList() {
  var list = document.getElementById('alerts-list');
  var empty = document.getElementById('alerts-empty');
  var alerts = getAlerts();
  if (!list) return;
  list.innerHTML = '';
  if (empty) empty.classList.toggle('hidden', alerts.length > 0);
  alerts.forEach(function (a, i) {
    var li = document.createElement('li');
    li.className = 'fp-alert-item';
    li.innerHTML =
      '<span class="fp-alert-item-text">' + escapeHtml(a.pair) + ' <span class="fp-alert-item-condition">' + escapeHtml(a.condition) + '</span> ' + escapeHtml(String(a.price)) + '</span>' +
      '<button type="button" class="alert-delete fp-alert-delete" data-i="' + i + '">Delete</button>';
    list.appendChild(li);
  });
  list.querySelectorAll('.alert-delete').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.dataset.i, 10);
      var arr = getAlerts();
      arr.splice(idx, 1);
      saveAlerts(arr);
      renderAlertsList();
      showToast('Alert removed');
    });
  });
}

function openAlertModal() {
  var modal = document.getElementById('alert-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAlertModal() {
  var el = document.getElementById('alert-modal');
  if (el) el.classList.add('hidden');
}

var alertAddBtn = document.getElementById('alert-add-btn');
if (alertAddBtn) alertAddBtn.addEventListener('click', openAlertModal);
var alertCancel = document.getElementById('alert-cancel');
if (alertCancel) alertCancel.addEventListener('click', closeAlertModal);
var alertSave = document.getElementById('alert-save');
if (alertSave) alertSave.addEventListener('click', function () {
  var pair = (document.getElementById('alert-pair') && document.getElementById('alert-pair').value) || 'EUR/USD';
  var condition = (document.getElementById('alert-condition') && document.getElementById('alert-condition').value) || 'above';
  var price = parseFloat((document.getElementById('alert-price') && document.getElementById('alert-price').value) || '');
  if (!price || isNaN(price)) {
    showToast('Enter a valid price');
    return;
  }
  var alerts = getAlerts();
  alerts.push({ pair: pair, condition: condition, price: price, id: Date.now() });
  saveAlerts(alerts);
  closeAlertModal();
  var priceInput = document.getElementById('alert-price');
  if (priceInput) priceInput.value = '';
  renderAlertsList();
  showToast('Alert added');
});

var alertModal = document.getElementById('alert-modal');
if (alertModal) alertModal.addEventListener('click', function (e) {
  if (e.target.id === 'alert-modal') closeAlertModal();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeAlertModal();
});
