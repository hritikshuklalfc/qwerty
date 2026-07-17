import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Mail, Settings, HeadphonesIcon, Sparkles, Menu, X, Eye } from 'lucide-react';
import { useSynapse } from '../../context/SynapseContext';
import { useAuth } from '../../hooks/useAuth';


const ASCIIBackground = () => {
  const [grid, setGrid] = useState('');

  useEffect(() => {
    const handleResize = () => {
      const cols = Math.floor(window.innerWidth / 12);
      const rows = Math.floor(window.innerHeight / 14);
      let pattern = '';
      for (let r = 0; r < rows; r++) {
        let rowStr = '';
        for (let c = 0; c < cols; c++) {
          if (r % 8 === 0 && c % 16 === 0) rowStr += '+';
          else if (r % 8 === 0) rowStr += '-';
          else if (c % 16 === 0) rowStr += '|';
          else rowStr += ' ';
        }
        pattern += rowStr + '\n';
      }
      setGrid(pattern);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center bg-white dark:bg-black text-black/10 dark:text-white/5 transition-colors duration-500">
      <pre className="font-mono text-xs leading-[14px] whitespace-pre m-0 p-0 select-none">
        {grid}
      </pre>
    </div>
  );
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingApprovals, agentStatuses } = useSynapse();
  const { user } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const pendingCount = pendingApprovals.filter(a => a.status === 'pending').length;
  const onlineCount = Object.values(agentStatuses).filter(a => a.status !== 'offline').length;

  const navItems = [
    { id: 'observatory', icon: Eye, path: '/app/observatory', label: 'Observatory' },
    { id: 'command-center', icon: Package, path: '/app/command-center', label: 'Command Center' },
    { id: 'ai-builder', icon: Sparkles, path: '/app/ai-builder', label: 'AI Builder' },
    { id: 'settings', icon: Settings, path: '/app/settings', label: 'Settings' },
  ];

  const isObservatoryActive = location.pathname === '/app/observatory';
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="relative h-screen w-full flex overflow-hidden font-sans bg-transparent">
      
      {/* Dynamic ASCII Background */}
      <ASCIIBackground />

      {/* Ambient Glow Blobs */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[30%] right-[15%] w-[450px] h-[450px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Mobile Top Bar - Glassmorphic */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-b border-black/10 dark:border-white/10 z-50 flex items-center justify-between px-4 transition-colors">
        <div className="font-display font-bold text-xl text-black dark:text-white tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          Synapse OS
        </div>
        <button onClick={toggleMobileMenu} className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation - Glassmorphic */}
      <nav className={`fixed md:relative top-0 left-0 h-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border-r border-black/10 dark:border-white/10 flex flex-col items-center py-6 shrink-0 z-40 transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-20' : '-translate-x-full md:translate-x-0 w-20'} pt-20 md:pt-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(255,255,255,0.02)]`}>
        
        {/* Logo Mark (Desktop) */}
        <div className="hidden md:flex cursor-pointer mb-10 items-center justify-center bg-transparent w-full px-1 hover:scale-105 transition-transform" onClick={() => navigate('/')}>
          <div className="font-display font-bold text-2xl text-black dark:text-white tracking-tighter">SOS</div>
        </div>

        {/* Top Nav Links */}
        <div className="flex flex-col gap-4 flex-grow w-full items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                title={item.label}
                className={`w-10 h-10 rounded-none flex items-center justify-center transition-colors relative ${
                  isActive ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-black dark:bg-white" />
                )}
                {item.badge && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Agent Status Indicator */}
        <div className="mb-6 flex flex-col items-center gap-1.5 cursor-help" title="Active Agents">
          <div className="relative flex items-center justify-center">
            <div className="w-2 h-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <span className="font-mono text-[10px] text-black/50 dark:text-white/50 font-medium">{onlineCount}</span>
        </div>

        {/* Bottom Nav Links */}
        <div className="flex flex-col gap-4 w-full items-center mt-auto pb-4">
          <button
            onClick={() => {
              navigate('/app/support');
              setIsMobileMenuOpen(false);
            }}
            title="Synapse AI Support & Queries"
            className={`w-10 h-10 rounded-none flex items-center justify-center transition-colors relative ${
              location.pathname === '/app/support'
                ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <HeadphonesIcon size={20} strokeWidth={location.pathname === '/app/support' ? 2.5 : 2} />
            {location.pathname === '/app/support' && (
              <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-black dark:bg-white" />
            )}
          </button>
          
          {/* Dark mode removed entirely */}
          <div 
            onClick={() => {
              navigate('/app/settings');
              setIsMobileMenuOpen(false);
            }}
            className="mt-2 w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:border-black/30 dark:hover:border-white/30 transition-colors text-black/70 dark:text-white/70 text-sm font-bold uppercase"
            title="Settings"
          >
            {user?.user_metadata?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area - Transparent so ASCII shows through */}
      <main className="flex-1 h-full overflow-y-auto relative pt-16 md:pt-0 z-10 bg-transparent">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
