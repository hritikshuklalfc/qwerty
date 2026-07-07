/* ============================================================
   SYNAPSE OS — Neural Network Visualization
   Canvas-based animated agent swarm display
   ============================================================ */

class NeuralNetwork {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.dataPackets = [];
    this.hoveredNode = null;
    this.animationId = null;
    this.isRunning = false;
    this.time = 0;

    // Agent definitions
    this.agentDefs = [
      { id: 'inventory',   label: 'Inventory Agent',   icon: '📦', color: 'hsl(185, 100%, 55%)', shortLabel: 'INV' },
      { id: 'procurement', label: 'Procurement Agent',  icon: '🛒', color: 'hsl(265, 90%, 65%)',  shortLabel: 'PRC' },
      { id: 'finance',     label: 'Finance Agent',      icon: '💰', color: 'hsl(38, 100%, 60%)',   shortLabel: 'FIN' },
      { id: 'logistics',   label: 'Logistics Agent',    icon: '🚛', color: 'hsl(155, 80%, 50%)',   shortLabel: 'LOG' },
      { id: 'pricing',     label: 'Pricing Agent',      icon: '📊', color: 'hsl(350, 90%, 60%)',   shortLabel: 'PRI' },
    ];

    // Central orchestrator
    this.orchestrator = { id: 'orchestrator', label: 'Synapse Core', icon: '🧠', color: 'hsl(220, 20%, 95%)', shortLabel: 'CORE' };

    this.resize = this.resize.bind(this);
    this.handleMouse = this.handleMouse.bind(this);
    this.animate = this.animate.bind(this);
  }

  init() {
    this.resize();
    this.createNodes();
    this.createConnections();
    this.bindEvents();
    this.isRunning = true;
    this.animate();

    // Start periodic data packets
    this.packetInterval = setInterval(() => {
      if (this.isRunning) this.sendRandomPacket();
    }, 1200);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    if (this.nodes.length > 0) {
      this.positionNodes();
    }
  }

  createNodes() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const radius = Math.min(cx, cy) * 0.6;

    // Center node (orchestrator)
    this.nodes.push({
      ...this.orchestrator,
      x: cx,
      y: cy,
      targetX: cx,
      targetY: cy,
      radius: 35,
      pulsePhase: 0,
      activity: 1,
    });

    // Agent nodes in a circle
    this.agentDefs.forEach((agent, i) => {
      const angle = (i / this.agentDefs.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      this.nodes.push({
        ...agent,
        x, y,
        targetX: x,
        targetY: y,
        radius: 28,
        pulsePhase: Math.random() * Math.PI * 2,
        activity: 0.3 + Math.random() * 0.7,
        angle,
        orbitRadius: radius,
      });
    });
  }

  positionNodes() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const radius = Math.min(cx, cy) * 0.6;

    // Reposition center
    this.nodes[0].targetX = cx;
    this.nodes[0].targetY = cy;

    // Reposition agents
    for (let i = 1; i < this.nodes.length; i++) {
      const angle = ((i - 1) / this.agentDefs.length) * Math.PI * 2 - Math.PI / 2;
      this.nodes[i].targetX = cx + Math.cos(angle) * radius;
      this.nodes[i].targetY = cy + Math.sin(angle) * radius;
      this.nodes[i].angle = angle;
      this.nodes[i].orbitRadius = radius;
    }
  }

  createConnections() {
    // Connect each agent to the orchestrator
    for (let i = 1; i < this.nodes.length; i++) {
      this.connections.push({
        from: 0,
        to: i,
        activity: 0.3,
      });
    }

    // Connect some agents to each other (mesh)
    const meshPairs = [[1, 2], [2, 3], [3, 4], [4, 5], [1, 3], [2, 5]];
    meshPairs.forEach(([a, b]) => {
      if (a < this.nodes.length && b < this.nodes.length) {
        this.connections.push({
          from: a,
          to: b,
          activity: 0.15,
          isMesh: true,
        });
      }
    });
  }

  sendRandomPacket() {
    // Pick random connection
    const conn = this.connections[Math.floor(Math.random() * this.connections.length)];
    const fromNode = this.nodes[conn.from];
    const toNode = this.nodes[conn.to];

    // Determine direction randomly
    const reverse = Math.random() > 0.5;
    const start = reverse ? toNode : fromNode;
    const end = reverse ? fromNode : toNode;

    this.dataPackets.push({
      x: start.x,
      y: start.y,
      targetX: end.x,
      targetY: end.y,
      progress: 0,
      speed: 0.01 + Math.random() * 0.015,
      color: start.color,
      size: 3 + Math.random() * 3,
    });

    // Boost connection activity
    conn.activity = Math.min(1, conn.activity + 0.4);
  }

  sendPacketBetween(fromId, toId) {
    const fromNode = this.nodes.find(n => n.id === fromId);
    const toNode = this.nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.dataPackets.push({
          x: fromNode.x,
          y: fromNode.y,
          targetX: toNode.x,
          targetY: toNode.y,
          progress: 0,
          speed: 0.015 + Math.random() * 0.01,
          color: fromNode.color,
          size: 4 + Math.random() * 3,
        });
      }, i * 200);
    }
  }

  highlightAgent(agentId) {
    const node = this.nodes.find(n => n.id === agentId);
    if (node) {
      node.activity = 1;
      node.pulsePhase = 0;
    }
  }

  bindEvents() {
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('mousemove', this.handleMouse);
    this.canvas.addEventListener('mouseleave', () => { this.hoveredNode = null; });
  }

  handleMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    this.hoveredNode = null;
    for (const node of this.nodes) {
      const dx = mx - node.x;
      const dy = my - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + 10) {
        this.hoveredNode = node;
        this.canvas.style.cursor = 'pointer';
        return;
      }
    }
    this.canvas.style.cursor = 'default';
  }

  update() {
    this.time += 0.016;

    // Smooth node positions
    for (const node of this.nodes) {
      node.x += (node.targetX - node.x) * 0.05;
      node.y += (node.targetY - node.y) * 0.05;
      node.pulsePhase += 0.03;

      // Gentle orbit wobble for agent nodes
      if (node.angle !== undefined) {
        const wobble = Math.sin(this.time * 0.5 + node.angle * 2) * 5;
        const wobbleY = Math.cos(this.time * 0.3 + node.angle * 3) * 5;
        node.x += wobble * 0.02;
        node.y += wobbleY * 0.02;
      }

      // Decay activity
      node.activity = Math.max(0.3, node.activity - 0.002);
    }

    // Update data packets
    for (let i = this.dataPackets.length - 1; i >= 0; i--) {
      const p = this.dataPackets[i];
      p.progress += p.speed;
      p.x = p.x + (p.targetX - p.x) * p.speed * 2;
      p.y = p.y + (p.targetY - p.y) * p.speed * 2;

      if (p.progress >= 1) {
        this.dataPackets.splice(i, 1);
      }
    }

    // Decay connection activity
    for (const conn of this.connections) {
      conn.activity = Math.max(conn.isMesh ? 0.08 : 0.15, conn.activity - 0.005);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections
    for (const conn of this.connections) {
      const from = this.nodes[conn.from];
      const to = this.nodes[conn.to];

      this.ctx.beginPath();
      this.ctx.moveTo(from.x, from.y);
      this.ctx.lineTo(to.x, to.y);
      this.ctx.strokeStyle = `hsla(185, 100%, 55%, ${conn.activity * 0.3})`;
      this.ctx.lineWidth = conn.isMesh ? 0.5 : 1;
      this.ctx.stroke();
    }

    // Draw data packets
    for (const p of this.dataPackets) {
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();

      // Glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    // Draw nodes
    for (const node of this.nodes) {
      const isHovered = this.hoveredNode === node;
      const pulse = 1 + Math.sin(node.pulsePhase) * 0.1 * node.activity;
      const r = node.radius * pulse;

      // Glow ring
      const glowGrad = this.ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 2.5);
      glowGrad.addColorStop(0, node.color.replace(')', `, ${0.1 * node.activity})`).replace('hsl', 'hsla'));
      glowGrad.addColorStop(1, 'transparent');
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = glowGrad;
      this.ctx.fill();

      // Node background
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      const bgOpacity = isHovered ? 0.2 : 0.08;
      this.ctx.fillStyle = `rgba(20, 22, 35, ${0.9})`;
      this.ctx.fill();

      // Node border
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      const borderOpacity = isHovered ? 0.8 : 0.3 + node.activity * 0.3;
      this.ctx.strokeStyle = node.color.replace(')', `, ${borderOpacity})`).replace('hsl', 'hsla');
      this.ctx.lineWidth = isHovered ? 2.5 : 1.5;
      this.ctx.stroke();

      // Icon
      this.ctx.font = `${node.id === 'orchestrator' ? 22 : 18}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.icon, node.x, node.y - 2);

      // Label
      this.ctx.font = `600 ${isHovered ? 11 : 9}px Inter, sans-serif`;
      this.ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)';
      this.ctx.fillText(node.shortLabel, node.x, node.y + r + 14);

      // Activity indicator
      if (node.activity > 0.7) {
        const indicatorY = node.y + r + 24;
        this.ctx.beginPath();
        this.ctx.arc(node.x, indicatorY, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = node.color;
        this.ctx.fill();
      }
    }

    // Draw hover tooltip
    if (this.hoveredNode) {
      const node = this.hoveredNode;
      const tooltipX = node.x;
      const tooltipY = node.y - node.radius - 35;

      // Tooltip background
      this.ctx.fillStyle = 'rgba(10, 12, 20, 0.95)';
      const text = node.label;
      this.ctx.font = '500 12px Inter, sans-serif';
      const textWidth = this.ctx.measureText(text).width;
      const padding = 12;

      this.roundedRect(tooltipX - textWidth / 2 - padding, tooltipY - 14, textWidth + padding * 2, 28, 6);
      this.ctx.fill();

      this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      this.ctx.lineWidth = 1;
      this.roundedRect(tooltipX - textWidth / 2 - padding, tooltipY - 14, textWidth + padding * 2, 28, 6);
      this.ctx.stroke();

      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(text, tooltipX, tooltipY);
    }
  }

  roundedRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
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
    if (this.packetInterval) clearInterval(this.packetInterval);
    window.removeEventListener('resize', this.resize);
  }
}

window.NeuralNetwork = NeuralNetwork;
