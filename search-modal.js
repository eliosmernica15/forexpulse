
(function () {
  var DEBOUNCE_MS = 300;
  var debounceTimer = null;
  var selectedIndex = 0;
  var currentResults = [];

  function createModal() {
    if (document.getElementById('search-modal-overlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'search-modal-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Search pairs');
    overlay.innerHTML =
      '<div id="search-modal" style="max-width: 28rem; width: 100%;">' +
      '  <div class="cmd-input">' +
      '    <input type="text" id="search-modal-input" placeholder="Search by pair or currency (e.g. EUR/USD, Euro, USD)" autocomplete="off">' +
      '  </div>' +
      '  <p class="search-modal-kbd" aria-hidden="true">Esc to close · Enter to open pair</p>' +
      '  <div class="search-list" id="search-modal-list"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById('search-modal-input');
    var listEl = document.getElementById('search-modal-list');

    function renderList(results) {
      currentResults = results || [];
      selectedIndex = 0;
      listEl.innerHTML = '';
      if (currentResults.length === 0) {
        listEl.innerHTML = '<div class="py-6 text-center text-sm" style="color: var(--fp-purple-100);">No pairs found</div>';
        return;
      }
      currentResults.forEach(function (p, i) {
        var pair = typeof p === 'string' ? p : (p && p.pair);
        if (!pair) return;
        var item = document.createElement('a');
        item.href = 'pair-detail.html?pair=' + encodeURIComponent(pair);
        item.className = 'search-item' + (i === 0 ? ' fp-selected' : '');
        item.setAttribute('data-index', i);
        item.innerHTML =
          '<span class="coin-info">' +
          '<span class="font-medium">' + pair + '</span>' +
          '</span>' +
          '<span class="coin-symbol">' + (p.name || pair) + '</span>';
        listEl.appendChild(item);
      });
    }

    function search() {
      if (!window.ForexPulsePairs || typeof window.ForexPulsePairs.search !== 'function') {
        listEl.innerHTML = '<div class="py-6 px-4 text-center text-sm" style="color: var(--fp-muted);">Search not available. <a href="pairs.html" style="color: var(--fp-accent); font-weight: 500;">Browse all pairs</a></div>';
        currentResults = [];
        return;
      }
      var q = (input && input.value) || '';
      var results = window.ForexPulsePairs.search(q);
      renderList(results);
    }

    function moveSelection(delta) {
      if (currentResults.length === 0) return;
      selectedIndex = (selectedIndex + delta + currentResults.length) % currentResults.length;
      var items = listEl.querySelectorAll('.search-item');
      items.forEach(function (el, i) {
        el.classList.toggle('fp-selected', i === selectedIndex);
      });
    }

    function acceptSelection() {
      if (currentResults.length === 0) return;
      var item = currentResults[selectedIndex];
      var pair = typeof item === 'string' ? item : (item && item.pair);
      if (pair) {
        close();
        window.location.href = 'pair-detail.html?pair=' + encodeURIComponent(pair);
      }
    }

    function close() {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.display = 'none';
      document.body.classList.remove('fp-search-modal-open');
      if (input) input.value = '';
      renderList([]);
      document.removeEventListener('keydown', onKeyDown);
    }

    function getFocusables() {
      var list = overlay.querySelectorAll('.search-item, #search-modal-input');
      return Array.prototype.filter.call(list, function (el) {
        return el.offsetParent !== null && !el.hasAttribute('disabled');
      });
    }

    function open() {
      overlay.setAttribute('aria-hidden', 'false');
      overlay.style.display = 'flex';
      document.body.classList.add('fp-search-modal-open');
      search();
      setTimeout(function () {
        if (input) input.focus();
      }, 150);
      document.addEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        close();
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === 'ArrowDown') {
        moveSelection(1);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp') {
        moveSelection(-1);
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter') {
        acceptSelection();
        e.preventDefault();
        return;
      }
      if (e.key === 'Tab') {
        var focusables = getFocusables();
        if (focusables.length === 0) return;
        var idx = focusables.indexOf(document.activeElement);
        if (e.shiftKey) {
          if (idx <= 0) {
            e.preventDefault();
            focusables[focusables.length - 1].focus();
          }
        } else {
          if (idx >= focusables.length - 1 || idx === -1) {
            e.preventDefault();
            focusables[0].focus();
          }
        }
      }
    }

    overlay.addEventListener('click', function (e) {
      var modalBox = document.getElementById('search-modal');
      if (modalBox && !modalBox.contains(e.target)) close();
    });
    if (input) {
      input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(search, DEBOUNCE_MS);
      });
    }

    window.ForexPulseSearchModal = {
      open: open,
      close: close,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createModal);
  } else {
    createModal();
  }
})();
