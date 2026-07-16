import React, { useState, useCallback } from 'react';
import { Bot, GitBranch, Settings, X, CheckCircle2, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSynapse } from '../context/SynapseContext';
import { useAuth } from '../hooks/useAuth';


// ── Sidebar Item ──
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2 rounded-[8px] transition-colors duration-200 w-full text-sm font-medium ${active ? 'bg-sot-gray-light dark:bg-black text-sot-blue' : 'text-text-secondary dark:text-white/70 hover:bg-sot-gray-light dark:bg-black hover:text-foreground dark:text-white'}`}
  >
    <Icon size={18} className={active ? 'text-sot-blue' : 'text-text-tertiary'} />
    <span>{label}</span>
  </button>
);

// ── Agent List View ──
const ProductListView = ({ products, onDelete }) => (
  <div className="space-y-4">
    <h2 className="text-sm font-semibold text-foreground dark:text-white">Deployed Swarms ({products.length})</h2>
    {products.length === 0 && (
      <div className="text-center py-16 text-text-tertiary bg-white dark:bg-[#111] rounded-[8px] border border-sot-border dark:border-white/10">
        <Network size={32} className="mx-auto mb-4 text-text-tertiary" />
        <p className="text-sm font-medium">No active nodes. Initialize a swarm!</p>
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(p => (
        <div key={p.id} className="flex flex-col gap-4 p-5 bg-white dark:bg-[#111] border border-sot-border dark:border-white/10 rounded-[8px] hover:shadow-sot-light transition-shadow group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-[8px] bg-sot-gray-light dark:bg-black border border-sot-border dark:border-white/10 flex items-center justify-center text-text-secondary dark:text-white/70">
              {p.images?.[0] ? (
                <img src={p.images[0].dataUrl} alt="" className="w-full h-full rounded-[8px] object-cover" />
              ) : (
                <Bot size={20} />
              )}
            </div>
            <button onClick={() => onDelete(p.id)} className="text-text-tertiary hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-[4px] border border-transparent hover:border-sot-border dark:border-white/10 hover:bg-sot-gray-light dark:bg-black"><X size={14} /></button>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground dark:text-white truncate">{p.name || 'ANONYMOUS_NODE'}</div>
            <div className="text-xs text-text-secondary dark:text-white/70 mt-1">{p.sku || 'SYS-ID-PENDING'}</div>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-sot-border dark:border-white/10 mt-auto">
             <div className="text-xs font-medium text-text-secondary dark:text-white/70">{p.category || 'Core'}</div>
             {p.price && <div className="text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-[4px] border border-green-200">{p.price} req/s</div>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Approvals View ──
const ApprovalsView = () => {
  const { pendingApprovals, approveRequest, rejectRequest } = useSynapse();

  return (
    <div className="space-y-6 h-full overflow-y-auto no-scrollbar pb-12">
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground dark:text-white mb-1">Interventions</h2>
        <p className="text-sm text-text-secondary dark:text-white/70">Awaiting authorization from biological operator</p>
      </div>

      {pendingApprovals.length === 0 && (
        <div className="text-center py-16 text-text-tertiary border border-dashed border-sot-border dark:border-white/10 rounded-[8px] bg-white dark:bg-[#111] mt-8">
          <CheckCircle2 size={32} className="mx-auto mb-4 text-green-500" />
          <p className="text-sm font-medium">No pending interventions. Nominal operations.</p>
        </div>
      )}

      <div className="grid gap-4 mt-6 max-w-4xl">
        {pendingApprovals.map(approval => (
          <div key={approval.id} className="p-5 bg-white dark:bg-[#111] border border-sot-border dark:border-white/10 rounded-[8px] flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center hover:shadow-sot-light transition-shadow">
            <div className="flex gap-5 flex-grow">
              <div className="w-12 h-12 rounded-[8px] bg-sot-gray-light dark:bg-black border border-sot-border dark:border-white/10 flex items-center justify-center text-2xl shrink-0">
                {approval.agentIcon || '🤖'}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-sm font-semibold text-foreground dark:text-white">{approval.description}</h3>
                   <span className="text-[10px] font-medium text-sot-blue bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-100">AWAITING_AUTH</span>
                </div>
                <div className="text-xs text-text-secondary dark:text-white/70 mb-3">
                  Req Source: <span className="font-medium text-foreground dark:text-white">{approval.agentName}</span>
                </div>
                {approval.details && (
                  <div className="bg-sot-gray-light dark:bg-black p-3 rounded-[8px] border border-sot-border dark:border-white/10 text-xs text-text-secondary dark:text-white/70 grid grid-cols-2 gap-2">
                    {Object.entries(approval.details).map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5">
                        <span className="text-text-tertiary uppercase text-[10px]">{k}</span> 
                        <span className="text-foreground dark:text-white truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {approval.status === 'pending' ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
                <button 
                  onClick={() => rejectRequest(approval.id)}
                  className="px-4 py-2 bg-white dark:bg-[#111] border border-sot-border dark:border-white/10 text-text-secondary dark:text-white/70 rounded-[8px] text-sm font-medium hover:bg-sot-gray-light dark:bg-black transition-colors"
                >
                  Reject
                </button>
                <button 
                  onClick={() => approveRequest(approval.id)}
                  className="px-4 py-2 bg-sot-blue text-white rounded-[8px] text-sm font-medium hover:bg-sot-blue-light transition-colors"
                >
                  Authorize
                </button>
              </div>
            ) : (
              <div className={`px-3 py-1 rounded-[4px] text-xs font-medium border shrink-0 ${
                approval.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {approval.status}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


// ── Main Component ──

const SIDEBAR_ITEMS = [
  { icon: Bot, label: 'Agent Swarms' },
  { icon: GitBranch, label: 'Workflow Canvas' },
  { icon: Settings, label: 'Settings' },
];

const MultiModalInbox = () => {
  const { products, deleteProduct, pendingApprovals } = useSynapse();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSidebar, setActiveSidebar] = useState('Agent Swarms');

  const pendingCount = pendingApprovals.filter(a => a.status === 'pending').length;

  const handleSidebarClick = (label) => {
    if (label === 'Settings') {
      navigate('/app/settings');
    } else {
      setActiveSidebar(label);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-transparent font-sans text-foreground dark:text-white transition-colors duration-500">
      
      {/* Mobile Tabs */}
      <div className="md:hidden w-full overflow-x-auto no-scrollbar border-b border-sot-border dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md p-2 flex gap-2 shrink-0">
        {SIDEBAR_ITEMS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSidebarClick(item.label)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSidebar === item.label ? 'bg-sot-gray-light dark:bg-black text-sot-blue' : 'text-text-secondary dark:text-white/70 hover:bg-sot-gray-light dark:bg-black'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Secondary Sidebar (Desktop only) */}
      <div className="hidden md:flex w-64 h-full flex-col bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border-r border-sot-border dark:border-white/10 shrink-0 z-10 relative transition-colors duration-500">
        <div className="p-6 pb-4 border-b border-sot-border dark:border-white/10">
          <div className="cursor-pointer mb-6 flex items-center justify-start" onClick={() => navigate('/')}>
            <div className="font-display font-semibold text-lg text-foreground dark:text-white">Synapse OS</div>
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-180px)] pr-2">
            {SIDEBAR_ITEMS.map((item, idx) => (
              <div key={idx} className="relative">
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  active={activeSidebar === item.label}
                  onClick={() => handleSidebarClick(item.label)}
                />
                {item.label === 'Workflow Canvas' && pendingCount > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-sot-blue rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-auto p-5 border-t border-sot-border dark:border-white/10 bg-sot-gray-light dark:bg-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-[#111] border border-sot-border dark:border-white/10 flex items-center justify-center text-text-secondary dark:text-white/70 text-xs font-bold shrink-0">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground dark:text-white truncate">{user?.user_metadata?.full_name || 'Operator'}</div>
              <div className="text-[10px] text-text-secondary dark:text-white/70 truncate">{user?.email || 'SYS.ADMIN'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden bg-transparent">
        {activeSidebar === 'Agent Swarms' && (
          <div className="flex-grow overflow-y-auto p-8 no-scrollbar relative z-10">
            <div className="flex justify-between items-end mb-8 border-b border-sot-border dark:border-white/10 pb-4">
              <div>
                <h1 className="text-2xl font-display font-semibold text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-slate-200 dark:to-cyan-400 mb-1">Agent Swarms</h1>
                <div className="text-sm text-text-secondary dark:text-white/70">{products.length} Nodes Active</div>
              </div>
            </div>
            <ProductListView products={products} onDelete={deleteProduct} />
          </div>
        )}

        {activeSidebar === 'Workflow Canvas' && (
          <div className="p-8 h-full relative z-10">
            <ApprovalsView />
          </div>
        )}

      </div>
    </div>
  );
};

export default MultiModalInbox;
