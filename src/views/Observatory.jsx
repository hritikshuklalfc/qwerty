import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSynapse } from '../context/SynapseContext';
import { 
  Play, X, Eye, Activity, Clock, DollarSign, 
  CheckCircle2, AlertTriangle, Zap, ChevronDown, 
  ChevronUp, RotateCcw, Cpu, Send, Sparkles,
  Radio, Bot
} from 'lucide-react';
import styles from './Observatory.module.css';

import LiveSwarmView from '../components/liveswarm/LiveSwarmView';

import { AgentNode } from '../components/observatory/AgentNode';
import { TimelinePanel } from '../components/observatory/TimelinePanel';
import { AgentDetailPanel } from '../components/observatory/AgentDetailPanel';

const nodeTypes = { agentNode: AgentNode };

// ═══════════════════════════════════════════
// Edge definitions: which agents can communicate
// ═══════════════════════════════════════════
const AGENT_EDGES = [
  { source: 'inventory', target: 'procurement', label: 'Low Stock Alert' },
  { source: 'procurement', target: 'finance', label: 'PO Validation' },
  { source: 'inventory', target: 'pricing', label: 'Demand Signal' },
  { source: 'logistics', target: 'procurement', label: 'Route Alert' },
  { source: 'logistics', target: 'finance', label: 'Cost Analysis' },
  { source: 'pricing', target: 'finance', label: 'Revenue Data' },
  { source: 'finance', target: 'inventory', label: 'Budget Approval' },
  { source: 'pricing', target: 'logistics', label: 'Priority Signal' },
];

// Constellation layout positions for agents
const AGENT_POSITIONS = {
  inventory:   { x: 400, y: 80 },
  procurement: { x: 100, y: 300 },
  finance:     { x: 700, y: 300 },
  logistics:   { x: 200, y: 550 },
  pricing:     { x: 600, y: 550 },
};

// ═══════════════════════════════════════════
// Main Observatory Component
// ═══════════════════════════════════════════
export default function Observatory() {
  const {
    simulator,
    scenarios,
    agentStatuses,
    activityLog,
    pendingApprovals,
    scenarioRunning,
    demoSteps,
    activeHandoffs,
    runScenario,
    runLiveScenario,
    runCustomPrompt,
    liveMode,
    liveTelemetry,
    approveRequest,
    rejectRequest,
  } = useSynapse();

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeEdges, setActiveEdges] = useState(new Set());
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'flow'
  const [engineMode, setEngineMode] = useState('ai'); // 'ai' (real) or 'sim' (simulation)
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const logEndRef = useRef(null);
  const customInputRef = useRef(null);

  // Track which edges are active based on agent statuses + handoffs
  useEffect(() => {
    const processing = new Set(
      Object.entries(agentStatuses)
        .filter(([_, a]) => a.status === 'processing')
        .map(([id]) => id)
    );

    const edgeSet = new Set();
    
    // Light edges for processing agents
    AGENT_EDGES.forEach(e => {
      if (processing.has(e.source) || processing.has(e.target)) {
        edgeSet.add(`${e.source}-${e.target}`);
      }
    });
    
    // Light edges for active handoffs
    activeHandoffs.forEach(h => {
      const edgeId = `${h.from}-${h.to}`;
      edgeSet.add(edgeId);
    });
    
    setActiveEdges(edgeSet);
  }, [agentStatuses, activeHandoffs]);

  // Open timeline when scenario starts
  useEffect(() => {
    if (scenarioRunning) setTimelineOpen(true);
  }, [scenarioRunning]);

  // Auto-scroll activity log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog]);

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  // Handle scenario button click — routes to real AI or simulation
  const handleRunScenario = useCallback((scenarioId) => {
    if (engineMode === 'ai') {
      runLiveScenario(scenarioId);
    } else {
      runScenario(scenarioId);
    }
  }, [engineMode, runLiveScenario, runScenario]);

  // Handle custom prompt submission
  const handleCustomPrompt = useCallback(() => {
    if (!customPrompt.trim()) return;
    runCustomPrompt(customPrompt.trim());
    setCustomPrompt('');
    setShowCustomInput(false);
  }, [customPrompt, runCustomPrompt]);

  // Build React Flow nodes
  const handleNodeClick = useCallback((agentId) => {
    setSelectedAgent(prev => prev === agentId ? null : agentId);
  }, []);

  const rfNodes = useMemo(() => {
    return Object.entries(agentStatuses).map(([id, agent]) => ({
      id,
      type: 'agentNode',
      position: AGENT_POSITIONS[id] || { x: 400, y: 300 },
      data: { agent, onClick: handleNodeClick },
    }));
  }, [agentStatuses, handleNodeClick]);

  const rfEdges = useMemo(() => {
    return AGENT_EDGES.map(e => {
      const edgeId = `${e.source}-${e.target}`;
      const isActive = activeEdges.has(edgeId);
      return {
        id: edgeId,
        source: e.source,
        target: e.target,
        label: isActive ? e.label : '',
        animated: isActive,
        style: {
          stroke: isActive ? '#06b6d4' : 'rgba(0,0,0,0.12)',
          strokeWidth: isActive ? 3 : 1.5,
          strokeDasharray: isActive ? '8 4' : 'none',
        },
        labelStyle: {
          fontSize: 10,
          fontFamily: 'monospace',
          fill: isActive ? '#0891b2' : 'transparent',
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: isActive ? 'rgba(255,255,255,0.9)' : 'transparent',
          stroke: isActive ? 'rgba(6,182,212,0.2)' : 'transparent',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActive ? '#06b6d4' : 'rgba(0,0,0,0.12)',
          width: 16,
          height: 16,
        },
      };
    });
  }, [activeEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Sync nodes/edges with real-time state
  useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  // Get logs for selected agent
  const agentLogs = useMemo(() => {
    if (!selectedAgent) return [];
    return activityLog.filter(l => l.agentId === selectedAgent).slice(-50);
  }, [activityLog, selectedAgent]);

  // Build timeline entries from demo steps — persist after scenario completes
  const [lastScenarioId, setLastScenarioId] = useState(null);
  
  useEffect(() => {
    if (scenarioRunning) setLastScenarioId(scenarioRunning);
  }, [scenarioRunning]);
  
  const displayScenarioId = scenarioRunning || lastScenarioId;
  const activeScenario = displayScenarioId ? scenarios[displayScenarioId] : null;
  const timelineEntries = useMemo(() => {
    if (!activeScenario) return [];
    return activeScenario.steps.map((step, i) => ({
      ...step,
      status: demoSteps[i]?.status || 'pending',
      output: demoSteps[i]?.output || null,
    }));
  }, [activeScenario, demoSteps]);

  // Pending approval for detail panel
  const agentApprovals = useMemo(() => {
    return pendingApprovals.filter(a => a.status === 'pending');
  }, [pendingApprovals]);

  // Check if API key is set
  const hasApiKey = !!localStorage.getItem('geminiApiKey');

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-transparent">

      {/* ── Scenario Launcher Bar ── */}
      <div className={styles.scenarioBar}>
        {/* Left Section: Title & Scenario Cards */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0 mr-1 sm:mr-2">
            <Cpu size={16} className="text-black/50 dark:text-white/50" />
            <span className="text-sm font-bold text-black dark:text-white tracking-tight">Observatory</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-black/10 dark:bg-white/10 shrink-0" />

          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(scenarios).map(([id, scenario]) => (
              <button
                key={id}
                onClick={() => handleRunScenario(id)}
                disabled={!!scenarioRunning}
                className={`${styles.scenarioCard} ${
                  scenarioRunning === id ? styles.scenarioCardActive : ''
                } ${scenarioRunning && scenarioRunning !== id ? styles.scenarioCardDisabled : ''}`}
              >
                <span className="text-base">{scenario.icon}</span>
                <span>{scenario.title}</span>
                {scenarioRunning === id && (
                  <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent animate-spin rounded-full" />
                )}
                {!scenarioRunning && <Play size={12} className="opacity-40" />}
              </button>
            ))}

            {/* ── Custom Prompt Button (NEW) ── */}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              disabled={!!scenarioRunning || engineMode !== 'ai'}
              className={`${styles.scenarioCard} ${showCustomInput ? styles.scenarioCardActive : ''} ${engineMode !== 'ai' ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={engineMode !== 'ai' ? 'Switch to LIVE AI mode to use custom prompts' : 'Ask agents anything'}
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Custom</span>
            </button>
          </div>
        </div>

        {/* ── Right Section: Engine Mode Toggle + Status ── */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap ml-auto justify-end shrink-0">
          {/* Engine Mode Toggle: AI vs Simulation */}
          <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 border border-black/10 dark:border-white/10 shrink-0">
            <button
              onClick={() => setEngineMode('ai')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                engineMode === 'ai' 
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              <Sparkles size={11} />
              LIVE AI
            </button>
            <button
              onClick={() => setEngineMode('sim')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                engineMode === 'sim' 
                  ? 'bg-cyan-500 text-white shadow-sm' 
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              <Bot size={11} />
              Demo
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 border border-black/10 dark:border-white/10 shrink-0">
            <button
              onClick={() => setViewMode('live')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'live' 
                  ? 'bg-cyan-500 text-white shadow-sm' 
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              Live Swarm
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'flow' 
                  ? 'bg-cyan-500 text-white shadow-sm' 
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              Agent Flow
            </button>
          </div>

          {/* Live AI Status Indicator */}
          {engineMode === 'ai' && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border shrink-0 ${
              liveMode 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : hasApiKey
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500/70'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                liveMode 
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
                  : hasApiKey
                    ? 'bg-emerald-500'
                    : 'bg-red-400'
              }`} />
              {liveMode ? 'AI RUNNING' : hasApiKey ? 'AI READY' : 'NO API KEY'}
            </div>
          )}

          {/* Live Telemetry Badge */}
          {liveTelemetry && (
            <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-[10px] font-mono text-purple-400 shrink-0">
              <span>{liveTelemetry.totalTokens} tok</span>
              <span className="opacity-40">|</span>
              <span>${liveTelemetry.totalCost?.toFixed(4)}</span>
              <span className="opacity-40">|</span>
              <span>{(liveTelemetry.totalLatency / 1000).toFixed(1)}s</span>
            </div>
          )}

          {agentApprovals.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-medium shrink-0">
              <AlertTriangle size={12} />
              {agentApprovals.length} pending
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-black/50 dark:text-white/50 shrink-0">
            <div className="w-2 h-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            {Object.values(agentStatuses).filter(a => a.status !== 'offline').length} online
          </div>
        </div>
      </div>

      {/* ── Custom Prompt Input Bar (NEW) ── */}
      {showCustomInput && engineMode === 'ai' && (
        <div className="px-4 py-3 bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-cyan-500/5 border-b border-amber-500/20 dark:border-amber-500/10 flex items-center gap-3 flex-wrap backdrop-blur-xl">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <input
            ref={customInputRef}
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCustomPrompt();
              }
            }}
            placeholder="Ask agents anything... e.g. 'A major client cancelled a $50K order. What should we do?'"
            disabled={!!scenarioRunning}
            className="flex-1 min-w-[240px] bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2 text-sm text-black dark:text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 font-medium"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCustomPrompt}
              disabled={!customPrompt.trim() || !!scenarioRunning}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              <Send size={14} />
              Run
            </button>
            <button
              onClick={() => setShowCustomInput(false)}
              className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── No API Key Warning ── */}
      {engineMode === 'ai' && !hasApiKey && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-red-400 text-xs font-medium">
          <AlertTriangle size={14} />
          <span>No Gemini API key configured. Go to <strong>Settings → API Configuration</strong> to add your key.</span>
        </div>
      )}

      {/* ── Main Content Area ── */}
      {viewMode === 'live' ? (
        <div className="flex-1 w-full h-full bg-transparent overflow-hidden">
          <LiveSwarmView />
        </div>
      ) : (
        <div className={`flex-1 relative ${styles.canvas}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background gap={24} size={1} color="rgba(0,0,0,0.05)" />
            <Controls showInteractive={false} />
          </ReactFlow>

          {/* ── Agent Detail Panel (Slide-in) ── */}
          <AgentDetailPanel
            selectedAgent={selectedAgent}
            setSelectedAgent={setSelectedAgent}
            agentStatuses={agentStatuses}
            agentApprovals={agentApprovals}
            approveRequest={approveRequest}
            rejectRequest={rejectRequest}
            agentLogs={agentLogs}
            logEndRef={logEndRef}
          />

          {/* ── Timeline Panel ── */}
          <TimelinePanel
            timelineOpen={timelineOpen}
            setTimelineOpen={setTimelineOpen}
            timelineEntries={timelineEntries}
            activeScenario={activeScenario}
            scenarioRunning={scenarioRunning}
          />
        </div>
      )}
    </div>
  );
}
