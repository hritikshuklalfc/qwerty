/* ============================================================
   SYNAPSE OS — Enhancements
   Boot screen, Command palette, Chat, FAB, Ticker, ROI, etc.
   ============================================================ */

// ── 1. CINEMATIC BOOT SCREEN ──
class BootScreen {
  constructor() {
    this.el = document.getElementById('boot-screen');
    this.statusEl = document.getElementById('boot-status');
    this.progressEl = document.getElementById('boot-progress-fill');
    this.messages = [
      'Initializing Synapse Core Engine...',
      'Loading multi-modal vision models...',
      'Connecting Inventory Agent...',
      'Connecting Procurement Agent...',
      'Connecting Finance Agent...',
      'Connecting Logistics Agent...',
      'Connecting Pricing Agent...',
      'Establishing agent mesh network...',
      'Calibrating decision intelligence...',
      'Running self-diagnostics...',
      'Syncing external data feeds...',
      'All systems operational ✓',
    ];
  }

  async run() {
    if (!this.el) return;
    for (let i = 0; i < this.messages.length; i++) {
      if (this.statusEl) this.statusEl.textContent = this.messages[i];
      const progress = ((i + 1) / this.messages.length) * 100;
      if (this.progressEl) this.progressEl.style.width = progress + '%';
      await this._delay(280 + Math.random() * 200);
    }
    await this._delay(500);
    this.el.classList.add('hidden');
    // Remove from DOM after transition
    setTimeout(() => this.el.remove(), 1000);
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}


// ── 2. COMMAND PALETTE ──
class CommandPalette {
  constructor() {
    this.overlay = document.getElementById('cmd-palette-overlay');
    this.input = document.getElementById('cmd-input');
    this.results = document.getElementById('cmd-results');
    this.isOpen = false;
    this.selectedIndex = -1;

    this.commands = [
      { group: 'Navigation', icon: '🏠', name: 'Go to Home', desc: 'Scroll to hero section', shortcut: '', action: () => this._scrollTo('home') },
      { group: 'Navigation', icon: '📊', name: 'Go to Dashboard', desc: 'Open operations dashboard', shortcut: '', action: () => this._scrollTo('dashboard') },
      { group: 'Navigation', icon: '🎮', name: 'Go to Demo', desc: 'Interactive demo section', shortcut: '', action: () => this._scrollTo('demo') },
      { group: 'Navigation', icon: '🏗️', name: 'Go to Architecture', desc: 'Technical architecture view', shortcut: '', action: () => this._scrollTo('architecture') },
      { group: 'Navigation', icon: '💰', name: 'Go to ROI Calculator', desc: 'Calculate your savings', shortcut: '', action: () => this._scrollTo('roi') },
      { group: 'Demos', icon: '📄', name: 'Run Invoice Demo', desc: 'Process an invoice through agents', shortcut: '', action: () => { this._scrollTo('demo'); setTimeout(() => window.demoFlow?.runScenario('invoice'), 800); } },
      { group: 'Demos', icon: '💬', name: 'Run WhatsApp Demo', desc: 'Process a WhatsApp order', shortcut: '', action: () => { this._scrollTo('demo'); setTimeout(() => window.demoFlow?.runScenario('whatsapp'), 800); } },
      { group: 'Demos', icon: '🌀', name: 'Run Self-Healing Demo', desc: 'Trigger supply chain disruption', shortcut: '', action: () => { this._scrollTo('demo'); setTimeout(() => window.demoFlow?.runScenario('selfhealing'), 800); } },
      { group: 'Dashboard', icon: '🤖', name: 'View Agent Swarm', desc: 'Neural network visualization', shortcut: '', action: () => { this._scrollTo('dashboard'); setTimeout(() => document.querySelector('[data-panel="panel-agents"]')?.click(), 400); } },
      { group: 'Dashboard', icon: '📈', name: 'View Analytics', desc: 'Charts and metrics', shortcut: '', action: () => { this._scrollTo('dashboard'); setTimeout(() => document.querySelector('[data-panel="panel-analytics"]')?.click(), 400); } },
      { group: 'Tools', icon: '💬', name: 'Open Agent Chat', desc: 'Chat with the agent swarm', shortcut: '', action: () => window.agentChat?.open() },
      { group: 'Tools', icon: '🔔', name: 'Show Notifications', desc: 'View recent agent activity', shortcut: '', action: () => window.app?.showToast('info', 'Notifications', '5 agents active, 3 pending approvals') },
    ];
  }

  init() {
    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Overlay click to close
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    // Input filtering
    if (this.input) {
      this.input.addEventListener('input', () => this._filter());
      this.input.addEventListener('keydown', (e) => this._handleKeyNav(e));
    }

    // Nav kbd hint
    const kbdHint = document.getElementById('nav-kbd-hint');
    if (kbdHint) {
      kbdHint.addEventListener('click', () => this.toggle());
    }

    this._renderResults(this.commands);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    if (this.overlay) this.overlay.classList.add('active');
    if (this.input) { this.input.value = ''; this.input.focus(); }
    this._renderResults(this.commands);
    this.selectedIndex = -1;
  }

  close() {
    this.isOpen = false;
    if (this.overlay) this.overlay.classList.remove('active');
  }

  _filter() {
    const query = this.input.value.toLowerCase();
    const filtered = this.commands.filter(c =>
      c.name.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query) || c.group.toLowerCase().includes(query)
    );
    this._renderResults(filtered);
    this.selectedIndex = -1;
  }

  _renderResults(cmds) {
    if (!this.results) return;

    const groups = {};
    cmds.forEach(cmd => {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    });

    let html = '';
    Object.entries(groups).forEach(([group, items]) => {
      html += `<div class="cmd-palette__group-label">${group}</div>`;
      items.forEach((item, i) => {
        const globalIndex = cmds.indexOf(item);
        html += `
          <div class="cmd-palette__item" data-index="${globalIndex}" onclick="window.cmdPalette._execute(${globalIndex})">
            <span class="cmd-palette__item-icon">${item.icon}</span>
            <div class="cmd-palette__item-text">
              <div class="cmd-palette__item-name">${item.name}</div>
              <div class="cmd-palette__item-desc">${item.desc}</div>
            </div>
            ${item.shortcut ? `<span class="cmd-palette__item-shortcut">${item.shortcut}</span>` : ''}
          </div>
        `;
      });
    });

    if (cmds.length === 0) {
      html = '<div style="padding:var(--space-6);text-align:center;color:var(--text-muted);">No commands found</div>';
    }

    this.results.innerHTML = html;
  }

  _execute(index) {
    const cmd = this.commands[index];
    if (cmd) {
      this.close();
      cmd.action();
    }
  }

  _handleKeyNav(e) {
    const items = this.results.querySelectorAll('.cmd-palette__item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
      this._highlightItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this._highlightItem(items);
    } else if (e.key === 'Enter' && this.selectedIndex >= 0) {
      e.preventDefault();
      items[this.selectedIndex]?.click();
    }
  }

  _highlightItem(items) {
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === this.selectedIndex);
      if (i === this.selectedIndex) item.scrollIntoView({ block: 'nearest' });
    });
  }

  _scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}


// ── 3. AGENT CHAT INTERFACE ──
class AgentChat {
  constructor(simulator) {
    this.simulator = simulator;
    this.panel = document.getElementById('chat-panel');
    this.messages = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.isOpen = false;

    this.responses = {
      'stock': { agent: 'Inventory Agent', icon: '📦', response: 'Current stock levels:\n• Widget A: 450 units ✅\n• Widget B: 120 units ⚠️ (below reorder)\n• Component X: 800 units ✅\n• Module Y: 65 units ❌ (critical)\n• Sensor Z: 290 units ✅' },
      'inventory': { agent: 'Inventory Agent', icon: '📦', response: 'I\'m monitoring 5 SKUs across 2 warehouses. Module Y is critically low at 65 units — I\'ve already flagged the Procurement Agent to source alternatives.' },
      'cash': { agent: 'Finance Agent', icon: '💰', response: 'Cash Flow Summary:\n• Balance: $287,450\n• Monthly Revenue: $145,000 ↑12.4%\n• Monthly Expenses: $98,000\n• Net Cash Flow: +$47,000/mo\n• Runway: 6.1 months at current burn' },
      'supplier': { agent: 'Procurement Agent', icon: '🛒', response: 'Top 3 suppliers ranked:\n1. TechParts Co. — 95% reliability, 3-day lead, 1.0x price\n2. QuickShip Inc. — 92% reliability, 1-day lead, 1.15x price\n3. GlobalSource Ltd. — 88% reliability, 7-day lead, 0.85x price\n\nRecommendation: TechParts for standard orders, QuickShip for urgent.' },
      'delivery': { agent: 'Logistics Agent', icon: '🚛', response: 'Active Shipments: 12\n• On Track: 10 ✅\n• Delayed: 1 ⚠️ (SHP-2847, rerouted via Jaipur)\n• Delivered Today: 1 ✅\n\nNext delivery: SHP-2851 arriving tomorrow 2:00 PM' },
      'price': { agent: 'Pricing Agent', icon: '📊', response: 'Current pricing strategy: STANDARD\n• No dynamic adjustments active\n• Margin average: 32.4%\n• Best performer: Widget A ($24.99, 38% margin)\n• Underperformer: Sensor Z ($35.00, 22% margin)\n\nI can activate dynamic pricing if supply disruptions are detected.' },
      'help': { agent: 'Synapse Core', icon: '🧠', response: 'I can help with:\n• "stock" or "inventory" — Check stock levels\n• "cash" or "finance" — Cash flow summary\n• "supplier" — Supplier rankings\n• "delivery" or "shipment" — Shipment status\n• "price" — Pricing analysis\n• "status" — All agent statuses\n• Or just ask anything naturally!' },
      'status': { agent: 'Synapse Core', icon: '🧠', response: 'System Status: ALL OPERATIONAL ✅\n\n📦 Inventory Agent — Active (142 actions)\n🛒 Procurement Agent — Active (98 actions)\n💰 Finance Agent — Active (87 actions)\n🚛 Logistics Agent — Active (73 actions)\n📊 Pricing Agent — Active (51 actions)\n\nUptime: 99.97% | Latency: 12ms' },
      'hello': { agent: 'Synapse Core', icon: '🧠', response: 'Hello! 👋 I\'m the Synapse OS orchestrator. I coordinate 5 specialized AI agents to run your business autonomously. Type "help" to see what I can do, or just ask me anything about your operations!' },
      'hi': { agent: 'Synapse Core', icon: '🧠', response: 'Hey there! 👋 Welcome to Synapse OS. I\'m here to help you monitor and manage your autonomous operations. Try asking about stock levels, cash flow, or shipment status!' },
    };
  }

  init() {
    // Toggle button
    const toggleBtn = document.getElementById('chat-toggle-btn');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());

    // Close button
    const closeBtn = document.getElementById('chat-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Send button
    const sendBtn = document.getElementById('chat-send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());

    // Enter key
    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    // Suggestion chips
    document.querySelectorAll('.chat-suggestion').forEach(chip => {
      chip.addEventListener('click', () => {
        if (this.input) this.input.value = chip.dataset.msg;
        this.sendMessage();
      });
    });

    // Welcome message
    this._addMessage('agent', 'Synapse Core', '🧠', 'Welcome to Synapse OS! 👋 I\'m your autonomous operations assistant. Ask me about stock levels, cash flow, shipments, or type "help" for a full list of commands.');
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    this.isOpen = true;
    if (this.panel) this.panel.classList.add('open');
    if (this.input) setTimeout(() => this.input.focus(), 300);
  }

  close() {
    this.isOpen = false;
    if (this.panel) this.panel.classList.remove('open');
  }

  sendMessage() {
    const text = this.input?.value.trim();
    if (!text) return;

    this._addMessage('user', 'You', '👤', text);
    this.input.value = '';

    // Find response
    setTimeout(() => {
      this._showTyping();
      setTimeout(() => {
        this._removeTyping();
        const response = this._findResponse(text);
        this._addMessage('agent', response.agent, response.icon, response.response);
      }, 1000 + Math.random() * 1000);
    }, 300);
  }

  _findResponse(text) {
    const lower = text.toLowerCase();
    for (const [key, resp] of Object.entries(this.responses)) {
      if (lower.includes(key)) return resp;
    }
    // Default
    return {
      agent: 'Synapse Core',
      icon: '🧠',
      response: `I've processed your request: "${text}"\n\nThe relevant agents have been notified and are analyzing the data. You'll receive updates in the activity feed.\n\nFor specific commands, type "help".`
    };
  }

  _addMessage(type, name, icon, text) {
    if (!this.messages) return;
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg--${type === 'user' ? 'user' : 'agent'}`;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="chat-msg__avatar chat-msg__avatar--${type === 'user' ? 'user' : 'system'}">${icon}</div>
      <div class="chat-msg__bubble">
        ${type !== 'user' ? `<div class="chat-msg__agent-name">${name}</div>` : ''}
        <div style="white-space:pre-wrap;">${text}</div>
        <div class="chat-msg__time">${time}</div>
      </div>
    `;
    this.messages.appendChild(div);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  _showTyping() {
    if (!this.messages) return;
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--agent';
    div.id = 'chat-typing';
    div.innerHTML = `
      <div class="chat-msg__avatar chat-msg__avatar--system">🧠</div>
      <div class="chat-msg__bubble">
        <div class="thinking-dots"><span></span><span></span><span></span></div>
      </div>
    `;
    this.messages.appendChild(div);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  _removeTyping() {
    document.getElementById('chat-typing')?.remove();
  }
}


// ── 4. FLOATING ACTION BUTTON ──
class FAB {
  constructor() {
    this.container = document.getElementById('fab-container');
    this.isOpen = false;
  }

  init() {
    const btn = document.getElementById('fab-btn');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.container) {
      this.container.classList.toggle('open', this.isOpen);
    }
  }

  close() {
    this.isOpen = false;
    if (this.container) this.container.classList.remove('open');
  }
}


// ── 5. LIVE METRICS TICKER ──
class MetricsTicker {
  constructor() {
    this.track = document.getElementById('ticker-track');
    this.metrics = [
      { label: 'Revenue/Day', value: '$4,833', cls: 'up' },
      { label: 'Orders Today', value: '34', cls: 'up' },
      { label: 'Fulfillment', value: '96.8%', cls: 'up' },
      { label: 'Agent Actions', value: '1,247', cls: 'neutral' },
      { label: 'Avg Response', value: '12ms', cls: 'neutral' },
      { label: 'Stock Health', value: '94%', cls: 'up' },
      { label: 'Cash Flow', value: '+$47K/mo', cls: 'up' },
      { label: 'Active Agents', value: '5/5', cls: 'neutral' },
      { label: 'Shipments', value: '12 active', cls: 'neutral' },
      { label: 'Approvals', value: '2 pending', cls: 'down' },
      { label: 'WIDGET A', value: '$24.99', cls: 'up' },
      { label: 'MODULE Y', value: '$89.00 ↑', cls: 'up' },
      { label: 'SENSOR Z', value: '$35.00', cls: 'neutral' },
    ];
  }

  init() {
    if (!this.track) return;
    // Double the content for seamless loop
    const items = this.metrics.map(m =>
      `<div class="ticker-item">
        <span class="ticker-item__label">${m.label}</span>
        <span class="ticker-item__value ${m.cls}">${m.value}</span>
      </div>
      <div class="ticker-divider"></div>`
    ).join('');

    this.track.innerHTML = items + items;
  }
}


// ── 6. ROI CALCULATOR ──
class ROICalculator {
  constructor() {
    this.employees = 25;
    this.orders = 500;
    this.revenue = 200000;
  }

  init() {
    const sliders = document.querySelectorAll('.roi-slider');
    sliders.forEach(slider => {
      slider.addEventListener('input', () => this.update());
    });
    this.update();
  }

  update() {
    const empSlider = document.getElementById('roi-employees');
    const ordSlider = document.getElementById('roi-orders');
    const revSlider = document.getElementById('roi-revenue');

    if (empSlider) this.employees = parseInt(empSlider.value);
    if (ordSlider) this.orders = parseInt(ordSlider.value);
    if (revSlider) this.revenue = parseInt(revSlider.value);

    // Display slider values
    const empVal = document.getElementById('roi-employees-val');
    const ordVal = document.getElementById('roi-orders-val');
    const revVal = document.getElementById('roi-revenue-val');
    if (empVal) empVal.textContent = this.employees;
    if (ordVal) ordVal.textContent = this.orders.toLocaleString();
    if (revVal) revVal.textContent = '$' + this.revenue.toLocaleString();

    // Calculate ROI
    const laborSavings = this.employees * 2800 * 0.35; // 35% labor reduction
    const errorReduction = this.orders * 1.20 * 0.80; // 80% error reduction
    const revenueLift = this.revenue * 0.12; // 12% revenue lift from dynamic pricing
    const totalSavings = laborSavings + errorReduction + revenueLift;
    const roiPercent = ((totalSavings / (this.revenue * 0.03)) * 100).toFixed(0); // Assuming 3% cost of software

    // Update display
    this._updateEl('roi-total-savings', '$' + Math.round(totalSavings).toLocaleString());
    this._updateEl('roi-percent', roiPercent + '%');
    this._updateEl('roi-labor', '$' + Math.round(laborSavings).toLocaleString());
    this._updateEl('roi-labor-sub', Math.round(this.employees * 0.35) + ' FTE equivalents freed');
    this._updateEl('roi-errors', '$' + Math.round(errorReduction).toLocaleString());
    this._updateEl('roi-errors-sub', '80% fewer processing errors');
    this._updateEl('roi-revenue', '$' + Math.round(revenueLift).toLocaleString());
    this._updateEl('roi-revenue-sub', '12% lift from dynamic pricing');
    this._updateEl('roi-payback', Math.max(1, Math.round(12 / (totalSavings / (this.revenue * 0.03)))) + ' months');
  }

  _updateEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
}


// ── 7. NOTIFICATION BELL ──
class NotificationBell {
  constructor(simulator) {
    this.simulator = simulator;
    this.count = 0;
    this.countEl = document.getElementById('notification-count');
  }

  init() {
    this.simulator.on('activity', (entry) => {
      if (entry.type === 'warning' || entry.type === 'success') {
        this.count++;
        this._updateCount();
      }
    });

    const bell = document.getElementById('notification-bell');
    if (bell) {
      bell.addEventListener('click', () => {
        this.count = 0;
        this._updateCount();
        window.app?.showToast('info', 'Notifications Cleared', 'All caught up!');
      });
    }
  }

  _updateCount() {
    if (this.countEl) {
      this.countEl.textContent = this.count > 99 ? '99+' : this.count;
      this.countEl.style.display = this.count > 0 ? 'flex' : 'none';
    }
  }
}


// ── BOOT SEQUENCE ──
document.addEventListener('DOMContentLoaded', async () => {
  // Run boot screen first
  const boot = new BootScreen();
  await boot.run();

  // Then init all enhancements (after main app has initialized)
  setTimeout(() => {
    // Command Palette
    window.cmdPalette = new CommandPalette();
    window.cmdPalette.init();

    // Agent Chat
    if (window.app?.simulator) {
      window.agentChat = new AgentChat(window.app.simulator);
      window.agentChat.init();
    }

    // FAB
    window.fab = new FAB();
    window.fab.init();

    // Ticker
    const ticker = new MetricsTicker();
    ticker.init();

    // ROI Calculator
    const roi = new ROICalculator();
    roi.init();

    // Notification Bell
    if (window.app?.simulator) {
      const bell = new NotificationBell(window.app.simulator);
      bell.init();
    }

    // Keyboard shortcuts indicator
    document.addEventListener('keydown', (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        window.app?.showToast('info', 'Keyboard Shortcuts', 'Ctrl+K: Command Palette\nEsc: Close panels\n?: This help');
      }
    });
  }, 500);
});
