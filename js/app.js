/* ============================================================
   SYNAPSE OS — Main Application Controller
   ============================================================ */

class App {
  constructor() {
    this.particleSystem = null;
    this.neuralNetwork = null;
    this.simulator = null;
    this.dashboard = null;
    this.charts = null;
    this.demoFlow = null;
    this.toastQueue = [];
  }

  async init() {
    console.log('%c⚡ SYNAPSE OS v1.0', 'color: #00e5cc; font-size: 20px; font-weight: 900;');
    console.log('%cAutonomous Multi-Agent Orchestration Layer', 'color: #9966ff; font-size: 12px;');

    // Initialize particle system
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas) {
      this.particleSystem = new ParticleSystem(heroCanvas);
      this.particleSystem.init();
    }

    // Initialize agent simulator
    this.simulator = new AgentSimulator();

    // Initialize neural network
    const swarmCanvas = document.getElementById('swarm-canvas');
    if (swarmCanvas) {
      this.neuralNetwork = new NeuralNetwork(swarmCanvas);
      this.neuralNetwork.init();
    }

    // Wire neural network to simulator
    this.simulator.on('neural-packet', ({ from, to }) => {
      if (this.neuralNetwork) {
        this.neuralNetwork.sendPacketBetween(from, to);
        this.neuralNetwork.highlightAgent(from);
        this.neuralNetwork.highlightAgent(to);
      }
    });

    // Initialize dashboard
    this.dashboard = new Dashboard(this.simulator);
    this.dashboard.init();

    // Initialize charts
    this.charts = new Charts();
    // Delay to ensure containers are rendered
    setTimeout(() => this.charts.init(), 300);

    // Initialize demo flow
    this.demoFlow = new DemoFlow(this.simulator);
    this.demoFlow.init();
    window.demoFlow = this.demoFlow;

    // Start simulator background
    this.simulator.start();

    // Setup navigation
    this._setupNavigation();

    // Setup scroll reveals
    this._setupScrollReveals();

    // Setup dashboard tabs
    this._setupDashboardTabs();

    // Animate counters on load
    this._animateHeroCounters();

    // Show welcome toast
    setTimeout(() => {
      this.showToast('info', 'Synapse OS Online', 'All 5 AI agents initialized and operational');
    }, 2000);
  }

  _setupNavigation() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    // Scroll-based nav styling
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  _setupScrollReveals() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger').forEach(el => {
      observer.observe(el);
    });
  }

  _setupDashboardTabs() {
    const tabs = document.querySelectorAll('.dashboard__tab');
    const panels = document.querySelectorAll('.dashboard__panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPanel = tab.dataset.panel;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        panels.forEach(p => {
          p.classList.remove('active');
          if (p.id === targetPanel) {
            p.classList.add('active');
            // Re-render charts when panel becomes visible
            if (targetPanel === 'panel-analytics') {
              setTimeout(() => this.charts.init(), 100);
            }
          }
        });
      });
    });
  }

  _animateHeroCounters() {
    const counters = document.querySelectorAll('.hero__stat-value');
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target, 10);
      if (isNaN(target)) return;

      let current = 0;
      const increment = target / 60;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        counter.textContent = counter.dataset.prefix
          ? counter.dataset.prefix + Math.floor(current).toLocaleString() + (counter.dataset.suffix || '')
          : Math.floor(current).toLocaleString() + (counter.dataset.suffix || '');
      }, 30);
    });
  }

  // ── Toast System ──
  showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconMap = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: '⚡',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <div class="toast__icon">${iconMap[type]}</div>
      <div class="toast__content">
        <div class="toast__title">${title}</div>
        <div class="toast__message">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ── Approval Actions ──
  approveItem(approvalId) {
    const el = document.getElementById(`approval-${approvalId}`);
    if (el) {
      el.style.borderColor = 'var(--color-emerald)';
      el.style.background = 'hsla(155, 80%, 50%, 0.05)';
      el.querySelector('.approval-item__actions').innerHTML = `
        <div style="color: var(--color-emerald); font-size: var(--text-sm); font-weight: 600; text-align: center; width: 100%;">
          ✅ Approved
        </div>
      `;
      this.showToast('success', 'Approved', `Approval ${approvalId} has been authorized`);
      this.simulator.log('finance', `✅ Approval ${approvalId} authorized by human operator`, 'success');
    }
  }

  rejectItem(approvalId) {
    const el = document.getElementById(`approval-${approvalId}`);
    if (el) {
      el.style.borderColor = 'var(--color-rose)';
      el.style.opacity = '0.5';
      el.querySelector('.approval-item__actions').innerHTML = `
        <div style="color: var(--color-rose); font-size: var(--text-sm); font-weight: 600; text-align: center; width: 100%;">
          ❌ Rejected
        </div>
      `;
      this.showToast('warning', 'Rejected', `Approval ${approvalId} has been declined`);
      this.simulator.log('finance', `❌ Approval ${approvalId} rejected by human operator`, 'warning');
    }
  }

  // ── Quick Demo Trigger (for hero CTA) ──
  launchDemo() {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        if (!this.demoFlow.isRunning) {
          this.demoFlow.runScenario('invoice');
        }
      }, 800);
    }
  }

  scrollToDashboard() {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
