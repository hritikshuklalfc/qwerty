import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Shield, Database, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSynapse } from '../context/SynapseContext';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useSynapse();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('geminiApiKey') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [isSaving, setIsSaving] = useState(false);

  const saveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      localStorage.removeItem('geminiApiKey');
      addToast('success', 'API Key Removed', 'API key removed successfully.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey.trim()}`);
      if (!response.ok) {
        throw new Error('Invalid API Key');
      }

      localStorage.setItem('geminiApiKey', geminiApiKey.trim());
      addToast('success', 'API Key Saved', 'your API KEY saved successfullly');
    } catch (error) {
      addToast('error', 'Validation Failed', 'The API Key provided is invalid. Please check and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const sections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      description: 'Manage your public profile and personal information.',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 flex items-center justify-center text-xl text-black dark:text-white">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <button className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white">
              Change Avatar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-left">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Full Name</label>
              <input 
                type="text" 
                defaultValue={user?.user_metadata?.full_name || ''} 
                className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 text-black dark:text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-lg px-4 py-2 text-sm outline-none transition-colors" 
              />
            </div>
            <div className="text-left">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Email Address</label>
              <input 
                type="email" 
                disabled 
                defaultValue={user?.email || ''} 
                className="w-full bg-black/10 dark:bg-black/40 border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 rounded-lg px-4 py-2 text-sm outline-none cursor-not-allowed font-mono" 
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security',
      icon: Shield,
      description: 'Update your password and secure your account.',
      content: (
        <div className="space-y-4 text-left">
          <button className="px-4 py-2 bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-400/50 text-cyan-600 dark:text-cyan-200 backdrop-blur-md hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all text-sm font-semibold rounded-lg">
            Change Password
          </button>
          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-black/20 rounded-xl border border-black/10 dark:border-white/5 mt-4">
            <div>
              <div className="text-sm text-black dark:text-white/90 font-semibold">Two-Factor Authentication</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</div>
            </div>
            <button 
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300 border ${twoFactorEnabled ? 'bg-cyan-500/40 border-cyan-400' : 'bg-black/10 dark:bg-black/40 border-black/20 dark:border-white/10'}`}
            >
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-300 shadow-sm ${twoFactorEnabled ? 'bg-cyan-500 dark:bg-cyan-300 left-[22px]' : 'bg-slate-400 dark:bg-slate-500 left-1'}`} />
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'api-config',
      title: 'API Configuration',
      icon: Key,
      description: 'Configure your external API keys for AI services.',
      content: (
        <div className="space-y-4 text-left">
          <div className="text-left">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Google Gemini API Key</label>
            <div className="flex items-center gap-3">
              <input 
                type="password" 
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..." 
                className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 text-black dark:text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-lg px-4 py-2 text-sm outline-none transition-colors" 
              />
              <button 
                onClick={saveApiKey}
                disabled={isSaving}
                className={`px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-cyan-500/20 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Your key is stored securely in your browser's local storage.</p>
          </div>
        </div>
      )
    },
    {
      id: 'danger',
      title: 'Danger Zone',
      icon: Database,
      description: 'Irreversible actions for your account and data.',
      content: (
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div>
              <div className="text-sm text-red-400 font-semibold">Delete Account</div>
              <div className="text-[11px] text-red-400/70">Permanently delete your account and all data.</div>
            </div>
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="h-full w-full bg-transparent flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-black/10 dark:border-white/10 shrink-0 bg-white/40 dark:bg-white/5 backdrop-blur-2xl sticky top-0 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="text-left">
          <h1 className="text-xl font-bold text-black dark:text-white/90">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account and preferences</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Content */}
      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        {sections.map(section => (
          <div key={section.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-black/10 dark:border-white/10">
                <section.icon size={16} />
              </div>
              <h2 className="text-lg font-bold text-black dark:text-white/90 text-left">{section.title}</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 pl-11 text-left">{section.description}</p>
            <div className="pl-11">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
