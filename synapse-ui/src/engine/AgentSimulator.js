/* ============================================================
   SYNAPSE OS — Agent Simulator (React Module)
   Event-driven state machine for the agentic swarm
   ============================================================ */

class AgentSimulator {
  constructor() {
    this.agents = {
      inventory: {
        id: 'inventory',
        name: 'Inventory Agent',
        icon: '📦',
        status: 'idle',
        actions: 0,
        color: '#3B82F6',
        tasks: [],
      },
      procurement: {
        id: 'procurement',
        name: 'Procurement Agent',
        icon: '🛒',
        status: 'idle',
        actions: 0,
        color: '#F59E0B',
        tasks: [],
      },
      finance: {
        id: 'finance',
        name: 'Finance Agent',
        icon: '💰',
        status: 'idle',
        actions: 0,
        color: '#10B981',
        tasks: [],
      },
      logistics: {
        id: 'logistics',
        name: 'Logistics Agent',
        icon: '🚛',
        status: 'idle',
        actions: 0,
        color: '#8B5CF6',
        tasks: [],
      },
      pricing: {
        id: 'pricing',
        name: 'Pricing Agent',
        icon: '📊',
        status: 'idle',
        actions: 0,
        color: '#EC4899',
        tasks: [],
      },
    };

    this.eventBus = new EventTarget();
    this.messageLog = [];
    this.pendingApprovals = [];
    this.isRunning = false;

    this.inventory = {
      'Widget A': { qty: 450, reorder: 200, price: 24.99 },
      'Widget B': { qty: 120, reorder: 150, price: 49.99 },
      'Component X': { qty: 800, reorder: 300, price: 12.50 },
      'Module Y': { qty: 65, reorder: 100, price: 89.00 },
      'Sensor Z': { qty: 290, reorder: 250, price: 35.00 },
    };

    this.suppliers = [
      { name: 'TechParts Co.', reliability: 0.95, priceMultiplier: 1.0, leadDays: 3 },
      { name: 'GlobalSource Ltd.', reliability: 0.88, priceMultiplier: 0.85, leadDays: 7 },
      { name: 'QuickShip Inc.', reliability: 0.92, priceMultiplier: 1.15, leadDays: 1 },
    ];

    this.cashFlow = {
      balance: 287450.00,
      monthlyRevenue: 145000.00,
      monthlyExpenses: 98000.00,
      pendingPayables: 34200.00,
      pendingReceivables: 67800.00,
    };

    // Demo scenarios metadata
    this.scenarios = {
      invoice: {
        id: 'invoice',
        title: 'Invoice OCR Processing',
        icon: '📄',
        description: 'Warehouse manager photographs a paper invoice. AI agents parse, verify stock, draft purchase orders, and prepare financial approvals — all autonomously.',
        steps: [
          { title: 'Multi-Modal OCR Parsing', desc: 'Vision model extracts structured data from invoice image' },
          { title: 'Inventory Cross-Reference', desc: 'Stock levels checked, low-stock alerts triggered' },
          { title: 'Autonomous Procurement', desc: 'Supplier analysis, PO generation with best pricing' },
          { title: 'Financial Validation', desc: 'Cash flow check, approval request for human review' },
        ],
        data: {
          invoiceNo: 'INV-2024-4872',
          vendor: 'Mumbai Parts Distributors Pvt. Ltd.',
          date: '2024-07-06',
          items: [
            { name: 'Widget B', qty: 80, price: 49.99 },
            { name: 'Module Y', qty: 45, price: 89.00 },
            { name: 'Sensor Z', qty: 60, price: 35.00 },
          ],
        },
      },
      whatsapp: {
        id: 'whatsapp',
        title: 'WhatsApp Custom Order',
        icon: '💬',
        description: 'Customer sends a complex custom order via WhatsApp. NLP parses intent, checks availability, calculates pricing, and confirms delivery.',
        steps: [
          { title: 'NLP Message Parsing', desc: 'Extract order intent from natural language WhatsApp text' },
          { title: 'Stock Availability Check', desc: 'Verify all requested items are in stock' },
          { title: 'Dynamic Pricing Engine', desc: 'Calculate order total with demand-based pricing' },
          { title: 'Order Fulfillment', desc: 'Generate invoice, schedule delivery, notify customer' },
        ],
        data: {
          text: 'Hi, I need 25 units of Widget A and 10 units of Module Y delivered to our Bangalore warehouse by Thursday. Can you also add 50 Sensor Z? Priority order for Rajesh at TechCorp.',
          parsed: {
            customer: 'Rajesh @ TechCorp',
            items: [
              { name: 'Widget A', qty: 25 },
              { name: 'Module Y', qty: 10 },
              { name: 'Sensor Z', qty: 50 },
            ],
            destination: 'Bangalore Warehouse',
            deadline: 'Thursday',
            priority: 'High',
            notes: 'Priority order',
          },
        },
      },
      selfhealing: {
        id: 'selfhealing',
        title: 'Self-Healing Supply Chain',
        icon: '🌀',
        description: 'A cyclone disrupts a major shipping route. The system autonomously activates dynamic pricing, reroutes shipments, and reschedules workforce.',
        steps: [
          { title: 'External Disruption Alert', desc: 'Weather API detects cyclone on shipping corridor' },
          { title: 'Dynamic Pricing Activation', desc: 'Optimize pricing on affected SKUs, reserve safety stock' },
          { title: 'Alternative Route Planning', desc: 'Find backup suppliers and shipping routes' },
          { title: 'Autonomous Resolution', desc: 'Reschedule workforce, calculate net impact, notify stakeholders' },
        ],
        data: {},
      },
    };
  }

  start() {
    this.isRunning = true;
    this._startBackgroundSimulation();
  }

  stop() {
    this.isRunning = false;
    if (this._bgInterval) clearInterval(this._bgInterval);
  }

  emit(eventName, data) {
    this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  on(eventName, callback) {
    const handler = (e) => callback(e.detail);
    this.eventBus.addEventListener(eventName, handler);
    return () => this.eventBus.removeEventListener(eventName, handler);
  }

  log(agentId, message, type = 'info') {
    const entry = {
      id: Date.now() + Math.random(),
      agentId,
      agent: this.agents[agentId],
      message,
      type,
      timestamp: new Date(),
    };
    this.messageLog.push(entry);
    if (this.messageLog.length > 200) {
      this.messageLog = this.messageLog.slice(-100);
    }
    this.agents[agentId].actions++;
    this.emit('activity', entry);
    return entry;
  }

  setAgentStatus(agentId, status) {
    this.agents[agentId].status = status;
    this.emit('agent-status', { agentId, status });
  }

  getAgentStatuses() {
    const result = {};
    Object.keys(this.agents).forEach(id => {
      result[id] = { ...this.agents[id] };
    });
    return result;
  }

  getOnlineCount() {
    return Object.values(this.agents).filter(a => a.status !== 'offline').length;
  }

  // ── Scenario Runner ──
  async runScenario(scenarioId) {
    switch (scenarioId) {
      case 'invoice':
        await this.processInvoice(this.scenarios.invoice.data);
        break;
      case 'whatsapp':
        await this.processWhatsAppOrder(this.scenarios.whatsapp.data);
        break;
      case 'selfhealing':
        await this.triggerSelfHealing();
        break;
      default:
        console.warn('Unknown scenario:', scenarioId);
    }
  }

  // ── Scenario 1: Invoice Processing ──
  async processInvoice(invoiceData) {
    this.emit('scenario-start', { scenario: 'invoice' });

    this.setAgentStatus('inventory', 'processing');
    this.log('inventory', 'Received invoice image for OCR processing...', 'info');
    await this._delay(1500);

    this.log('inventory', `Parsed invoice: ${invoiceData.items.length} line items detected`, 'success');
    this.emit('demo-step', { step: 0, status: 'completed', output: this._formatInvoiceData(invoiceData) });
    await this._delay(800);

    this.emit('demo-step', { step: 1, status: 'active' });
    this.log('inventory', 'Cross-referencing invoice items with current stock levels...', 'info');
    await this._delay(1200);

    const lowStock = [];
    for (const item of invoiceData.items) {
      if (this.inventory[item.name]) {
        this.inventory[item.name].qty -= item.qty;
        if (this.inventory[item.name].qty < this.inventory[item.name].reorder) {
          lowStock.push(item.name);
        }
      }
    }

    if (lowStock.length > 0) {
      this.log('inventory', `⚠️ LOW STOCK ALERT: ${lowStock.join(', ')} below reorder threshold`, 'warning');
    }

    this.setAgentStatus('inventory', 'idle');
    this.log('inventory', 'Stock levels updated. Handing off to Procurement Agent.', 'success');
    this.emit('demo-step', { step: 1, status: 'completed', output: this._formatStockLevels(lowStock) });
    await this._delay(600);

    this.emit('demo-step', { step: 2, status: 'active' });
    this.setAgentStatus('procurement', 'processing');
    this.log('procurement', 'Received low-stock alert. Initiating supplier analysis...', 'info');
    await this._delay(1500);

    const bestSupplier = this._findBestSupplier(lowStock[0]);
    this.log('procurement', `Analyzed ${this.suppliers.length} suppliers. Best match: ${bestSupplier.name} (${(bestSupplier.reliability * 100).toFixed(0)}% reliability, ${bestSupplier.leadDays}-day lead)`, 'success');
    await this._delay(1000);

    const orderTotal = lowStock.reduce((sum, name) => {
      const item = this.inventory[name];
      return sum + (item ? item.reorder * item.price * bestSupplier.priceMultiplier : 0);
    }, 0);

    this.log('procurement', `Draft PO #PO-${Date.now().toString().slice(-6)} created: ${lowStock.length} items, total $${orderTotal.toFixed(2)}`, 'success');
    this.setAgentStatus('procurement', 'idle');
    this.emit('demo-step', { step: 2, status: 'completed', output: this._formatPO(lowStock, bestSupplier, orderTotal) });
    await this._delay(600);

    this.emit('demo-step', { step: 3, status: 'active' });
    this.setAgentStatus('finance', 'processing');
    this.log('finance', 'Validating purchase order against cash flow constraints...', 'info');
    await this._delay(1200);

    const cashCheck = this.cashFlow.balance - this.cashFlow.pendingPayables;
    const canAfford = cashCheck > orderTotal;

    this.log('finance', `Cash flow analysis: Available $${cashCheck.toFixed(2)} | Required $${orderTotal.toFixed(2)} | ${canAfford ? '✅ APPROVED' : '❌ INSUFFICIENT'}`, canAfford ? 'success' : 'warning');
    await this._delay(800);

    const approval = {
      id: `APR-${Date.now().toString().slice(-6)}`,
      type: 'Purchase Order',
      amount: orderTotal,
      description: `Auto-PO for ${lowStock.join(', ')} from ${bestSupplier.name}`,
      agent: 'finance',
      timestamp: new Date(),
      supplier: bestSupplier.name,
      items: lowStock,
      status: 'pending',
    };

    this.pendingApprovals.push(approval);
    this.log('finance', `Approval request ${approval.id} queued for human review.`, 'info');
    this.setAgentStatus('finance', 'idle');
    this.emit('approval-added', approval);
    this.emit('demo-step', { step: 3, status: 'completed', output: this._formatApproval(approval, canAfford) });

    this.emit('scenario-complete', { scenario: 'invoice' });
  }

  // ── Scenario 2: WhatsApp Order ──
  async processWhatsAppOrder(message) {
    this.emit('scenario-start', { scenario: 'whatsapp' });

    this.setAgentStatus('inventory', 'processing');
    this.log('inventory', `Incoming WhatsApp message: "${message.text}"`, 'info');
    await this._delay(1000);
    this.log('inventory', 'Running NLP extraction on customer message...', 'info');
    await this._delay(1500);

    const parsedOrder = message.parsed;
    this.log('inventory', `Order parsed: ${parsedOrder.items.map(i => `${i.qty}x ${i.name}`).join(', ')} for ${parsedOrder.customer}`, 'success');
    this.emit('demo-step', { step: 0, status: 'completed', output: this._formatParsedOrder(parsedOrder) });
    await this._delay(600);

    this.emit('demo-step', { step: 1, status: 'active' });
    this.log('inventory', 'Verifying stock availability for order items...', 'info');
    await this._delay(1200);

    let allAvailable = true;
    const availability = parsedOrder.items.map(item => {
      const stock = this.inventory[item.name];
      const available = stock && stock.qty >= item.qty;
      if (!available) allAvailable = false;
      return { ...item, available, inStock: stock ? stock.qty : 0 };
    });

    this.log('inventory', allAvailable ? '✅ All items in stock' : '⚠️ Some items have limited availability', allAvailable ? 'success' : 'warning');
    this.setAgentStatus('inventory', 'idle');
    this.emit('demo-step', { step: 1, status: 'completed', output: this._formatAvailability(availability) });
    await this._delay(600);

    this.emit('demo-step', { step: 2, status: 'active' });
    this.setAgentStatus('pricing', 'processing');
    this.log('pricing', 'Calculating dynamic pricing based on demand and margins...', 'info');
    await this._delay(1500);

    const orderTotal = parsedOrder.items.reduce((sum, item) => {
      const stock = this.inventory[item.name];
      return sum + (stock ? stock.price * item.qty : 0);
    }, 0);

    this.log('pricing', `Order total: $${orderTotal.toFixed(2)} (standard pricing applied)`, 'success');
    this.setAgentStatus('pricing', 'idle');
    this.emit('demo-step', { step: 2, status: 'completed', output: `Order Total: $${orderTotal.toFixed(2)}\nMargin: 32.4%\nDiscount Applied: None (standard customer)` });
    await this._delay(600);

    this.emit('demo-step', { step: 3, status: 'active' });
    this.setAgentStatus('finance', 'processing');
    this.setAgentStatus('logistics', 'processing');

    this.log('finance', `Recording order revenue: $${orderTotal.toFixed(2)}`, 'info');
    this.log('logistics', 'Scheduling fulfillment and delivery route...', 'info');
    await this._delay(1500);

    this.log('logistics', '📋 Delivery scheduled: Route #R-447, ETA 2 days', 'success');
    this.log('finance', '✅ Invoice generated and sent to customer via WhatsApp', 'success');

    this.setAgentStatus('finance', 'idle');
    this.setAgentStatus('logistics', 'idle');
    this.emit('demo-step', { step: 3, status: 'completed', output: `Order Confirmed: ORD-${Date.now().toString().slice(-6)}\nDelivery: Route #R-447 | ETA: 2 days\nInvoice: Sent via WhatsApp\nPayment: COD / UPI link shared` });

    this.emit('scenario-complete', { scenario: 'whatsapp' });
  }

  // ── Scenario 3: Self-Healing Supply Chain ──
  async triggerSelfHealing() {
    this.emit('scenario-start', { scenario: 'selfhealing' });

    this.setAgentStatus('logistics', 'processing');
    this.log('logistics', '🌀 EXTERNAL ALERT: Cyclone warning detected on shipping corridor Mumbai→Delhi', 'warning');
    await this._delay(1500);

    this.log('logistics', 'Analyzing impact: 3 active shipments affected, estimated 4-day delay', 'warning');
    this.emit('demo-step', { step: 0, status: 'completed', output: '⛈️ Cyclone Alert: Category 2\nAffected Route: Mumbai → Delhi (NH-48)\nShipments at Risk: SHP-2847, SHP-2851, SHP-2856\nEstimated Delay: 4 days\nGoods Value: $47,200' });
    await this._delay(800);

    this.emit('demo-step', { step: 1, status: 'active' });
    this.setAgentStatus('pricing', 'processing');
    this.log('pricing', 'Supply disruption detected. Activating dynamic pricing on affected SKUs...', 'info');
    await this._delay(1500);

    this.log('pricing', '📈 Price adjustments: Widget A +12%, Component X +8%', 'success');
    await this._delay(800);

    this.setAgentStatus('inventory', 'processing');
    this.log('inventory', 'Reserving safety stock for priority customers...', 'info');
    await this._delay(1000);
    this.log('inventory', '🔒 Reserved: 50x Widget A, 100x Component X for Tier-1 accounts', 'success');
    this.setAgentStatus('inventory', 'idle');
    this.setAgentStatus('pricing', 'idle');
    this.emit('demo-step', { step: 1, status: 'completed', output: 'Dynamic Pricing Activated:\n  Widget A:     $24.99 → $27.99 (+12%)\n  Component X:  $12.50 → $13.50 (+8%)\n  Module Y:     $89.00 → $89.00 (no change)\n\nProjected Revenue Impact: +$4,280/day\nSafety Stock Reserved: Tier-1 priority' });
    await this._delay(600);

    this.emit('demo-step', { step: 2, status: 'active' });
    this.setAgentStatus('procurement', 'processing');
    this.log('procurement', 'Searching alternative suppliers and routes...', 'info');
    await this._delay(1800);

    this.log('procurement', '✅ Alt route found: Mumbai→Jaipur→Delhi via QuickShip Inc. (+$1,200, saves 2 days)', 'success');
    this.setAgentStatus('procurement', 'idle');
    this.emit('demo-step', { step: 2, status: 'completed', output: 'Alternative Routing:\n  Original: Mumbai → Delhi (NH-48) | 3 days\n  Rerouted: Mumbai → Jaipur → Delhi | 5 days\n  Express:  Via QuickShip Inc. | 3 days (+$1,200)\n\nRecommendation: Express route for SHP-2847 (high-value)\n                Standard reroute for SHP-2851, SHP-2856' });
    await this._delay(600);

    this.emit('demo-step', { step: 3, status: 'active' });
    this.setAgentStatus('logistics', 'processing');
    this.setAgentStatus('finance', 'processing');

    this.log('logistics', 'Rescheduling warehouse shifts to match new delivery windows...', 'info');
    await this._delay(1200);
    this.log('logistics', '👷 Shift schedule updated: 3 workers reassigned to evening shift', 'success');

    this.log('finance', 'Calculating disruption cost vs. dynamic pricing revenue offset...', 'info');
    await this._delay(1000);
    this.log('finance', '💡 Net impact: -$1,200 (rerouting) +$4,280 (pricing) = +$3,080 net positive', 'success');

    this.setAgentStatus('logistics', 'idle');
    this.setAgentStatus('finance', 'idle');

    this.emit('demo-step', { step: 3, status: 'completed', output: '✅ SELF-HEALING COMPLETE\n\nDisruption Cost:     -$1,200 (express rerouting)\nPricing Revenue:     +$4,280 (dynamic pricing)\nNet Impact:          +$3,080 (positive)\n\nShifts Rescheduled:  3 workers\nCustomers Notified:  12 (automated)\nSLA Maintained:      98.2%' });

    this.emit('scenario-complete', { scenario: 'selfhealing' });
  }

  // ── Approve / Reject ──
  approveRequest(approvalId) {
    const idx = this.pendingApprovals.findIndex(a => a.id === approvalId);
    if (idx !== -1) {
      this.pendingApprovals[idx].status = 'approved';
      this.log('finance', `✅ Approval ${approvalId} APPROVED by human operator`, 'success');
      this.emit('approval-resolved', { ...this.pendingApprovals[idx] });
      this.cashFlow.balance -= this.pendingApprovals[idx].amount;
      this.cashFlow.pendingPayables += this.pendingApprovals[idx].amount;
    }
  }

  rejectRequest(approvalId) {
    const idx = this.pendingApprovals.findIndex(a => a.id === approvalId);
    if (idx !== -1) {
      this.pendingApprovals[idx].status = 'rejected';
      this.log('finance', `❌ Approval ${approvalId} REJECTED by human operator`, 'warning');
      this.emit('approval-resolved', { ...this.pendingApprovals[idx] });
    }
  }

  // ── Background Simulation ──
  _startBackgroundSimulation() {
    let tick = 0;
    this._bgInterval = setInterval(() => {
      if (!this.isRunning) return;
      tick++;

      if (tick % 8 === 0) {
        const agentIds = Object.keys(this.agents);
        const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
        const messages = [
          'Routine health check completed ✓',
          'Syncing data with external systems...',
          'Cache refreshed, 0 stale entries',
          'Monitoring metrics within normal range',
          'Heartbeat signal sent to orchestrator',
        ];
        this.log(randomAgent, messages[Math.floor(Math.random() * messages.length)], 'info');
      }

      if (tick % 15 === 0) {
        const items = Object.keys(this.inventory);
        const item = items[Math.floor(Math.random() * items.length)];
        const change = Math.floor(Math.random() * 20) - 5;
        this.inventory[item].qty = Math.max(0, this.inventory[item].qty + change);

        if (this.inventory[item].qty < this.inventory[item].reorder) {
          this.log('inventory', `Stock alert: ${item} at ${this.inventory[item].qty} units (below ${this.inventory[item].reorder} threshold)`, 'warning');
        }
      }
    }, 4000);
  }

  // ── Helpers ──
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _findBestSupplier() {
    return this.suppliers.reduce((best, s) => {
      const score = s.reliability * (1 / s.priceMultiplier) * (1 / s.leadDays);
      const bestScore = best.reliability * (1 / best.priceMultiplier) * (1 / best.leadDays);
      return score > bestScore ? s : best;
    });
  }

  _formatInvoiceData(data) {
    let out = `Invoice: ${data.invoiceNo}\nVendor:  ${data.vendor}\nDate:    ${data.date}\n${'─'.repeat(40)}\n`;
    data.items.forEach(item => {
      out += `  ${item.name.padEnd(15)} × ${String(item.qty).padStart(4)}  @ $${item.price.toFixed(2)}\n`;
    });
    const total = data.items.reduce((s, i) => s + i.qty * i.price, 0);
    out += `${'─'.repeat(40)}\nTotal: $${total.toFixed(2)}`;
    return out;
  }

  _formatStockLevels(lowStockItems) {
    let out = 'Updated Stock Levels:\n';
    Object.entries(this.inventory).forEach(([name, item]) => {
      const isLow = lowStockItems.includes(name);
      const bar = '█'.repeat(Math.min(20, Math.round(item.qty / item.reorder * 10)));
      out += `  ${isLow ? '⚠️' : '✅'} ${name.padEnd(15)} ${String(item.qty).padStart(4)}/${item.reorder} ${bar}\n`;
    });
    return out;
  }

  _formatPO(items, supplier, total) {
    return `Purchase Order Draft\n${'─'.repeat(40)}\nSupplier: ${supplier.name}\nReliability: ${(supplier.reliability * 100).toFixed(0)}%\nLead Time: ${supplier.leadDays} days\nPrice Factor: ${supplier.priceMultiplier}x\n${'─'.repeat(40)}\nItems: ${items.join(', ')}\nTotal: $${total.toFixed(2)}\nStatus: PENDING APPROVAL`;
  }

  _formatApproval(approval, canAfford) {
    return `Approval Request: ${approval.id}\n${'─'.repeat(40)}\nType: ${approval.type}\nAmount: $${approval.amount.toFixed(2)}\nSupplier: ${approval.supplier}\nItems: ${approval.items.join(', ')}\nCash Flow: ${canAfford ? '✅ SUFFICIENT' : '⚠️ REVIEW NEEDED'}\nStatus: ⏳ AWAITING HUMAN APPROVAL`;
  }

  _formatParsedOrder(order) {
    let out = `Customer: ${order.customer}\nChannel:  WhatsApp\n${'─'.repeat(40)}\n`;
    order.items.forEach(item => {
      out += `  ${item.qty}× ${item.name}\n`;
    });
    out += `${'─'.repeat(40)}\nPriority: ${order.priority || 'Standard'}\nNotes: ${order.notes || 'None'}`;
    return out;
  }

  _formatAvailability(items) {
    let out = 'Stock Availability Check:\n';
    items.forEach(item => {
      out += `  ${item.available ? '✅' : '❌'} ${item.name}: ${item.qty} requested | ${item.inStock} in stock\n`;
    });
    return out;
  }
}

export default AgentSimulator;
