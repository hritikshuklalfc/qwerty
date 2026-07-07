import React, { useState } from 'react';
import { Users, Copy, Gift, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSynapse } from '../../context/SynapseContext';

const ReferralsPage = () => {
  const { user } = useAuth();
  const { addToast } = useSynapse();
  const [copied, setCopied] = useState(false);

  // Generate a mock referral code based on user id or email
  const refCode = user?.email ? user.email.split('@')[0].toUpperCase() + '2026' : 'SYNAPSE2026';
  const refLink = `https://synapse-os.app/signup?ref=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    addToast('success', 'Copied', 'Referral link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Refer & Earn</h2>
        <p className="text-sm text-text-tertiary">Invite friends and earn platform credits</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-glass-surface-solid border border-glass-border p-8 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center">
          <Gift size={48} className="text-primary-accent mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Give $50, Get $50</h3>
          <p className="text-sm text-text-tertiary mb-8 max-w-md">
            For every friend who signs up with your link and activates their account, you both get $50 in API credits to use on Synapse OS.
          </p>
          
          <div className="w-full max-w-md bg-black/30 border border-white/10 rounded-xl p-2 flex items-center justify-between">
            <span className="text-sm text-white px-4 font-mono select-all truncate">{refLink}</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors shrink-0"
            >
              {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
            <div className="text-text-tertiary text-xs font-semibold mb-1">Total Referrals</div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>
          <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
            <div className="text-text-tertiary text-xs font-semibold mb-1">Credits Earned</div>
            <div className="text-3xl font-bold text-green-400">$0.00</div>
          </div>
        </div>
      </div>

      <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-white mb-4">Referral History</h3>
        <div className="py-8 text-center text-text-tertiary border-2 border-dashed border-white/10 rounded-xl bg-black/10">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">You haven't referred anyone yet.</p>
          <p className="text-xs mt-1">Share your link to get started!</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;
