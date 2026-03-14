
(function () {
  function renderCell(col, row, rowIndex) {
    var content = col.cell(row, rowIndex);
    if (typeof content === 'string') {
      var span = document.createElement('span');
      span.innerHTML = content;
      return span;
    }
    if (content && content.nodeType === 1) return content;
    var empty = document.createElement('span');
    empty.textContent = '—';
    return empty;
  }

  function createTable(options) {
    var columns = options.columns || [];
    var data = options.data || [];
    var rowKey = options.rowKey || function (row, i) { return i; };
    var tableClassName = options.tableClassName || 'fp-table';
    var headerCellClassName = options.headerCellClassName || '';
    var bodyCellClassName = options.bodyCellClassName || '';

    var table = document.createElement('table');
    table.className = tableClassName + ' custom-scrollbar';

    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    columns.forEach(function (col) {
      var th = document.createElement('th');
      th.className = headerCellClassName;
      th.textContent = typeof col.header === 'string' ? col.header : (col.header || '');
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    data.forEach(function (row, i) {
      var tr = document.createElement('tr');
      columns.forEach(function (col) {
        var td = document.createElement('td');
        if (col.cellClassName) td.className = col.cellClassName + ' ' + bodyCellClassName;
        else td.className = bodyCellClassName;
        var cellContent = renderCell(col, row, i);
        td.appendChild(cellContent);
        tr.appendChild(td);
      });
      tr.dataset.rowKey = String(rowKey(row, i));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }

  function renderInto(containerEl, options) {
    if (!containerEl) return null;
    var table = createTable(options);
    containerEl.innerHTML = '';
    containerEl.appendChild(table);
    return table;
  }

  if (typeof window !== 'undefined') {
    window.ForexPulseDataTable = {
      createTable: createTable,
      renderInto: renderInto,
    };
  }
})();
