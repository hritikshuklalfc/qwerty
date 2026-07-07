/* ============================================================
   SYNAPSE OS — Charts
   Lightweight SVG-based charting (no dependencies)
   ============================================================ */

class Charts {
  constructor() {
    this.charts = {};
  }

  init() {
    this.renderRevenueChart('chart-revenue');
    this.renderInventoryChart('chart-inventory');
    this.renderAgentWorkloadChart('chart-workload');
  }

  renderRevenueChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const revenue = [98000, 112000, 108000, 125000, 132000, 141000, 145000];
    const expenses = [72000, 78000, 82000, 85000, 89000, 94000, 98000];

    const width = container.offsetWidth || 500;
    const height = 220;
    const padding = { top: 20, right: 20, bottom: 35, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...revenue) * 1.1;

    const xScale = (i) => padding.left + (i / (months.length - 1)) * chartW;
    const yScale = (v) => padding.top + chartH - (v / maxVal) * chartH;

    // Build paths
    let revenuePath = `M ${xScale(0)} ${yScale(revenue[0])}`;
    let expensePath = `M ${xScale(0)} ${yScale(expenses[0])}`;
    let revenueArea = `M ${xScale(0)} ${yScale(revenue[0])}`;

    for (let i = 1; i < months.length; i++) {
      // Smooth curves using cubic bezier
      const prevX = xScale(i - 1), prevY = yScale(revenue[i - 1]);
      const currX = xScale(i), currY = yScale(revenue[i]);
      const cpX = (prevX + currX) / 2;
      revenuePath += ` C ${cpX} ${prevY}, ${cpX} ${currY}, ${currX} ${currY}`;
      revenueArea += ` C ${cpX} ${prevY}, ${cpX} ${currY}, ${currX} ${currY}`;

      const ePrevY = yScale(expenses[i - 1]);
      const eCurrY = yScale(expenses[i]);
      expensePath += ` C ${cpX} ${ePrevY}, ${cpX} ${eCurrY}, ${currX} ${eCurrY}`;
    }

    revenueArea += ` L ${xScale(months.length - 1)} ${padding.top + chartH} L ${xScale(0)} ${padding.top + chartH} Z`;

    // Grid lines
    let gridLines = '';
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (i / gridSteps) * chartH;
      const val = maxVal - (i / gridSteps) * maxVal;
      gridLines += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
      gridLines += `<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="10" font-family="JetBrains Mono, monospace">$${(val / 1000).toFixed(0)}k</text>`;
    }

    // X-axis labels
    let xLabels = '';
    months.forEach((m, i) => {
      xLabels += `<text x="${xScale(i)}" y="${padding.top + chartH + 20}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="10" font-family="Inter, sans-serif">${m}</text>`;
    });

    // Dots
    let revenueDots = revenue.map((v, i) => `
      <circle cx="${xScale(i)}" cy="${yScale(v)}" r="3.5" fill="#00e5cc" stroke="rgba(10,12,20,1)" stroke-width="2">
        <title>${months[i]}: $${v.toLocaleString()}</title>
      </circle>
    `).join('');

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="revenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00e5cc" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#00e5cc" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${gridLines}
        ${xLabels}
        <path d="${revenueArea}" fill="url(#revenueGrad)" />
        <path d="${expensePath}" fill="none" stroke="#9966ff" stroke-width="2" stroke-dasharray="4 4" opacity="0.5" stroke-linecap="round"/>
        <path d="${revenuePath}" fill="none" stroke="#00e5cc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${revenueDots}
      </svg>
      <div style="display:flex; gap:16px; justify-content:center; margin-top:8px;">
        <span style="font-size:11px; color:rgba(255,255,255,0.5); display:flex; align-items:center; gap:4px;">
          <span style="width:12px; height:2px; background:#00e5cc; display:inline-block; border-radius:1px;"></span> Revenue
        </span>
        <span style="font-size:11px; color:rgba(255,255,255,0.5); display:flex; align-items:center; gap:4px;">
          <span style="width:12px; height:2px; background:#9966ff; display:inline-block; border-radius:1px; border-top: 1px dashed #9966ff;"></span> Expenses
        </span>
      </div>
    `;
  }

  renderInventoryChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = [
      { name: 'Widget A', qty: 450, max: 600, color: '#00e5cc' },
      { name: 'Widget B', qty: 120, max: 600, color: '#9966ff' },
      { name: 'Comp. X', qty: 800, max: 1000, color: '#33cc88' },
      { name: 'Module Y', qty: 65, max: 600, color: '#ffaa33' },
      { name: 'Sensor Z', qty: 290, max: 600, color: '#ff6699' },
    ];

    const width = container.offsetWidth || 500;
    const height = 220;
    const padding = { top: 15, right: 20, bottom: 35, left: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barH = 24;
    const gap = (chartH - barH * items.length) / (items.length + 1);

    let bars = '';
    items.forEach((item, i) => {
      const y = padding.top + gap + i * (barH + gap);
      const barW = (item.qty / item.max) * chartW;
      const isLow = item.qty < 150;

      bars += `
        <text x="${padding.left - 8}" y="${y + barH / 2 + 4}" text-anchor="end" fill="rgba(255,255,255,0.5)" font-size="10" font-family="Inter, sans-serif">${item.name}</text>
        <rect x="${padding.left}" y="${y}" width="${chartW}" height="${barH}" rx="4" fill="rgba(255,255,255,0.03)"/>
        <rect x="${padding.left}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${item.color}" opacity="0.7">
          <animate attributeName="width" from="0" to="${barW}" dur="0.8s" fill="freeze" begin="0.${i}s"/>
        </rect>
        <text x="${padding.left + barW + 8}" y="${y + barH / 2 + 4}" fill="${isLow ? '#ff6699' : 'rgba(255,255,255,0.6)'}" font-size="11" font-family="JetBrains Mono, monospace" font-weight="${isLow ? '700' : '400'}">${item.qty} ${isLow ? '⚠' : ''}</text>
      `;
    });

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        ${bars}
      </svg>
    `;
  }

  renderAgentWorkloadChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const agents = [
      { name: 'Inventory', value: 28, color: '#00e5cc' },
      { name: 'Procurement', value: 22, color: '#9966ff' },
      { name: 'Finance', value: 20, color: '#ffaa33' },
      { name: 'Logistics', value: 18, color: '#33cc88' },
      { name: 'Pricing', value: 12, color: '#ff6699' },
    ];

    const size = 180;
    const cx = size / 2, cy = size / 2, r = 65;
    const total = agents.reduce((s, a) => s + a.value, 0);

    let startAngle = -90;
    let arcs = '';
    let legend = '';
    const circumference = 2 * Math.PI * r;

    agents.forEach((agent, i) => {
      const fraction = agent.value / total;
      const dashLength = fraction * circumference;
      const dashOffset = circumference * (1 - fraction);
      const rotation = startAngle;

      arcs += `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
          stroke="${agent.color}" stroke-width="20"
          stroke-dasharray="${dashLength} ${circumference - dashLength}"
          transform="rotate(${rotation} ${cx} ${cy})"
          opacity="0.85">
        </circle>
      `;

      startAngle += fraction * 360;

      legend += `
        <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
          <span style="width:8px; height:8px; border-radius:2px; background:${agent.color}; flex-shrink:0;"></span>
          <span style="color:rgba(255,255,255,0.5);">${agent.name}</span>
          <span style="color:rgba(255,255,255,0.8); font-family:JetBrains Mono, monospace; margin-left:auto;">${agent.value}%</span>
        </div>
      `;
    });

    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:24px; justify-content:center;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="20"/>
          ${arcs}
          <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="22" font-weight="800" font-family="JetBrains Mono, monospace">${total}</text>
          <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9" text-transform="uppercase" letter-spacing="1" font-family="Inter, sans-serif">ACTIONS</text>
        </svg>
        <div style="display:flex; flex-direction:column; gap:8px; min-width:140px;">
          ${legend}
        </div>
      </div>
    `;
  }
}

window.Charts = Charts;
