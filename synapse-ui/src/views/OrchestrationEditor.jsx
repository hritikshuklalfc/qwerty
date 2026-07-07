import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

// ── Auto-Layout Function using Dagre ──
const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 260; 
  const nodeHeight = 85; 

  dagreGraph.setGraph({ rankdir: direction, ranksep: 90, nodesep: 60 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
import { Bot, Database, Mail, FileJson, AlertTriangle, CheckCircle2, Search, ChevronDown, ChevronRight, Activity, Zap, Cpu, Filter, Link2, Play, X, Trash2, Terminal } from 'lucide-react';
import { useSynapse } from '../context/SynapseContext';
import ActivityFeed from '../components/ActivityFeed/ActivityFeed';
import Modal from '../components/Modal/Modal';

// ── Icon Map ──
const ICON_MAP = { Activity, Bot, Database, Mail, FileJson, Zap, Cpu, Filter, Link2 };

// ── Custom Node Component ──
const AgentNode = ({ data, selected }) => {
  const Icon = data.icon;
  const isActive = data.isActive;
  return (
    <div className={`w-64 bg-white/5 backdrop-blur-md border border-emerald-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)] rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:border-emerald-400/50 ${
      isActive 
        ? 'border-teal-400 ring-2 ring-teal-400/30 shadow-[0_0_20px_rgba(45,212,191,0.5)] animate-pulse' 
        : selected 
          ? 'border-teal-400 ring-2 ring-teal-400/30 shadow-[0_0_15px_rgba(45,212,191,0.3)]' 
          : ''
    }`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-background !left-[-6px] hover:scale-125 transition-transform shadow-[0_0_10px_rgba(45,212,191,0.4)]" 
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.iconBg} ${data.iconColor} shrink-0`}>
            {Icon && <Icon size={20} />}
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-teal-400 block leading-tight">{data.title}</span>
            {data.sub && <span className="text-[10px] text-slate-400 block mt-1 leading-tight">{data.sub}</span>}
          </div>
        </div>
        {(data.status || isActive) && (
          <div className={`w-2.5 h-2.5 rounded-full ${isActive || data.status === 'processing' ? 'bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.6)]' : 'bg-slate-500'}`} />
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-background !right-[-6px] hover:scale-125 transition-transform shadow-[0_0_10px_rgba(45,212,191,0.4)]" 
      />
    </div>
  );
};

const nodeTypes = { agentNode: AgentNode };

// ── Initial Data ──
const initialNodes = [
  { id: '1', type: 'agentNode', position: { x: 50, y: 150 }, data: { title: 'Ingestion Node', icon: Activity, iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', sub: 'Pump telemetry' } },
  { id: '2', type: 'agentNode', position: { x: 350, y: 150 }, data: { title: 'Extraction Node', icon: Filter, iconBg: 'bg-pink-500/20', iconColor: 'text-pink-400', sub: 'Text parser' } },
  { id: '3', type: 'agentNode', position: { x: 650, y: 150 }, data: { title: 'AI Inference Node', icon: Bot, iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', sub: 'Ollama (Local Node)' } },
  { id: '4', type: 'agentNode', position: { x: 950, y: 150 }, data: { title: 'Action Node', icon: Mail, iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400', sub: 'Sync Database' } },
];

const edgeStyle = { stroke: '#8bb3d6', strokeWidth: 2 };
const defaultMarker = { type: MarkerType.ArrowClosed, color: '#06b6d4' };

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', style: edgeStyle, markerEnd: defaultMarker },
  { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', style: edgeStyle, markerEnd: defaultMarker },
  { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', style: edgeStyle, markerEnd: defaultMarker },
];

// ── Sidebar Section ──
const SidebarSection = ({ title, iconColor, letter, items, defaultOpen = true, searchTerm, onAddNode, onDragStart }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(item => {
      const name = typeof item === 'string' ? item : item.name;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [items, searchTerm]);

  // Keep section open automatically if there is an active search filter matching items!
  useEffect(() => {
    if (searchTerm && filteredItems.length > 0) {
      setIsOpen(true);
    }
  }, [searchTerm, filteredItems]);

  if (searchTerm && filteredItems.length === 0) return null;

  return (
    <div className="mb-2 border border-white/5 rounded-xl bg-black/10 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full ${iconColor} bg-current/10 flex items-center justify-center text-[10px] font-bold`}>
            {letter}
          </div>
          <span className="text-sm font-semibold text-text-secondary group-hover:text-white transition-colors">{title}</span>
          <span className="text-[10px] text-text-tertiary px-1.5 py-0.5 rounded bg-white/5">{filteredItems.length}</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-text-tertiary" /> : <ChevronRight size={14} className="text-text-tertiary" />}
      </button>
      
      {isOpen && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-1.5 border-t border-white/5 bg-black/5 animate-fade-in">
          {filteredItems.map((item, idx) => {
            const itemData = typeof item === 'string' ? { name: item } : item;
            return (
              <div
                key={idx}
                draggable
                onDragStart={(e) => onDragStart(e, itemData)}
                onClick={() => onAddNode(itemData)}
                className="flex items-center gap-3 py-2 cursor-grab active:cursor-grabbing group hover:bg-white/5 rounded-lg px-2.5 transition-all border border-transparent hover:border-white/5 bg-white/2"
                title={`Drag or click to add "${itemData.name}" to canvas`}
              >
                <div className="w-4 h-4 rounded border border-white/20 group-hover:border-[#00f2fe]/60 group-hover:bg-[#00f2fe]/10 transition-colors flex items-center justify-center bg-white/5">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00f2fe] text-[10px] font-bold">+</span>
                </div>
                <span className="text-xs text-text-secondary group-hover:text-white transition-colors">{itemData.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Scenario Picker Modal ──
const ScenarioPicker = ({ isOpen, onClose, onPick }) => {
  const { scenarios, scenarioRunning } = useSynapse();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Run Demo Scenario" size="lg">
      <p className="text-sm text-text-secondary mb-6">Select a scenario to watch AI agents collaborate autonomously:</p>
      <div className="grid grid-cols-1 gap-4">
        {Object.values(scenarios).map(s => (
          <button
            key={s.id}
            onClick={() => { onPick(s.id); onClose(); }}
            disabled={!!scenarioRunning}
            className="flex items-start gap-4 p-4 rounded-xl border border-glass-border bg-black/20 hover:bg-white/5 hover:border-primary-accent/30 transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-3xl shrink-0">{s.icon}</span>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-primary-accent transition-colors">{s.title}</div>
              <div className="text-xs text-text-tertiary mt-1 leading-relaxed">{s.description}</div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {s.steps.map((step, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-tertiary">
                    {i + 1}. {step.title}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};

// ── Main Component ──
const OrchestrationEditor = () => {
  const { nodeCatalog, runScenario, scenarioRunning, demoSteps, scenarios, addToast, agentStatuses } = useSynapse();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // AI Inference Provider Config States
  const [provider, setProvider] = useState('Gemini');
  const [geminiModel, setGeminiModel] = useState('Gemini 2.5 Flash');
  const [geminiTemp, setGeminiTemp] = useState('0.7');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [anthropicModel, setAnthropicModel] = useState('claude-3-5-sonnet-20240620');
  const [groqArch, setGroqArch] = useState('Llama-3-70b');
  const [groqMaxTokens, setGroqMaxTokens] = useState('2048');
  const [hfUrl, setHfUrl] = useState('https://api-inference.huggingface.co/models/');
  const [hfTask, setHfTask] = useState('Text Generation');
  const [ollamaPort, setOllamaPort] = useState('11434');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [apiKey, setApiKey] = useState('');

  // Additional Node Config States
  const [sourceText, setSourceText] = useState('');
  const [extractionMode, setExtractionMode] = useState('key_value');
  const [actionType, setActionType] = useState('email');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('Synapse AI Notification');
  const [emailBody, setEmailBody] = useState('AI Response:\n{ai_response}');
  const [scriptCode, setScriptCode] = useState('print("Hello from Synapse OS Python Script!")\\nprint("Context received:", context)');

  // Simulation Timeline States
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simProgress, setSimProgress] = useState(0);
  const [simLogs, setSimLogs] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // ── Local Storage Persistence ──
  useEffect(() => {
    const savedNodes = localStorage.getItem('synapse_workflow_nodes');
    const savedEdges = localStorage.getItem('synapse_workflow_edges');
    if (savedNodes && savedEdges) {
      try {
        const parsedNodes = JSON.parse(savedNodes);
        if (parsedNodes.length > 0) {
          const restoredNodes = parsedNodes.map(n => {
            let restoredIcon = Bot;
            if (n.data?.title) {
              const t = n.data.title.toLowerCase();
              if (t.includes('ingest')) restoredIcon = Activity;
              else if (t.includes('extract')) restoredIcon = Filter;
              else if (t.includes('action') || t.includes('mail')) restoredIcon = Mail;
            }
            return {
              ...n,
              data: { ...n.data, icon: restoredIcon }
            };
          });
          setNodes(restoredNodes);
          setEdges(JSON.parse(savedEdges));
        }
      } catch (e) {
        console.error('Failed to parse saved workflow', e);
      }
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length > 0) {
      const safeNodes = nodes.map(n => ({
        ...n,
        data: { ...n.data, icon: undefined }
      }));
      localStorage.setItem('synapse_workflow_nodes', JSON.stringify(safeNodes));
      localStorage.setItem('synapse_workflow_edges', JSON.stringify(edges));
    }
  }, [nodes, edges]);

  // ── Serialize nodes for the backend (strip non-serializable icon components) ──
  const serializeNodes = (nodeList) => nodeList.map(n => ({
    id: n.id,
    type: n.type || 'agentNode',
    position: n.position,
    data: {
      title: n.data?.title || 'Unnamed Node',
      sub: n.data?.sub || '',
      iconBg: n.data?.iconBg || '',
      iconColor: n.data?.iconColor || '',
      config: n.data?.config || {},
    },
  }));

  // ── Hardcoded fallback simulation (runs when backend is offline) ──
  const runFallbackSimulation = () => {
    setSimRunning(true);
    setSimStep(1);
    setSimProgress(0);
    setSimLogs([]);
    setShowLogs(true);

    const progressInterval = setInterval(() => {
      setSimProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + 1.25;
      });
    }, 100);

    const steps = [
      { id: '1', log: '[00:01] INFO  ▸ Initializing Multi-Modal parser stream… Reading source file.' },
      { id: '2', log: '[00:03] INFO  ▸ Transforming unstructured text data into structured JSON layout.' },
      { id: '3', log: `[00:05] SUCCESS ▸ Executing pipeline payload using ${provider}… Response token generation completed.` },
      { id: '4', log: '[00:07] SUCCESS ▸ Workflow completed. Database records synchronized successfully.' }
    ];

    let currentStep = 1;
    setSimLogs([steps[0].log]);
    setNodes(nds => nds.map(n => n.id === '1' ? { ...n, data: { ...n.data, isActive: true } } : { ...n, data: { ...n.data, isActive: false } }));
    setEdges(eds => eds.map(e => ({
      ...e,
      animated: e.source === '1',
      style: e.source === '1' ? { stroke: '#06b6d4', strokeWidth: 3, strokeDasharray: '5,5' } : edgeStyle
    })));

    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep > 4) {
        clearInterval(stepInterval);
        setSimRunning(false);
        setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isActive: false } })));
        setEdges(eds => eds.map(e => ({ ...e, animated: false, style: edgeStyle })));
        addToast('success', 'Workflow Complete', 'Database records synchronized successfully.');
        return;
      }
      setSimStep(currentStep);
      setSimLogs(prev => [...prev, steps[currentStep - 1].log]);
      setNodes(nds => nds.map(n => n.id === String(currentStep) ? { ...n, data: { ...n.data, isActive: true } } : { ...n, data: { ...n.data, isActive: false } }));
      setEdges(eds => eds.map(e => {
        const sourceNum = parseInt(e.source, 10);
        const isFlowing = !isNaN(sourceNum) && sourceNum <= currentStep;
        return { ...e, animated: isFlowing, style: isFlowing ? { stroke: '#06b6d4', strokeWidth: 3, strokeDasharray: '5,5' } : edgeStyle };
      }));
    }, 2000);
  };

  // ── Main execution function — calls backend, falls back to local sim ──
  const executeWorkflow = async () => {
    if (simRunning || isExecuting) return;
    setIsExecuting(true);
    setSimRunning(true);
    setSimStep(0);
    setSimProgress(0);
    setSimLogs(['[...] Connecting to Synapse Engine backend…']);
    setShowLogs(true);

    // Start a smooth progress bar animation
    let progressVal = 0;
    const progressInterval = setInterval(() => {
      progressVal += 0.5;
      if (progressVal > 90) { clearInterval(progressInterval); return; }
      setSimProgress(progressVal);
    }, 100);

    try {
      const serializedNodes = serializeNodes(nodes);
      const serializedEdges = edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type || 'smoothstep' }));

      const response = await fetch('http://localhost:8000/api/execute-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: serializedNodes, edges: serializedEdges }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result = await response.json();

      // Animate nodes one at a time based on the execution order from the backend
      clearInterval(progressInterval);
      setSimLogs([]);

      const executionOrder = result.execution_order || [];
      const allLogs = result.logs || [];

      // Feed logs in progressively and highlight nodes sequentially
      for (let i = 0; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i];
        const stepProgress = ((i + 1) / executionOrder.length) * 100;

        // Highlight the active node
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, isActive: true } } : { ...n, data: { ...n.data, isActive: false } }));
        setEdges(eds => eds.map(e => {
          const isFlowing = executionOrder.slice(0, i + 1).includes(e.source);
          return { ...e, animated: isFlowing, style: isFlowing ? { stroke: '#06b6d4', strokeWidth: 3, strokeDasharray: '5,5' } : edgeStyle };
        }));
        setSimStep(i + 1);
        setSimProgress(stepProgress);

        // Find logs that belong to this node's execution chunk
        const nodeLogs = allLogs.filter(log => log.includes(`[${nodeId}]`) || log.includes(nodes.find(n => n.id === nodeId)?.data?.title || ''));
        
        // Add a few logs per step with a delay
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Push ALL logs at the end for the complete picture
      setSimLogs(allLogs);
      setSimProgress(100);

      // Reset node highlights after a brief pause
      await new Promise(resolve => setTimeout(resolve, 800));
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isActive: false } })));
      setEdges(eds => eds.map(e => ({ ...e, animated: false, style: edgeStyle })));
      setSimRunning(false);
      setIsExecuting(false);
      addToast('success', 'Workflow Complete', `Executed ${executionOrder.length} nodes via Synapse Engine.`);

    } catch (err) {
      // ── Fallback: backend is offline, run local simulation ──
      clearInterval(progressInterval);
      console.warn('Backend unreachable, falling back to local simulation:', err.message);
      setSimRunning(false);
      setIsExecuting(false);
      setSimLogs([`[WARN] Backend offline (${err.message}). Running local simulation…`]);

      // Small delay before fallback starts
      await new Promise(resolve => setTimeout(resolve, 500));
      runFallbackSimulation();
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', style: edgeStyle, markerEnd: defaultMarker }, eds)),
    [setEdges]
  );

  // Drag and Drop handlers
  const onDragStart = useCallback((event, itemData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(itemData));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;

      const itemData = JSON.parse(dataStr);
      if (!reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `node-${Date.now()}`;
      const Icon = ICON_MAP[itemData.iconName] || Bot;
      const newNode = {
        id,
        type: 'agentNode',
        position,
        data: {
          title: itemData.name,
          icon: Icon,
          iconBg: itemData.iconBg || 'bg-purple-500/20',
          iconColor: itemData.iconColor || 'text-purple-400',
        },
      };

      setNodes((nds) => [...nds, newNode]);
      addToast('success', 'Node Added', `"${itemData.name}" added at drop coordinate.`);
    },
    [reactFlowInstance, setNodes, addToast]
  );

  // Auto-Layout Clean Up
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      'LR'
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      }
    }, 50);
    addToast('success', 'Layout Cleaned', 'Nodes automatically aligned from left to right.');
  }, [nodes, edges, setNodes, setEdges, reactFlowInstance, addToast]);

  // Add node from sidebar click (fallback)
  const handleAddNode = useCallback((itemData) => {
    const id = `node-${Date.now()}`;
    const Icon = ICON_MAP[itemData.iconName] || Bot;
    const newNode = {
      id,
      type: 'agentNode',
      position: {
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 300,
      },
      data: {
        title: itemData.name,
        icon: Icon,
        iconBg: itemData.iconBg || 'bg-purple-500/20',
        iconColor: itemData.iconColor || 'text-purple-400',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    addToast('success', 'Node Added', `"${itemData.name}" added to canvas`);
  }, [setNodes, addToast]);

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      addToast('info', 'No Selection', 'Select a node first, then delete');
      return;
    }
    const selectedIds = new Set(selectedNodes.map(n => n.id));
    setNodes(nds => nds.filter(n => !selectedIds.has(n.id)));
    setEdges(eds => eds.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
    addToast('info', 'Deleted', `${selectedNodes.length} node(s) removed`);
  }, [nodes, setNodes, setEdges, addToast]);

  // Node double click handler (opens config drawer)
  const onNodeDoubleClick = useCallback((_, node) => {
    setSelectedNode(node);
    if (node.data?.config) {
      setProvider(node.data.config.provider || 'Gemini');
      setGeminiModel(node.data.config.geminiModel || 'Gemini 2.5 Flash');
      setGeminiTemp(node.data.config.geminiTemp || '0.7');
      setOpenaiModel(node.data.config.openaiModel || 'gpt-4o');
      setAnthropicModel(node.data.config.anthropicModel || 'claude-3-5-sonnet-20240620');
      setGroqArch(node.data.config.groqArch || 'Llama-3-70b');
      setGroqMaxTokens(node.data.config.groqMaxTokens || '2048');
      setHfUrl(node.data.config.hfUrl || 'https://api-inference.huggingface.co/models/');
      setHfTask(node.data.config.hfTask || 'Text Generation');
      setOllamaPort(node.data.config.ollamaPort || '11434');
      setOllamaModel(node.data.config.ollamaModel || 'llama3');
      setApiKey(node.data.config.apiKey || '');
      setSourceText(node.data.config.sourceText || '');
      setExtractionMode(node.data.config.extractionMode || 'key_value');
      setActionType(node.data.config.actionType || 'email');
      setSmtpHost(node.data.config.smtpHost || 'smtp.gmail.com');
      setSmtpPort(node.data.config.smtpPort || '587');
      setSmtpUser(node.data.config.smtpUser || '');
      setSmtpPassword(node.data.config.smtpPassword || '');
      setToEmail(node.data.config.toEmail || '');
      setEmailSubject(node.data.config.subject || 'Synapse AI Notification');
      setEmailBody(node.data.config.body || 'AI Response:\n{ai_response}');
      setScriptCode(node.data.config.scriptCode || 'print("Hello from Synapse OS Python Script!")\\nprint("Context received:", context)');
    } else {
      setProvider('Gemini');
      setGeminiModel('Gemini 2.5 Flash');
      setGeminiTemp('0.7');
      setOpenaiModel('gpt-4o');
      setAnthropicModel('claude-3-5-sonnet-20240620');
      setGroqArch('Llama-3-70b');
      setGroqMaxTokens('2048');
      setHfUrl('https://api-inference.huggingface.co/models/');
      setHfTask('Text Generation');
      setOllamaPort('11434');
      setOllamaModel('llama3');
      setApiKey('');
      setSourceText('');
      setExtractionMode('key_value');
      setActionType('email');
      setSmtpHost('smtp.gmail.com');
      setSmtpPort('587');
      setSmtpUser('');
      setSmtpPassword('');
      setToEmail('');
      setEmailSubject('Synapse AI Notification');
      setEmailBody('AI Response:\n{ai_response}');
      setScriptCode('print("Hello from Synapse OS Python Script!")\\nprint("Context received:", context)');
    }
    setShowNodeDetails(true);
  }, []);

  // Keyboard handler
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      handleDeleteSelected();
    }
  }, [handleDeleteSelected]);

  // Current running scenario info
  const currentScenario = scenarioRunning ? scenarios[scenarioRunning] : null;

  return (
    <div className="flex h-full w-full bg-transparent" onKeyDown={onKeyDown} tabIndex={0}>
      
      {/* Sidebar */}
      <div className="w-72 h-full flex flex-col bg-white/5 backdrop-blur-2xl border-r border-white/10 shrink-0 shadow-2xl">
        
        {/* Search */}
        <div className="flex border-b border-white/10 p-4">
          <div className="flex items-center bg-black/20 border border-white/10 rounded-lg py-2 px-3 focus-within:border-primary-accent transition-colors w-full">
            <Search size={14} className="text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search nodes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-white text-xs ml-2 w-full placeholder:text-text-tertiary"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-text-tertiary hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex-grow overflow-y-auto p-3 no-scrollbar">
          {Object.entries(nodeCatalog).map(([category, { letter, color, items }]) => (
            <SidebarSection
              key={category}
              title={category}
              letter={letter}
              iconColor={color}
              items={items}
              defaultOpen={category === 'AI & Machine Learning'}
              searchTerm={searchTerm}
              onAddNode={handleAddNode}
              onDragStart={onDragStart}
            />
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          <div className="text-[10px] text-text-tertiary text-center">
            {nodes.length} nodes · {edges.length} connections
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <div className="h-20 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center px-6 shrink-0 z-10 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-background">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                AI Advisor 
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/10 text-text-tertiary">V1.2</span>
                {scenarioRunning && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </h1>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            {/* Auto-Layout Clean Up */}
            <button
              onClick={onLayout}
              className="flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              title="Clean Up Layout (Left-to-Right)"
            >
              Clean Up Layout
            </button>

            {/* Run Scenario Button */}
            <button
              onClick={executeWorkflow}
              disabled={!!scenarioRunning || simRunning || isExecuting}
              className="flex items-center gap-2 text-xs font-semibold text-cyan-200 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 backdrop-blur-md hover:bg-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              {isExecuting ? (
                <><span className="w-3 h-3 border-2 border-cyan-200 border-t-transparent rounded-full animate-spin" /> Executing…</>
              ) : (
                <><Play size={12} className="text-cyan-200 fill-cyan-200/20" /> Execute Workflow</>
              )}
            </button>

            <div className="w-px h-4 bg-white/20 mx-1" />

            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-red-400 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-500/30 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>

            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${showLogs ? 'text-white border-primary-accent/50 bg-primary-accent/10' : 'text-text-secondary border-transparent hover:border-white/10'}`}
            >
              <Terminal size={12} /> Logs
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        {simRunning && (
          <div className="w-full bg-black/45 h-1.5 overflow-hidden border-b border-white/10 relative z-20">
            <div 
              className="h-full bg-gradient-to-r from-primary-accent via-cyan-400 to-[#00f2fe] transition-all duration-300 shadow-[0_0_8px_#00f2fe]" 
              style={{ width: `${simProgress}%` }}
            />
          </div>
        )}

        {/* Scenario Progress Banner */}
        {currentScenario && (
          <div className="bg-black/30 border-b border-glass-border px-6 py-3 flex items-center gap-4 animate-slide-in">
            <span className="text-lg">{currentScenario.icon}</span>
            <span className="text-sm font-semibold text-white">{currentScenario.title}</span>
            <div className="flex gap-2 ml-4">
              {currentScenario.steps.map((step, i) => {
                const stepState = demoSteps[i];
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border transition-all ${
                      stepState?.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                      stepState?.status === 'active' ? 'bg-primary-accent/20 border-primary-accent text-primary-accent animate-pulse' :
                      'bg-white/5 border-white/20 text-text-tertiary'
                    }`}>
                      {stepState?.status === 'completed' ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] hidden lg:inline ${stepState?.status === 'completed' ? 'text-green-400' : stepState?.status === 'active' ? 'text-primary-accent' : 'text-text-tertiary'}`}>
                      {step.title}
                    </span>
                    {i < currentScenario.steps.length - 1 && <div className="w-4 h-px bg-white/20 mx-1" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main content area: canvas + optional logs + optional config drawer */}
        <div className="flex-grow flex relative">
          {/* Node Editor */}
          <div 
            className={`${showLogs ? 'w-2/3' : 'w-full'} h-full bg-transparent transition-all relative`}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDoubleClick={onNodeDoubleClick}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              fitView
              className="dark-theme bg-transparent"
              deleteKeyCode={null}
            >
              <Background color="transparent" gap={16} size={1} />
              <Controls className="!bg-glass-surface !border-glass-border !fill-white" />
            </ReactFlow>
          </div>

          {/* Logs Panel */}
          {showLogs && (
            <div className="w-1/3 border-l border-glass-border bg-background/90 flex flex-col animate-slide-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-primary-accent" />
                  <span className="text-xs font-bold text-white">Agent Activity Logs</span>
                </div>
                <button onClick={() => setShowLogs(false)} className="text-text-tertiary hover:text-white">
                  <X size={14} />
                </button>
              </div>
              
              {simRunning || simLogs.length > 0 ? (
                <div className="flex-grow overflow-y-auto p-4 space-y-3 font-mono text-[11px] text-green-400 bg-black/40 no-scrollbar">
                  {simLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed border-b border-white/5 pb-2 animate-fade-in">
                      {log}
                    </div>
                  ))}
                  {simRunning && (
                    <div className="flex items-center gap-2 text-text-tertiary">
                      <span className="w-1.5 h-1.5 bg-[#00f2fe] rounded-full animate-ping" />
                      <span>Pipeline executing...</span>
                    </div>
                  )}
                </div>
              ) : (
                <ActivityFeed className="p-2" />
              )}
            </div>
          )}

          {/* Config Sliding Drawer */}
          {showNodeDetails && selectedNode && (
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-background/95 border-l border-glass-border backdrop-blur-md flex flex-col animate-slide-in z-25 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${selectedNode.data.iconBg} ${selectedNode.data.iconColor}`}>
                    {selectedNode.data.icon && <selectedNode.data.icon size={14} />}
                  </div>
                  <span className="text-xs font-bold text-white">{selectedNode.data.title}</span>
                </div>
                <button onClick={() => setShowNodeDetails(false)} className="text-text-tertiary hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar text-xs">
                <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10 shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedNode.data.iconBg} ${selectedNode.data.iconColor}`}>
                    {selectedNode.data.icon && <selectedNode.data.icon size={16} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{selectedNode.data.title}</div>
                    <div className="text-[10px] text-text-tertiary">ID: {selectedNode.id}</div>
                  </div>
                </div>

                {/* Dynamic Configuration Panels */}
                {(() => {
                  const title = selectedNode.data.title?.toLowerCase() || '';
                  
                  if (title.includes('ingest') || title.includes('pump') || title.includes('listener')) {
                    return (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-4">
                        <div className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/10 pb-1.5">Ingestion Config</div>
                        <div>
                          <label className="text-text-secondary block mb-1 font-medium">Data Source Text</label>
                          <textarea 
                            value={sourceText} 
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="Enter raw telemetry or source data..."
                            className="w-full h-24 bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#00f2fe]"
                          />
                        </div>
                      </div>
                    );
                  }

                  if (title.includes('extract') || title.includes('parser') || title.includes('filter')) {
                    return (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-4">
                        <div className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/10 pb-1.5">Extraction Config</div>
                        <div>
                          <label className="text-text-secondary block mb-1 font-medium">Extraction Mode</label>
                          <select 
                            value={extractionMode} 
                            onChange={(e) => setExtractionMode(e.target.value)}
                            className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#00f2fe]"
                          >
                            <option value="key_value">Key-Value Pairs (Comma Separated)</option>
                            <option value="regex">Regex Matching</option>
                            <option value="generic">Generic Text Block</option>
                          </select>
                        </div>
                      </div>
                    );
                  }

                  if (title.includes('inference') || title.includes('ai') || title.includes('llm') || title.includes('model') || title.includes('assistant')) {
                    return (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-4">
                        <div className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/10 pb-1.5">AI Inference Config</div>
                        
                        <div>
                          <label className="text-text-secondary block mb-1 font-medium">AI Inference Provider</label>
                          <select 
                            value={provider} 
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#00f2fe]"
                          >
                            <option value="Gemini">Google Gemini Pro</option>
                            <option value="OpenAI">OpenAI (GPT-4)</option>
                            <option value="Anthropic">Anthropic (Claude)</option>
                            <option value="Groq">Groq Cloud Infrastructure</option>
                            <option value="HuggingFace">Hugging Face Inference</option>
                            <option value="Ollama">Ollama (Local Node)</option>
                          </select>
                        </div>

                        {provider === 'Gemini' && (
                          <div className="space-y-3 animate-fade-in">
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">API Key <span className="text-red-400">*</span></label>
                              <input 
                                type="password" 
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API Key..."
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-red-400"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">Model Version</label>
                              <select 
                                value={geminiModel} 
                                onChange={(e) => setGeminiModel(e.target.value)}
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                              >
                                <option value="Gemini 2.5 Flash">Gemini 2.5 Flash</option>
                                <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">Temperature: {geminiTemp}</label>
                              <input 
                                type="range" 
                                min="0.0" 
                                max="1.0" 
                                step="0.1" 
                                value={geminiTemp} 
                                onChange={(e) => setGeminiTemp(e.target.value)}
                                className="w-full accent-[#00f2fe]"
                              />
                            </div>
                          </div>
                        )}

                        {provider === 'Groq' && (
                          <div className="space-y-3 animate-fade-in">
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">LLM Architecture</label>
                              <select 
                                value={groqArch} 
                                onChange={(e) => setGroqArch(e.target.value)}
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                              >
                                <option value="Llama-3-70b">Llama-3-70b</option>
                                <option value="Mixtral-8x7b">Mixtral-8x7b</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {provider === 'OpenAI' && (
                          <div className="space-y-3 animate-fade-in">
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">API Key <span className="text-red-400">*</span></label>
                              <input 
                                type="password" 
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-red-400"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">Model Version</label>
                              <select 
                                value={openaiModel} 
                                onChange={(e) => setOpenaiModel(e.target.value)}
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                              >
                                <option value="gpt-4o">gpt-4o</option>
                                <option value="gpt-4-turbo">gpt-4-turbo</option>
                                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {provider === 'Anthropic' && (
                          <div className="space-y-3 animate-fade-in">
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">API Key <span className="text-red-400">*</span></label>
                              <input 
                                type="password" 
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-ant-..."
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-red-400"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">Model Version</label>
                              <select 
                                value={anthropicModel} 
                                onChange={(e) => setAnthropicModel(e.target.value)}
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                              >
                                <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {provider === 'Ollama' && (
                          <div className="space-y-3 animate-fade-in">
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">Local Port</label>
                              <input 
                                type="text" 
                                value={ollamaPort} 
                                onChange={(e) => setOllamaPort(e.target.value)}
                                placeholder="11434"
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium">Model Name</label>
                              <input 
                                type="text" 
                                value={ollamaModel} 
                                onChange={(e) => setOllamaModel(e.target.value)}
                                placeholder="llama3, mistral, etc..."
                                className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (title.includes('action') || title.includes('sync') || title.includes('mail') || title.includes('email') || title.includes('notify') || title.includes('sender')) {
                    return (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-4">
                        <div className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/10 pb-1.5">Action / Email Config</div>
                        
                        <div>
                          <label className="text-text-secondary block mb-1 font-medium">Action Type</label>
                          <select 
                            value={actionType} 
                            onChange={(e) => setActionType(e.target.value)}
                            className="w-full bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#00f2fe]"
                          >
                            <option value="email">Send Email (SMTP)</option>
                            <option value="database">Sync Database</option>
                          </select>
                        </div>

                        {actionType === 'email' && (
                          <div className="space-y-3 animate-fade-in">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-text-secondary block mb-1 font-medium text-[10px]">SMTP Host</label>
                                <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full bg-black/45 border border-white/10 rounded-lg px-2 py-1 text-white outline-none text-[10px]" />
                              </div>
                              <div>
                                <label className="text-text-secondary block mb-1 font-medium text-[10px]">Port</label>
                                <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="w-full bg-black/45 border border-white/10 rounded-lg px-2 py-1 text-white outline-none text-[10px]" />
                              </div>
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium text-[10px]">SMTP User (Email)</label>
                              <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="w-full bg-black/45 border border-white/10 rounded-lg px-2 py-1 text-white outline-none text-[10px]" />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium text-[10px]">App Password</label>
                              <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className="w-full bg-black/45 border border-white/10 rounded-lg px-2 py-1 text-white outline-none text-[10px]" />
                              <div className="text-[9px] text-text-tertiary mt-1">Use a Google App Password for Gmail.</div>
                            </div>
                            <div className="border-t border-white/10 pt-3 mt-3">
                              <label className="text-text-secondary block mb-1 font-medium text-[10px]">To Email</label>
                              <input type="text" value={toEmail} onChange={(e) => setToEmail(e.target.value)} className="w-full bg-black/45 border border-white/10 rounded-lg px-2 py-1 text-white outline-none text-[10px]" />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium text-[10px]">Subject</label>
                              <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full bg-black/45 border border-white/10 rounded-lg px-2 py-1 text-white outline-none text-[10px]" />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1 font-medium text-[10px]">Body Template</label>
                              <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="w-full h-24 bg-black/45 border border-white/10 rounded-lg px-2 py-1 text-white outline-none text-[10px] resize-none" placeholder="Use {ai_response} and {raw_text}" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (title.includes('python') || title.includes('script')) {
                    return (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-4">
                        <div className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/10 pb-1.5">Python Script Config</div>
                        <div>
                          <label className="text-text-secondary block mb-1 font-medium">Code (context available)</label>
                          <textarea 
                            value={scriptCode} 
                            onChange={(e) => setScriptCode(e.target.value)}
                            className="w-full h-32 bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-green-400 font-mono text-[10px] outline-none focus:border-[#00f2fe]"
                          />
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                {(
                  selectedNode.data.title?.toLowerCase().includes('ingest') ||
                  selectedNode.data.title?.toLowerCase().includes('pump') ||
                  selectedNode.data.title?.toLowerCase().includes('extract') ||
                  selectedNode.data.title?.toLowerCase().includes('parser') ||
                  selectedNode.data.title?.toLowerCase().includes('inference') ||
                  selectedNode.data.title?.toLowerCase().includes('ai') ||
                  selectedNode.data.title?.toLowerCase().includes('model') ||
                  selectedNode.data.title?.toLowerCase().includes('action') ||
                  selectedNode.data.title?.toLowerCase().includes('mail') ||
                  selectedNode.data.title?.toLowerCase().includes('python')
                ) && (
                  <div className="px-3">
                    <button 
                      onClick={() => {
                        setNodes(nds => nds.map(n => {
                          if (n.id === selectedNode.id) {
                            return {
                              ...n,
                              data: {
                                ...n.data,
                                config: { 
                                  provider, geminiModel, geminiTemp, openaiModel, anthropicModel, groqArch, groqMaxTokens, hfUrl, hfTask, ollamaPort, ollamaModel, apiKey,
                                  sourceText, extractionMode, actionType, smtpHost, smtpPort, smtpUser, smtpPassword, toEmail, subject: emailSubject, body: emailBody, scriptCode
                                }
                              }
                            };
                          }
                          return n;
                        }));
                        setShowNodeDetails(false);
                        addToast('success', 'Configuration Saved', 'Node configuration updated.');
                      }}
                      className="w-full py-2 bg-gradient-to-r from-primary-accent to-[#00f2fe] text-background font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Save Configuration
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-black/10 rounded-lg border border-white/5">
                    <div className="text-text-tertiary mb-1">Position X</div>
                    <div className="text-white font-semibold">{Math.round(selectedNode.position.x)}</div>
                  </div>
                  <div className="p-3 bg-black/10 rounded-lg border border-white/5">
                    <div className="text-text-tertiary mb-1">Position Y</div>
                    <div className="text-white font-semibold">{Math.round(selectedNode.position.y)}</div>
                  </div>
                </div>

                <div className="p-3 bg-black/10 rounded-lg border border-white/5 text-xs">
                  <div className="text-text-tertiary mb-2">Connected Edges</div>
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map(e => (
                    <div key={e.id} className="text-text-secondary py-1 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {e.source} → {e.target}
                    </div>
                  ))}
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length === 0 && (
                    <div className="text-text-tertiary italic">No connections</div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-white/10 shrink-0">
                <button
                  onClick={() => { handleDeleteSelected(); setShowNodeDetails(false); }}
                  className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                >
                  Delete Node
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scenario Picker */}
      <ScenarioPicker
        isOpen={showScenarios}
        onClose={() => setShowScenarios(false)}
        onPick={runScenario}
      />
    </div>
  );
};

export default OrchestrationEditor;
