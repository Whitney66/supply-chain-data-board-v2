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
  const removeNonTop300 = () => {
    document.querySelectorAll('div, span, h2, h3, h4').forEach(element => {
      if (element.children.length) return;
      if (element.textContent.trim() === '非TOP300') element.closest('.flex, .grid, section')?.remove();
    });
  };
  const run = () => { enhanceTrend(); addControls(); mergeOverview(); hideRequestedMetrics(); normalizeMetricLabels(); };
  const start = () => { run(); setInterval(run, 300); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
