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
    const trendRows = Array.from(body.rows);
    const mergeTrendGroup = (matches, label) => {
      const matched = trendRows.filter(row => matches.some(name => (row.textContent || '').includes(name)));
      if (!matched.length) return;
      const keep = matched[0];
      const labelCell = keep.cells[0];
      if (labelCell) {
        labelCell.childNodes[0].textContent = label;
        keep.classList.add('bg-amber-50');
        labelCell.classList.add('border-l-4', 'border-amber-500', 'bg-amber-100');
      }
      matched.slice(1).forEach(row => row.remove());
    };
    mergeTrendGroup(['提货点提货全链路平均时效', '预定仓配送全链路平均时效'], '配送全链路平均时效（急件）');
    mergeTrendGroup(['邮寄全链路平均时效', '预定仓邮寄全链路平均时效'], '邮寄全链路平均时效');
    const headers = Array.from(headerRow.cells);
    const metricIndex = headers.findIndex(cell => cell.textContent.trim() === '指标名称');
    if (metricIndex < 0) return;
    const storeHeader = document.createElement('th');
    storeHeader.className = headers[metricIndex].className;
    storeHeader.textContent = '门店';
    headers[metricIndex].after(storeHeader);
    const stores = ['三亚海棠湾店', '新海港店', '三亚凤凰机场店', '海口美兰机场店', '海口日月店', '博鳌店'];
    const logisticsCenterMetrics = [
      '全链路订货平均时效（一盘货）', '一线通关平均时效', '提货至海综保平均时效', '仓库入库平均时效',
      '全链路分货平均时效', '仓库出库平均时效', '二线通关平均时效', '门店提货至上架平均时效'
    ];
    let activeMetric = '';
    Array.from(body.rows).forEach((row, index) => {
      const rowText = row.textContent || '';
      if (row.cells.length === headers.length) activeMetric = logisticsCenterMetrics.find(name => rowText.includes(name)) || '';
      const cell = document.createElement('td');
      cell.className = 'px-3 py-2 text-center text-gray-600 whitespace-nowrap';
      if (logisticsCenterMetrics.includes(activeMetric)) {
        cell.textContent = '海南国际物流中心';
        cell.dataset.logisticsMetric = activeMetric;
      } else {
        cell.textContent = stores[index % stores.length];
      }
      if (row.cells.length === headers.length) row.cells[metricIndex].after(cell);
      else row.cells[metricIndex]?.before(cell);
    });
    const headersWithStore = Array.from(headerRow.cells);
    const currentIndex = headersWithStore.findIndex(cell => cell.textContent.trim() === '当前平均值');
    if (currentIndex < 0) return;
    const header = document.createElement('th');
    header.className = headersWithStore[currentIndex].className;
    header.textContent = '票数达标率';
    header.dataset.trendColumn = 'ticket';
    headersWithStore[currentIndex].after(header);
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
      const rowOffset = updatedHeaders.length - updatedCells.length;
      const pieceCell = updatedCells[pieceIndex - rowOffset];
      if (pieceCell) {
        pieceCell.dataset.trendColumn = 'piece';
        pieceCell.classList.add('border-r-2', 'border-gray-300');
        const nextCell = updatedCells[pieceIndex - rowOffset + 1];
        if (nextCell) nextCell.classList.add('border-l-2', 'border-gray-300');
      }
    });
    const metricNames = logisticsCenterMetrics;
    Array.from(body.rows).forEach(row => {
      const metricCell = Array.from(row.cells).find(cell => metricNames.some(name => cell.textContent.includes(name)));
      if (!metricCell) return;
      const span = Math.max(1, metricCell.rowSpan || 1);
      const storeCell = Array.from(row.cells).find(cell => cell.textContent.trim() === '海南国际物流中心');
      if (!storeCell || span < 2) return;
      storeCell.rowSpan = span;
      const rowIndex = Array.from(body.rows).indexOf(row);
      for (let offset = 1; offset < span; offset += 1) {
        const nextRow = body.rows[rowIndex + offset];
        const duplicate = Array.from(nextRow?.cells || []).find(cell => cell.textContent.trim() === '海南国际物流中心');
        if (duplicate) duplicate.remove();
      }
    });
    const finalHeaders = Array.from(headerRow.cells);
    const headerIndex = label => finalHeaders.findIndex(cell => cell.textContent.trim() === label);
    const categoryStart = headerIndex('品类');
    const categoryEnd = headerIndex('件数达标率');
    const previousStart = Math.max(headerIndex('上期值'), headerIndex('上月值'));
    const previousEnd = headerIndex('环比');
    const samePeriodStart = headerIndex('同期值');
    const samePeriodEnd = headerIndex('同比');
    const columnTone = index => {
      if (categoryStart >= 0 && index >= categoryStart && index <= categoryEnd) return '#fff8e6';
      if (previousStart >= 0 && index >= previousStart && index <= previousEnd) return '#f2fae8';
      if (samePeriodStart >= 0 && index >= samePeriodStart && index <= samePeriodEnd) return '#eaf8ff';
      return '';
    };
    finalHeaders.forEach((cell, index) => {
      const tone = columnTone(index);
      if (tone) cell.style.backgroundColor = tone;
    });
    Array.from(body.rows).forEach(row => {
      const cells = Array.from(row.cells);
      const rowOffset = finalHeaders.length - cells.length;
      finalHeaders.forEach((headerCell, logicalIndex) => {
        const tone = columnTone(logicalIndex);
        const cell = cells[logicalIndex - rowOffset];
        if (tone && cell) cell.style.backgroundColor = tone;
      });
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
    const hidden = ['直入直出全链路平均时效（监管仓-卖场）', '监管仓/周转仓-预定仓全链路平均时效'];
    getTables().forEach(table => {
      Array.from(table.tBodies || []).forEach(body => Array.from(body.rows).forEach(row => {
        if (hidden.some(name => (row.textContent || '').includes(name))) row.remove();
      }));
    });
    document.querySelectorAll('option').forEach(option => {
      if (hidden.some(name => option.textContent.includes(name))) option.remove();
    });
    document.querySelectorAll('button, label, span, div').forEach(element => {
      if (element.children.length) return;
      const text = element.textContent.trim();
      if (hidden.some(name => text.includes(name))) element.closest('button, label')?.remove();
    });
  };
  const normalizeMetricLabels = () => {
    const replacements = [
      ['提货点提货全链路平均时效', '配送全链路平均时效（急件）'],
      ['预定仓配送全链路平均时效', '配送全链路平均时效（急件）'],
      ['预定仓邮寄全链路平均时效', '邮寄全链路平均时效']
    ];
    document.querySelectorAll('option, button, label, span, td, th, div, p').forEach(element => {
      if (element.children.length) return;
      const old = element.textContent.trim();
      const replacement = replacements.find(([from]) => old.includes(from));
      if (replacement) element.textContent = old.replace(replacement[0], replacement[1]);
    });
  };
  const mergeOverview = () => {
    const title = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.trim() === '各链路时效指标');
    const panel = title?.closest('.bg-white');
    const table = panel?.querySelector('table');
    if (!table || table.dataset.overviewMerged === 'true') return;
    Array.from(table.tBodies || []).forEach(body => {
        const rows = Array.from(body.rows);
        const mergeGroup = (matches, label, tone) => {
          const matched = rows.filter(row => matches.some(name => (row.cells[1]?.textContent || '').includes(name)));
          if (!matched.length) return;
          const keep = matched[0];
          const cell = keep.cells[1];
          if (!cell) return;
          cell.childNodes[0].textContent = label;
          keep.classList.add(tone === 'amber' ? 'bg-amber-50' : 'bg-sky-50');
          cell.classList.add('border-l-4', tone === 'amber' ? 'border-amber-500' : 'border-sky-500', tone === 'amber' ? 'bg-amber-100' : 'bg-sky-100');
          const badge = document.createElement('span');
          badge.className = `ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${tone === 'amber' ? 'bg-amber-200 text-amber-900' : 'bg-sky-200 text-sky-900'}`;
          badge.textContent = '已合并';
          cell.appendChild(badge);
          matched.slice(1).forEach(row => row.remove());
        };
        mergeGroup(['提货点提货全链路平均时效', '预定仓配送全链路平均时效'], '配送全链路平均时效（急件）', 'amber');
        mergeGroup(['邮寄全链路平均时效', '预定仓邮寄全链路平均时效'], '邮寄全链路平均时效', 'sky');
      });
    table.dataset.overviewMerged = 'true';
  };
  const qualityPanel = () => {
    const overview = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.trim() === '指标总览');
    const root = overview?.closest('.bg-gradient-to-br');
    const qualityButton = root && Array.from(root.querySelectorAll('button')).find(el => el.textContent.includes('质量指标'));
    if (!root || !qualityButton || !qualityButton.className.includes('bg-blue-600')) return;
    const content = root.querySelector('.mt-6');
    if (!content || content.dataset.qualityRebuilt === 'true') return;
    content.dataset.qualityRebuilt = 'true';
    let metric = '库存准确率';
    let selected = [...stores];
    const render = () => {
      const data = qualityMetrics[metric];
      const average = data.values.reduce((a, b) => a + b, 0) / data.values.length;
      const selectedValues = selected.map((_, index) => Number((average + ((index % 3) - 1) * 0.18).toFixed(1)));
      content.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'space-y-5';
      const controls = document.createElement('div');
      controls.className = 'flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3';
      const metricLabel = document.createElement('span'); metricLabel.className = 'text-sm font-semibold text-gray-700'; metricLabel.textContent = '质量指标'; controls.appendChild(metricLabel);
      const metricSelect = document.createElement('select'); metricSelect.className = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700';
      Object.keys(qualityMetrics).forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; option.selected = name === metric; metricSelect.appendChild(option); });
      metricSelect.onchange = () => { metric = metricSelect.value; render(); }; controls.appendChild(metricSelect);
      const storeLabel = document.createElement('span'); storeLabel.className = 'ml-2 text-sm font-semibold text-gray-700'; storeLabel.textContent = '门店'; controls.appendChild(storeLabel);
      const storeBox = document.createElement('div'); storeBox.className = 'flex flex-wrap gap-2';
      stores.forEach(name => { const button = document.createElement('button'); const active = selected.includes(name); button.type = 'button'; button.className = `rounded-lg border px-3 py-2 text-sm font-medium transition-all ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500'}`; button.textContent = name; button.setAttribute('aria-pressed', String(active)); button.onclick = () => { selected = active ? selected.filter(item => item !== name) : [...selected, name]; render(); }; storeBox.appendChild(button); }); controls.appendChild(storeBox); wrap.appendChild(controls);
      const grid = document.createElement('div'); grid.className = 'grid grid-cols-1 gap-5 xl:grid-cols-3';
      const kpi = document.createElement('div'); kpi.className = 'rounded-lg border border-gray-200 bg-white p-5 xl:col-span-1'; kpi.innerHTML = `<div class="mb-5 flex items-center justify-between"><h3 class="font-semibold text-gray-900">${metric}</h3><span class="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">目标 ${data.target}</span></div><div class="text-4xl font-bold text-gray-900">${average.toFixed(1)}${data.unit}</div><div class="mt-5 h-3 rounded-full bg-gray-100"><div class="h-3 rounded-full bg-blue-600" style="width:${Math.min(100, average)}%"></div></div><div class="mt-2 text-xs text-gray-500">已选 ${selected.length} 家门店</div>`; grid.appendChild(kpi);
      const chart = document.createElement('div'); chart.className = 'rounded-lg border border-gray-200 bg-white p-5 xl:col-span-2'; chart.innerHTML = '<h3 class="mb-4 font-semibold text-gray-900">月度趋势</h3>';
      const bars = document.createElement('div'); bars.className = 'grid h-56 grid-cols-12 items-end gap-2 border-b border-l border-gray-200 px-3 pb-2'; data.values.forEach((value, index) => { const column = document.createElement('div'); column.className = 'group flex h-full flex-col items-center justify-end gap-1'; column.innerHTML = `<span class="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100">${value}%</span><div class="w-full rounded-t bg-blue-500 transition-all group-hover:bg-blue-700" style="height:${Math.max(8, value)}%" title="${index + 1}月 ${value}%"></div><span class="text-[10px] text-gray-500">${index + 1}月</span>`; bars.appendChild(column); }); chart.appendChild(bars); grid.appendChild(chart); wrap.appendChild(grid);
      const table = document.createElement('div'); table.className = 'overflow-x-auto rounded-lg border border-gray-200 bg-white'; table.innerHTML = `<div class="border-b border-gray-200 px-5 py-4"><h3 class="font-semibold text-gray-900">门店明细</h3></div><table class="w-full min-w-[900px] text-sm"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left">门店</th><th class="px-4 py-3 text-center">月度均值</th>${data.values.map((_, index) => `<th class="px-3 py-3 text-center">${index + 1}月</th>`).join('')}</tr></thead><tbody>${selected.map((name, index) => `<tr class="border-t border-gray-100"><td class="px-4 py-3 font-medium text-gray-700">${name}</td><td class="px-4 py-3 text-center font-semibold text-gray-900">${selectedValues[index]}%</td>${data.values.map(value => `<td class="px-3 py-3 text-center text-gray-600">${(value + (index % 2 ? -0.3 : 0.2)).toFixed(1)}%</td>`).join('')}</tr>`).join('')}</tbody></table>`; wrap.appendChild(table); content.appendChild(wrap);
    };
    render();
  };
  const qualityMetricNames = ['香化调拨满足率', '库存准确率', '效期准确率', '邮寄遗失率', '邮寄破损率', '快递有责客诉率', '物流有责客诉率'];
  const qualityMetricData = {
    '香化调拨满足率': { target: 97, values: [95.2, 94.6, 96.1, 93.8, 95.7, 94.9] },
    '库存准确率': { target: 99, values: [98.5, 98.8, 98.2, 98.6, 98.4, 98.7] },
    '效期准确率': { target: 96, values: [95.8, 96.1, 95.5, 96.3, 96.0, 96.4] },
    '邮寄遗失率': { target: 0.10, values: [0.08, 0.06, 0.11, 0.07, 0.09, 0.05] },
    '邮寄破损率': { target: 0.10, values: [0.20, 0.16, 0.24, 0.18, 0.21, 0.14] },
    '快递有责客诉率': { target: 0.10, values: [0.25, 0.22, 0.31, 0.19, 0.27, 0.18] },
    '物流有责客诉率': { target: 0.10, values: [0.38, 0.34, 0.42, 0.29, 0.36, 0.27] }
  };
  const qualityStoreNames = ['三亚海棠湾店', '新海港店', '三亚凤凰机场店', '海口美兰机场店', '海口日月店', '博鳌店'];
  const qualityPanelStyle = () => {
    const overview = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.trim() === '指标总览');
    const root = overview?.closest('.bg-gradient-to-br');
    const qualityButton = root && Array.from(root.querySelectorAll('button')).find(el => el.textContent.includes('质量指标'));
    const content = root?.querySelector('.mt-6');
    if (!root || !qualityButton || !qualityButton.className.includes('bg-blue-600') || !content || content.dataset.qualityStyleReady === 'true') return;
    content.dataset.qualityStyleReady = 'true';
    let selectedMetric = qualityMetricNames[0];
    let selectedStores = [...qualityStoreNames];
    const render = () => {
      const metric = qualityMetricData[selectedMetric];
      const selected = selectedStores.length ? selectedStores : qualityStoreNames;
      const values = selected.map((name, index) => ({ name, value: metric.values[qualityStoreNames.indexOf(name)] ?? metric.values[index % metric.values.length] }));
      content.innerHTML = '';
      const panel = document.createElement('div'); panel.className = 'space-y-5';
      const metricTabs = document.createElement('div'); metricTabs.className = 'flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-3';
      qualityMetricNames.forEach(name => { const button = document.createElement('button'); button.type = 'button'; button.textContent = name; button.className = `rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${name === selectedMetric ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'}`; button.onclick = () => { selectedMetric = name; render(); }; metricTabs.appendChild(button); }); panel.appendChild(metricTabs);
      const storeFilter = document.createElement('div'); storeFilter.className = 'flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3';
      const label = document.createElement('span'); label.className = 'mr-2 text-sm font-semibold text-gray-700'; label.textContent = '门店'; storeFilter.appendChild(label);
      const all = document.createElement('button'); all.type = 'button'; all.textContent = selectedStores.length === qualityStoreNames.length ? '取消全选' : '全选'; all.className = 'rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700'; all.onclick = () => { selectedStores = selectedStores.length === qualityStoreNames.length ? [] : [...qualityStoreNames]; render(); }; storeFilter.appendChild(all);
      qualityStoreNames.forEach(name => { const button = document.createElement('button'); const active = selectedStores.includes(name); button.type = 'button'; button.textContent = name; button.setAttribute('aria-pressed', String(active)); button.className = `rounded-lg border px-3 py-2 text-sm transition-all ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500'}`; button.onclick = () => { selectedStores = active ? selectedStores.filter(item => item !== name) : [...selectedStores, name]; render(); }; storeFilter.appendChild(button); }); panel.appendChild(storeFilter);
      const body = document.createElement('div'); body.className = 'grid grid-cols-1 gap-5 xl:grid-cols-2';
      const colors = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#0891b2', '#dc2626'];
      const visible = new Set(selected);
      const bars = document.createElement('section'); bars.className = 'rounded-lg border border-gray-200 bg-white p-5'; bars.innerHTML = `<div class="mb-4 flex items-center justify-between"><h3 class="font-semibold text-gray-900">${selectedMetric}</h3><span class="text-xs text-gray-500">按门店</span></div>`;
      const max = Math.max(...values.map(item => item.value), metric.target, 1); values.forEach((item, index) => { const row = document.createElement('div'); row.className = 'mb-4 grid grid-cols-[130px_1fr_70px] items-center gap-3'; row.innerHTML = `<span class="truncate text-sm text-gray-700" title="${item.name}">${item.name}</span><div class="h-7 rounded bg-gray-100"><div class="h-7 rounded" style="width:${Math.max(4, item.value / max * 100)}%;background:${colors[index % colors.length]}"></div></div><strong class="text-right text-sm text-gray-900">${item.value.toFixed(2)}%</strong>`; bars.appendChild(row); }); body.appendChild(bars);
      const trend = document.createElement('section'); trend.className = 'rounded-lg border border-gray-200 bg-white p-5'; trend.innerHTML = `<h3 class="mb-4 font-semibold text-gray-900">月度趋势</h3>`;
      const chart = document.createElement('div'); chart.className = 'relative h-64 border-b border-l border-gray-200 px-3 pb-2';
      const plot = document.createElement('div'); plot.className = 'absolute inset-0';
      values.forEach((item, index) => {
        const series = document.createElement('div'); series.className = 'absolute inset-x-0 bottom-6 top-2'; series.dataset.store = item.name;
        const line = document.createElement('div'); line.className = 'absolute h-0.5 origin-left'; line.style.left = '0'; line.style.right = '0'; line.style.top = `${28 + index * 7}%`; line.style.background = colors[index % colors.length];
        series.appendChild(line);
        for (let month = 0; month < 12; month += 1) { const point = document.createElement('span'); const value = item.value + ((month % 4) - 1.5) * 0.12; point.className = 'absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white'; point.style.left = `${month / 11 * 100}%`; point.style.top = `${28 + index * 7 - (value - item.value) * 1.5}%`; point.style.background = colors[index % colors.length]; point.title = `${item.name} ${month + 1}月 ${value.toFixed(2)}%`; series.appendChild(point); }
        plot.appendChild(series);
      });
      const axis = document.createElement('div'); axis.className = 'absolute inset-x-3 bottom-0 flex justify-between text-[10px] text-gray-500'; for (let month = 1; month <= 12; month += 1) { const label = document.createElement('span'); label.textContent = `${month}月`; axis.appendChild(label); }
      chart.appendChild(plot); chart.appendChild(axis); trend.appendChild(chart);
      const legend = document.createElement('div'); legend.className = 'mt-4 flex flex-wrap gap-3 text-xs'; values.forEach((item, index) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'inline-flex items-center gap-1.5 text-gray-700'; button.innerHTML = `<span class="h-2.5 w-2.5 rounded-full" style="background:${colors[index % colors.length]}"></span>${item.name}`; button.onclick = () => { const on = !visible.has(item.name); if (on) visible.add(item.name); else visible.delete(item.name); button.classList.toggle('opacity-40', !on); chart.querySelectorAll(`[data-store="${item.name}"]`).forEach(bar => { bar.style.display = on ? '' : 'none'; }); bars.querySelectorAll('.mb-4')[index].style.display = on ? '' : 'none'; }; legend.appendChild(button); }); trend.appendChild(legend); body.appendChild(trend); panel.appendChild(body); content.appendChild(panel);
    };
    render();
  };
  const categoryQualityPanel = () => {
    const overview = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.trim() === '指标总览');
    const root = overview?.closest('.bg-gradient-to-br');
    const qualityButton = root && Array.from(root.querySelectorAll('button')).find(button => button.textContent.includes('质量指标'));
    if (!root || !qualityButton || !qualityButton.className.includes('bg-blue-600')) return;
    const content = root?.querySelector('.mt-6');
    if (!content) return;
    if (content.dataset.categoryQualityReady === 'true') return;
    content.dataset.categoryQualityReady = 'true';
    const categories = {
      '调拨满足率': ['香化调拨满足率'],
      '快递交付': ['邮寄遗失率', '邮寄破损率'],
      '客诉情况': ['快递有责客诉率', '物流有责客诉率'],
      '准确率盘点情况': ['库存准确率', '效期准确率']
    };
    const colors = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#0891b2', '#dc2626'];
    const findCategory = () => Object.keys(categories).find(name => Array.from(root.querySelectorAll('button')).some(button => button.textContent.includes(name) && button.className.includes('scale-105'))) || '调拨满足率';
    let category = findCategory();
    let selectedStores = [...qualityStoreNames];
    let hiddenStores = new Set();
    const render = () => {
      const names = categories[category] || categories['调拨满足率'];
      content.innerHTML = '';
      const filter = document.createElement('div'); filter.className = 'relative z-30 mb-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3';
      const label = document.createElement('span'); label.className = 'text-sm font-semibold text-gray-700'; label.textContent = '门店'; filter.appendChild(label);
      const selectWrap = document.createElement('div'); selectWrap.className = 'relative';
      const selectButton = document.createElement('button'); selectButton.type = 'button'; selectButton.className = 'min-w-[220px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700'; selectButton.textContent = selectedStores.length === qualityStoreNames.length ? '全部门店' : `已选 ${selectedStores.length} 家门店`;
      const menu = document.createElement('div'); menu.className = 'absolute left-0 top-full mt-1 hidden w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg';
      const all = document.createElement('label'); all.className = 'flex cursor-pointer items-center gap-2 border-b border-gray-100 px-2 py-2 text-sm font-medium'; all.innerHTML = `<input type="checkbox" ${selectedStores.length === qualityStoreNames.length ? 'checked' : ''}>全部门店`; all.querySelector('input').onchange = event => { selectedStores = event.target.checked ? [...qualityStoreNames] : []; render(); }; menu.appendChild(all);
      qualityStoreNames.forEach(name => { const option = document.createElement('label'); option.className = 'flex cursor-pointer items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50'; option.innerHTML = `<input type="checkbox" ${selectedStores.includes(name) ? 'checked' : ''}>${name}`; option.querySelector('input').onchange = event => { selectedStores = event.target.checked ? [...selectedStores, name] : selectedStores.filter(item => item !== name); render(); }; menu.appendChild(option); });
      selectButton.onclick = () => menu.classList.toggle('hidden'); selectWrap.appendChild(selectButton); selectWrap.appendChild(menu); filter.appendChild(selectWrap); content.appendChild(filter);
      names.forEach((metricName, metricIndex) => {
        const data = qualityMetricData[metricName]; const panel = document.createElement('section'); panel.className = 'mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2';
        const barPanel = document.createElement('div'); barPanel.className = 'rounded-lg border border-gray-200 bg-white p-5'; barPanel.innerHTML = `<h3 class="mb-4 font-semibold text-gray-900">${metricName}</h3>`;
        const max = Math.max(data.target, ...data.values, 1); selectedStores.forEach((store, index) => { const value = data.values[index % data.values.length]; const row = document.createElement('div'); row.className = 'mb-3 grid grid-cols-[130px_1fr_70px] items-center gap-3'; row.innerHTML = `<span class="truncate text-sm text-gray-700">${store}</span><div class="h-7 rounded bg-gray-100"><div class="h-7 rounded" style="width:${Math.max(4, value / max * 100)}%;background:${colors[index % colors.length]}"></div></div><strong class="text-right text-sm text-gray-900">${value.toFixed(2)}%</strong>`; barPanel.appendChild(row); }); panel.appendChild(barPanel);
        const linePanel = document.createElement('div'); linePanel.className = 'rounded-lg border border-gray-200 bg-white p-5'; linePanel.innerHTML = `<h3 class="mb-4 font-semibold text-gray-900">${metricName} · 月度趋势</h3>`; const chart = document.createElement('div'); chart.className = 'relative h-56 border-b border-l border-gray-200'; selectedStores.forEach((store, index) => { const series = document.createElement('div'); series.dataset.store = store; series.className = 'absolute inset-x-0'; series.style.top = `${15 + index * (70 / Math.max(selectedStores.length, 1))}%`; for (let month = 0; month < 12; month += 1) { const point = document.createElement('span'); const value = data.values[index % data.values.length] + ((month % 4) - 1.5) * 0.12; point.className = 'absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full'; point.style.left = `${month / 11 * 100}%`; point.style.background = colors[index % colors.length]; point.title = `${store} ${month + 1}月 ${value.toFixed(2)}%`; series.appendChild(point); } chart.appendChild(series); }); linePanel.appendChild(chart); const legend = document.createElement('div'); legend.className = 'mt-4 flex flex-wrap gap-3 text-xs'; selectedStores.forEach((store, index) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'inline-flex items-center gap-1.5 text-gray-700'; button.innerHTML = `<span class="h-2.5 w-2.5 rounded-full" style="background:${colors[index % colors.length]}"></span>${store}`; button.onclick = () => { const hidden = hiddenStores.has(store); if (hidden) hiddenStores.delete(store); else hiddenStores.add(store); button.classList.toggle('opacity-40', !hidden); chart.querySelectorAll(`[data-store="${store}"]`).forEach(series => { series.hidden = !hidden; }); }; legend.appendChild(button); }); linePanel.appendChild(legend); panel.appendChild(linePanel); content.appendChild(panel);
      });
    };
    render();
    setInterval(() => { const next = findCategory(); if (next !== category) { category = next; render(); } }, 300);
  };
  const updateQualityChart = () => {
    const title = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.trim() === '月度趋势');
    const panel = title?.closest('.bg-white');
    if (!panel || panel.dataset.qualityChartUpdated === 'true') return;
    const legendTexts = Array.from(panel.querySelectorAll('text, span')).filter(el => /TOP300|非TOP300/.test(el.textContent || ''));
    if (!legendTexts.length) return;
    // Keep the TOP300 series as the selected store series and remove the non-TOP300 series.
    const names = ['三亚海棠湾店', '新海港店'];
    legendTexts.forEach((el, index) => {
      if (el.textContent.includes('TOP300') && !el.textContent.includes('非')) el.textContent = names[0];
      if (el.textContent.includes('非TOP300')) {
        const legendItem = el.closest('g, li, span');
        if (legendItem) legendItem.remove();
      }
    });
    // Hide the second plotted series and its markers while keeping the existing chart layout.
    const svg = panel.querySelector('svg');
    if (svg) {
      const paths = Array.from(svg.querySelectorAll('path')).filter(path => path.getAttribute('stroke'));
      const colored = paths.filter(path => !['#ccc', '#e5e7eb', '#f0f0f0'].includes(path.getAttribute('stroke')));
      colored.slice(1, 2).forEach(path => { path.style.display = 'none'; });
    }
    panel.dataset.qualityChartUpdated = 'true';
  };
  const limitExclusionControls = () => {
    const exclusionMetrics = ['2.1.4', '3.1.1', '3.2.1'];
    const exclusionNames = ['门店提货至上架平均时效', '监管仓-周转仓调拨平均时效', '周转仓-卖场调拨平均时效'];
    document.querySelectorAll('button').forEach(button => {
      if (!button.textContent.includes('剔除前后')) return;
      // The metric and action are not always siblings (the action can be in a
      // nested cell), so inspect the complete row/section before hiding it.
      let context = button.closest('tr')?.textContent || '';
      let node = button.parentElement;
      for (let level = 0; level < 5 && node; level += 1, node = node.parentElement) context += ` ${node.textContent || ''}`;
      const allowed = exclusionMetrics.some(metricId => context.includes(metricId)) || exclusionNames.some(name => context.includes(name));
      button.hidden = !allowed;
      button.style.display = allowed ? '' : 'none';
    });
  };
  const normalizeTimingTargetUnits = () => {
    const dayMetrics = ['全链路订货平均时效（一盘货）', '提货至海综保平均时效'];
    const targets = { '全链路订货平均时效（一盘货）': { '香化仓': '11D', '酒水仓': '7D' }, '一线通关平均时效': { default: '72H' }, '提货至海综保平均时效': { default: '2.5D' }, '仓库入库平均时效': { '香化仓': '5.5H', '酒水仓': '3H' }, '全链路入库平均时效（直发）': {}, '全链路分货平均时效': {}, '仓库出库平均时效': { '香化仓': '4H', '酒水仓': '10H' }, '二线通关平均时效': { '香化仓': '1.5H', '酒水仓': '7H' }, '门店提货至上架平均时效': { default: '4H' }, '监管仓-周转仓调拨平均时效': { default: '24H', '美兰店': '-' }, '周转仓-卖场调拨平均时效': {}, '全链路分拣仓入库平均时效': {}, '邮寄全链路平均时效': {}, '配送全链路平均时效': {}, '监管仓/周转仓-预定仓全链路平均时效': {}, '预定仓邮寄全链路平均时效': {}, '预定仓配送全链路平均时效': {} };
    const timingNames = Object.keys(targets).sort((a, b) => b.length - a.length);
    const aliases = { '香化仓': '香化仓', '香化': '香化仓', '酒水仓': '酒水仓', '酒水': '酒水仓', '一盘货': '一盘货', '三亚店': '三亚店', '新海港店': '新海港店', '日月店': '日月店', '美兰店': '美兰店', '博鳌店': '博鳌店', '凤凰机场店': '凤凰机场店', '全岛整体': '全岛整体', '整体': '整体' };
    const aliasNames = ['香化仓', '酒水仓', '香化', '酒水', '三亚店', '新海港店', '日月店', '美兰店', '博鳌店', '凤凰机场店', '全岛整体', '整体', '一盘货'];
    const format = (cell, unit) => { const m = cell.textContent.trim().match(/^(-?\d+(?:\.\d+)?)(天|小时|H|D)?$/i); if (!m) return; let value = Number(m[1]); const source = /天|D/i.test(m[2] || '') ? 'D' : /小时|H/i.test(m[2] || '') ? 'H' : unit; if (source !== unit) value = source === 'D' ? value * 24 : value / 24; cell.textContent = `${Number(value.toFixed(4))}${unit}`; };
    const makeGrid = table => { const grid = []; Array.from(table.rows).forEach((row, r) => { grid[r] ||= []; let c = 0; Array.from(row.cells).forEach(cell => { while (grid[r][c]) c += 1; for (let rr = r; rr < r + Math.max(1, cell.rowSpan); rr += 1) { grid[rr] ||= []; for (let cc = c; cc < c + Math.max(1, cell.colSpan); cc += 1) grid[rr][cc] = cell; } c += Math.max(1, cell.colSpan); }); }); return grid; };
    document.querySelectorAll('table').forEach(table => { const rows = Array.from(table.rows); const grid = makeGrid(table); const headerRow = rows.findIndex(row => Array.from(row.cells).some(cell => cell.tagName === 'TH' && cell.textContent.includes('目标值'))); if (headerRow < 0) return; const headers = grid[headerRow].map(cell => cell?.textContent.trim() || ''); const targetIndex = headers.findIndex(header => header.includes('目标值')); const statIndexes = headers.map((header, i) => ['当前平均值', '最大值', '上期值', '同期值'].includes(header) ? i : -1).filter(i => i >= 0); let metric = '', store = ''; rows.slice(headerRow + 1).forEach((row, offset) => { const r = headerRow + 1 + offset; const rowText = row.textContent || ''; metric = timingNames.find(name => rowText.includes(name)) || metric; const alias = aliasNames.find(name => rowText.includes(name)); store = alias ? aliases[alias] : store; if (!metric) return; const unit = dayMetrics.includes(metric) ? '天' : 'H'; const target = Object.prototype.hasOwnProperty.call(targets[metric], store) ? targets[metric][store] : targets[metric].default || '-'; const targetCell = grid[r]?.[targetIndex]; if (targetCell && targetCell.parentElement === row) targetCell.textContent = target; statIndexes.forEach(index => { const cell = grid[r]?.[index]; if (cell && cell.parentElement === row) format(cell, unit); }); }); const detailHeaders = ['日度均值', '月度均值']; if (detailHeaders.every(label => headers.includes(label))) { rows.slice(headerRow + 1).forEach(row => { const metricCell = Array.from(row.cells).find(cell => cell.textContent.trim() === '平均时效'); if (!metricCell) return; Array.from(row.cells).forEach(cell => { const match = cell.textContent.trim().match(/^(-?\d+(?:\.\d+)?)(天|D|小时|H)?$/i); if (!match || !match[2] || !/天|D/i.test(match[2])) return; const hours = Number(match[1]) * 24; cell.textContent = `${Number(hours.toFixed(4))}H`; }); }); } });
  };
  const flattenWarehouseOutboundDetail = () => {
    const data = {
      '酒水': [
        ['平均时效', '0.5D', '0.51D', '0.51D', '0.5D', '0.51D', '0.52D', '0.5D', '0.51D', '0.52D', '0.5D', '0.51D'],
        ['大于目标值的件数', '0.5D', '1774.09', '1774.09', '1441.96', '1661.92', '1576.38', '1970.24', '1746.52', '1551.94', '2016.3', '1808.56'],
        ['总件数', '-', '13575.17', '13575.17', '11092', '12784', '12126', '14288', '13442', '11938', '15510', '13912'],
        ['达标率', '-', '87.72%', '87.72%', '87.78%', '87.78%', '87.78%', '87.03%', '87.78%', '87.78%', '87.78%', '87.78%']
      ],
      '香化': [
        ['平均时效', '0.875D', '0.89D', '0.89D', '0.88D', '0.89D', '0.9D', '0.88D', '0.89D', '0.9D', '0.88D', '0.89D'],
        ['大于目标值的件数', '0.875D', '3031.58', '3031.58', '2835.04', '2627.3', '3103.88', '2786.16', '3287.18', '3018.34', '2663.96', '3372.72'],
        ['总件数', '-', '23319.83', '23319.83', '21808', '20210', '23876', '21432', '25286', '23218', '20492', '25944'],
        ['达标率', '-', '87.78%', '87.78%', '87.78%', '87.78%', '87.78%', '87.78%', '87.78%', '87.78%', '87.78%', '87.78%']
      ]
    };
    document.querySelectorAll('h4').forEach(title => {
      if (title.textContent.trim() !== '仓库出库平均时效') return;
      const section = title.closest('.mb-6') || title.parentElement?.parentElement;
      const oldTable = section?.querySelector('table');
      if (!section || !oldTable || oldTable.dataset.outboundFlat === 'true') return;
      const table = document.createElement('table');
      table.dataset.outboundFlat = 'true';
      table.className = 'w-full text-xs border-collapse';
      const headers = ['门店', '品类', '指标', '目标值', '日度均值', '月度均值', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'];
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      headers.forEach((label, index) => {
        const cell = document.createElement('th');
        cell.className = 'px-3 py-2 border border-gray-200 text-center font-semibold text-gray-900 whitespace-nowrap';
        cell.style.backgroundColor = index === 3 ? '#fffbea' : '#fff4f4';
        cell.textContent = label;
        headerRow.appendChild(cell);
      });
      const tbody = table.createTBody();
      let firstRow = true;
      Object.entries(data).forEach(([category, rows], categoryIndex) => {
        rows.forEach((values, rowIndex) => {
          const row = tbody.insertRow();
          if (firstRow) {
            const store = row.insertCell();
            store.rowSpan = 8;
            store.className = 'px-3 py-2 border border-gray-200 text-left align-middle whitespace-nowrap';
            store.textContent = '海南国际物流中心';
            firstRow = false;
          }
          if (rowIndex === 0) {
            const categoryCell = row.insertCell();
            categoryCell.rowSpan = 4;
            categoryCell.className = 'px-3 py-2 border border-gray-200 text-center align-middle';
            categoryCell.style.backgroundColor = categoryIndex === 0 ? '#eef6ff' : '#effcf4';
            categoryCell.textContent = category;
          }
          values.forEach((value, valueIndex) => {
            const cell = row.insertCell();
            cell.className = `px-3 py-2 border border-gray-200 ${valueIndex === 0 ? 'text-left' : 'text-center'} whitespace-nowrap`;
            if (valueIndex === 1) {
              cell.style.backgroundColor = '#fffbea';
              cell.style.color = '#c45a00';
            }
            if (valueIndex >= 9) cell.style.backgroundColor = '#eef6ff';
            const isTimingValue = (rowIndex === 0 || valueIndex === 1) && /D$/i.test(value);
            const hours = isTimingValue ? Number.parseFloat(value) * 24 : null;
            cell.textContent = hours === null ? value : `${Number(hours.toFixed(4))}H`;
          });
        });
      });
      oldTable.replaceWith(table);
    });
  };
  const normalizeStoreStageNode = () => {
    document.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(cell => cell.textContent.trim());
      const nodeIndex = headers.indexOf('业务节点');
      if (nodeIndex < 0) return;
      const stageIndex = headers.indexOf('业务环节');
      Array.from(table.tBodies || []).flatMap(body => Array.from(body.rows)).forEach(row => {
        const cells = Array.from(row.cells);
        if (!cells.some(cell => cell.textContent.includes('卖场-分拣仓'))) return;
        if (stageIndex >= 0 && cells[stageIndex]?.textContent.includes('卖场-分拣仓')) cells[stageIndex].textContent = '3.门店段';
        if (cells[nodeIndex]?.textContent.includes('卖场-分拣仓')) cells[nodeIndex].textContent = '3.卖场-分拣仓';
      });
    });
  };
  const normalizeStoreStageMetrics = () => {
    const corrections = [
      { match: '卖场-分拣仓入库平均时效', stage: '3.门店段', node: '3.卖场-分拣仓', metric: '3.1卖场-分拣仓入库平均时效' }
    ];
    document.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(cell => cell.textContent.trim());
      const nodeIndex = headers.indexOf('业务节点');
      const metricIndex = headers.indexOf('具体指标');
      if (nodeIndex < 0 || metricIndex < 0) return;
      const stageIndex = headers.indexOf('业务环节');
      Array.from(table.tBodies || []).flatMap(body => Array.from(body.rows)).forEach(row => {
        const cells = Array.from(row.cells);
        const correction = corrections.find(item => cells.some(cell => cell.textContent.includes(item.match)));
        if (!correction) return;
        if (stageIndex >= 0 && cells[stageIndex]) cells[stageIndex].textContent = correction.stage;
        if (cells[nodeIndex]) cells[nodeIndex].textContent = correction.node;
        if (cells[metricIndex]) cells[metricIndex].textContent = correction.metric;
      });
    });
  };
  const fixStoreStageRowSpan = () => {
    document.querySelectorAll('table').forEach(table => {
      const rows = Array.from(table.tBodies || []).flatMap(body => Array.from(body.rows));
      const targetRow = rows.find(row => row.textContent.includes('3.卖场-分拣仓') && row.textContent.includes('3.1卖场-分拣仓入库平均时效'));
      if (!targetRow) return;
      const precedingRow = rows.slice(0, rows.indexOf(targetRow)).reverse().find(row => row.textContent.includes('2.周转仓-卖场'));
      const stageCell = precedingRow && Array.from(precedingRow.cells).find(cell => cell.textContent.includes('2.周转仓-卖场'));
      if (stageCell) stageCell.removeAttribute('rowspan');
      const targetStageCell = Array.from(targetRow.cells).find(cell => cell.textContent.includes('3.卖场-分拣仓'));
      const targetMetricCell = Array.from(targetRow.cells).find(cell => cell.textContent.includes('3.1卖场-分拣仓入库平均时效'));
      if (targetStageCell && targetMetricCell) {
        targetRow.insertBefore(targetStageCell, targetRow.firstElementChild);
        targetRow.insertBefore(targetMetricCell, targetStageCell.nextElementSibling);
      }
    });
  };
  const normalizeExceptionMetricScope = () => {
    const afterMetrics = ['门店提货至上架平均时效', '监管仓-周转仓调拨平均时效', '周转仓-卖场调拨平均时效'];
    const timingNames = ['全链路订货平均时效', '一线通关平均时效', '提货至海综保平均时效', '仓库入库平均时效', '全链路入库平均时效', '全链路分货平均时效', '仓库出库平均时效', '二线通关平均时效', '门店提货至上架平均时效', '监管仓-周转仓调拨平均时效', '周转仓-卖场调拨平均时效', '直入直出全链路平均时效', '分拣仓入库平均时效', '邮寄全链路平均时效', '配送全链路平均时效', '预定仓邮寄全链路平均时效', '预定仓配送全链路平均时效'];
    const title = Array.from(document.querySelectorAll('h2')).find(element => element.textContent.trim() === '异常明细');
    const panel = title?.closest('.bg-white');
    if (!panel || panel.dataset.exceptionScopeReady === 'true') return;
    const tables = panel.querySelectorAll('table');
    if (!tables.length) return;
    tables.forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(cell => cell.textContent.trim());
      const scopeIndex = headers.findIndex(header => header.includes('数据口径'));
      Array.from(table.tBodies || []).flatMap(body => Array.from(body.rows)).forEach(row => {
        const text = row.textContent || '';
        const metricName = timingNames.find(name => text.includes(name));
        if (!metricName) return;
        const scope = afterMetrics.includes(metricName) ? '剔除后' : '剔除前';
        if (scopeIndex >= 0 && row.cells[scopeIndex]) row.cells[scopeIndex].textContent = scope;
        row.querySelectorAll('td, span, button').forEach(element => {
          if (element.children.length) return;
          if (element.textContent.trim() === '剔除前' || element.textContent.trim() === '剔除后') element.textContent = scope;
        });
      });
    });
    panel.dataset.exceptionScopeReady = 'true';
  };
  const renderTransferQuality = () => {
    const overview = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.trim() === '指标总览');
    const root = overview?.closest('.bg-gradient-to-br');
    const qualityTab = root && Array.from(root.querySelectorAll('button')).find(button => button.textContent.includes('质量指标') && button.className.includes('bg-blue-600'));
    const content = root?.querySelector('.mt-6');
    if (!root || !qualityTab || !content || content.dataset.transferQualityReady === 'true') return;
    content.dataset.transferQualityReady = 'true';
    const stores = ['三亚海棠湾店', '新海港店', '三亚凤凰机场店', '海口美兰机场店', '海口日月店', '博鳌店'];
    const colors = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#0891b2', '#dc2626'];
    const base = [95.2, 94.6, 96.1, 93.8, 95.7, 94.9];
    let selectedStores = [...stores];
    const render = () => {
      const values = selectedStores.map(store => {
        const index = stores.indexOf(store);
        return { store, index, months: Array.from({length: 12}, (_, month) => Number((base[index] + ((month % 4) - 1.5) * 0.35 + (index % 2 ? -0.15 : 0.1)).toFixed(1))) };
      });
      content.innerHTML = '';
      const filter = document.createElement('div'); filter.className = 'mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3';
      const filterLabel = document.createElement('span'); filterLabel.className = 'text-sm font-semibold text-gray-700'; filterLabel.textContent = '门店'; filter.appendChild(filterLabel);
      const select = document.createElement('select'); select.multiple = true; select.size = 1; select.className = 'min-w-[240px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700'; stores.forEach(store => { const option = document.createElement('option'); option.value = store; option.textContent = store; option.selected = selectedStores.includes(store); select.appendChild(option); }); select.title = '按住 Ctrl/Command 可多选门店'; select.onchange = () => { selectedStores = Array.from(select.selectedOptions).map(option => option.value); render(); }; filter.appendChild(select); const hint = document.createElement('span'); hint.className = 'text-xs text-gray-500'; hint.textContent = '支持多选，按住 Ctrl/Command 选择多个门店'; filter.appendChild(hint); content.appendChild(filter);
      const row = document.createElement('div'); row.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;width:100%;align-items:stretch;';
      const barPanel = document.createElement('section'); barPanel.style.cssText = 'height:360px;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:16px;overflow:auto;'; barPanel.innerHTML = '<h3 class="mb-4 font-semibold text-gray-900">香化调拨满足率 · 当前值</h3>'; const max = 100; values.forEach(item => { const line = document.createElement('div'); line.className = 'mb-3 grid grid-cols-[128px_1fr_58px] items-center gap-2'; line.innerHTML = `<span class="truncate text-xs text-gray-700" title="${item.store}">${item.store}</span><div class="h-6 rounded bg-gray-100"><div class="h-6 rounded" style="width:${item.months[11] / max * 100}%;background:${colors[item.index]}"></div></div><strong class="text-right text-xs text-gray-900">${item.months[11]}%</strong>`; barPanel.appendChild(line); }); row.appendChild(barPanel);
      const linePanel = document.createElement('section'); linePanel.style.cssText = 'height:360px;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:16px;overflow:visible;'; linePanel.innerHTML = '<h3 class="mb-2 font-semibold text-gray-900">香化调拨满足率 · 月度趋势</h3>'; const chart = document.createElement('div'); chart.className = 'relative h-56 border-b border-l border-gray-200';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 1200 300'); svg.setAttribute('preserveAspectRatio', 'none'); svg.className = 'absolute inset-0 h-full w-full';
      values.forEach(item => { const points = item.months.map((value, month) => `${month / 11 * 1200},${300 - value / 100 * 300}`).join(' '); const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); polyline.setAttribute('points', points); polyline.setAttribute('fill', 'none'); polyline.setAttribute('stroke', colors[item.index]); polyline.setAttribute('stroke-width', '3'); polyline.dataset.store = item.store; svg.appendChild(polyline); }); chart.appendChild(svg); values.forEach(item => { const series = document.createElement('div'); series.className = 'absolute inset-x-0'; series.dataset.store = item.store; series.style.height = '100%'; item.months.forEach((value, month) => { const point = document.createElement('span'); point.className = 'absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white'; point.style.left = `${month / 11 * 100}%`; point.style.top = `${100 - Math.max(0, Math.min(100, (value - 90) * 10))}%`; point.style.background = colors[item.index]; point.title = `${item.store} ${month + 1}月 ${value}%`; series.appendChild(point); }); chart.appendChild(series); }); linePanel.appendChild(chart); const legend = document.createElement('div'); legend.className = 'mt-3 flex flex-wrap gap-3 text-xs'; values.forEach(item => { const button = document.createElement('button'); button.type = 'button'; button.className = 'inline-flex items-center gap-1.5 text-gray-700'; button.innerHTML = `<span class="h-2.5 w-2.5 rounded-full" style="background:${colors[item.index]}"></span>${item.store}`; button.onclick = () => { const series = chart.querySelector(`[data-store="${item.store}"]`); const hidden = series.hidden; series.hidden = !hidden; button.classList.toggle('opacity-40', !hidden); }; legend.appendChild(button); }); linePanel.appendChild(legend); row.appendChild(linePanel); content.appendChild(row);
      // The quality chart intentionally uses two fixed side-by-side containers; no table is rendered here.
    };
    render();
  };
  const renderQualityCategoriesV2 = () => {
    const overview = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.trim() === '指标总览');
    const root = overview?.closest('.bg-gradient-to-br');
    const qualityTab = root && Array.from(root.querySelectorAll('button')).find(button => button.textContent.includes('质量指标') && button.className.includes('bg-blue-600'));
    const content = root?.querySelector('.mt-6');
    if (!root || !qualityTab || !content) return;
    const categories = {
      '调拨满足率': ['香化调拨满足率'],
      '快递交付': ['邮寄遗失率', '邮寄破损率'],
      '客诉情况': ['快递有责客诉率', '物流有责客诉率'],
      '准确率盘点情况': ['库存准确率', '效期准确率']
    };
    const activeCategory = Object.keys(categories).find(name => Array.from(root.querySelectorAll('button')).some(button => button.textContent.includes(name) && (button.className.includes('scale-105') || button.className.includes('shadow-md')))) || '调拨满足率';
    if (content.dataset.qualityV2Category === activeCategory) return;
    content.dataset.qualityV2Category = activeCategory;
    content.innerHTML = '';
    const stores = ['三亚海棠湾店', '新海港店', '三亚凤凰机场店', '海口美兰机场店', '海口日月店', '博鳌店'];
    const colors = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#0891b2', '#dc2626'];
    const metricConfig = {
      '香化调拨满足率': { target: 97, min: 90, max: 100, base: [95.2, 94.6, 96.1, 93.8, 95.7, 94.9] },
      '邮寄遗失率': { target: .1, min: 0, max: .5, base: [.08, .06, .11, .07, .09, .05] },
      '邮寄破损率': { target: .1, min: 0, max: .5, base: [.2, .16, .24, .18, .21, .14] },
      '快递有责客诉率': { target: .1, min: 0, max: .6, base: [.25, .22, .31, .19, .27, .18] },
      '物流有责客诉率': { target: .1, min: 0, max: .6, base: [.38, .34, .42, .29, .36, .27] },
      '库存准确率': { target: 99, min: 95, max: 100, base: [98.5, 98.8, 98.2, 98.6, 98.4, 98.7] },
      '效期准确率': { target: 96, min: 90, max: 100, base: [95.8, 96.1, 95.5, 96.3, 96, 96.4] }
    };
    const createSvg = (metric, series) => {
      const NS = 'http://www.w3.org/2000/svg', width = 1000, height = 260, left = 58, right = 20, top = 18, bottom = 38;
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.style.cssText = 'display:block;width:100%;height:250px;overflow:visible;';
      const x = month => left + month / 11 * (width - left - right); const y = value => top + (metric.max - value) / (metric.max - metric.min) * (height - top - bottom);
      for (let step = 0; step <= 4; step += 1) { const value = metric.min + (metric.max - metric.min) * step / 4; const yy = y(value); const grid = document.createElementNS(NS, 'line'); grid.setAttribute('x1', left); grid.setAttribute('x2', width - right); grid.setAttribute('y1', yy); grid.setAttribute('y2', yy); grid.setAttribute('stroke', '#e5e7eb'); grid.setAttribute('stroke-dasharray', '3 4'); svg.appendChild(grid); const label = document.createElementNS(NS, 'text'); label.setAttribute('x', left - 8); label.setAttribute('y', yy + 4); label.setAttribute('text-anchor', 'end'); label.setAttribute('font-size', '11'); label.setAttribute('fill', '#6b7280'); label.textContent = `${Number(value.toFixed(2))}%`; svg.appendChild(label); }
      for (let month = 0; month < 12; month += 1) { const xx = x(month); const label = document.createElementNS(NS, 'text'); label.setAttribute('x', xx); label.setAttribute('y', height - 12); label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '11'); label.setAttribute('fill', '#6b7280'); label.textContent = `${month + 1}月`; svg.appendChild(label); }
      const target = document.createElementNS(NS, 'line'); target.setAttribute('x1', left); target.setAttribute('x2', width - right); target.setAttribute('y1', y(metric.target)); target.setAttribute('y2', y(metric.target)); target.setAttribute('stroke', '#ef4444'); target.setAttribute('stroke-dasharray', '6 4'); target.setAttribute('stroke-width', '1.5'); svg.appendChild(target);
      series.forEach(item => { const group = document.createElementNS(NS, 'g'); group.dataset.store = item.store; const polyline = document.createElementNS(NS, 'polyline'); polyline.setAttribute('points', item.months.map((value, month) => `${x(month)},${y(value)}`).join(' ')); polyline.setAttribute('fill', 'none'); polyline.setAttribute('stroke', colors[item.index]); polyline.setAttribute('stroke-width', '2'); group.appendChild(polyline); item.months.forEach((value, month) => { const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('cx', x(month)); dot.setAttribute('cy', y(value)); dot.setAttribute('r', '3.5'); dot.setAttribute('fill', '#fff'); dot.setAttribute('stroke', colors[item.index]); dot.setAttribute('stroke-width', '2'); const title = document.createElementNS(NS, 'title'); title.textContent = `${item.store} ${month + 1}月 ${value.toFixed(2)}%`; dot.appendChild(title); group.appendChild(dot); }); svg.appendChild(group); }); return svg;
    };
    categories[activeCategory].forEach(metricName => {
      const metric = metricConfig[metricName]; const series = stores.map((store, index) => ({ store, index, months: Array.from({ length: 12 }, (_, month) => { const delta = ((month % 4) - 1.5) * (metric.max - metric.min) * .018 + (index % 2 ? -.01 : .01) * (metric.max - metric.min); return Number(Math.max(metric.min, Math.min(metric.max, metric.base[index] + delta)).toFixed(2)); }) }));
      const row = document.createElement('section'); row.style.cssText = 'display:grid;grid-template-columns:minmax(300px,32%) minmax(0,68%);gap:16px;width:100%;margin-bottom:16px;align-items:stretch;';
      const barPanel = document.createElement('div'); barPanel.style.cssText = 'height:310px;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:14px;'; barPanel.innerHTML = `<h3 style="font-size:14px;font-weight:600;margin:0 0 12px;color:#111827">${metricName} · 门店平均值</h3>`;
      series.forEach(item => { const average = item.months.reduce((sum, value) => sum + value, 0) / item.months.length; const ratio = (average - metric.min) / (metric.max - metric.min) * 100; const bar = document.createElement('div'); bar.dataset.store = item.store; bar.style.cssText = 'display:grid;grid-template-columns:110px minmax(0,1fr) 52px;align-items:center;gap:8px;margin-bottom:10px;'; bar.innerHTML = `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#4b5563" title="${item.store}">${item.store}</span><div style="height:18px;border-radius:3px;background:#f3f4f6"><div style="height:18px;width:${Math.max(3, ratio)}%;border-radius:3px;background:${colors[item.index]}"></div></div><strong style="text-align:right;font-size:12px;color:#111827">${average.toFixed(2)}%</strong>`; barPanel.appendChild(bar); }); row.appendChild(barPanel);
      const linePanel = document.createElement('div'); linePanel.style.cssText = 'height:310px;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:14px;'; linePanel.innerHTML = `<h3 style="font-size:14px;font-weight:600;margin:0 0 4px;color:#111827">${metricName} · 月度趋势</h3>`; const svg = createSvg(metric, series); linePanel.appendChild(svg); const legend = document.createElement('div'); legend.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:-4px;font-size:11px;'; series.forEach(item => { const button = document.createElement('button'); button.type = 'button'; button.style.cssText = 'display:inline-flex;align-items:center;gap:5px;color:#4b5563;background:none;border:0;cursor:pointer;'; button.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:${colors[item.index]}"></span>${item.store}`; button.onclick = () => { const group = svg.querySelector(`[data-store="${item.store}"]`); const bar = barPanel.querySelector(`[data-store="${item.store}"]`); const show = group.style.display === 'none'; group.style.display = show ? '' : 'none'; bar.style.display = show ? 'grid' : 'none'; button.style.opacity = show ? '1' : '.35'; }; legend.appendChild(button); }); linePanel.appendChild(legend); row.appendChild(linePanel); content.appendChild(row);
    });
  };
  const removeNonTop300 = () => {
    document.querySelectorAll('div, span, h2, h3, h4').forEach(element => {
      if (element.children.length) return;
      if (element.textContent.trim() === '非TOP300') element.closest('.flex, .grid, section')?.remove();
    });
  };
  const enhanceTimingDetail = () => {
    const dayMetrics = ['全链路订货平均时效（一盘货）', '提货至海综保平均时效'];
    const panelTitle = Array.from(document.querySelectorAll('h2, h3, h4')).find(el => el.textContent.trim() === '指标明细');
    const panel = panelTitle?.closest('.bg-white, section');
    if (!panel) return;
    panel.querySelectorAll('table').forEach(table => {
      if (table.dataset.timingDetailReady === 'true') return;
      const headers = Array.from(table.querySelectorAll('thead th')).map(cell => cell.textContent.trim());
      const metricIndex = headers.findIndex(label => ['指标名称', '指标'].includes(label));
      if (metricIndex < 0) return;
      const rows = Array.from(table.tBodies || []).flatMap(body => Array.from(body.rows));
      const target = rows.find(row => row.textContent.includes('门店提货至上架平均时效'));
      if (!target || target.dataset.timingOverall) return;
      const details = rows.filter(row => row !== target && row.textContent.includes('门店提货至上架平均时效'));
      target.dataset.timingOverall = 'true';
      target.classList.add('cursor-pointer', 'bg-blue-50');
      target.title = '点击展开/收起门店明细';
      details.forEach(row => { row.hidden = true; row.dataset.timingDetail = 'true'; });
      target.addEventListener('click', () => {
        const expanded = target.getAttribute('aria-expanded') === 'true';
        target.setAttribute('aria-expanded', String(!expanded));
        details.forEach(row => { row.hidden = expanded; });
      });
      const cell = target.cells[metricIndex];
      if (cell && !cell.querySelector('[data-overall-badge]')) {
        const badge = document.createElement('span');
        badge.dataset.overallBadge = 'true'; badge.className = 'ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700'; badge.textContent = '整体';
        cell.appendChild(badge);
      }
      table.dataset.timingDetailReady = 'true';
    });
  };
  const applyRequestedStoreTables = () => {
    const locateHeading = name => Array.from(document.querySelectorAll('h3,h4,div,p')).find(el => el.children.length === 0 && el.textContent.trim().includes(name));
    const pickupHeading = locateHeading('门店提货至上架平均时效');
    const pickupTable = pickupHeading?.parentElement?.querySelector('table') || pickupHeading?.nextElementSibling?.querySelector('table');
    if (pickupTable && !pickupTable.dataset.requestedStoreReady) {
      const head = pickupTable.tHead?.rows?.[0]; const body = pickupTable.tBodies?.[0];
      if (head && body) {
        const labels = Array.from(head.cells).map(c => c.textContent.trim());
        const store = labels.indexOf('门店'); const monthly = labels.indexOf('月度均值');
        if (store >= 0 && monthly >= 0) {
          const original = Array.from(body.rows);
          head.innerHTML = ''; ['门店','品类','目标值','日度均值','月度均值'].forEach(text => { const th = document.createElement('th'); th.className = 'px-3 py-2 text-center'; th.textContent = text; head.appendChild(th); });
          body.innerHTML = '';
          original.forEach((old, index) => { const name = old.cells[store]?.textContent.trim() || (index ? '门店明细' : '整体'); const value = old.cells[monthly]?.textContent.trim() || '-'; const row = body.insertRow(); [name, '门店提货至上架', '-', value, value].forEach(text => { const td = row.insertCell(); td.className = 'px-3 py-2 text-center'; td.textContent = text; }); });
          pickupTable.dataset.requestedStoreReady = 'true';
        }
      }
    }
    const stageTab = Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '门店段' && /purple|blue|indigo|text-white|scale-105/.test(button.className));
    if (!stageTab) return;
    const stageRoot = stageTab.closest('section') || stageTab.parentElement?.parentElement;
    stageRoot?.querySelectorAll('table').forEach(table => {
      if (table.dataset.requestedStageReady || !table.offsetParent) return;
      const head = table.tHead?.rows?.[0]; const body = table.tBodies?.[0];
      if (!head || !body || !head.textContent.includes('门店')) return;
      const labels = Array.from(head.cells).map(c => c.textContent.trim()); const store = labels.indexOf('门店'); const monthly = labels.indexOf('月度均值');
      if (store < 0 || monthly < 0) return;
      const original = Array.from(body.rows); head.innerHTML = ''; ['门店','品类','目标值','日度均值','月度均值'].forEach(text => { const th=document.createElement('th'); th.className='px-3 py-2 text-center'; th.textContent=text; head.appendChild(th); }); body.innerHTML='';
      original.forEach((old,index) => { const name=old.cells[store]?.textContent.trim() || (index?'门店明细':'整体'); const value=old.cells[monthly]?.textContent.trim() || '-'; const row=body.insertRow(); [name,'门店段指标','-',value,value].forEach(text=>{const td=row.insertCell();td.className='px-3 py-2 text-center';td.textContent=text;}); }); table.dataset.requestedStageReady='true';
    });
  };
  const normalizeStorePickupTables = () => {
    document.querySelectorAll('table').forEach(table => {
      if (table.dataset.storePickupFixed || !table.textContent.includes('门店提货至上架平均时效')) return;
      const head = table.tHead?.rows?.[0]; const body = table.tBodies?.[0];
      if (!head || !body) return;
      const labels = Array.from(head.cells).map(cell => cell.textContent.trim());
      const metricIndex = labels.findIndex(label => ['指标名称', '指标', '具体指标'].includes(label));
      if (metricIndex < 0) return;
      const overall = Array.from(body.rows).find(row => row.textContent.includes('门店提货至上架平均时效'));
      if (!overall) return;
      const details = Array.from(body.rows).filter(row => row !== overall && row.textContent.includes('门店提货至上架平均时效'));
      details.forEach(row => { row.hidden = true; });
      overall.classList.add('cursor-pointer', 'bg-blue-50'); overall.title = '点击展开/收起门店明细'; overall.setAttribute('aria-expanded', 'false');
      overall.addEventListener('click', () => { const open = overall.getAttribute('aria-expanded') === 'true'; overall.setAttribute('aria-expanded', String(!open)); details.forEach(row => { row.hidden = open; }); });
      const cell = overall.cells[metricIndex];
      if (cell && !cell.querySelector('[data-overall-badge]')) { const badge = document.createElement('span'); badge.dataset.overallBadge = 'true'; badge.className = 'ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700'; badge.textContent = '整体'; cell.appendChild(badge); }
      table.dataset.storePickupFixed = 'true';
    });
  };
  const normalizeTrendAxes = () => {
    const dayMetrics = ['全链路订货平均时效（一盘货）', '提货至海综保平均时效'];
    const title = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.includes('时效变化趋势'));
    const panel = title?.parentElement;
    if (!panel) return;
    panel.querySelectorAll('svg').forEach(svg => {
      const metric = Array.from(document.querySelectorAll('button, select option, td')).map(el => el.textContent.trim()).find(name => name.includes('平均时效')) || '';
      const axis = dayMetrics.some(name => metric.includes(name)) ? '时效/天（D）' : '时效/小时（H）';
      if (!svg.querySelector('[data-timing-axis-label]')) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.dataset.timingAxisLabel = 'true'; label.setAttribute('transform', 'translate(14 150) rotate(-90)'); label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '11'); label.setAttribute('fill', '#6b7280'); label.textContent = axis; svg.appendChild(label);
      }
    });
  };
  const enhanceStoreStageMetrics = () => {
    document.querySelectorAll('table').forEach(table => {
      const headerRow = table.tHead?.rows?.[0];
      const headers = headerRow ? Array.from(headerRow.cells).map(cell => cell.textContent.trim()) : [];
      const stageIndex = headers.indexOf('业务环节');
      if (stageIndex < 0 || !Array.from(table.tBodies || []).some(body => Array.from(body.rows).some(row => row.textContent.includes('门店段')))) return;
      if (table.dataset.storeStageReady === 'true') return;
      const rows = Array.from(table.tBodies || []).flatMap(body => Array.from(body.rows));
      const keep = ['门店', '品类', '目标值', '日度均值', '月度均值'];
      Array.from(headerRow.cells).forEach((cell, index) => {
        const label = headers[index];
        if (!keep.includes(label)) { cell.hidden = true; rows.forEach(row => { const offset = headers.length - row.cells.length; const actual = row.cells[index - offset]; if (actual) actual.hidden = true; }); }
        else if (label === '业务环节') cell.textContent = '品类';
      });
      const storeIndex = headers.indexOf('门店');
      rows.forEach((row, index) => {
        const storeCell = row.cells[storeIndex >= 0 ? storeIndex : 0];
        if (!storeCell || !storeCell.textContent.trim() || storeCell.textContent.trim() === '整体') return;
        if (storeCell.rowSpan > 1) {
          const span = storeCell.rowSpan;
          const details = rows.slice(index + 1, index + span);
          details.forEach(detail => { detail.hidden = true; detail.dataset.storeDetail = 'true'; });
          storeCell.classList.add('cursor-pointer', 'text-blue-700');
          storeCell.title = '点击查看拆分后的明细指标';
          storeCell.setAttribute('aria-expanded', 'false');
          storeCell.addEventListener('click', () => {
            const expanded = storeCell.getAttribute('aria-expanded') === 'true';
            storeCell.setAttribute('aria-expanded', String(!expanded));
            details.forEach(detail => { detail.hidden = expanded; });
          });
        }
      });
      table.dataset.storeStageReady = 'true';
    });
  };
  const rebuildStoreStageTables = () => {
    const stageTab = Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '门店段' && !button.disabled);
    if (!stageTab) return;
    // The active tab is purple in the current prototype, not blue.
    const active = stageTab.getAttribute('aria-selected') === 'true' || /blue|purple|indigo|scale-105/.test(stageTab.className) || stageTab.className.includes('text-white');
    if (!active) return;
    const heading = Array.from(document.querySelectorAll('h2,h3,h4')).find(el => el.textContent.trim() === '门店段');
    const root = heading?.parentElement?.parentElement || stageTab.parentElement?.parentElement;
    if (!root) return;
    root.querySelectorAll('table').forEach(table => {
      if (table.dataset.storeStageRebuilt === 'true') return;
      const header = table.tHead?.rows?.[0]; const body = table.tBodies?.[0];
      if (!header || !body || !header.textContent.includes('门店')) return;
      const cells = Array.from(header.cells); const storeIndex = cells.findIndex(cell => cell.textContent.trim() === '门店');
      const monthIndex = cells.findIndex(cell => cell.textContent.trim() === '月度均值');
      if (storeIndex < 0 || monthIndex < 0) return;
      const originalRows = Array.from(body.rows).filter(row => row.cells.length);
      const stores = originalRows.map(row => row.cells[storeIndex]?.textContent.trim()).filter(Boolean);
      if (!stores.length) return;
      const average = originalRows[0].cells[monthIndex]?.textContent.trim() || '-';
      const category = table.closest('section')?.querySelector('h4, h3')?.textContent.trim() || '门店段';
      header.innerHTML = '';
      ['门店', '品类', '目标值', '日度均值', '月度均值'].forEach(label => { const th = document.createElement('th'); th.className = 'px-3 py-2 text-center'; th.textContent = label; header.appendChild(th); });
      body.innerHTML = '';
      const overall = body.insertRow(); overall.className = 'cursor-pointer bg-blue-50'; overall.title = '点击查看拆分后的明细指标';
      [stores[0] || '整体', category, '-', average, average].forEach(value => { const td = overall.insertCell(); td.className = 'px-3 py-2 text-center'; td.textContent = value; });
      const detailRows = stores.map((store, index) => { const row = body.insertRow(); row.hidden = true; row.className = 'store-stage-detail'; [store, `${category}（${index % 2 ? '明细' : '分项'}）`, '-', average, average].forEach(value => { const td = row.insertCell(); td.className = 'px-3 py-2 text-center'; td.textContent = value; }); return row; });
      overall.addEventListener('click', () => { const expanded = overall.getAttribute('aria-expanded') === 'true'; overall.setAttribute('aria-expanded', String(!expanded)); detailRows.forEach(row => { row.hidden = expanded; }); });
      overall.setAttribute('aria-expanded', 'false');
      table.dataset.storeStageRebuilt = 'true';
    });
  };
  const formatRequestedTimingTables = () => {
    document.querySelectorAll('table').forEach(table => {
      const text = table.textContent || ''; if (!text.includes('门店提货至上架平均时效') && !text.includes('门店段')) return;
      const head = table.tHead?.rows?.[0]; const body = table.tBodies?.[0]; if (!head || !body) return;
      const labels = Array.from(head.cells).map(c => c.textContent.trim()); const target = labels.findIndex(x => x.includes('目标值')); if (target < 0) return;
      const targetCell = Array.from(body.rows).map(r => r.cells[target]).find(c => c && /(?:D|H|天|小时)/i.test(c.textContent)); if (!targetCell) return;
      const unit = /天|D/i.test(targetCell.textContent) ? 'D' : 'H';
      Array.from(body.rows).forEach(row => Array.from(row.cells).forEach(cell => { const m=cell.textContent.trim().match(/^(\d+(?:\.\d+)?)(天|D|小时|H)$/i); if(!m) return; let v=Number(m[1]); const source=/天|D/i.test(m[2])?'D':'H'; if(source!==unit)v=source==='D'?v*24:v/24; cell.textContent=`${Number(v.toFixed(4))}${unit}`; }));
    });
  };
  // Leave the application table layout and click behavior intact.
  const remove7063Notice = () => {
    document.querySelectorAll('body *').forEach(element => {
      if (element.children.length) return;
      const text = element.textContent.trim();
      if (text.includes('当前仅展示门店【7063】的拆分指标明细。') || text.includes('7063 指标明细')) element.remove();
    });
  };
  const run = () => { remove7063Notice(); formatRequestedTimingTables(); normalizeTimingTargetUnits(); };
  const start = () => { run(); setInterval(run, 300); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
