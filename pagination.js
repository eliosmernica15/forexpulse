(function () {
  function renderPagination(containerEl, options) {
    if (!containerEl || !window.ForexPulseUtils) return null;
    var currentPage = options.currentPage || 1;
    var totalPages = Math.max(1, options.totalPages || 1);
    var onPageChange = options.onPageChange || function () {};

    var utils = window.ForexPulseUtils;
    var pages = utils.buildPageNumbers(currentPage, totalPages);

    containerEl.innerHTML = '';
    var inner = document.createElement('div');
    inner.id = 'fp-pagination';
    inner.setAttribute('aria-label', 'Pagination');

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'control-button prev';
    prevBtn.textContent = '← Previous';
    prevBtn.setAttribute('aria-label', 'Previous page');
    prevBtn.disabled = currentPage <= 1;
    if (currentPage <= 1) prevBtn.classList.add('control-disabled');
    prevBtn.addEventListener('click', function () {
      if (currentPage > 1) onPageChange(currentPage - 1);
    });
    inner.appendChild(prevBtn);

    var pagesWrap = document.createElement('div');
    pagesWrap.className = 'pagination-pages';
    pages.forEach(function (p) {
      if (p === utils.ELLIPSIS) {
        var ell = document.createElement('span');
        ell.className = 'ellipsis';
        ell.textContent = '...';
        ell.style.padding = '0.25rem 0.5rem';
        pagesWrap.appendChild(ell);
      } else {
        var link = document.createElement('button');
        link.type = 'button';
        link.className = 'page-link' + (p === currentPage ? ' page-link-active' : '');
        link.textContent = p;
        if (p === currentPage) link.setAttribute('aria-current', 'page');
        link.setAttribute('aria-label', 'Page ' + p);
        link.addEventListener('click', function () {
          onPageChange(p);
        });
        pagesWrap.appendChild(link);
      }
    });
    inner.appendChild(pagesWrap);

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'control-button next';
    nextBtn.textContent = 'Next →';
    nextBtn.setAttribute('aria-label', 'Next page');
    nextBtn.disabled = currentPage >= totalPages;
    if (currentPage >= totalPages) nextBtn.classList.add('control-disabled');
    nextBtn.addEventListener('click', function () {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    });
    inner.appendChild(nextBtn);

    containerEl.appendChild(inner);
    return containerEl;
  }

  if (typeof window !== 'undefined') {
    window.ForexPulsePagination = {
      render: renderPagination,
    };
  }
})();
