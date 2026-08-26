(() => {
  const rates = ['82.4%', '80.8%', '89.5%', '87.8%', '84.6%', '85.5%', '83.4%', '88.9%', '86.1%', '84.7%'];
  const allTables = () => [...document.querySelectorAll('table')];
  const trendTable = () => allTables().find(table => {
    const headers = [...(table.tHead?.rows[0]?.cells || [])].map(cell => cell.textContent.trim());
    return headers.includes('指标名称') && headers.includes('当前平均值') && headers.includes('件数达标率');
  });
  const trendTitle = () => [...document.querySelectorAll('h3')].find(el => el.textContent.includes('时效变化趋势'));
  const addControls = () => {
    const title = trendTitle();
    if (!title || title.parentElement.querySelector('[data-trend-controls]')) return;
    const controls = document.createElement('div');
    controls.dataset.trendControls = 'true';
    controls.className = 'flex items-center gap-2 flex-wrap text-xs';
    [['target', '目标值'], ['ticket', '票数达标率'], ['piece', '件数达标率']].forEach(([key, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.columnToggle = key;
      button.setAttribute('aria-pressed', 'true');
      button.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium transition-all';
      button.textContent = label;
      button.addEventListener('click', () => {
        const visible = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(visible));
        button.className = `px-3 py-1.5 rounded-lg font-medium transition-all ${visible ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`;
        allTables().forEach(table => table.querySelectorAll(`[data-trend-col="${key}"]`).forEach(cell => { cell.hidden = !visible; }));
      });
      controls.appendChild(button);
    });
    title.parentElement.appendChild(controls);
  };
  const enhanceTrend = () => {
    const table = trendTable();
    if (!table || table.dataset.ticketColumn) return;
    const headerCells = [...table.tHead.rows[0].cells];
    const currentIndex = headerCells.findIndex(cell => cell.textContent.trim() === '当前平均值');
    const pieceIndex = headerCells.findIndex(cell => cell.textContent.trim() === '件数达标率');
    if (currentIndex < 0 || pieceIndex < 0) return;
    const ticketHeader = document.createElement('th');
    ticketHeader.className = headerCells[currentIndex].className;
    ticketHeader.textContent = '票数达标率';
    ticketHeader.dataset.trendCol = 'ticket';
    headerCells[currentIndex].after(ticketHeader);
    [...table.tBodies[0].rows].forEach((row, index) => {
      if (!row.cells.length) return;
      const cell = document.createElement('td');
      cell.className = 'px-3 py-2 text-center font-semibold text-gray-900';
      cell.textContent = rates[index % rates.length];
      cell.dataset.trendCol = 'ticket';
      const anchor = row.cells[Math.min(currentIndex + 1, row.cells.length - 1)];
      anchor.before(cell);
      row.cells[pieceIndex + 1]?.setAttribute('data-trend-col', 'piece');
      row.cells[currentIndex]?.setAttribute('data-trend-col', 'target');
    });
    table.dataset.ticketColumn = 'true';
  };
  const mergeOverview = () => {
    const title = [...document.querySelectorAll('h3')].find(el => el.textContent.trim() === '各链路时效指标');
    const table = title && [...title.closest('div').parentElement.querySelectorAll('table')][0];
    if (!table || table.dataset.mergedMetrics) return;
    [...table.tBodies].forEach(tbody => [...tbody.rows].forEach(row => {
      const metricCell = row.cells[1];
      const metric = metricCell?.textContent || '';
      if (!metricCell) return;
      if (metric.includes('提货点提货全链路平均时效') || metric.includes('预定仓配送全链路平均时效')) metricCell.childNodes[0].textContent = '3.5.1 配送全链路平均时效（急件）';
      if (metric.includes('预定仓邮寄全链路平均时效')) row.remove();
      else if (metric.includes('邮寄全链路平均时效')) metricCell.childNodes[0].textContent = '3.4.1 邮寄全链路平均时效';
    }));
    table.dataset.mergedMetrics = 'true';
  };
  const run = () => { addControls(); enhanceTrend(); mergeOverview(); };
  run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  setInterval(run, 800);
})();
