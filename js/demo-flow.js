/* ============================================================
   SYNAPSE OS — Demo Flow Controller
   Interactive demonstration scenarios
   ============================================================ */

class DemoFlow {
  constructor(simulator) {
    this.simulator = simulator;
    this.currentScenario = null;
    this.isRunning = false;

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
        description: 'Customer sends a complex custom order via WhatsApp. NLP parses intent, checks availability, calculates pricing, and confirms delivery — zero manual effort.',
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
        description: 'A cyclone disrupts a major shipping route. The system autonomously activates dynamic pricing, reroutes shipments, and reschedules workforce — turning disruption into profit.',
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

  init() {
    this._renderScenarioCards();
    this._bindEvents();
  }

  _renderScenarioCards() {
    const container = document.getElementById('demo-scenarios');
    if (!container) return;

    container.innerHTML = Object.values(this.scenarios).map(s => `
      <div class="demo-scenario-card glass-card ripple" data-scenario="${s.id}" id="scenario-card-${s.id}">
        <div class="demo-scenario-card__icon">${s.icon}</div>
        <div class="demo-scenario-card__title">${s.title}</div>
        <div class="demo-scenario-card__desc">${s.description}</div>
      </div>
    `).join('');
  }

  _bindEvents() {
    // Scenario card clicks
    document.querySelectorAll('.demo-scenario-card').forEach(card => {
      card.addEventListener('click', () => {
        if (this.isRunning) return;
        const scenarioId = card.dataset.scenario;
        this.runScenario(scenarioId);
      });
    });

    // Listen for demo step updates
    this.simulator.on('demo-step', ({ step, status, output }) => {
      this._updateStep(step, status, output);
    });

    this.simulator.on('scenario-complete', ({ scenario }) => {
      this.isRunning = false;
      this._showCompletion(scenario);
    });
  }

  async runScenario(scenarioId) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentScenario = this.scenarios[scenarioId];

    // Highlight selected card
    document.querySelectorAll('.demo-scenario-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`scenario-card-${scenarioId}`)?.classList.add('active');

    // Render steps in viewport
    this._renderSteps();

    // Activate first step
    this._updateStep(0, 'active');

    // Show toast
    window.app?.showToast('info', 'Demo Started', `Running: ${this.currentScenario.title}`);

    // Run the scenario
    await this._delay(500);

    switch (scenarioId) {
      case 'invoice':
        await this.simulator.processInvoice(this.currentScenario.data);
        break;
      case 'whatsapp':
        await this.simulator.processWhatsAppOrder(this.currentScenario.data);
        break;
      case 'selfhealing':
        await this.simulator.triggerSelfHealing();
        break;
    }
  }

  _renderSteps() {
    const viewport = document.getElementById('demo-viewport');
    if (!viewport) return;

    const scenario = this.currentScenario;

    viewport.innerHTML = `
      <div class="demo-viewport__header" style="margin-bottom: var(--space-6);">
        <h3 style="font-size: var(--text-xl); font-weight: 700; display: flex; align-items: center; gap: var(--space-3);">
          <span>${scenario.icon}</span>
          <span>${scenario.title}</span>
          <span class="badge badge-cyan" style="margin-left: var(--space-2);">LIVE</span>
        </h3>
      </div>
      <div class="demo-steps" id="demo-steps">
        ${scenario.steps.map((step, i) => `
          <div class="demo-step" id="demo-step-${i}">
            <div class="demo-step__indicator" id="demo-step-indicator-${i}">${i + 1}</div>
            <div class="demo-step__content">
              <div class="demo-step__title">${step.title}</div>
              <div class="demo-step__desc">${step.desc}</div>
              <div class="demo-step__output" id="demo-step-output-${i}" style="display:none;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  _updateStep(stepIndex, status, output) {
    const stepEl = document.getElementById(`demo-step-${stepIndex}`);
    const indicatorEl = document.getElementById(`demo-step-indicator-${stepIndex}`);
    const outputEl = document.getElementById(`demo-step-output-${stepIndex}`);

    if (!stepEl) return;

    if (status === 'active') {
      stepEl.className = 'demo-step active';
      if (indicatorEl) {
        indicatorEl.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>`;
      }
      // Scroll into view
      stepEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (status === 'completed') {
      stepEl.className = 'demo-step completed';
      if (indicatorEl) {
        indicatorEl.innerHTML = '✓';
      }
      if (outputEl && output) {
        outputEl.style.display = 'block';
        this._typeOutput(outputEl, output);
      }

      // Activate next step if exists
      const nextStep = document.getElementById(`demo-step-${stepIndex + 1}`);
      if (nextStep) {
        // Next step will be activated by the simulator
      }
    }
  }

  _typeOutput(el, text) {
    el.textContent = '';
    let i = 0;
    const speed = 8;
    const type = () => {
      if (i < text.length) {
        // Add characters in chunks for speed
        const chunk = text.slice(i, i + 3);
        el.textContent += chunk;
        i += 3;
        setTimeout(type, speed);
      }
    };
    type();
  }

  _showCompletion(scenarioId) {
    window.app?.showToast('success', 'Scenario Complete', `${this.scenarios[scenarioId].title} finished successfully!`);

    // Add a completion banner
    const viewport = document.getElementById('demo-viewport');
    if (viewport) {
      const banner = document.createElement('div');
      banner.className = 'slide-up-fade';
      banner.style.cssText = 'margin-top: var(--space-6); padding: var(--space-5); background: hsla(155, 80%, 50%, 0.05); border: 1px solid hsla(155, 80%, 50%, 0.2); border-radius: var(--radius-md); text-align: center;';
      banner.innerHTML = `
        <div style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">✅</div>
        <div style="font-weight: 700; margin-bottom: var(--space-1); color: var(--color-emerald);">All Agents Completed</div>
        <div style="font-size: var(--text-sm); color: var(--text-secondary);">
          The entire workflow was handled autonomously by the agent swarm. 
          ${scenarioId === 'selfhealing' ? 'Disruption was turned into a net positive outcome.' : 'Human approval was requested only for financial decisions.'}
        </div>
        <button class="btn btn-secondary" style="margin-top: var(--space-4);" onclick="document.querySelectorAll('.demo-scenario-card').forEach(c=>c.classList.remove('active'));document.getElementById('demo-viewport').innerHTML='<div class=\\'demo-viewport__empty\\'><div class=\\'demo-viewport__empty-icon\\'>⚡</div><div>Select a scenario above to see the agent swarm in action</div></div>';window.demoFlow.isRunning=false;">
          ↻ Reset Demo
        </button>
      `;
      viewport.appendChild(banner);
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.DemoFlow = DemoFlow;
