import React from 'react';
import { BarChart, Activity, Cpu, Bot } from 'lucide-react';
import { useSynapse } from '../../context/SynapseContext';

const ReportPage = () => {
  const { agentStatuses, activityLog, pendingApprovals } = useSynapse();

  const totalActions = Object.values(agentStatuses).reduce((acc, curr) => acc + curr.actions, 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics Report</h2>
        <p className="text-sm text-text-tertiary">Agent performance and system metrics</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-glass-surface-solid border border-glass-border p-5 rounded-xl">
          <div className="text-text-secondary text-xs font-semibold mb-2 flex items-center gap-2"><Cpu size={14} /> Total Agents</div>
          <div className="text-2xl font-bold text-white">{Object.keys(agentStatuses).length}</div>
        </div>
        <div className="bg-glass-surface-solid border border-glass-border p-5 rounded-xl">
          <div className="text-text-secondary text-xs font-semibold mb-2 flex items-center gap-2"><Activity size={14} /> Total Actions</div>
          <div className="text-2xl font-bold text-blue-400">{totalActions}</div>
        </div>
        <div className="bg-glass-surface-solid border border-glass-border p-5 rounded-xl">
          <div className="text-text-secondary text-xs font-semibold mb-2 flex items-center gap-2"><BarChart size={14} /> Pending Approvals</div>
          <div className="text-2xl font-bold text-orange-400">{pendingApprovals.filter(a => a.status === 'pending').length}</div>
        </div>
        <div className="bg-glass-surface-solid border border-glass-border p-5 rounded-xl">
          <div className="text-text-secondary text-xs font-semibold mb-2 flex items-center gap-2"><Bot size={14} /> Log Entries</div>
          <div className="text-2xl font-bold text-green-400">{activityLog.length}</div>
        </div>
      </div>

      <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-white mb-6">Agent Activity Breakdown</h3>
        <div className="space-y-4">
          {Object.values(agentStatuses).map(agent => (
            <div key={agent.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white flex items-center gap-2">{agent.icon} {agent.name}</span>
                <span className="text-text-tertiary">{agent.actions} actions</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary-accent h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (agent.actions / Math.max(1, totalActions)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
