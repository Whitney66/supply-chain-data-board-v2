(() => {
  const stores = ['三亚海棠湾店','新海港店','三亚凤凰机场店','海口美兰机场店','海口日月店','博鳌店'];
  const colors = ['#2563eb','#16a34a','#f97316','#9333ea','#0891b2','#dc2626'];
  const metrics = { '香化调拨满足率': [95.2,94.6,96.1,93.8,95.7,94.9], '库存准确率': [98.5,98.8,98.2,98.6,98.4,98.7], '效期准确率': [95.8,96.1,95.5,96.3,96,96.4], '邮寄遗失率': [.08,.06,.11,.07,.09,.05], '邮寄破损率': [.2,.16,.24,.18,.21,.14], '快递有责客诉率': [.25,.22,.31,.19,.27,.18], '物流有责客诉率': [.38,.34,.42,.29,.36,.27] };
  const categories = { '调拨满足率':['香化调拨满足率'], '快递交付':['邮寄遗失率','邮寄破损率'], '客诉情况':['快递有责客诉率','物流有责客诉率'], '准确率盘点情况':['库存准确率','效期准确率'] };
  let overlay;
  const activeQuality = () => { const root = document.querySelector('h2')?.closest('.bg-gradient-to-br'); return root && [...root.querySelectorAll('button')].some(b => b.textContent.includes('质量指标') && b.className.includes('bg-blue-600')); };
  const host = () => document.querySelector('h2')?.closest('.bg-gradient-to-br')?.querySelector('.mt-6');
  const draw = () => {
    const target = host(); if (!target || !activeQuality()) { if (overlay) { overlay.remove(); overlay = null; } if (target) target.style.display = ''; return; }
    target.style.display = 'none';
    if (overlay) return;
    overlay = document.createElement('div'); overlay.style.cssText='position:relative;z-index:5;width:100%;padding-top:4px;background:#eff6ff;';
    const category = [...document.querySelectorAll('button')].find(b => ['调拨满足率','快递交付','客诉情况','准确率盘点情况'].some(n => b.textContent.includes(n) && b.className.includes('scale-105')))?.textContent.trim() || '调拨满足率';
    categories[category].forEach(name => {
      const values = metrics[name]; const box = document.createElement('section'); box.style.cssText='margin:0 0 16px;padding:14px;border:1px solid #dbe3ef;border-radius:10px;background:#fff;';
      const title = document.createElement('h3'); title.style.cssText='margin:0 0 12px;padding-left:10px;border-left:4px solid #2563eb;font-size:16px;font-weight:700;color:#111827;'; title.textContent=name; box.appendChild(title);
      const columns = document.createElement('div'); columns.style.cssText='display:grid;grid-template-columns:32% 68%;gap:16px;width:100%;';
      const left = document.createElement('div'); left.style.cssText='height:310px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;box-sizing:border-box;';
      const max=Math.max(...values,1); stores.forEach((store,i)=>{ const row=document.createElement('div'); row.style.cssText='display:grid;grid-template-columns:108px minmax(0,1fr) 54px;gap:7px;align-items:center;margin:0 0 10px;'; const value=values[i]; row.innerHTML=`<span style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${store}">${store}</span><span style="height:18px;background:#f3f4f6;border-radius:3px"><i style="display:block;height:18px;width:${value/max*100}%;background:${colors[i]};border-radius:3px"></i></span><b style="font-size:12px;text-align:right">${value.toFixed(2)}%</b>`; left.appendChild(row); }); columns.appendChild(left);
      const right=document.createElement('div'); right.style.cssText='height:310px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;box-sizing:border-box;overflow:hidden;'; const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('viewBox','0 0 1000 270'); svg.style.cssText='display:block;width:100%;height:250px;'; const x=m=>55+m/11*925,y=v=>18+(max-v)/(max||1)*205; for(let s=0;s<stores.length;s++){const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.dataset.store=stores[s];const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('fill','none');line.setAttribute('stroke',colors[s]);line.setAttribute('stroke-width','2.5');line.setAttribute('points',Array.from({length:12},(_,m)=>`${x(m)},${y(values[s]+((m%4)-1.5)*.15)}`).join(' '));group.appendChild(line);Array.from({length:12},(_,m)=>{const p=document.createElementNS('http://www.w3.org/2000/svg','circle');p.setAttribute('cx',x(m));p.setAttribute('cy',y(values[s]+((m%4)-1.5)*.15));p.setAttribute('r','3.5');p.setAttribute('fill','#fff');p.setAttribute('stroke',colors[s]);p.setAttribute('stroke-width','2');group.appendChild(p);});svg.appendChild(group);} right.appendChild(svg); const legend=document.createElement('div');legend.style.cssText='display:flex;justify-content:center;gap:12px;flex-wrap:wrap;font-size:11px;';stores.forEach((store,i)=>{const b=document.createElement('button');b.type='button';b.style.cssText='border:0;background:none;cursor:pointer;color:#4b5563';b.innerHTML=`<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${colors[i]};margin-right:4px"></span>${store}`;b.onclick=()=>{const g=svg.querySelector(`[data-store="${store}"]`);const hide=g.style.display!=='none';g.style.display=hide?'none':'';b.style.opacity=hide?'.35':'1';};legend.appendChild(b);});right.appendChild(legend); columns.appendChild(right); box.appendChild(columns); overlay.appendChild(box);
    });
    target.parentNode.insertBefore(overlay,target.nextSibling);
  };
  setInterval(draw,500);
})();
