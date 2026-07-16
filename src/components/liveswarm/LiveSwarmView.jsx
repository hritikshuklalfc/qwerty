// ═══════════════════════════════════════════════════════════
// LIVE SWARM VIEW — Inlined from backend/synapse-observatory/client
// Displays real-time agent swarm telemetry, topology, events,
// cost tracking, alerts, and emergency controls.
// Connects via Socket.IO to the backend server.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSwarmSocket } from '../../hooks/useSwarmSocket';
import {
  Brain, Activity, AlertTriangle, DollarSign, Wifi, WifiOff, Zap,
  Cpu, Clock, Crosshair, RotateCcw, Radio, BarChart3,
  StopCircle, ShieldAlert, Wrench, PlayCircle, Skull, X, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import './LiveSwarmView.css';

// ═══════════════════════════════════════
// Sub-components (inlined for simplicity)
// ═══════════════════════════════════════

const AGENT_ORDER = ['alpha', 'beta', 'gamma', 'delta'];

const STATUS_COLORS = {
  running: { dot: 'green', text: '#10B981', label: 'RUNNING' },
  idle: { dot: 'green', text: '#10B981', label: 'IDLE' },
  warning: { dot: 'amber', text: '#F59E0B', label: 'WARNING' },
  critical: { dot: 'red', text: '#EF4444', label: 'CRITICAL' },
  paused: { dot: 'amber', text: '#F59E0B', label: 'PAUSED' },
  killed: { dot: 'gray', text: '#6B7280', label: 'KILLED' },
};

const AGENT_ICONS = { alpha: '⍺', beta: 'β', gamma: 'γ', delta: 'δ' };

const AGENT_COLORS_MAP = {
  alpha: '#3B82F6', beta: '#8B5CF6', gamma: '#10B981', delta: '#F59E0B',
};

const CHART_COLORS = {
  alpha: { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.15)' },
  beta: { stroke: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.15)' },
  gamma: { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.15)' },
  delta: { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.15)' },
};

const AGENT_NAMES = { alpha: 'Alpha', beta: 'Beta', gamma: 'Gamma', delta: 'Delta' };

const TYPE_STYLES = {
  INFO: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.2)' },
  WARNING: { bg: 'rgba(245, 158, 11, 0.1)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.2)' },
  ERROR: { bg: 'rgba(239, 68, 68, 0.1)', text: '#F87171', border: 'rgba(239, 68, 68, 0.2)' },
  CRITICAL: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
};

function formatTime(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
}

const formatTokens = (n) => {
  if (!n) return '0';
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div className="swarm-glass-card p-5 flex flex-col justify-between rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
        <Icon size={14} style={{ color }} className="opacity-50" />
      </div>
      <div className="text-3xl font-bold tracking-tighter text-gray-900">{value}</div>
      {subtext && <div className="text-[10px] text-gray-500 mt-1 truncate">{subtext}</div>}
    </div>
  );
}

// ── Cost Tracker ──
function CostTracker({ totalCost, costColor, burnRatePerMin, systemHealth }) {
  const [displayCost, setDisplayCost] = useState(0);
  const targetRef = useRef(0);
  const displayRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => { targetRef.current = totalCost || 0; }, [totalCost]);

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (now) => {
      const dt = Math.min(now - lastTime, 50) / 1000;
      lastTime = now;
      const diff = targetRef.current - displayRef.current;
      if (Math.abs(diff) > 0.001) {
        const speed = Math.max(Math.abs(diff) * 3, 0.05);
        const step = Math.sign(diff) * Math.min(speed * dt, Math.abs(diff));
        displayRef.current += step;
        setDisplayCost(displayRef.current);
      } else {
        displayRef.current = targetRef.current;
        setDisplayCost(displayRef.current);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const formattedCost = displayCost.toFixed(2);
  const [dollars, cents] = formattedCost.split('.');
  const isCritical = systemHealth === 'critical';

  return (
    <div className={`swarm-glass-card p-5 flex flex-col justify-between transition-all duration-500 rounded-lg ${isCritical ? 'border-red-500/50' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</div>
        <DollarSign size={14} style={{ color: costColor }} className="opacity-50" />
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-3xl font-bold tracking-tighter transition-colors duration-500" style={{ color: costColor }}>${dollars}</span>
        <span className="text-xl font-bold tracking-tighter transition-colors duration-500" style={{ color: costColor, opacity: 0.7 }}>.{cents}</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <TrendingUp size={8} className={isCritical ? 'text-red-600' : 'text-gray-500'} />
        <div className={`text-[10px] truncate ${isCritical ? 'text-red-600 font-medium' : 'text-gray-500'}`}>${burnRatePerMin.toFixed(2)}/min</div>
      </div>
    </div>
  );
}

// ── Agent Card ──
function AgentCard({ agent, onKill, onRestart }) {
  const [hovered, setHovered] = useState(false);

  if (!agent) {
    return (
      <div className="swarm-glass-card p-5 animate-pulse">
        <div className="h-4 bg-black/5 rounded-md w-2/3 mb-3 border border-black/10" />
        <div className="h-3 bg-black/5 rounded-md w-1/2 mb-6 border border-black/10" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (<div key={i} className="h-10 bg-black/5 rounded-md border border-black/10" />))}
        </div>
      </div>
    );
  }

  const status = STATUS_COLORS[agent.status] || STATUS_COLORS.idle;
  const isRogue = agent.status === 'critical';
  const isCascade = agent.status === 'warning';
  const isPaused = agent.status === 'paused';
  const isKilled = agent.status === 'killed';
  const cardClass = isRogue ? 'swarm-glass-card swarm-rogue-card' : (isCascade || isPaused) ? 'swarm-glass-card swarm-cascade-card' : 'swarm-glass-card';
  const confidenceColor = agent.confidenceScore > 0.8 ? '#10B981' : agent.confidenceScore > 0.5 ? '#F59E0B' : '#EF4444';

  return (
    <div className={`${cardClass} p-4 relative group transition-all duration-300`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex items-start justify-between mb-3 border-b border-black/10 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md border flex items-center justify-center text-base font-bold flex-shrink-0" style={{ borderColor: isKilled ? 'rgba(0,0,0,0.1)' : `${status.text}40`, background: isKilled ? 'rgba(0,0,0,0.05)' : `${status.text}10`, color: status.text }}>{AGENT_ICONS[agent.agentId]}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight truncate">{agent.agentName}</h3>
              <span className={`swarm-status-dot ${status.dot}`} />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="swarm-badge border border-black/10 bg-black/5 text-black/60 font-mono">{agent.model}</span>
              <span className="swarm-badge border font-mono" style={{ borderColor: `${status.text}30`, background: `${status.text}10`, color: status.text }}>{status.label}</span>
            </div>
          </div>
        </div>
      </div>
      <p className={`text-xs mb-3 leading-relaxed line-clamp-2 ${isRogue ? 'text-red-400 font-medium' : isCascade ? 'text-amber-400/80' : isPaused ? 'text-amber-600 font-medium' : 'text-gray-500 italic'}`}>{agent.currentTask}</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-black/5 border border-black/10 rounded-md p-2.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Tokens</div>
          <p className={`text-sm font-bold font-mono ${isRogue ? 'text-red-600' : 'text-gray-900'}`}>{formatTokens(agent.tokenUsage?.total)}</p>
        </div>
        <div className="bg-black/5 border border-black/10 rounded-md p-2.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Cost</div>
          <p className={`text-sm font-bold font-mono ${agent.cumulativeCostUSD > 100 ? 'text-red-600' : agent.cumulativeCostUSD > 20 ? 'text-amber-600' : 'text-gray-900'}`}>${agent.cumulativeCostUSD?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-black/5 border border-black/10 rounded-md p-2.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Latency</div>
          <p className="text-sm font-bold font-mono text-gray-900">{agent.latencyMs || 0}<span className="text-[10px] text-gray-500 ml-0.5">ms</span></p>
        </div>
        <div className="bg-black/5 border border-black/10 rounded-md p-2.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Confidence</div>
          <p className="text-sm font-bold font-mono" style={{ color: confidenceColor }}>{((agent.confidenceScore || 0) * 100).toFixed(0)}%</p>
        </div>
      </div>
      <div className="swarm-confidence-bar mb-3">
        <div className="swarm-confidence-fill" style={{ width: `${(agent.confidenceScore || 0) * 100}%`, backgroundColor: confidenceColor }} />
      </div>
      {agent.reasoningChain && agent.reasoningChain.length > 0 && (
        <div className="space-y-1">
          {agent.reasoningChain.slice(-3).map((step, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[9px] text-gray-700 font-mono mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <p className={`text-[10px] font-mono leading-relaxed truncate ${isRogue ? 'text-red-500/70' : isCascade ? 'text-amber-500/60' : isPaused ? 'text-amber-600' : 'text-gray-600'}`}>{step}</p>
            </div>
          ))}
        </div>
      )}
      <div className={`absolute top-3 right-3 flex gap-1.5 transition-all duration-200 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
        {isKilled ? (
          <button onClick={onRestart} className="w-7 h-7 rounded-md border border-black/10 bg-white hover:bg-black/5 flex items-center justify-center transition-colors shadow-sm" title="Restart Agent"><RotateCcw size={12} className="text-emerald-600" /></button>
        ) : (
          <button onClick={onKill} className="w-7 h-7 rounded-md border border-black/10 bg-white hover:bg-black/5 flex items-center justify-center transition-colors shadow-sm" title="Kill Agent"><Crosshair size={12} className="text-red-600" /></button>
        )}
      </div>
    </div>
  );
}

// ── Swarm Topology ──
const TOPO_NODES = [
  { id: 'alpha', label: 'Alpha', name: 'Data Ingestion', x: 130, y: 80 },
  { id: 'beta', label: 'Beta', name: 'Analysis', x: 330, y: 80 },
  { id: 'gamma', label: 'Gamma', name: 'Decision', x: 530, y: 80 },
  { id: 'delta', label: 'Delta', name: 'Execution', x: 730, y: 80 },
];
const TOPO_LINKS = [
  { from: 'alpha', to: 'beta' },
  { from: 'beta', to: 'gamma' },
  { from: 'gamma', to: 'delta' },
];
const STATUS_FILL = { running: '#10B981', idle: '#10B981', warning: '#F59E0B', critical: '#EF4444', killed: '#374151' };

function SwarmTopology({ agents, selectedAgent, setSelectedAgent }) {
  const nodeData = useMemo(() => TOPO_NODES.map(node => {
    const agent = agents[node.id];
    const status = agent?.status || 'idle';
    const isSelected = selectedAgent === node.id;
    const isDimmed = selectedAgent !== null && !isSelected;
    return { ...node, status, agent, isSelected, isDimmed };
  }), [agents, selectedAgent]);

  const linkData = useMemo(() => TOPO_LINKS.map(link => {
    const fromAgent = agents[link.from];
    const toAgent = agents[link.to];
    const fromStatus = fromAgent?.status || 'idle';
    const toStatus = toAgent?.status || 'idle';
    let color = '#10B981', lineClass = 'swarm-flow-line';
    if (fromStatus === 'killed' || toStatus === 'killed') { color = '#374151'; lineClass = 'swarm-flow-line-stopped'; }
    else if (fromStatus === 'critical') { color = '#EF4444'; lineClass = 'swarm-flow-line-fast'; }
    else if (fromStatus === 'warning' || toStatus === 'warning') { color = '#F59E0B'; }
    const fromNode = TOPO_NODES.find(n => n.id === link.from);
    const toNode = TOPO_NODES.find(n => n.id === link.to);
    return { ...link, color, lineClass, x1: fromNode.x + 38, y1: fromNode.y, x2: toNode.x - 38, y2: toNode.y };
  }), [agents]);

  return (
    <div className="swarm-glass-card p-5 rounded-lg">
      <svg viewBox="0 0 860 160" className="w-full" style={{ maxHeight: '160px' }}>
        <defs>
          <marker id="swarmArrowGreen" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#10B981" opacity="0.5" /></marker>
          <marker id="swarmArrowRed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#EF4444" opacity="0.7" /></marker>
          <marker id="swarmArrowAmber" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#F59E0B" opacity="0.5" /></marker>
          <marker id="swarmArrowGray" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#374151" opacity="0.3" /></marker>
        </defs>
        {linkData.map((link, i) => {
          const markerColor = link.color === '#EF4444' ? 'Red' : link.color === '#F59E0B' ? 'Amber' : link.color === '#374151' ? 'Gray' : 'Green';
          return (
            <g key={i}>
              <line x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} stroke={link.color} strokeWidth="1" opacity="0.15" />
              <line x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} stroke={link.color} strokeWidth="2.5" className={link.lineClass} markerEnd={`url(#swarmArrow${markerColor})`} />
            </g>
          );
        })}
        {nodeData.map(node => {
          const fill = STATUS_FILL[node.status] || STATUS_FILL.idle;
          const isRogue = node.status === 'critical';
          const isKilled = node.status === 'killed';
          return (
            <g key={node.id} onClick={() => setSelectedAgent(node.isSelected ? null : node.id)} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} opacity={node.isDimmed ? 0.3 : 1} className="hover:opacity-100">
              {!isKilled && <circle cx={node.x} cy={node.y} r="42" fill="none" stroke={fill} strokeWidth="1" opacity={isRogue ? 0.4 : 0.15} className={isRogue ? 'swarm-node-rogue' : ''} />}
              <circle cx={node.x} cy={node.y} r="32" fill={`${fill}20`} stroke={fill} strokeWidth="2" className={!isKilled && !isRogue ? 'swarm-node-pulse' : isRogue ? 'swarm-node-rogue' : ''} />
              <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central" fill={isKilled ? '#6B7280' : '#000000'} fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">{node.label[0]}</text>
              <text x={node.x} y={node.y + 50} textAnchor="middle" fill={isKilled ? '#6B7280' : '#4B5563'} fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">{node.name}</text>
              <text x={node.x} y={node.y + 63} textAnchor="middle" fill={fill} fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="0.5">{node.status.toUpperCase()}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Event Feed ──
function EventFeed({ events, selectedAgent, setSelectedAgent }) {
  const containerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!isHovering && containerRef.current && events.length > prevCountRef.current) containerRef.current.scrollTop = 0;
    prevCountRef.current = events.length;
  }, [events, isHovering]);

  return (
    <div className="swarm-glass-card p-5 h-full flex flex-col rounded-lg" style={{ minHeight: '320px' }}>
      <div className="flex items-center justify-between mb-3 border-b border-black/10 pb-3">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-gray-500 animate-pulse" />
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            Live Event Feed
            {selectedAgent && (
              <button onClick={() => setSelectedAgent(null)} className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[9px] hover:bg-gray-300 transition-colors">Clear Filter ({selectedAgent}) ✕</button>
            )}
          </h3>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">{events.length} events</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-0" style={{ maxHeight: '280px' }} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-700 text-xs">Waiting for events...</div>
        ) : (
          events.filter(e => !selectedAgent || e.agent === selectedAgent).map(event => {
            const typeStyle = TYPE_STYLES[event.type] || TYPE_STYLES.INFO;
            const agentColor = AGENT_COLORS_MAP[event.agent] || '#6B7280';
            const isCritical = event.type === 'CRITICAL';
            return (
              <div key={event.id} className={`swarm-event-row py-2 px-2 flex items-start gap-2 border-b border-black/5 hover:bg-black/5 transition-colors ${isCritical ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                <span className="text-[10px] font-mono text-gray-500 flex-shrink-0 mt-0.5 w-[58px]">{formatTime(event.timestamp)}</span>
                {event.agent && <span className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 w-[38px] text-center" style={{ color: agentColor }}>{event.agent}</span>}
                <span className="swarm-badge flex-shrink-0 mt-0.5" style={{ background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}`, fontSize: '8px' }}>{event.type}</span>
                <p className={`text-[11px] leading-relaxed flex-1 min-w-0 ${isCritical ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{event.description}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Metrics Chart ──
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="p-3 border shadow-sm rounded-none" style={{ background: 'rgba(255,255,255,1)', borderColor: 'rgba(0,0,0,0.1)' }}>
      <p className="text-[10px] text-gray-500 font-mono mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-none" style={{ background: entry.color }} />
              <span className="text-[11px] text-gray-500">{AGENT_NAMES[entry.dataKey]}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-gray-900">{entry.value?.toLocaleString() || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsChart({ tokenHistory }) {
  const chartData = useMemo(() => {
    if (!tokenHistory || tokenHistory.length === 0) return [];
    const sampled = [];
    const step = Math.max(1, Math.floor(tokenHistory.length / 80));
    for (let i = 0; i < tokenHistory.length; i += step) sampled.push(tokenHistory[i]);
    if (sampled[sampled.length - 1] !== tokenHistory[tokenHistory.length - 1]) sampled.push(tokenHistory[tokenHistory.length - 1]);
    return sampled.map(point => ({ ...point, timeLabel: point.timeLabel || new Date(point.time).toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }) }));
  }, [tokenHistory]);

  return (
    <div className="swarm-glass-card p-5 h-full flex flex-col rounded-lg" style={{ minHeight: '320px' }}>
      <div className="flex items-center gap-2 mb-3 border-b border-black/10 pb-3">
        <BarChart3 size={14} className="text-gray-500" />
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Token Usage Over Time</h3>
        <span className="text-[10px] text-gray-500 ml-auto font-mono">Last 2 min</span>
      </div>
      <div className="flex-1 min-h-0">
        {chartData.length < 2 ? (
          <div className="flex items-center justify-center h-full text-gray-700 text-xs">Collecting telemetry data...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                {Object.entries(CHART_COLORS).map(([id, colors]) => (
                  <linearGradient key={id} id={`swarm-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={colors.stroke} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={{ stroke: 'rgba(0,0,0,0.05)' }} tickLine={false} interval="preserveStartEnd" minTickGap={40} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={{ stroke: 'rgba(0,0,0,0.05)' }} tickLine={false} width={45} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
              <Tooltip content={<CustomTooltip />} />
              {Object.entries(CHART_COLORS).map(([id, colors]) => (
                <Area key={id} type="monotone" dataKey={id} stroke={colors.stroke} fill={`url(#swarm-grad-${id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Maintenance Panel ──
function MaintenancePanel({ agents, resumeAgent }) {
  const pausedAgents = Object.values(agents).filter(a => a.status === 'paused');
  if (pausedAgents.length === 0) return null;
  return (
    <div className="swarm-glass-card p-5 rounded-lg border border-amber-500/30 bg-amber-50/50">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/10">
        <div className="flex items-center gap-2"><Wrench size={16} className="text-amber-600" /><h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">System Maintenance Required</h3></div>
        <span className="swarm-badge border border-amber-500/30 bg-amber-500/10 text-amber-700">{pausedAgents.length} Agent{pausedAgents.length > 1 ? 's' : ''} Paused</span>
      </div>
      <div className="space-y-3">
        {pausedAgents.map(agent => (
          <div key={agent.agentId} className="flex items-center justify-between bg-white/80 p-3 rounded-lg border border-black/5 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-gray-900">{agent.agentName}</span></div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600"><AlertTriangle size={12} className="text-amber-500 flex-shrink-0" /><span className="truncate">{agent.pauseReason || 'Auto-Safeguard Triggered'}</span></div>
            </div>
            <button onClick={() => resumeAgent(agent.agentId)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-sm transition-colors ml-4"><PlayCircle size={14} />Fix & Resume</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Kill Switch ──
function KillSwitch({ killAll, restartAll, allKilled, systemHealth, triggerRogue }) {
  const [flashActive, setFlashActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isCritical = systemHealth === 'critical';

  const handleKill = async () => {
    if (isProcessing) return;
    setIsProcessing(true); setFlashActive(true);
    await killAll();
    setTimeout(() => setFlashActive(false), 400);
    setTimeout(() => setIsProcessing(false), 600);
  };

  const handleRestart = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await restartAll();
    setTimeout(() => setIsProcessing(false), 600);
  };

  return (
    <div className="swarm-glass-card p-6 mb-6">
      {flashActive && <div className="fixed inset-0 bg-red-500/10 pointer-events-none z-50 swarm-kill-flash" />}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2"><ShieldAlert size={16} className={isCritical ? 'text-red-600' : 'text-black/60'} /><h3 className="text-sm font-semibold tracking-tight text-black">Emergency Controls</h3></div>
          <button onClick={triggerRogue} className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-amber-500 transition-colors" title="Trigger rogue event"><Zap size={12} />Demo: Force Cascade</button>
        </div>
        <div className="w-full">
          {!allKilled ? (
            <button onClick={handleKill} disabled={isProcessing} className={`w-full h-16 rounded-none flex items-center justify-center gap-3 transition-colors disabled:opacity-50 ${isCritical ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white border border-red-600/30 hover:bg-red-50 text-red-600'}`}><StopCircle size={20} /><span className="text-sm font-bold tracking-widest uppercase">Terminate Swarm</span></button>
          ) : (
            <div className="flex gap-4">
              <div className="flex-1 h-16 rounded-none bg-black/5 border border-black/10 flex items-center justify-center gap-3 text-black/60"><StopCircle size={20} /><span className="text-sm font-bold tracking-widest uppercase">Terminated</span></div>
              <button onClick={handleRestart} disabled={isProcessing} className="flex-1 h-16 rounded-none bg-black text-white hover:bg-black/80 flex items-center justify-center gap-3 transition-colors disabled:opacity-50"><RotateCcw size={20} /><span className="text-sm font-bold tracking-widest uppercase">Restart Swarm</span></button>
            </div>
          )}
        </div>
        <p className="text-[10px] font-mono text-black/50 uppercase tracking-widest">
          {allKilled ? '[SYS] Swarm offline — all agents terminated' : isCritical ? '[WARN] Critical state detected — kill switch armed' : '[INFO] All systems operational — kill switch on standby'}
        </p>
      </div>
    </div>
  );
}

// ── Hallucination Alert ──
function HallucinationAlert({ alerts, agents, systemStatus, killAgent, killAll, dismissAlert, clearAlerts }) {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const rogueAgent = Object.values(agents).find(a => a.status === 'critical');
  const cascadeAgent = Object.values(agents).find(a => a.agentId === 'delta' && a.status === 'warning');
  const hallucinationAlert = alerts.find(a => a.type === 'hallucination');
  const shouldShow = hallucinationAlert && rogueAgent && !dismissed;

  useEffect(() => { if (shouldShow) requestAnimationFrame(() => setIsVisible(true)); else setIsVisible(false); }, [shouldShow]);
  useEffect(() => { if (dismissed && rogueAgent) { const t = setTimeout(() => setDismissed(false), 10000); return () => clearTimeout(t); } }, [dismissed, rogueAgent]);

  if (!shouldShow) return null;
  const burnRate = systemStatus.burnRatePerSec || 5;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className={`max-w-4xl mx-auto rounded-xl p-5 transition-all duration-500 bg-red-50/95 backdrop-blur-md border border-red-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${isVisible ? 'animate-slide-down' : 'opacity-0 -translate-y-full'}`}>
        <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 w-7 h-7 rounded-lg border border-black/5 bg-white/80 hover:bg-black/5 flex items-center justify-center transition-colors shadow-sm"><X size={14} className="text-gray-500" /></button>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg border border-red-500/20 bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Skull size={24} className="text-red-500 animate-pulse" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-red-600" /><h2 className="text-base font-bold text-red-600 tracking-wide">HALLUCINATION CASCADE DETECTED</h2></div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3"><strong className="text-red-600">Agent Gamma (Decision Agent)</strong> has entered an infinite reasoning loop.{cascadeAgent && <span> <strong className="text-amber-600">Agent Delta (Execution Agent)</strong> is receiving corrupted data.</span>}</p>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="bg-white/80 border border-red-500/20 rounded-lg px-4 py-3"><p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">Confidence</p><p className="text-xl font-bold font-mono text-red-600">{((rogueAgent?.confidenceScore || 0.18) * 100).toFixed(0)}%</p></div>
              <div className="bg-white/80 border border-red-500/20 rounded-lg px-4 py-3"><p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">Burn Rate</p><p className="text-xl font-bold font-mono text-red-600">${burnRate.toFixed(2)}/sec</p></div>
              <div className="bg-white/80 border border-red-500/20 rounded-lg px-4 py-3"><p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">Projected Hourly</p><p className="text-xl font-bold font-mono text-red-600">${Math.round(burnRate * 3600).toLocaleString()}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={async () => { if (rogueAgent) { await killAgent(rogueAgent.agentId); clearAlerts(); setDismissed(true); } }} className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"><StopCircle size={16} />Kill Rogue Agent</button>
              <button onClick={async () => { await killAll(); clearAlerts(); setDismissed(true); }} className="px-6 py-2.5 rounded-lg bg-white hover:bg-black/5 border border-black/10 text-black text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"><StopCircle size={16} />Kill All Agents</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// MAIN LIVE SWARM VIEW
// ═══════════════════════════════════════════════════════════
export default function LiveSwarmView() {
  const {
    agents, events, alerts, tokenHistory, systemStatus, isConnected,
    killAgent, killAll, restartAgent, restartAll, resumeAgent, triggerRogue, dismissAlert, clearAlerts,
  } = useSwarmSocket();

  const agentList = AGENT_ORDER.map(id => agents[id]).filter(Boolean);
  const activeAgentCount = agentList.filter(a => a.status !== 'killed').length;
  const activeAlertCount = systemStatus.alertCount || 0;
  const totalTokensFormatted = systemStatus.totalTokens >= 1000000
    ? `${(systemStatus.totalTokens / 1000000).toFixed(1)}M`
    : systemStatus.totalTokens >= 1000
    ? `${(systemStatus.totalTokens / 1000).toFixed(1)}K`
    : String(systemStatus.totalTokens || 0);
  const totalCost = systemStatus.totalCost || 0;
  const costColor = totalCost > 200 ? '#EF4444' : totalCost > 50 ? '#F59E0B' : '#10B981';
  const allKilled = agentList.length > 0 && agentList.every(a => a.status === 'killed');
  const [selectedAgent, setSelectedAgent] = useState(null);

  return (
    <div className="h-full w-full bg-transparent overflow-y-auto">
      <HallucinationAlert alerts={alerts} agents={agents} systemStatus={systemStatus} killAgent={killAgent} killAll={killAll} dismissAlert={dismissAlert} clearAlerts={clearAlerts} />
      <div className="w-full h-full px-6 py-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Zap} label="Total Tokens" value={totalTokensFormatted} color="#8B5CF6" subtext="Cumulative across all agents" />
          <StatCard icon={Activity} label="Active Agents" value={`${activeAgentCount} / 4`} color={activeAgentCount === 4 ? '#10B981' : activeAgentCount > 0 ? '#F59E0B' : '#EF4444'} subtext={allKilled ? 'Swarm terminated' : 'Agents online'} />
          <StatCard icon={AlertTriangle} label="Active Alerts" value={String(activeAlertCount)} color={activeAlertCount > 0 ? '#EF4444' : '#10B981'} subtext={activeAlertCount > 0 ? 'Action required' : 'No active alerts'} />
          <CostTracker totalCost={totalCost} costColor={costColor} burnRatePerMin={systemStatus.burnRatePerMin || 0} systemHealth={systemStatus.systemHealth} />
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {AGENT_ORDER.map(id => (<AgentCard key={id} agent={agents[id]} onKill={() => killAgent(id)} onRestart={() => restartAgent(id)} />))}
        </div>

        {/* Swarm Topology */}
        <SwarmTopology agents={agents} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} />

        {/* Maintenance Panel */}
        <MaintenancePanel agents={agents} resumeAgent={resumeAgent} />

        {/* Bottom Section: Chart + Event Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3"><MetricsChart tokenHistory={tokenHistory} /></div>
          <div className="lg:col-span-2"><EventFeed events={events} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} /></div>
        </div>

        {/* Kill Switch */}
        <KillSwitch killAll={killAll} restartAll={restartAll} allKilled={allKilled} systemHealth={systemStatus.systemHealth} triggerRogue={triggerRogue} />
      </div>
    </div>
  );
}
