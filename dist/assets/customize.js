(() => {
  const ticketRates = ['82.4%', '80.8%', '89.5%', '87.8%', '84.6%', '85.5%', '83.4%', '88.9%', '86.1%', '84.7%'];
  const getTables = () => Array.from(document.getElementsByTagName('table'));
  const enhanceTrend = () => {
    const table = getTables().find(t => {
      const text = t.querySelector('thead')?.textContent || '';
      return text.includes('指标名称') && text.includes('当前平均值') && text.includes('件数达标率');
    });
    if (!table || table.dataset.ticketRateReady === 'true') return;
    const headerRow = table.tHead?.rows?.[0];
    const body = table.tBodies?.[0];
    if (!headerRow || !body) return;
    const headers = Array.from(headerRow.cells);
    const currentIndex = headers.findIndex(cell => cell.textContent.trim() === '当前平均值');
    if (currentIndex < 0) return;
    const header = document.createElement('th');
    header.className = headers[currentIndex].className;
    header.textContent = '票数达标率';
    header.dataset.trendColumn = 'ticket';
    headers[currentIndex].after(header);
    const updatedHeaders = Array.from(headerRow.cells);
    const pieceIndex = updatedHeaders.findIndex(cell => cell.textContent.trim() === '件数达标率');
    if (pieceIndex >= 0) {
      updatedHeaders[pieceIndex].dataset.trendColumn = 'piece';
      updatedHeaders[pieceIndex].classList.add('border-r-2', 'border-gray-300');
    }
    Array.from(body.rows).forEach((row, index) => {
      if (!row.cells.length) return;
      const cells = Array.from(row.cells);
      const cell = document.createElement('td');
      cell.className = 'px-3 py-2 text-center font-semibold text-gray-900';
      cell.textContent = ticketRates[index % ticketRates.length];
      cell.dataset.trendColumn = 'ticket';
      const insertAt = Math.min(currentIndex + 1, cells.length - 1);
      cells[insertAt].before(cell);
      const updatedCells = Array.from(row.cells);
      const pieceCell = updatedCells[pieceIndex];
      if (pieceCell) {
        pieceCell.dataset.trendColumn = 'piece';
        pieceCell.classList.add('border-r-2', 'border-gray-300');
        const nextCell = updatedCells[pieceIndex + 1];
        if (nextCell) nextCell.classList.add('border-l-2', 'border-gray-300');
      }
    });
    table.dataset.ticketRateReady = 'true';
  };
  const addControls = () => {
    const title = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.includes('时效变化趋势'));
    if (!title || title.parentElement.querySelector('[data-trend-controls]')) return;
    const wrap = document.createElement('div');
    wrap.dataset.trendControls = 'true';
    wrap.className = 'flex items-center gap-2 flex-wrap text-xs';
    [['target', '目标值'], ['ticket', '票数达标率'], ['piece', '件数达标率']].forEach(([key, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-pressed', 'true');
      button.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium transition-all';
      button.textContent = label;
      button.onclick = () => {
        const visible = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(visible));
        button.className = `px-3 py-1.5 rounded-lg font-medium transition-all ${visible ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`;
        document.querySelectorAll(`[data-trend-column="${key}"]`).forEach(cell => { cell.hidden = !visible; });
      };
      wrap.appendChild(button);
    });
    title.parentElement.appendChild(wrap);
  };
  const hideRequestedMetrics = () => {
    const hidden = ['3.2.3 直入直出全链路平均时效（监管仓-卖场）', '3.6.1 监管仓/周转仓-预定仓全链路平均时效'];
    getTables().forEach(table => {
      Array.from(table.tBodies || []).forEach(body => Array.from(body.rows).forEach(row => {
        if (hidden.some(name => (row.textContent || '').includes(name))) row.remove();
      }));
    });
  };
  const mergeOverview = () => {
    Array.from(document.querySelectorAll('table')).forEach(table => {
      if (table.dataset.overviewMerged === 'true') return;
      const text = table.closest('div')?.textContent || '';
      if (!text.includes('各链路时效指标')) return;
      Array.from(table.tBodies || []).forEach(body => Array.from(body.rows).forEach(row => {
        const cell = row.cells[1];
        const metric = cell?.textContent || '';
        if (!cell) return;
        if (metric.includes('提货点提货全链路平均时效') || metric.includes('预定仓配送全链路平均时效')) cell.childNodes[0].textContent = '3.5.1 配送全链路平均时效（急件）';
        if (metric.includes('预定仓邮寄全链路平均时效')) row.remove();
        else if (metric.includes('邮寄全链路平均时效')) cell.childNodes[0].textContent = '3.4.1 邮寄全链路平均时效';
      }));
      table.dataset.overviewMerged = 'true';
    });
  };
  const run = () => { enhanceTrend(); addControls(); mergeOverview(); hideRequestedMetrics(); };
  const start = () => { run(); setInterval(run, 300); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
