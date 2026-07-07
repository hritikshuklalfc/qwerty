import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AgentSimulator from '../engine/AgentSimulator';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SynapseContext = createContext(null);

// ── Initial lease data (Fallback) ──
const INITIAL_LEASES = [
  { id: '1', company: 'Pease Airlines', property: 'Peace Hangers', startDate: '11/7/16', endDate: '12/10/13', units: '238', moveIn: 'Completed', moveOut: 'Pending', status: 'past' },
  { id: '2', company: 'Solutions LLC', property: 'Solutions HQ', startDate: '3/4/16', endDate: '8/30/14', units: '238', moveIn: 'Completed', moveOut: 'Completed', status: 'past' },
  { id: '3', company: 'Myrd Properties', property: '223 Plaza Lane', startDate: '1/28/17', endDate: '2/11/12', units: '238', moveIn: 'Completed', moveOut: 'Incomplete', status: 'past' },
  { id: '4', company: 'Open Property Inc', property: 'Paramount Plaza', startDate: '5/27/15', endDate: '8/15/17', units: '238', moveIn: 'Completed', moveOut: 'Completed', status: 'past' },
  { id: '5', company: 'TechCorp Solutions', property: 'Innovation Hub', startDate: '1/15/24', endDate: '1/15/26', units: '412', moveIn: 'Completed', moveOut: 'Pending', status: 'current' },
  { id: '6', company: 'Green Energy Ltd', property: 'Solar Complex', startDate: '3/1/24', endDate: '3/1/27', units: '156', moveIn: 'Completed', moveOut: 'Pending', status: 'current' },
  { id: '7', company: 'Draft Corp', property: 'New Office', startDate: '', endDate: '', units: '100', moveIn: 'Pending', moveOut: 'Pending', status: 'draft' },
];

// ── Initial node catalog for orchestration ──
const NODE_CATALOG = {
  Listeners: {
    letter: 'L',
    color: 'text-blue-400',
    items: [
      { name: 'Pump telemetry', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', iconName: 'Activity' },
      { name: 'Webhook Listener', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', iconName: 'Zap' },
    ],
  },
  'Context Providers': {
    letter: 'CP',
    color: 'text-orange-400',
    items: [
      { name: 'Get Prompt Details', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400', iconName: 'Database' },
    ],
  },
  Transformations: {
    letter: 'T',
    color: 'text-pink-400',
    items: [
      { name: 'Filters', iconBg: 'bg-pink-500/20', iconColor: 'text-pink-400', iconName: 'Filter' },
      { name: 'Add URL', iconBg: 'bg-pink-500/20', iconColor: 'text-pink-400', iconName: 'Link2' },
      { name: 'Join Prompt Details', iconBg: 'bg-pink-500/20', iconColor: 'text-pink-400', iconName: 'Link2' },
      { name: 'Filter Out Existing', iconBg: 'bg-pink-500/20', iconColor: 'text-pink-400', iconName: 'Filter' },
    ],
  },
  'AI & Machine Learning': {
    letter: 'AI',
    color: 'text-purple-400',
    items: [
      { name: 'Anomaly Detection', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'Cpu' },
      { name: 'Azure ML', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'Cpu' },
      { name: 'Azure OpenAI', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'Bot' },
      { name: 'Binary Classification', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'Cpu' },
      { name: 'Forecasting', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'Activity' },
      { name: 'Ollama Model', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'Bot' },
      { name: 'OpenAI Assistant', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'Bot' },
      { name: 'Python Script', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'FileJson' },
      { name: 'Regression', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', iconName: 'Activity' },
    ],
  },
  Functions: {
    letter: 'F',
    color: 'text-orange-500',
    items: [
      { name: 'HTTP Request', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-500', iconName: 'Zap' },
      { name: 'Email Sender', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-500', iconName: 'Mail' },
    ],
  },
  Recommendations: {
    letter: 'R',
    color: 'text-green-500',
    items: [
      { name: 'Content Recommender', iconBg: 'bg-green-500/20', iconColor: 'text-green-500', iconName: 'Cpu' },
    ],
  },
};

export function SynapseProvider({ children }) {
  const { user } = useAuth();
  const simulatorRef = useRef(null);

  // Initialize simulator once
  if (!simulatorRef.current) {
    simulatorRef.current = new AgentSimulator();
  }
  const simulator = simulatorRef.current;

  // ── Agent State ──
  const [agentStatuses, setAgentStatuses] = useState(() => simulator.getAgentStatuses());
  const [activityLog, setActivityLog] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [scenarioRunning, setScenarioRunning] = useState(null);
  const [demoSteps, setDemoSteps] = useState({});

  // ── Data State ──
  const [leases, setLeases] = useState([]);
  const [products, setProducts] = useState([]);
  const [permissions, setPermissions] = useState({ canCreateTickets: true, canManageLeases: false });
  const [toasts, setToasts] = useState([]);
  const [dbConnected, setDbConnected] = useState(false);

  // ── Load Data from Supabase (or fallback) ──
  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const [{ data: leaseData, error: lErr }, { data: productData, error: pErr }] = await Promise.all([
            supabase.from('leases').select('*'),
            supabase.from('products').select('*')
          ]);

          if (lErr) throw lErr;
          setLeases(leaseData && leaseData.length > 0 ? leaseData : INITIAL_LEASES);
          setProducts(productData && productData.length > 0 ? productData : [
            { id: '1', name: 'Premium Leather Jacket', price: 199.99, stock: 15, sales: 120 },
            { id: '2', name: 'Basic T-Shirt', price: 29.99, stock: 50, sales: 450 }
          ]);
          setDbConnected(true);
        } catch (error) {
          console.warn("Supabase fetch failed, falling back to local storage.", error);
          loadLocalData();
        }
      } else {
        loadLocalData();
      }
    }

    function loadLocalData() {
      const savedLeases = localStorage.getItem('synapse-leases');
      const parsedLeases = savedLeases ? JSON.parse(savedLeases) : null;
      setLeases(parsedLeases && parsedLeases.length > 0 ? parsedLeases : INITIAL_LEASES);
      const savedProducts = localStorage.getItem('synapse-products');
      const parsedProducts = savedProducts ? JSON.parse(savedProducts) : null;
      setProducts(parsedProducts && parsedProducts.length > 0 ? parsedProducts : [
        { id: '1', name: 'Premium Leather Jacket', price: 199.99, stock: 15, sales: 120 },
        { id: '2', name: 'Basic T-Shirt', price: 29.99, stock: 50, sales: 450 }
      ]);
      const savedPerms = localStorage.getItem('synapse-permissions');
      setPermissions(savedPerms ? JSON.parse(savedPerms) : { canCreateTickets: true, canManageLeases: false });
    }

    loadData();
  }, [user]);

  // ── Persist state (fallback) ──
  useEffect(() => {
    if (!dbConnected) {
      localStorage.setItem('synapse-leases', JSON.stringify(leases));
      localStorage.setItem('synapse-products', JSON.stringify(products));
      localStorage.setItem('synapse-permissions', JSON.stringify(permissions));
    }
  }, [leases, products, permissions, dbConnected]);

  // ── Subscribe to simulator events ──
  useEffect(() => {
    simulator.start();

    const unsubs = [
      simulator.on('activity', (entry) => {
        setActivityLog(prev => [...prev.slice(-99), entry]);
      }),
      simulator.on('agent-status', () => {
        setAgentStatuses(simulator.getAgentStatuses());
      }),
      simulator.on('approval-added', (approval) => {
        setPendingApprovals(prev => [...prev, approval]);
        addToast('warning', 'Approval Required', approval.description);
      }),
      simulator.on('approval-resolved', () => {
        setPendingApprovals([...simulator.pendingApprovals]);
      }),
      simulator.on('scenario-start', ({ scenario }) => {
        setScenarioRunning(scenario);
        setDemoSteps({});
      }),
      simulator.on('demo-step', ({ step, status, output }) => {
        setDemoSteps(prev => ({
          ...prev,
          [step]: { status, output },
        }));
      }),
      simulator.on('scenario-complete', () => {
        setScenarioRunning(null);
        addToast('success', 'Scenario Complete', 'All agents finished their tasks successfully!');
      }),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
      simulator.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast System ──
  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Scenario Actions ──
  const runScenario = useCallback(async (scenarioId) => {
    if (scenarioRunning) {
      addToast('warning', 'Busy', 'A scenario is already running');
      return;
    }
    addToast('info', 'Demo Started', `Running: ${simulator.scenarios[scenarioId]?.title}`);
    await simulator.runScenario(scenarioId);
  }, [scenarioRunning, addToast, simulator]);

  // ── Approval Actions ──
  const approveRequest = useCallback((id) => {
    simulator.approveRequest(id);
    setPendingApprovals([...simulator.pendingApprovals]);
    addToast('success', 'Approved', `Request ${id} approved`);
  }, [simulator, addToast]);

  const rejectRequest = useCallback((id) => {
    simulator.rejectRequest(id);
    setPendingApprovals([...simulator.pendingApprovals]);
    addToast('info', 'Rejected', `Request ${id} rejected`);
  }, [simulator, addToast]);

  // ── Lease CRUD ──
  const addLease = useCallback(async (lease) => {
    if (dbConnected && user) {
      const { data, error } = await supabase.from('leases').insert([{ ...lease, user_id: (user.uid || user.id) }]).select();
      if (!error && data) {
        setLeases(prev => [...prev, data[0]]);
        addToast('success', 'Lease Added', `${lease.company} added successfully`);
        return;
      }
    }
    const newLease = { ...lease, id: Date.now().toString() };
    setLeases(prev => [...prev, newLease]);
    addToast('success', 'Lease Added', `${lease.company} added successfully`);
  }, [addToast, dbConnected, user]);

  const updateLease = useCallback(async (id, updates) => {
    if (dbConnected) {
      const { error } = await supabase.from('leases').update(updates).eq('id', id);
      if (error) {
        addToast('error', 'Update Failed', error.message);
        return;
      }
    }
    setLeases(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    addToast('success', 'Lease Updated', 'Lease details updated');
  }, [addToast, dbConnected]);

  const deleteLease = useCallback(async (id) => {
    if (dbConnected) {
      await supabase.from('leases').delete().eq('id', id);
    }
    setLeases(prev => prev.filter(l => l.id !== id));
    addToast('info', 'Lease Deleted', 'Lease removed successfully');
  }, [addToast, dbConnected]);

  // ── Permission Toggle ──
  const togglePermission = useCallback((key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    addToast('info', 'Permission Updated', `${key} toggled`);
  }, [addToast]);

  // ── Product CRUD ──
  const addProduct = useCallback(async (product) => {
    if (dbConnected && user) {
      const { data, error } = await supabase.from('products').insert([{ ...product, user_id: (user.uid || user.id) }]).select();
      if (!error && data) {
        setProducts(prev => [...prev, data[0]]);
        addToast('success', 'Product Saved', `${product.name || 'Product'} added successfully`);
        return data[0];
      }
    }
    const newProduct = { ...product, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setProducts(prev => [...prev, newProduct]);
    addToast('success', 'Product Saved', `${product.name || 'Product'} added successfully`);
    return newProduct;
  }, [addToast, dbConnected, user]);

  const deleteProduct = useCallback(async (id) => {
    if (dbConnected) {
      await supabase.from('products').delete().eq('id', id);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    addToast('info', 'Product Deleted', 'Product removed');
  }, [addToast, dbConnected]);

  // ── Export Leases as CSV ──
  const exportLeasesCSV = useCallback((filteredLeases) => {
    const data = filteredLeases || leases;
    const headers = ['Company', 'Property', 'Start Date', 'End Date', 'Units', 'Move In', 'Move Out', 'Status'];
    const rows = data.map(l => [l.company, l.property, l.startDate, l.endDate, l.units, l.moveIn, l.moveOut, l.status]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-leases-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Exported', 'Lease data downloaded as CSV');
  }, [leases, addToast]);

  const value = {
    // Engine
    simulator,
    scenarios: simulator.scenarios,

    // Agent state
    agentStatuses,
    activityLog,
    pendingApprovals,
    scenarioRunning,
    demoSteps,

    // Actions
    runScenario,
    approveRequest,
    rejectRequest,

    // Leases
    leases,
    addLease,
    updateLease,
    deleteLease,
    exportLeasesCSV,

    // Permissions
    permissions,
    togglePermission,

    // Products
    products,
    addProduct,
    deleteProduct,

    // Toast
    toasts,
    addToast,
    dismissToast,

    // Catalog
    nodeCatalog: NODE_CATALOG,
  };

  return (
    <SynapseContext.Provider value={value}>
      {children}
    </SynapseContext.Provider>
  );
}

export function useSynapse() {
  const context = useContext(SynapseContext);
  if (!context) {
    throw new Error('useSynapse must be used within a SynapseProvider');
  }
  return context;
}

export default SynapseContext;
