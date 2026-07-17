// ═══════════════════════════════════════════════════════════
// LIVE SWARM VIEW
// Displays real-time agent swarm telemetry, topology, events,
// cost tracking, alerts, and emergency controls.
// Connects via Socket.IO to the backend server.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSwarmSocket } from '../../hooks/useSwarmSocket';
import {
  Brain, Activity, AlertTriangle, DollarSign, Wifi, WifiOff, Zap,
  Cpu, Clock, Crosshair, RotateCcw, Radio, BarChart3,
  StopCircle, ShieldAlert, Wrench, PlayCircle, Skull, X, TrendingUp,
  Shield, Eye, Loader2, Info,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import './LiveSwarmView.css';

// ═══════════════════════════════════════
// Sub-components & Helpers
// ═══════════════════════════════════════

const STATUS_COLORS = {
  running: { dot: 'green', text: '#10B981', label: 'RUNNING' },
  processing: { dot: 'green', text: '#10B981', label: 'RUNNING' }, // Added processing map
  idle: { dot: 'green', text: '#10B981', label: 'IDLE' },
  warning: { dot: 'amber', text: '#F59E0B', label: 'WARNING' },
  critical: { dot: 'red', text: '#EF4444', label: 'CRITICAL' },
  paused: { dot: 'amber', text: '#F59E0B', label: 'PAUSED' },
  killed: { dot: 'gray', text: '#6B7280', label: 'KILLED' },
};

const AGENT_ICONS = { alpha: '⍺', beta: 'β', gamma: 'γ', delta: 'δ' };
const AGENT_COLORS_MAP = { alpha: '#3B82F6', beta: '#8B5CF6', gamma: '#10B981', delta: '#F59E0B' };

const getAgentColor = (id, index) => {
  if (AGENT_COLORS_MAP[id]) return AGENT_COLORS_MAP[id];
  const palette = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F43F5E'];
  return palette[index % palette.length];
};

const getAgentIcon = (id, index) => {
  if (AGENT_ICONS[id]) return AGENT_ICONS[id];
  return id.substring(0, 1).toUpperCase();
};

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
function AgentCard({ agent, onKill, onRestart, hrs, icon, color }) {
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
          <div className="w-8 h-8 rounded-md border flex items-center justify-center text-base font-bold flex-shrink-0" style={{ borderColor: isKilled ? 'rgba(0,0,0,0.1)' : `${color}40`, background: isKilled ? 'rgba(0,0,0,0.05)' : `${color}10`, color: color }}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight truncate" title={agent.agentName}>{agent.agentName}</h3>
              <span className={`swarm-status-dot ${status.dot}`} />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="swarm-badge border border-black/10 bg-black/5 text-black/60 font-mono">{agent.model || 'auto'}</span>
              <span className="swarm-badge border font-mono" style={{ borderColor: `${status.text}30`, background: `${status.text}10`, color: status.text }}>{status.label}</span>
            </div>
          </div>
        </div>
      </div>
      <p className={`text-xs mb-3 leading-relaxed line-clamp-2 ${isRogue ? 'text-red-400 font-medium' : isCascade ? 'text-amber-400/80' : isPaused ? 'text-amber-600 font-medium' : 'text-gray-500 italic'}`}>{agent.currentTask || 'Idle...'}</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-black/5 border border-black/10 rounded-md p-2.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Tokens</div>
          <p className={`text-sm font-bold font-mono ${isRogue ? 'text-red-600' : 'text-gray-900'}`}>{formatTokens(agent.tokenUsage?.total)}</p>
        </div>
        <div className="bg-black/5 border border-black/10 rounded-md p-2.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Cost</div>
          <p className={`text-sm font-bold font-mono ${agent.costUSD > 100 ? 'text-red-600' : agent.costUSD > 20 ? 'text-amber-600' : 'text-gray-900'}`}>${agent.costUSD?.toFixed(2) || agent.cumulativeCostUSD?.toFixed(2) || '0.00'}</p>
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

      {/* ── HRS Gauge ── */}
      {hrs && (
        <div className="mb-3 bg-black/[0.03] border border-black/10 rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Shield size={10} className={hrs.level === 'critical' ? 'text-red-500' : hrs.level === 'high' ? 'text-orange-500' : hrs.level === 'warning' ? 'text-amber-500' : 'text-emerald-500'} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">HRS</span>
            </div>
            <div className="flex items-center gap-1.5">
              {hrs.activeTiers.map(t => (
                <span key={t} className="text-[8px] font-bold font-mono px-1 py-0.5 rounded border border-black/10 bg-black/5 text-gray-600">{t}</span>
              ))}
              <span className={`text-[10px] font-bold font-mono ${
                hrs.level === 'critical' ? 'text-red-600' : hrs.level === 'high' ? 'text-orange-600' : hrs.level === 'warning' ? 'text-amber-600' : 'text-emerald-600'
              }`}>{(hrs.hrs * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${Math.min(100, hrs.hrs * 100)}%`,
              background: hrs.level === 'critical' ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : hrs.level === 'high' ? 'linear-gradient(90deg, #f97316, #ea580c)'
                : hrs.level === 'warning' ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, #10b981, #059669)',
            }} />
          </div>
        </div>
      )}
      
      {agent.reasoningChain && agent.reasoningChain.length > 0 && (
        <div className="space-y-1 mt-2">
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
const STATUS_FILL = { running: '#10B981', processing: '#10B981', idle: '#10B981', warning: '#F59E0B', critical: '#EF4444', killed: '#374151' };

function SwarmTopology({ agents, agentKeys, selectedAgent, setSelectedAgent, activeSwarmId }) {
  const isDemo = activeSwarmId === 'demo' || (agentKeys.includes('alpha') && agentKeys.includes('beta'));

  const nodeData = useMemo(() => {
    if (isDemo && agentKeys.length <= 4) {
      return TOPO_NODES.map((node, i) => {
        const agent = agents[node.id];
        const status = agent?.status || 'idle';
        return { ...node, status, agent, isSelected: selectedAgent === node.id, isDimmed: selectedAgent !== null && selectedAgent !== node.id };
      });
    } else {
      // Dynamic Layout
      return agentKeys.map((id, i) => {
        const agent = agents[id];
        const status = agent?.status || 'idle';
        return {
          id,
          label: getAgentIcon(id, i),
          name: agent.agentName || id,
          x: 100 + (i % 5) * 160,
          y: 80 + Math.floor(i / 5) * 120,
          status, agent, isSelected: selectedAgent === id, isDimmed: selectedAgent !== null && selectedAgent !== id
        };
      });
    }
  }, [agents, agentKeys, selectedAgent, isDemo]);

  const linkData = useMemo(() => {
    if (isDemo) {
      return TOPO_LINKS.map(link => {
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
        return { ...link, color, lineClass, x1: fromNode?.x + 38, y1: fromNode?.y, x2: toNode?.x - 38, y2: toNode?.y };
      });
    }
    // For non-demo swarms, we draw simple links between consecutive agents for now
    const links = [];
    for (let i = 0; i < nodeData.length - 1; i++) {
      const fromNode = nodeData[i];
      const toNode = nodeData[i + 1];
      const color = (fromNode.status === 'killed' || toNode.status === 'killed') ? '#374151'
        : fromNode.status === 'critical' ? '#EF4444' : '#10B981';
      const lineClass = color === '#374151' ? 'swarm-flow-line-stopped' : color === '#EF4444' ? 'swarm-flow-line-fast' : 'swarm-flow-line';
      links.push({ from: fromNode.id, to: toNode.id, color, lineClass, x1: fromNode.x + 38, y1: fromNode.y, x2: toNode.x - 38, y2: toNode.y });
    }
    return links;
  }, [agents, nodeData, isDemo]);

  const maxRows = Math.max(1, Math.ceil(nodeData.length / 5));
  const svgHeight = isDemo ? 160 : Math.max(160, maxRows * 120 + 40);

  return (
    <div className="swarm-glass-card p-5 rounded-lg overflow-x-auto">
      <svg viewBox={`0 0 ${Math.max(860, Math.min(nodeData.length, 5) * 160 + 50)} ${svgHeight}`} className="w-full" style={{ minHeight: `${svgHeight}px` }}>
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
        {nodeData.map((node, i) => {
          const fill = STATUS_FILL[node.status] || STATUS_FILL.idle;
          const isRogue = node.status === 'critical';
          const isKilled = node.status === 'killed';
          return (
            <g key={node.id} onClick={() => setSelectedAgent(node.isSelected ? null : node.id)} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} opacity={node.isDimmed ? 0.3 : 1} className="hover:opacity-100">
              {!isKilled && <circle cx={node.x} cy={node.y} r="42" fill="none" stroke={fill} strokeWidth="1" opacity={isRogue ? 0.4 : 0.15} className={isRogue ? 'swarm-node-rogue' : ''} />}
              <circle cx={node.x} cy={node.y} r="32" fill={`${fill}20`} stroke={fill} strokeWidth="2" className={!isKilled && !isRogue ? 'swarm-node-pulse' : isRogue ? 'swarm-node-rogue' : ''} />
              <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central" fill={isKilled ? '#6B7280' : '#000000'} fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">{node.label}</text>
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
          events.filter(e => !selectedAgent || e.agent === selectedAgent).map((event, index) => {
            const typeStyle = TYPE_STYLES[event.type] || TYPE_STYLES.INFO;
            const agentColor = getAgentColor(event.agent, Object.keys(AGENT_COLORS_MAP).indexOf(event.agent) > -1 ? Object.keys(AGENT_COLORS_MAP).indexOf(event.agent) : index) || '#6B7280';
            const isCritical = event.type === 'CRITICAL';
            return (
              <div key={event.id} className={`swarm-event-row py-2 px-2 flex items-start gap-2 border-b border-black/5 hover:bg-black/5 transition-colors ${isCritical ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                <span className="text-[10px] font-mono text-gray-500 flex-shrink-0 mt-0.5 w-[58px]">{formatTime(event.timestamp)}</span>
                {event.agent && <span className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 w-[38px] text-center truncate" style={{ color: agentColor }} title={event.agent}>{event.agent.substring(0,6)}</span>}
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
function CustomTooltip({ active, payload, label, agents }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="p-3 border shadow-sm rounded-none" style={{ background: 'rgba(255,255,255,1)', borderColor: 'rgba(0,0,0,0.1)' }}>
      <p className="text-[10px] text-gray-500 font-mono mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-none" style={{ background: entry.color }} />
              <span className="text-[11px] text-gray-500">{agents[entry.dataKey]?.agentName || entry.dataKey}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-gray-900">{entry.value?.toLocaleString() || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsChart({ tokenHistory, agentKeys, agents }) {
  const chartColors = useMemo(() => {
    const colors = {};
    agentKeys.forEach((id, i) => {
      const stroke = getAgentColor(id, i);
      colors[id] = { stroke, fill: `${stroke}25` }; 
    });
    return colors;
  }, [agentKeys]);

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
                {agentKeys.map(id => (
                  <linearGradient key={id} id={`swarm-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors[id]?.stroke} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={chartColors[id]?.stroke} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={{ stroke: 'rgba(0,0,0,0.05)' }} tickLine={false} interval="preserveStartEnd" minTickGap={40} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={{ stroke: 'rgba(0,0,0,0.05)' }} tickLine={false} width={45} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
              <Tooltip content={<CustomTooltip agents={agents} />} />
              {agentKeys.map(id => (
                <Area key={id} type="monotone" dataKey={id} stroke={chartColors[id]?.stroke} fill={`url(#swarm-grad-${id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
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
function KillSwitch({ killAll, restartAll, allKilled, systemHealth, triggerRogue, isDemo }) {
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
          {isDemo && <button onClick={triggerRogue} className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-amber-500 transition-colors" title="Trigger rogue event"><Zap size={12} />Demo: Force Cascade</button>}
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
  const cascadeAgent = Object.values(agents).find(a => a.status === 'warning');
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
            <p className="text-sm text-gray-700 leading-relaxed mb-3"><strong className="text-red-600">{rogueAgent.agentName}</strong> has entered an infinite reasoning loop.{cascadeAgent && <span> <strong className="text-amber-600">{cascadeAgent.agentName}</strong> is receiving corrupted data.</span>}</p>
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


// ── HRS Info Modal ──
function HrsInfoModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [windowState, setWindowState] = useState('normal'); // 'normal' | 'minimized' | 'maximized'

  const portalNode = typeof document !== 'undefined' ? document.body : null;

  if (windowState === 'minimized') {
    const minContent = (
      <div className="fixed top-24 right-8 z-[9999]" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <button onClick={() => setWindowState('normal')} className="swarm-glass-card px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-white/20 hover:bg-white/80 transition-all group cursor-pointer" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
          <Info size={16} className="text-gray-500 group-hover:text-gray-800 transition-colors" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-800">HRS Doc</span>
          <div className="flex gap-1.5 ml-4">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-600/20" />
             <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500/20" />
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-600/20" />
          </div>
        </button>
      </div>
    );
    return portalNode ? createPortal(minContent, portalNode) : minContent;
  }

  const modalContent = (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 ${windowState === 'maximized' ? 'p-4' : 'p-6'}`} style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
      `}</style>
      <div 
        className={`swarm-glass-card shadow-2xl relative flex flex-col border border-white/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          windowState === 'maximized' ? 'w-[98vw] max-w-none rounded-xl' : 'w-full max-w-5xl rounded-xl'
        }`} 
        style={{ 
          height: windowState === 'maximized' ? '98vh' : '85vh', 
          maxHeight: windowState === 'maximized' ? '98vh' : '750px', 
          background: windowState === 'maximized' ? '#ffffff' : 'rgba(255, 255, 255, 0.95)' 
        }}
      >
        <div className="flex justify-start border-b border-black/10 px-4 py-3 bg-black/5">
          <div className="flex items-center gap-2 group">
            <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 border border-red-600/20 shadow-sm transition-colors" title="Close" />
            <button onClick={() => setWindowState('minimized')} className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 border border-yellow-500/20 shadow-sm transition-colors" title="Minimize" />
            <button onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 border border-green-600/20 shadow-sm transition-colors" title="Maximize/Restore" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 flex flex-col">
          {step === 1 && (
            <div className="flex flex-col h-full justify-center max-w-3xl mx-auto animate-slide-up">
              <span className="swarm-badge border border-gray-500/30 bg-gray-500/10 text-gray-800 mb-6 self-start">SYS.DOC.01</span>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-6 uppercase">Understanding HRS</h1>
              <p className="text-lg text-gray-600 mb-6 font-mono leading-relaxed">
                The <strong className="text-gray-900">Hallucination Risk Score (HRS)</strong> is a real-time safety heuristic. It continuously computes the probability that an LLM agent is generating mathematically incorrect, logically inconsistent, or factually inaccurate ("hallucinated") data.
              </p>
              <div className="bg-black/5 border border-black/10 rounded-lg p-6 mb-10 font-mono text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <Activity size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block text-gray-900 mb-1">How it works:</strong>
                    The Engine sits between the agent's reasoning chain and its execution output, scoring every token stream. If the aggregated score exceeds safety thresholds, the system triggers an Auto-Pause.
                  </div>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="bg-black text-white px-6 py-3 font-bold uppercase tracking-wider rounded-md hover:bg-black/80 transition-colors self-start shadow-sm border border-black flex items-center gap-2">
                Initialize Defense Tiers <Zap size={14} />
              </button>
            </div>
          )}
          
          {step === 2 && (
            <div className="w-full h-full flex flex-col animate-slide-up">
              <div className="mb-10">
                <span className="swarm-badge border border-gray-500/30 bg-gray-500/10 text-gray-800 mb-4 inline-block">SYS.DOC.02</span>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">The 3-Tier Defense System</h2>
                <p className="font-mono text-gray-500 text-sm">Deep-dive into the hierarchical validation layers.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                <div className="swarm-glass-card p-6 border-t-4 border-t-gray-400 flex flex-col">
                  <div className="text-4xl font-black text-gray-300 mb-4 font-mono">T1</div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Math & Logic</h3>
                  <div className="flex-1 font-mono text-xs text-gray-600 space-y-3">
                    <p>Calculates statistical variance in numerical outputs.</p>
                    <p>Detects reasoning loops (e.g. A → B → A).</p>
                    <p>Validates basic arithmetic integrity before execution.</p>
                  </div>
                </div>
                
                <div className="swarm-glass-card p-6 border-t-4 border-t-gray-500 flex flex-col">
                  <div className="text-4xl font-black text-gray-400 mb-4 font-mono">T2</div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Contracts</h3>
                  <div className="flex-1 font-mono text-xs text-gray-600 space-y-3">
                    <p>Enforces strict JSON schema compliance.</p>
                    <p>Blocks prompt injection attempts and system-prompt leakages.</p>
                    <p>Ensures agent stays within defined behavioral boundaries.</p>
                  </div>
                </div>
                
                <div className="swarm-glass-card p-6 border-t-4 border-t-gray-600 flex flex-col">
                  <div className="text-4xl font-black text-gray-500 mb-4 font-mono">T3</div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Cross-Reference</h3>
                  <div className="flex-1 font-mono text-xs text-gray-600 space-y-3">
                    <p>Queries external vector databases (RAG) to verify claims.</p>
                    <p>Detects highly-confident false assertions ("deep hallucinations").</p>
                    <p>Cost-heavy: only triggers when T1 & T2 flag suspicion.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex justify-between items-center pt-6 border-t border-black/10">
                <button onClick={() => setStep(1)} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors">← Back</button>
                <button onClick={() => setStep(3)} className="bg-black text-white px-6 py-3 font-bold uppercase tracking-wider rounded-md hover:bg-black/80 transition-colors shadow-sm flex items-center gap-2">
                  View Telemetry States <Activity size={14} />
                </button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="w-full h-full flex flex-col animate-slide-up">
              <div className="mb-10 text-center">
                <span className="swarm-badge border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 mb-4 inline-block">SYS.DOC.03</span>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Reading the Risk Gauge</h2>
                <p className="font-mono text-gray-500 text-sm">Understanding UI states and system interventions.</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 flex-1 items-center justify-center">
                {/* Nominal State */}
                <div className="flex-1 w-full max-w-sm swarm-glass-card p-6 border border-emerald-500/30">
                  <div className="flex justify-between items-center mb-4">
                    <span className="swarm-badge border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">✓ NOMINAL</span>
                    <span className="text-2xl font-black font-mono text-emerald-600">2%</span>
                  </div>
                  <div className="w-full bg-black/5 h-2 rounded-full mb-6 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '2%' }}></div>
                  </div>
                  <div className="font-mono text-xs text-gray-600 space-y-2">
                    <p><strong className="text-gray-900">Status:</strong> All clear. Confidence is high.</p>
                    <p><strong className="text-gray-900">Action:</strong> Agent continues execution loop.</p>
                  </div>
                </div>
                
                {/* Critical State */}
                <div className="flex-1 w-full max-w-sm swarm-glass-card swarm-rogue-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest font-mono">ACTION TAKEN</div>
                  <div className="flex justify-between items-center mb-4 mt-2">
                    <span className="swarm-badge border border-red-500/30 bg-red-500/10 text-red-600 animate-pulse">⚠ AUTO-PAUSE</span>
                    <span className="text-2xl font-black font-mono text-red-600">98%</span>
                  </div>
                  <div className="w-full bg-red-500/20 h-2 rounded-full mb-6 overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full transition-all duration-1000" style={{ width: '98%' }}></div>
                  </div>
                  <div className="font-mono text-xs text-red-900/80 space-y-2">
                    <p><strong className="text-red-700">Status:</strong> Severe logic failure detected.</p>
                    <p><strong className="text-red-700">Action:</strong> Agent instantly paused to prevent corrupted data from cascading downstream.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex justify-center pt-6 border-t border-black/10">
                <button onClick={() => setStep(1)} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black flex items-center gap-2 transition-colors">
                  <RotateCcw size={12} /> Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return portalNode ? createPortal(modalContent, portalNode) : modalContent;
}

// ── HRS Detection Panel ──
function HrsDetectionPanel({ hrsScores, agents, agentKeys, onShowInfo }) {
  const scores = Object.values(hrsScores);
  if (scores.length === 0) return null;

  const maxHrs = scores.reduce((max, s) => s.hrs > max.hrs ? s : max, scores[0]);
  const activeTiers = maxHrs?.activeTiers || ['T1'];
  const anyWarning = scores.some(s => s.level !== 'nominal');

  return (
    <div className={`swarm-glass-card p-5 rounded-lg transition-all duration-300 ${anyWarning ? 'border-amber-500/30' : ''}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/10">
        <div className="flex items-center gap-2">
          <Shield size={16} className={anyWarning ? 'text-amber-600' : 'text-emerald-600'} />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Hallucination Detection Engine</h3>
          <button onClick={onShowInfo} className="text-gray-400 hover:text-gray-900 transition-colors ml-1 p-1 rounded-full hover:bg-black/5" title="What does this mean?">
            <Info size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {activeTiers.map(t => (
            <span key={t} className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
              t === 'T3' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
              : t === 'T2' ? 'border-blue-500/30 bg-blue-500/10 text-blue-600'
              : 'border-gray-300 bg-gray-100 text-gray-600'
            }`}>
              {t === 'T1' ? 'T1: Math' : t === 'T2' ? 'T2: Contracts' : 'T3: Verifier'}
            </span>
          ))}
          <span className="text-[10px] font-mono text-gray-500">
            Accuracy: {maxHrs?.accuracy || '~75-85%'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {agentKeys.map(id => {
          const hrs = hrsScores[id];
          const agent = agents[id];
          if (!hrs || !agent) return (
            <div key={id} className="bg-black/[0.03] border border-black/10 rounded-md p-3">
              <div className="text-[10px] text-gray-400 font-mono">Collecting baseline...</div>
            </div>
          );
          return (
            <div key={id} className={`border rounded-md p-3 transition-all duration-300 ${
              hrs.level === 'critical' ? 'bg-red-50/80 border-red-300'
              : hrs.level === 'high' ? 'bg-orange-50/50 border-orange-300'
              : hrs.level === 'warning' ? 'bg-amber-50/50 border-amber-300'
              : 'bg-black/[0.03] border-black/10'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-900">{agent.agentName || id}</span>
                <span className={`text-xs font-bold font-mono ${
                  hrs.level === 'critical' ? 'text-red-600' : hrs.level === 'high' ? 'text-orange-600' : hrs.level === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                }`}>{(hrs.hrs * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${Math.min(100, hrs.hrs * 100)}%`,
                  background: hrs.level === 'critical' ? '#ef4444'
                    : hrs.level === 'high' ? '#f97316'
                    : hrs.level === 'warning' ? '#f59e0b'
                    : '#10b981',
                }} />
              </div>
              <div className="text-[9px] font-mono text-gray-500 uppercase font-bold tracking-wider">
                {hrs.level === 'critical' ? '⚠ AUTO-PAUSE' : hrs.level === 'high' ? '⚠ HIGH RISK' : hrs.level === 'warning' ? '△ ELEVATED' : '✓ NOMINAL'}
              </div>
              {hrs.shouldPause && (
                <div className="mt-1 text-[9px] font-mono text-red-500 font-bold animate-pulse">AGENT PAUSED BY HRS</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// MAIN LIVE SWARM VIEW
// ═══════════════════════════════════════════════════════════
export default function LiveSwarmView({ activeSwarmId, setLiveAgentCount }) {
  const [showHrsInfo, setShowHrsInfo] = useState(false);
  const {
    swarms, agents, events, alerts, tokenHistory, hrsScores, systemStatus, isConnected, isWaitingForEvent,
    killAgent, killAll, restartAgent, restartAll, resumeAgent, triggerRogue, dismissAlert, clearAlerts,
  } = useSwarmSocket(activeSwarmId);

  const agentKeys = Object.keys(agents);
  const agentList = Object.values(agents);
  const activeAgentCount = agentList.filter(a => a.status !== 'killed').length;

  useEffect(() => {
    if (setLiveAgentCount) setLiveAgentCount(activeAgentCount);
  }, [activeAgentCount, setLiveAgentCount]);

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

  if (isWaitingForEvent) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
        <div className="text-sm font-medium">Waiting for first telemetry event for swarm <span className="font-mono text-xs ml-1 font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{activeSwarmId}</span>...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-transparent overflow-y-auto">
      {showHrsInfo && <HrsInfoModal onClose={() => setShowHrsInfo(false)} />}
      <HallucinationAlert alerts={alerts} agents={agents} systemStatus={systemStatus} killAgent={killAgent} killAll={killAll} dismissAlert={dismissAlert} clearAlerts={clearAlerts} />
      <div className="w-full h-full px-6 py-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Zap} label="Total Tokens" value={totalTokensFormatted} color="#8B5CF6" subtext="Cumulative across all agents" />
          <StatCard icon={Activity} label="Active Agents" value={`${activeAgentCount} / ${agentKeys.length}`} color={activeAgentCount === agentKeys.length && agentKeys.length > 0 ? '#10B981' : activeAgentCount > 0 ? '#F59E0B' : '#EF4444'} subtext={allKilled ? 'Swarm terminated' : 'Agents online'} />
          <StatCard icon={AlertTriangle} label="Active Alerts" value={String(activeAlertCount)} color={activeAlertCount > 0 ? '#EF4444' : '#10B981'} subtext={activeAlertCount > 0 ? 'Action required' : 'No active alerts'} />
          <CostTracker totalCost={totalCost} costColor={costColor} burnRatePerMin={systemStatus.burnRatePerMin || 0} systemHealth={systemStatus.systemHealth} />
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {agentKeys.map((id, i) => (<AgentCard key={id} agent={agents[id]} onKill={() => killAgent(id)} onRestart={() => restartAgent(id)} hrs={hrsScores[id]} icon={getAgentIcon(id, i)} color={getAgentColor(id, i)} />))}
        </div>

        {/* HRS Detection Panel */}
        <HrsDetectionPanel hrsScores={hrsScores} agents={agents} agentKeys={agentKeys} onShowInfo={() => setShowHrsInfo(true)} />

        {/* Swarm Topology */}
        {agentKeys.length > 0 && <SwarmTopology agents={agents} agentKeys={agentKeys} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} activeSwarmId={activeSwarmId} />}

        {/* Maintenance Panel */}
        <MaintenancePanel agents={agents} resumeAgent={resumeAgent} />

        {/* Bottom Section: Chart + Event Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3"><MetricsChart tokenHistory={tokenHistory} agentKeys={agentKeys} agents={agents} /></div>
          <div className="lg:col-span-2"><EventFeed events={events} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} /></div>
        </div>

        {/* Kill Switch */}
        <KillSwitch killAll={killAll} restartAll={restartAll} allKilled={allKilled} systemHealth={systemStatus.systemHealth} triggerRogue={triggerRogue} isDemo={activeSwarmId === 'demo'} />
      </div>
    </div>
  );
}
