/* ============================================================
   SYNAPSE OS — Particle System
   Lightweight particle network for hero background
   ============================================================ */

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.animationId = null;
    this.isRunning = false;

    this.config = {
      particleCount: 80,
      maxDistance: 150,
      particleMinSize: 1,
      particleMaxSize: 2.5,
      speed: 0.3,
      colors: [
        'hsla(185, 100%, 55%, 0.6)',
        'hsla(265, 90%, 65%, 0.4)',
        'hsla(185, 100%, 55%, 0.3)',
        'hsla(265, 90%, 65%, 0.2)',
        'hsla(220, 20%, 95%, 0.15)',
      ],
      lineColor: 'hsla(185, 100%, 55%,',
    };

    this.resize = this.resize.bind(this);
    this.handleMouse = this.handleMouse.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.animate = this.animate.bind(this);
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.isRunning = true;
    this.animate();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    // Adjust particle count for smaller screens
    if (this.canvas.width < 768) {
      this.config.particleCount = 40;
    }
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        size: this.config.particleMinSize + Math.random() * (this.config.particleMaxSize - this.config.particleMinSize),
        color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('mousemove', this.handleMouse);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
  }

  handleMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  handleMouseLeave() {
    this.mouse.x = null;
    this.mouse.y = null;
  }

  update() {
    for (const p of this.particles) {
      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Pulse size
      p.pulsePhase += p.pulseSpeed;

      // Boundary bounce
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      // Clamp to canvas
      p.x = Math.max(0, Math.min(this.canvas.width, p.x));
      p.y = Math.max(0, Math.min(this.canvas.height, p.y));

      // Mouse interaction — gentle push
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (1 - dist / this.mouse.radius) * 0.02;
          p.vx += dx * force;
          p.vy += dy * force;
        }
      }

      // Speed damping
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > this.config.speed * 3) {
        p.vx *= 0.98;
        p.vy *= 0.98;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.maxDistance) {
          const opacity = (1 - dist / this.config.maxDistance) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `${this.config.lineColor} ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of this.particles) {
      const pulse = 1 + Math.sin(p.pulsePhase) * 0.3;
      const size = p.size * pulse;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
    }
  }

  animate() {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  }

  destroy() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('mousemove', this.handleMouse);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
  }
}

// Export
window.ParticleSystem = ParticleSystem;
