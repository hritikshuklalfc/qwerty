import React, { useState } from 'react';
import { Store, Image as ImageIcon, Save } from 'lucide-react';
import { useSynapse } from '../../context/SynapseContext';

const MyStorePage = () => {
  const { addToast } = useSynapse();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    storeName: 'Delegancy Property Shop',
    tagline: 'Your one-stop shop for property management supplies',
    email: 'contact@delegancy.com',
    phone: '+1 657 123 1234',
    address: '200A Westminster Ave, Venice, CA'
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('success', 'Store Updated', 'Your store configuration has been saved.');
    }, 800);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">My Store Configuration</h2>
          <p className="text-sm text-text-tertiary">Manage your storefront appearance and details</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-white text-background rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Store Name</label>
              <input type="text" name="storeName" value={form.storeName} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tagline / Short Description</label>
              <input type="text" name="tagline" value={form.tagline} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent" />
            </div>
          </div>

          <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Support Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Phone Number</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Business Address</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent" />
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
            <h3 className="text-lg font-bold text-white mb-4 w-full text-left">Store Logo</h3>
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center bg-black/20 cursor-pointer hover:border-primary-accent hover:bg-white/5 transition-colors mb-4">
              <ImageIcon size={32} className="text-text-tertiary mb-2" />
              <span className="text-xs text-text-secondary">Upload Logo</span>
            </div>
            <p className="text-[10px] text-text-tertiary">Recommended size: 512x512px. Max 2MB.</p>
          </div>

          <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Brand Colors</h3>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Primary Color</label>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary-accent border border-white/20" />
                <input type="text" defaultValue="#FF3B30" className="flex-grow bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Secondary Color</label>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#000000] border border-white/20" />
                <input type="text" defaultValue="#000000" className="flex-grow bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStorePage;
