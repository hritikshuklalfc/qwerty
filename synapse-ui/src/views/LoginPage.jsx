import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSynapse } from '../context/SynapseContext';
import synapseLogo from '../assets/synapse-logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { addToast } = useSynapse();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      addToast('success', 'Welcome back!', 'Successfully logged in.');
      navigate('/app');
    } catch (error) {
      addToast('error', 'Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950/20 overflow-hidden font-sans p-4">
      
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
      
      <div className="w-full max-w-md bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-10 relative">
        <div className="flex justify-center mb-6">
          <div className="w-48 h-16 bg-contain bg-no-repeat bg-center mix-blend-screen" style={{ backgroundImage: `url(${synapseLogo})` }} />
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome to Synapse OS</h1>
        <p className="text-sm text-text-tertiary text-center mb-8">Sign in to access your agent workspace</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary-accent transition-colors" 
              placeholder="you@company.com" 
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-text-secondary block">Password</label>
              <a href="#" className="text-[10px] text-primary-accent hover:underline">Forgot password?</a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary-accent transition-colors" 
              placeholder="••••••••" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-4 rounded-xl bg-white text-background font-bold text-sm hover:bg-gray-200 transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-xs text-center text-text-tertiary mt-6">
          Don't have an account? <Link to="/register" className="text-white font-semibold hover:underline">Request access</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
