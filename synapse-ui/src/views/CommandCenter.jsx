import React, { useState, useMemo, useCallback } from 'react';
import { Search, Download, Plus, Map, LayoutDashboard, Edit, CheckCircle2, Activity, AlertTriangle, Filter, Trash2, X, Edit2, Check } from 'lucide-react';
import { useSynapse } from '../context/SynapseContext';
import Modal from '../components/Modal/Modal';

// ── Add/Edit Lease Form ──
const LeaseForm = ({ lease, onSave, onCancel }) => {
  const [form, setForm] = useState(lease || {
    company: '', property: '', startDate: '', endDate: '', units: '', moveIn: 'Pending', moveOut: 'Pending', status: 'draft'
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-white mb-1.5 block">Company</label>
          <input value={form.company} onChange={e => handleChange('company', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="Company name" />
        </div>
        <div>
          <label className="text-xs font-semibold text-white mb-1.5 block">Property</label>
          <input value={form.property} onChange={e => handleChange('property', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="Property name" />
        </div>
        <div>
          <label className="text-xs font-semibold text-white mb-1.5 block">Start Date</label>
          <input value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="MM/DD/YY" />
        </div>
        <div>
          <label className="text-xs font-semibold text-white mb-1.5 block">End Date</label>
          <input value={form.endDate} onChange={e => handleChange('endDate', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="MM/DD/YY" />
        </div>
        <div>
          <label className="text-xs font-semibold text-white mb-1.5 block">Units</label>
          <input value={form.units} onChange={e => handleChange('units', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="Number of units" />
        </div>
        <div>
          <label className="text-xs font-semibold text-white mb-1.5 block">Status</label>
          <select value={form.status} onChange={e => handleChange('status', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-accent transition-colors">
            <option value="current">Current</option>
            <option value="past">Past</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-text-secondary hover:text-white transition-colors">Cancel</button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.company || !form.property}
          className="px-6 py-2 bg-white text-background text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
};

const CommandCenter = () => {
  const { leases, addLease, updateLease, deleteLease, exportLeasesCSV, permissions, togglePermission, agentStatuses } = useSynapse();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('past');
  const [subTab, setSubTab] = useState('tenancy');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLease, setEditingLease] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Contacts states
  const [contacts, setContacts] = useState([
    { id: '1', name: "Aman Verma", email: "aman.v@synapse.io", role: "Lead Multi-Branch Auditor", type: "auditor" },
    { id: '2', name: "Sarah Jenkins", email: "s.jenkins@synapse.io", role: "Legal Counsel (Leasing)", type: "counsel" },
    { id: '3', name: "System Dispatcher Agent", email: "dispatcher@synapse.io", role: "Autonomous Microservice", type: "agent", status: "ACTIVE" }
  ]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', role: '', email: '' });

  // Filter and search
  const filteredLeases = useMemo(() => {
    let result = leases.filter(l => l.status === activeTab);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.company.toLowerCase().includes(term) ||
        l.property.toLowerCase().includes(term)
      );
    }
    return result;
  }, [leases, activeTab, searchTerm]);

  const tabCounts = useMemo(() => ({
    current: leases.filter(l => l.status === 'current').length,
    past: leases.filter(l => l.status === 'past').length,
    draft: leases.filter(l => l.status === 'draft').length,
  }), [leases]);

  // Stats from agent engine
  const totalAgentActions = Object.values(agentStatuses).reduce((sum, a) => sum + a.actions, 0);
  const activeAgents = Object.values(agentStatuses).filter(a => a.status === 'processing').length;

  const handleSaveNew = useCallback((form) => {
    addLease(form);
    setShowAddModal(false);
  }, [addLease]);

  const handleSaveEdit = useCallback((form) => {
    updateLease(editingLease.id, form);
    setEditingLease(null);
  }, [editingLease, updateLease]);

  const handleDelete = useCallback((id) => {
    deleteLease(id);
    setDeleteConfirm(null);
  }, [deleteLease]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      
      {/* Top Navigation Bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
             <div className="w-4 h-4 bg-white/30 rounded-sm transform rotate-12" />
           </div>
           <div className="text-sm font-medium text-text-tertiary">
             Dashboard / <span className="text-white font-semibold">Delgancy Property</span>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/20 border border-white/10 rounded-full py-1.5 px-4 focus-within:border-primary-accent transition-colors w-64">
            <Search size={14} className="text-text-tertiary" />
            <input
              type="text"
              placeholder="Search leases..."
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
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white hover:bg-white/5 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            AI Mode
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Inner Header Tabs */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button 
                onClick={() => setSubTab('tenancy')}
                className={`px-4 py-2 text-sm font-semibold rounded-full shadow-md transition-colors ${subTab === 'tenancy' ? 'bg-white text-black' : 'text-text-secondary hover:text-white bg-transparent'}`}
              >
                Tenancy Details
              </button>
              <button 
                onClick={() => setSubTab('abstraction')}
                className={`px-4 py-2 text-sm font-semibold rounded-full shadow-md transition-colors ${subTab === 'abstraction' ? 'bg-white text-black' : 'text-text-secondary hover:text-white bg-transparent'}`}
              >
                Lease Details & Abstraction
              </button>
              <button 
                onClick={() => setSubTab('contacts')}
                className={`px-4 py-2 text-sm font-semibold rounded-full shadow-md transition-colors ${subTab === 'contacts' ? 'bg-white text-black' : 'text-text-secondary hover:text-white bg-transparent'}`}
              >
                Important Contacts
              </button>
            </div>
            <button
              onClick={() => exportLeasesCSV(filteredLeases)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 backdrop-blur-md hover:bg-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all text-sm font-medium rounded-lg"
            >
              <Download size={14} /> Export
            </button>
          </div>

          {subTab === 'tenancy' && (
            <>
              {/* Top Cards Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-slide-in">
                {/* Card 1: Company Details */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:bg-white/10 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-white">Company Details</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddModal(true)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-colors" title="Add new lease"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,59,48,0.3)]">
                       <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[12px] border-b-white border-r-[8px] border-r-transparent transform rotate-90" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Delegancy property</div>
                      <div className="text-[11px] text-text-tertiary font-medium">example.com</div>
                    </div>
                    <div className="ml-auto px-2 py-1 rounded bg-black/20 border border-white/5 text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Industrial</div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-text-tertiary mb-1 font-medium">📧 Email</div>
                      <div className="text-white font-semibold truncate">support@example.com</div>
                      <div className="text-white font-semibold truncate mt-1">sales@example.com</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-text-tertiary mb-1 font-medium">📞 Phone</div>
                      <div className="text-white font-semibold truncate">+1 657 123 1234</div>
                      <div className="text-white font-semibold truncate mt-1">+1 657 123 5678</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-text-tertiary mb-1 font-medium"><Map size={12} /> Address</div>
                      <div className="text-white font-semibold leading-tight pr-4">200A Westminster Ave, Venice</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-text-tertiary mb-1 font-medium">🌐 Country</div>
                      <div className="text-white font-semibold flex items-center gap-1.5"><span className="text-[12px] opacity-80">🇺🇸</span> United States</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Live Agent Stats */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col hover:bg-white/10 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-white">Agent Overview</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-center">
                      <div className="text-2xl font-bold text-white">{Object.keys(agentStatuses).length}</div>
                      <div className="text-[10px] text-text-tertiary font-medium mt-1">Total Agents</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-center">
                      <div className="text-2xl font-bold text-green-400">{activeAgents}</div>
                      <div className="text-[10px] text-text-tertiary font-medium mt-1">Active Now</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-center">
                      <div className="text-2xl font-bold text-blue-400">{totalAgentActions}</div>
                      <div className="text-[10px] text-text-tertiary font-medium mt-1">Total Actions</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-center">
                      <div className="text-2xl font-bold text-purple-400">{leases.length}</div>
                      <div className="text-[10px] text-text-tertiary font-medium mt-1">Total Leases</div>
                    </div>
                  </div>
                  <div className="mt-auto space-y-2">
                    {Object.values(agentStatuses).map(agent => (
                      <div key={agent.id} className="flex items-center gap-2 text-xs">
                        <span>{agent.icon}</span>
                        <span className="text-text-secondary flex-grow">{agent.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          agent.status === 'processing' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-text-tertiary'
                        }`}>
                          {agent.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 3: Lease Date & Permissions */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:bg-white/10 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-white">Lease Date</h3>
                  </div>
                  <div className="flex gap-4 mb-8">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white mb-2">Commencement Date</div>
                      <div className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-inner">9-12-2024</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white mb-2">Expiration Date</div>
                      <div className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-medium text-text-tertiary shadow-inner">9-12-2026</div>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-bold text-white mb-4">Tenant Permissions</h4>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-sm text-white font-semibold mb-0.5">Access</div>
                      <div className="text-[11px] text-text-tertiary">Tenant Can Create Job Tickets</div>
                    </div>
                    <button
                      onClick={() => togglePermission('canCreateTickets')}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${permissions.canCreateTickets ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-black/40 border border-white/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${permissions.canCreateTickets ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-secondary font-semibold mb-0.5">Manage</div>
                      <div className="text-[11px] text-text-tertiary max-w-[180px] leading-tight">Manage lease dates and tenant permissions.</div>
                    </div>
                    <button
                      onClick={() => togglePermission('canManageLeases')}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${permissions.canManageLeases ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-black/40 border border-white/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full shadow-sm transition-all ${permissions.canManageLeases ? 'right-1 bg-white' : 'left-1 bg-text-tertiary'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Leases Table */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-slide-in hover:bg-white/10 transition-all duration-300">
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/10">
                  <div className="flex items-center gap-6">
                    <span className="text-lg font-bold text-white">Leases List</span>
                    <div className="flex items-center bg-black/30 border border-white/10 rounded-full py-1.5 px-3">
                      <Search size={14} className="text-text-tertiary" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-xs ml-2 w-48 placeholder:text-text-tertiary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold items-center">
                    {[
                      { key: 'current', label: 'Current Lease' },
                      { key: 'past', label: 'Past Leases' },
                      { key: 'draft', label: 'Drafts' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`transition-colors ${activeTab === tab.key ? 'text-white bg-white/10 px-3 py-1 rounded-full border border-white/10' : 'text-text-secondary hover:text-white cursor-pointer'}`}
                      >
                        {tab.label} <span className="text-text-tertiary ml-1 font-normal">{tabCounts[tab.key]}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-7 h-7 rounded-full bg-primary-accent/20 border border-primary-accent/40 flex items-center justify-center text-primary-accent ml-2 hover:bg-primary-accent/30 transition-colors"
                      title="Add new lease"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[1000px]">
                    <thead>
                      <tr className="text-text-tertiary text-xs border-b border-white/10 bg-white/2">
                        <th className="py-4 px-6 w-12"></th>
                        <th className="py-4 px-4 font-medium">Company</th>
                        <th className="py-4 px-4 font-medium">Property</th>
                        <th className="py-4 px-4 font-medium">Start Date</th>
                        <th className="py-4 px-4 font-medium">End Date</th>
                        <th className="py-4 px-4 font-medium">Units</th>
                        <th className="py-4 px-4 font-medium">Move In</th>
                        <th className="py-4 px-4 font-medium">Move Out</th>
                        <th className="py-4 px-6 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-white text-sm">
                      {filteredLeases.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-text-tertiary">
                            {searchTerm ? `No results for "${searchTerm}"` : 'No leases in this category'}
                          </td>
                        </tr>
                      )}
                      {filteredLeases.map((row) => (
                        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors font-medium">
                          <td className="py-5 px-6"><div className="w-4 h-4 rounded border border-white/20 bg-black/20" /></td>
                          <td className="py-5 px-4">{row.company}</td>
                          <td className="py-5 px-4 text-text-secondary">{row.property}</td>
                          <td className="py-5 px-4">{row.startDate || '—'}</td>
                          <td className="py-5 px-4">{row.endDate || '—'}</td>
                          <td className="py-5 px-4">{row.units}</td>
                          <td className="py-5 px-4">
                            <StatusBadge status={row.moveIn} />
                          </td>
                          <td className="py-5 px-4">
                            <StatusBadge status={row.moveOut} />
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex justify-end gap-2 text-text-tertiary">
                              <button onClick={() => setEditingLease(row)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-colors bg-white/5" title="Edit"><Edit size={14} /></button>
                              <button onClick={() => setDeleteConfirm(row)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-colors bg-white/5" title="Delete"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Lease Details & Abstraction Sub Tab */}
          {subTab === 'abstraction' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in">
              {/* Card 1: Financial Clauses */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-slate-800/50 transition-all duration-300 p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Financial Clauses</h3>
                  <p className="text-xs text-slate-400">Extracted lease financial terms</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-200">Base Rent</span>
                    <span className="font-semibold text-cyan-400">$45 / sq ft</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-200">Security Deposit</span>
                    <span className="font-semibold text-cyan-400">$50,000</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-200">Escalation Rate</span>
                    <span className="font-semibold text-cyan-400">3.5% Annually</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-200">Escalation Period</span>
                    <span className="font-semibold text-white">Starting Year 2</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Critical Dates */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-slate-800/50 transition-all duration-300 p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Critical Dates</h3>
                  <p className="text-xs text-slate-400">Operational milestones & deadlines</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-200">Execution Date</span>
                    <span className="font-semibold text-cyan-400">Jan 10, 2026</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-200">Expiration Date</span>
                    <span className="font-semibold text-cyan-400">Dec 31, 2031</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-200">Renewal Notice</span>
                    <span className="font-semibold text-cyan-400">June 1, 2031</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-200">Notice Period</span>
                    <span className="font-semibold text-white">180 Days Prior</span>
                  </div>
                </div>
              </div>

              {/* Card 3: AI Confidence Scores */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-slate-800/50 transition-all duration-300 p-6 flex flex-col items-center justify-between text-center space-y-4 md:col-span-2 lg:col-span-1">
                <div className="w-full text-left">
                  <h3 className="text-lg font-bold text-white mb-1">AI Confidence Scores</h3>
                  <p className="text-xs text-slate-400">Accuracy parsing validations</p>
                </div>
                
                {/* SVG Progress Ring */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#06b6d4"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * 97.4) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-bold text-cyan-400">97.4%</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Accuracy</span>
                  </div>
                </div>

                <div className="text-xs text-slate-200 leading-normal px-2">
                  NLP parsing verification matches standard LLM validation profiles.
                </div>
              </div>
            </div>
          )}

          {/* Important Contacts Sub Tab */}
          {subTab === 'contacts' && (
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-slate-800/50 transition-all duration-300 p-6 space-y-6 max-w-4xl mx-auto animate-slide-in">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Important Contacts</h3>
                <p className="text-xs text-text-tertiary">Operational leads and autonomous agents active on this lease</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {contacts.map((contact) => {
                  const isEditing = editingId === contact.id;
                  return (
                    <div 
                      key={contact.id} 
                      className="p-4 bg-black/25 border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group hover:bg-slate-900/30 transition-all duration-200 ease-in-out"
                    >
                      {isEditing ? (
                        <div className="space-y-2 text-left flex-grow max-w-lg">
                          <div>
                            <label className="text-[10px] text-slate-400 block font-semibold uppercase mb-0.5">Name</label>
                            <input 
                              type="text" 
                              value={editFormData.name} 
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} 
                              className="bg-black/20 border border-white/10 text-slate-200 text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block font-semibold uppercase mb-0.5">Role</label>
                            <input 
                              type="text" 
                              value={editFormData.role} 
                              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })} 
                              className="bg-black/20 border border-white/10 text-slate-200 text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block font-semibold uppercase mb-0.5">Email</label>
                            <input 
                              type="text" 
                              value={editFormData.email} 
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} 
                              className="bg-black/20 border border-white/10 text-slate-200 text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 font-mono"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold text-white">{contact.name}</span>
                            {contact.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                {contact.status}
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                contact.type === 'auditor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                contact.type === 'counsel' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              }`}>{contact.role || "Operations Team"}</span>
                            )}
                          </div>
                          {contact.status === 'ACTIVE' && (
                            <div className="text-[10px] text-text-tertiary font-semibold uppercase">{contact.role}</div>
                          )}
                          {!contact.status && contact.role && (
                            <div className="text-[10px] text-text-tertiary font-medium">{contact.role}</div>
                          )}
                          <div className="text-xs text-text-secondary font-mono">{contact.email}</div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, name: editFormData.name, role: editFormData.role, email: editFormData.email } : c));
                                setEditingId(null);
                              }}
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                              title="Save Changes"
                            >
                              <Check size={14} /> Save
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setEditingId(null);
                              }}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                              title="Cancel Edit"
                            >
                              <X size={14} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setEditingId(contact.id);
                                setEditFormData({ name: contact.name, role: contact.role, email: contact.email });
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white rounded-lg"
                              title="Edit Contact"
                            >
                              <Edit2 size={12} />
                            </button>
                            <a 
                              href={`mailto:${contact.email}`}
                              onClick={(e) => { /* native behaviour is fine */ }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-xs text-text-secondary font-medium"
                              title="Send Email"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                              Email
                            </a>
                            <button 
                              onClick={(e) => { e.preventDefault(); alert(`Showing execution logs for: ${contact.name}`); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-[#00f2fe] rounded-lg transition-colors text-xs text-text-secondary font-medium"
                              title="View Logs"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              Logs
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* + Add Operator Action Option at the bottom */}
              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const newId = `contact-${Date.now()}`;
                    const newContact = {
                      id: newId,
                      name: "New Operator",
                      role: "Systems Analyst",
                      email: "operator@synapse.io",
                      type: "auditor"
                    };
                    setContacts(prev => [...prev, newContact]);
                    setEditingId(newId);
                    setEditFormData({ name: newContact.name, role: newContact.role, email: newContact.email });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 backdrop-blur-md hover:bg-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all font-bold text-xs rounded-lg animate-pulse-ring"
                >
                  <Plus size={12} /> Add Operator
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Lease Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Lease">
        <LeaseForm onSave={handleSaveNew} onCancel={() => setShowAddModal(false)} />
      </Modal>

      {/* Edit Lease Modal */}
      <Modal isOpen={!!editingLease} onClose={() => setEditingLease(null)} title="Edit Lease">
        {editingLease && (
          <LeaseForm lease={editingLease} onSave={handleSaveEdit} onCancel={() => setEditingLease(null)} />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        {deleteConfirm && (
          <div className="text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <p className="text-sm text-text-secondary mb-2">Are you sure you want to delete the lease for</p>
            <p className="text-base font-bold text-white mb-6">"{deleteConfirm.company}"?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-6 py-2 rounded-lg bg-glass-surface text-sm text-white hover:bg-white/10 border border-white/10 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="px-6 py-2 rounded-lg bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── Status Badge Component ──
const StatusBadge = ({ status }) => {
  const config = {
    Completed: { icon: CheckCircle2, color: 'border-green-500/50 text-green-400 bg-green-500/10' },
    Pending: { icon: Activity, color: 'border-orange-500/50 text-orange-400 bg-orange-500/10' },
    Incomplete: { icon: AlertTriangle, color: 'border-red-500/50 text-red-400 bg-red-500/10' },
  };
  const c = config[status] || config.Pending;
  const Icon = c.icon;
  return (
    <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${c.color}`}>
      <Icon size={12} strokeWidth={2.5} /> {status}
    </div>
  );
};

export default CommandCenter;
