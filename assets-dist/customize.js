(() => {
  const ticketRates = ['82.4%', '80.8%', '89.5%', '87.8%', '84.6%', '85.5%', '83.4%', '88.9%', '86.1%', '84.7%', '81.9%', '86.1%'];
  const trendLabels = ['提货至海综保平均时效', '仓库入库平均时效', '一线通关平均时效-门店', '门店提货至上架平均时效', '监管仓-周转仓调拨平均时效', '周转仓-卖场调拨平均时效'];
  const isTrend = () => [...document.querySelectorAll('h3')].some(el => el.textContent.includes('时效变化趋势'));
  const findTrendTable = () => {
    const title = [...document.querySelectorAll('h3')].find(el => el.textContent.includes('时效变化趋势'));
    return title?.closest('.bg-white')?.querySelector('table');
  };
  const addControls = () => {
    const title = [...document.querySelectorAll('h3')].find(el => el.textContent.includes('时效变化趋势'));
    if (!title || title.parentElement.querySelector('[data-trend-controls]')) return;
    const controls = document.createElement('div');
    controls.dataset.trendControls = 'true';
    controls.className = 'flex items-center gap-2 flex-wrap text-xs';
    [['target','目标值'],['ticket','票数达标率'],['piece','件数达标率']].forEach(([key,label]) => {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.columnToggle = key; button.setAttribute('aria-pressed','true');
      button.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium transition-all';
      button.textContent = label;
      button.onclick = () => {
        const on = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(on));
        button.className = `px-3 py-1.5 rounded-lg font-medium transition-all ${on ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`;
        document.querySelectorAll(`[data-trend-col="${key}"]`).forEach(cell => { cell.style.display = on ? '' : 'none'; });
      };
      controls.appendChild(button);
    });
    title.parentElement.appendChild(controls);
  };
  const updateTable = () => {
    const table = findTrendTable(); if (!table || table.dataset.enhanced) return;
    table.dataset.enhanced = 'true';
    const headers = [...table.tHead.rows[0].cells];
    const targetIndex = headers.findIndex(c => c.textContent.trim() === '目标值');
    const currentIndex = headers.findIndex(c => c.textContent.trim() === '当前平均值');
    if (targetIndex < 0 || currentIndex < 0) return;
    const ticketHead = document.createElement('th'); ticketHead.className = headers[currentIndex].className; ticketHead.textContent = '票数达标率'; ticketHead.dataset.trendCol = 'ticket';
    const pieceHead = headers.find(c => c.textContent.trim() === '件数达标率');
    const pieceIndex = headers.indexOf(pieceHead);
    headers[currentIndex].after(ticketHead);
    [...table.tBodies[0].rows].forEach((row, index) => {
      if (!row.cells.length) return;
      const ticket = document.createElement('td'); ticket.className = 'px-3 py-2 text-center font-semibold text-gray-900'; ticket.textContent = ticketRates[index % ticketRates.length]; ticket.dataset.trendCol = 'ticket';
      row.cells[Math.min(currentIndex + 1, row.cells.length - 1)].before(ticket);
      if (pieceIndex >= 0) row.cells[pieceIndex + 1]?.setAttribute('data-trend-col','piece');
      if (targetIndex >= 0) row.cells[targetIndex]?.setAttribute('data-trend-col','target');
    });
    // Merge the two requested pairs into their new business labels in the trend table.
    [...table.tBodies[0].rows].forEach(row => {
      const text = row.textContent;
      const label = row.cells[0];
      if (!label) return;
      if (text.includes('提货点提货全链路平均时效') || text.includes('预定仓配送全链路平均时效')) label.childNodes[0].textContent = '3.5.1 配送全链路平均时效（急件）';
      if (text.includes('预定仓邮寄全链路平均时效')) row.remove();
      if (text.includes('邮寄全链路平均时效')) label.childNodes[0].textContent = '3.4.1 邮寄全链路平均时效';
    });
  };
  const updateOverviewTable = () => {
    const title = [...document.querySelectorAll('h3')].find(el => el.textContent.trim() === '各链路时效指标');
    const table = title?.closest('.bg-white')?.querySelector('table');
    if (!table || table.dataset.mergedMetrics) return;
    table.dataset.mergedMetrics = 'true';
    [...table.tBodies].forEach(tbody => [...tbody.rows].forEach(row => {
      const cells = [...row.cells];
      const metricCell = cells[1];
      const metric = metricCell?.textContent || '';
      if (!metricCell) return;
      if (metric.includes('提货点提货全链路平均时效') || metric.includes('预定仓配送全链路平均时效')) {
        metricCell.childNodes[0].textContent = '3.5.1 配送全链路平均时效（急件）';
      }
      if (metric.includes('预定仓邮寄全链路平均时效')) row.remove();
      if (metric.includes('邮寄全链路平均时效')) {
        metricCell.childNodes[0].textContent = '3.4.1 邮寄全链路平均时效';
      }
    }));
  };
  const run = () => {
    if (isTrend()) { addControls(); updateTable(); }
    updateOverviewTable();
  };
  new MutationObserver(run).observe(document.body, {childList:true, subtree:true});
  setTimeout(run, 500);
})();
