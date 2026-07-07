import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, GitBranch, Terminal, Play, ArrowRight, Globe, Mail, MessageCircle, Plus } from 'lucide-react';
import synapseLogo from '../assets/synapse-logo.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-slate-950/20 overflow-hidden font-sans">
      
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

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 w-full min-h-screen p-4 lg:p-12 flex items-center justify-center">
        
        {/* The Glass Card Container */}
        <div className="relative w-full h-full min-h-[85vh] bg-slate-900/10 backdrop-blur-sm border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[2rem] flex flex-col justify-between overflow-hidden p-6 lg:p-12">
          
          {/* Logo pinned inside the glass container */}
          <div className="absolute top-8 left-10 z-50 cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
            <div className="w-80 h-24 bg-contain bg-no-repeat bg-left mix-blend-screen contrast-[1.5] brightness-[1.2]" style={{ backgroundImage: `url(${synapseLogo})` }} />
          </div>

          <main className="flex-grow flex flex-col items-center justify-center text-center w-full max-w-5xl mx-auto mt-12 mb-12">
            <h1 className="text-5xl lg:text-7xl leading-[1.1] max-w-4xl mx-auto font-bold font-sans mt-8">
              <span className="bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent block">Autonomous AI</span>
              <span className="bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent font-serif italic tracking-wide block mt-2 pr-4 pb-2">Agent Orchestration</span>
            </h1>
            
            <p className="mt-8 text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Design swarms, structure workflows, and delegate critical tasks to self-governing microservices in real-time.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center gap-6 justify-center">
              <button 
                onClick={() => navigate('/app')}
                className="group relative px-8 py-4 bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md border border-cyan-400/50 hover:border-cyan-300 text-cyan-100 rounded-full font-semibold transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center gap-3 text-base"
              >
                <span>Get Started</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/app/orchestration')}
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-full font-semibold transition-all duration-300 flex items-center gap-4 text-base shadow-lg"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/40 transition-colors">
                  <Play size={14} className="text-cyan-400 fill-cyan-400/50 translate-x-[1px]" />
                </div>
                Execute Workflow
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-16">
              {['Multi-Agent Swarms', 'Workflow Canvas', 'Cognitive Routing'].map(tag => (
                <div key={tag} className="bg-white/5 border border-white/10 backdrop-blur-md px-6 py-2.5 rounded-full text-sm text-cyan-400 tracking-wide font-medium">
                  {tag}
                </div>
              ))}
            </div>
          </main>

          {/* Bottom Quote */}
          <div className="shrink-0 flex flex-col items-center text-center mt-auto mb-4">
            <div className="text-[11px] tracking-[0.3em] uppercase text-cyan-400/70 mb-4 font-bold">Visionary Architecture</div>
            <p className="text-lg text-slate-300 mb-6">
              <span className="font-sans">"We imagined a realm </span>
              <span className="font-serif italic text-cyan-400">with no ending."</span>
            </p>
            <div className="flex items-center gap-6 opacity-40">
              <div className="w-12 h-[1px] bg-slate-500"></div>
              <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">Synapse Dispatcher Core</span>
              <div className="w-12 h-[1px] bg-slate-500"></div>
            </div>
          </div>

        </div>
      </div>



    </div>
  );
};

export default LandingPage;
