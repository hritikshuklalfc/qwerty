/* ============================================================
   SYNAPSE OS — Dashboard Controller
   KPIs, activity feed, agent status grid, supply health
   ============================================================ */

class Dashboard {
  constructor(simulator) {
    this.simulator = simulator;
    this.kpis = {
      revenue:       { value: 145000, target: 180000, trend: 12.4 },
      orders:        { value: 847,    target: 1000,   trend: 8.2 },
      fulfillment:   { value: 96.8,   target: 99,     trend: 2.1 },
      agentActions:  { value: 0,      target: null,    trend: 0 },
    };
    this.supplyHealth = 94;
    this.activityItems = [];
    this.maxActivityItems = 50;
  }

  init() {
    this._renderKPIs();
    this._renderAgentGrid();
    this._renderSupplyHealth();
    this._renderApprovals();
    this._bindSimulatorEvents();
    this._startKPIUpdates();
  }

  _renderKPIs() {
    const container = document.getElementById('kpi-row');
    if (!container) return;

    const kpiData = [
      { id: 'revenue', label: 'Monthly Revenue', value: this.kpis.revenue.value, prefix: '$', format: 'currency', trend: this.kpis.revenue.trend, icon: '💎' },
      { id: 'orders', label: 'Total Orders', value: this.kpis.orders.value, prefix: '', format: 'number', trend: this.kpis.orders.trend, icon: '📦' },
      { id: 'fulfillment', label: 'Fulfillment Rate', value: this.kpis.fulfillment.value, suffix: '%', format: 'percent', trend: this.kpis.fulfillment.trend, icon: '🎯' },
      { id: 'agent-actions', label: 'Agent Actions', value: this.kpis.agentActions.value, prefix: '', format: 'number', trend: 0, icon: '🤖' },
    ];

    container.innerHTML = kpiData.map(kpi => `
      <div class="kpi-card glass-card" id="kpi-${kpi.id}">
        <div class="kpi-card__header">
          <span class="kpi-card__label">${kpi.icon} ${kpi.label}</span>
          <span class="kpi-card__trend ${kpi.trend >= 0 ? 'up' : 'down'}">
            ${kpi.trend >= 0 ? '↑' : '↓'} ${Math.abs(kpi.trend)}%
          </span>
        </div>
        <div class="kpi-card__value counter-animate" data-kpi="${kpi.id}">
          ${kpi.prefix || ''}${this._formatNumber(kpi.value, kpi.format)}${kpi.suffix || ''}
        </div>
        <div class="kpi-card__sparkline" id="sparkline-${kpi.id}"></div>
      </div>
    `).join('');

    // Generate sparklines
    kpiData.forEach(kpi => {
      this._renderSparkline(`sparkline-${kpi.id}`, kpi.id);
    });
  }

  _renderSparkline(containerId, kpiId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Generate fake historical data
    const points = 20;
    const data = [];
    let val = 50;
    for (let i = 0; i < points; i++) {
      val += (Math.random() - 0.45) * 15;
      val = Math.max(10, Math.min(90, val));
      data.push(val);
    }

    const width = container.offsetWidth || 200;
    const height = 32;
    const color = kpiId === 'revenue' ? '#00e5cc' : kpiId === 'orders' ? '#9966ff' : kpiId === 'fulfillment' ? '#33cc88' : '#ff6699';

    const stepX = width / (points - 1);
    let pathD = `M 0 ${height - data[0] * height / 100}`;
    for (let i = 1; i < points; i++) {
      const x = i * stepX;
      const y = height - data[i] * height / 100;
      pathD += ` L ${x} ${y}`;
    }

    const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`;

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad-${kpiId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaD}" fill="url(#grad-${kpiId})" />
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  _renderAgentGrid() {
    const container = document.getElementById('agent-grid');
    if (!container) return;

    const agents = Object.values(this.simulator.agents);
    container.innerHTML = agents.map(agent => `
      <div class="agent-card glass-card" data-agent="${agent.id}" id="agent-card-${agent.id}">
        <div class="agent-card__icon">${agent.icon}</div>
        <div class="agent-card__name">${agent.id}</div>
        <div class="agent-card__status">
          <span class="status-dot active" id="status-dot-${agent.id}"></span>
          <span id="status-text-${agent.id}">Idle</span>
        </div>
        <div class="agent-card__actions" id="action-count-${agent.id}">${agent.actions} actions</div>
      </div>
    `).join('');
  }

  _renderSupplyHealth() {
    const container = document.getElementById('supply-health-gauge');
    if (!container) return;

    const circumference = 2 * Math.PI * 65;
    const offset = circumference - (this.supplyHealth / 100) * circumference;
    const color = this.supplyHealth > 80 ? 'var(--color-emerald)' : this.supplyHealth > 50 ? 'var(--color-amber)' : 'var(--color-rose)';

    container.innerHTML = `
      <div class="gauge-circle">
        <svg viewBox="0 0 160 160">
          <circle class="gauge-circle__bg" cx="80" cy="80" r="65" />
          <circle class="gauge-circle__fill" cx="80" cy="80" r="65"
            stroke="${color}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            id="gauge-fill"
          />
        </svg>
        <div class="gauge-circle__value">
          <span class="gauge-circle__number" id="gauge-number">${this.supplyHealth}%</span>
          <span class="gauge-circle__label">Health</span>
        </div>
      </div>
    `;

    // Render metrics
    const metricsContainer = document.getElementById('supply-metrics');
    if (metricsContainer) {
      metricsContainer.innerHTML = `
        <div class="supply-metric">
          <div class="supply-metric__label">On-Time Delivery</div>
          <div class="supply-metric__value" style="color: var(--color-emerald)">94.2%</div>
        </div>
        <div class="supply-metric">
          <div class="supply-metric__label">Stockout Risk</div>
          <div class="supply-metric__value" style="color: var(--color-amber)">Low</div>
        </div>
        <div class="supply-metric">
          <div class="supply-metric__label">Active Shipments</div>
          <div class="supply-metric__value">12</div>
        </div>
        <div class="supply-metric">
          <div class="supply-metric__label">Avg Lead Time</div>
          <div class="supply-metric__value">3.2 days</div>
        </div>
      `;
    }
  }

  _renderApprovals() {
    const container = document.getElementById('approval-list');
    const countEl = document.getElementById('approval-count');
    if (!container) return;

    // Show initial sample approvals
    const sampleApprovals = [
      { id: 'APR-001', type: 'Purchase Order', amount: 12450, description: 'Restock Widget B from TechParts Co.', timestamp: new Date(Date.now() - 3600000) },
      { id: 'APR-002', type: 'Price Override', amount: 890, description: 'Bulk discount for Tier-1 client', timestamp: new Date(Date.now() - 7200000) },
    ];

    const all = [...sampleApprovals, ...this.simulator.pendingApprovals];
    if (countEl) countEl.textContent = all.length;

    container.innerHTML = all.map(a => `
      <div class="approval-item slide-up-fade" id="approval-${a.id}">
        <div class="approval-item__header">
          <span class="approval-item__type badge-amber badge">${a.type}</span>
          <span class="approval-item__amount">$${a.amount.toLocaleString()}</span>
        </div>
        <div class="approval-item__desc">${a.description}</div>
        <div class="approval-item__meta">
          <span>🕐 ${this._timeAgo(a.timestamp)}</span>
          <span>ID: ${a.id}</span>
        </div>
        <div class="approval-item__actions">
          <button class="btn-approve ripple" onclick="window.app.approveItem('${a.id}')">✓ Approve</button>
          <button class="btn-reject ripple" onclick="window.app.rejectItem('${a.id}')">✗ Reject</button>
        </div>
      </div>
    `).join('');
  }

  addActivityItem(entry) {
    this.activityItems.unshift(entry);
    if (this.activityItems.length > this.maxActivityItems) {
      this.activityItems.pop();
    }
    this._renderActivityItem(entry);
    this._updateAgentCard(entry.agentId);
    this._updateKPI('agent-actions', this._getTotalActions());
  }

  _renderActivityItem(entry) {
    const list = document.getElementById('activity-list');
    if (!list) return;

    const colorMap = {
      inventory: 'var(--agent-inventory)',
      procurement: 'var(--agent-procurement)',
      finance: 'var(--agent-finance)',
      logistics: 'var(--agent-logistics)',
      pricing: 'var(--agent-pricing)',
    };

    const bgMap = {
      inventory: 'hsla(185, 100%, 55%, 0.1)',
      procurement: 'hsla(265, 90%, 65%, 0.1)',
      finance: 'hsla(38, 100%, 60%, 0.1)',
      logistics: 'hsla(155, 80%, 50%, 0.1)',
      pricing: 'hsla(350, 90%, 60%, 0.1)',
    };

    const el = document.createElement('div');
    el.className = 'activity-item';
    el.innerHTML = `
      <div class="activity-item__icon" style="background: ${bgMap[entry.agentId]}; color: ${colorMap[entry.agentId]}">
        ${entry.agent.icon}
      </div>
      <div class="activity-item__content">
        <div class="activity-item__text">
          <strong>${entry.agent.name}</strong> ${entry.message}
        </div>
        <div class="activity-item__time">${this._formatTime(entry.timestamp)}</div>
      </div>
    `;

    list.insertBefore(el, list.firstChild);

    // Remove old items
    while (list.children.length > this.maxActivityItems) {
      list.removeChild(list.lastChild);
    }
  }

  _updateAgentCard(agentId) {
    const agent = this.simulator.agents[agentId];
    if (!agent) return;

    const statusDot = document.getElementById(`status-dot-${agentId}`);
    const statusText = document.getElementById(`status-text-${agentId}`);
    const actionCount = document.getElementById(`action-count-${agentId}`);

    if (statusDot) {
      statusDot.className = `status-dot ${agent.status === 'processing' ? 'processing' : 'active'}`;
    }
    if (statusText) {
      statusText.textContent = agent.status === 'processing' ? 'Processing' : 'Active';
    }
    if (actionCount) {
      actionCount.textContent = `${agent.actions} actions`;
    }
  }

  _updateKPI(kpiId, value) {
    const el = document.querySelector(`[data-kpi="${kpiId}"]`);
    if (!el) return;

    el.textContent = this._formatNumber(value, 'number');
    el.classList.add('changed');
    setTimeout(() => el.classList.remove('changed'), 300);
  }

  _bindSimulatorEvents() {
    this.simulator.on('activity', (entry) => {
      this.addActivityItem(entry);
    });

    this.simulator.on('agent-status', ({ agentId, status }) => {
      this._updateAgentCard(agentId);
    });

    this.simulator.on('approval-added', (approval) => {
      this._renderApprovals();
    });
  }

  _startKPIUpdates() {
    setInterval(() => {
      // Simulate small KPI changes
      this.kpis.revenue.value += Math.floor(Math.random() * 200 - 50);
      this.kpis.orders.value += Math.random() > 0.7 ? 1 : 0;

      const revenueEl = document.querySelector('[data-kpi="revenue"]');
      if (revenueEl) {
        revenueEl.textContent = '$' + this._formatNumber(this.kpis.revenue.value, 'currency');
      }

      const ordersEl = document.querySelector('[data-kpi="orders"]');
      if (ordersEl) {
        ordersEl.textContent = this._formatNumber(this.kpis.orders.value, 'number');
      }
    }, 5000);
  }

  _getTotalActions() {
    return Object.values(this.simulator.agents).reduce((s, a) => s + a.actions, 0);
  }

  _formatNumber(num, format) {
    if (format === 'currency') {
      return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    if (format === 'percent') {
      return num.toFixed(1);
    }
    return num.toLocaleString();
  }

  _formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  _timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }
}

window.Dashboard = Dashboard;
