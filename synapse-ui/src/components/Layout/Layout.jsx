import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Mail, Settings, HeadphonesIcon } from 'lucide-react';
import { useSynapse } from '../../context/SynapseContext';
import { useAuth } from '../../context/AuthContext';
import synapseLogo from '../../assets/synapse-logo.png';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingApprovals, agentStatuses } = useSynapse();
  const { user } = useAuth();

  const pendingCount = pendingApprovals.filter(a => a.status === 'pending').length;
  const onlineCount = Object.values(agentStatuses).filter(a => a.status !== 'offline').length;

  const navItems = [
    { id: 'orchestration', icon: LayoutDashboard, path: '/app/orchestration', label: 'Orchestration' },
    { id: 'command-center', icon: Package, path: '/app/command-center', label: 'Command Center' },
    { id: 'inbox', icon: Mail, path: '/app/inbox', badge: pendingCount > 0 ? pendingCount : null, label: 'Inbox' },
    { id: 'settings', icon: Settings, path: '/app/settings', label: 'Settings' },
  ];

  return (
    <div className="relative h-screen w-full flex overflow-hidden bg-slate-950/20 backdrop-blur-[2px] text-text-primary font-sans bg-fixed bg-center bg-cover">
      
      {/* Background Looping Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover -z-20 opacity-80"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4" type="video/mp4" />
      </video>

      {/* Ambient Glow Blobs */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[30%] right-[15%] w-[450px] h-[450px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Thin Icon Rail */}
      <nav className="w-16 h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col items-center py-6 shrink-0 z-20 shadow-2xl">
        
        {/* Logo Mark */}
        <div className="cursor-pointer mb-10 flex items-center justify-center animate-fade-in bg-transparent w-full px-1" onClick={() => navigate('/')}>
          <div className="w-14 h-14 bg-contain bg-no-repeat bg-center mix-blend-screen contrast-[1.5] brightness-[1.2]" style={{ backgroundImage: `url(${synapseLogo})` }} />
        </div>

        {/* Top Nav Links */}
        <div className="flex flex-col gap-6 flex-grow w-full items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                title={item.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
                  isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner' : 'text-text-tertiary hover:text-cyan-400 hover:bg-cyan-500/10'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-500 rounded-r-full" />
                )}
                {/* Notification badge */}
                {item.badge && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse-ring">
                    {item.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Agent Status Indicator */}
        <div className="mb-4 flex flex-col items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
          <span className="text-[8px] text-text-tertiary font-bold tracking-wider">{onlineCount}</span>
        </div>

        {/* Bottom Nav Links */}
        <div className="flex flex-col gap-6 w-full items-center mt-auto">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-text-tertiary hover:text-white hover:bg-white/5 transition-colors">
            <HeadphonesIcon size={18} />
          </button>
          <div 
            onClick={() => navigate('/app/settings')}
            className="w-8 h-8 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors text-white text-xs font-bold"
            title="Settings"
          >
            {user?.user_metadata?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative bg-transparent text-white/90">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="h-full w-full relative z-10">
          <div className="w-full h-full bg-[#030712]/40 backdrop-blur-xl border border-emerald-500/10 shadow-2xl overflow-hidden">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
};

export default Layout;
