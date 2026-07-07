import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, LayoutDashboard, Package, ShoppingBag, Truck, Box, CreditCard, Users, Settings, X, CheckCircle2, AlertCircle, Bot, GitBranch, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSynapse } from '../context/SynapseContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import SupportPage from './inbox/SupportPage';
import FinancePage from './inbox/FinancePage';
import ReportPage from './inbox/ReportPage';
import MyStorePage from './inbox/MyStorePage';
import SellerToolsPage from './inbox/SellerToolsPage';
import ReferralsPage from './inbox/ReferralsPage';

// ── Sidebar Item ──
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors w-full ${active ? 'bg-white/10 text-white' : 'text-text-tertiary hover:bg-white/5 hover:text-white'}`}
  >
    <Icon size={18} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// ── Tab: Basic Information ──
const BasicInfoTab = ({ form, onChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Product Name *</label>
        <input value={form.name || ''} onChange={e => onChange('name', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="Enter product name" />
      </div>
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">SKU</label>
        <input value={form.sku || ''} onChange={e => onChange('sku', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="e.g. SKU-12345" />
      </div>
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Category</label>
        <select value={form.category || ''} onChange={e => onChange('category', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors">
          <option value="">Select category</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="home">Home & Garden</option>
          <option value="sports">Sports & Outdoors</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Brand</label>
        <input value={form.brand || ''} onChange={e => onChange('brand', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="Brand name" />
      </div>
    </div>
    <div>
      <label className="text-xs font-semibold text-white mb-2 block">Short Description</label>
      <textarea value={form.shortDesc || ''} onChange={e => onChange('shortDesc', e.target.value)} rows={3} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors resize-none" placeholder="Brief description of the product" />
    </div>
  </div>
);

// ── Tab: Variations and Price ──
const VariationsTab = ({ form, onChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-3 gap-6">
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Price ($) *</label>
        <input type="number" value={form.price || ''} onChange={e => onChange('price', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="0.00" />
      </div>
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Compare at Price</label>
        <input type="number" value={form.comparePrice || ''} onChange={e => onChange('comparePrice', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="0.00" />
      </div>
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Cost per Item</label>
        <input type="number" value={form.costPrice || ''} onChange={e => onChange('costPrice', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="0.00" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Quantity in Stock</label>
        <input type="number" value={form.quantity || ''} onChange={e => onChange('quantity', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="0" />
      </div>
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Weight (kg)</label>
        <input type="number" value={form.weight || ''} onChange={e => onChange('weight', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="0.0" />
      </div>
    </div>
    <div>
      <label className="text-xs font-semibold text-white mb-2 block">Available Sizes</label>
      <div className="flex gap-2">
        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
          <button
            key={size}
            onClick={() => {
              const sizes = form.sizes || [];
              const next = sizes.includes(size) ? sizes.filter(s => s !== size) : [...sizes, size];
              onChange('sizes', next);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              (form.sizes || []).includes(size) ? 'bg-white text-background border-white' : 'bg-black/20 text-text-tertiary border-white/10 hover:border-white/30'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── Tab: Descriptions ──
const DescriptionsTab = ({ form, onChange }) => (
  <div className="space-y-6">
    <div>
      <label className="text-xs font-semibold text-white mb-2 block">Full Description</label>
      <textarea value={form.fullDesc || ''} onChange={e => onChange('fullDesc', e.target.value)} rows={8} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors resize-none" placeholder="Detailed product description..." />
    </div>
    <div>
      <label className="text-xs font-semibold text-white mb-2 block">Key Features</label>
      <textarea value={form.features || ''} onChange={e => onChange('features', e.target.value)} rows={4} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors resize-none" placeholder="One feature per line" />
    </div>
  </div>
);

// ── Tab: Shipping ──
const ShippingTab = ({ form, onChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Shipping Weight (kg)</label>
        <input type="number" value={form.shippingWeight || ''} onChange={e => onChange('shippingWeight', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="0.0" />
      </div>
      <div>
        <label className="text-xs font-semibold text-white mb-2 block">Processing Time (days)</label>
        <input type="number" value={form.processingTime || ''} onChange={e => onChange('processingTime', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="1-3" />
      </div>
    </div>
    <div>
      <label className="text-xs font-semibold text-white mb-2 block">Return Policy</label>
      <textarea value={form.returnPolicy || ''} onChange={e => onChange('returnPolicy', e.target.value)} rows={3} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors resize-none" placeholder="30-day return policy..." />
    </div>
    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
      <div>
        <div className="text-sm text-white font-semibold">Free Shipping</div>
        <div className="text-[11px] text-text-tertiary">Enable free shipping for this product</div>
      </div>
      <button
        onClick={() => onChange('freeShipping', !form.freeShipping)}
        className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${form.freeShipping ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-black/40 border border-white/10'}`}
      >
        <div className={`absolute top-1 w-3 h-3 rounded-full shadow-sm transition-all ${form.freeShipping ? 'right-1 bg-white' : 'left-1 bg-text-tertiary'}`} />
      </button>
    </div>
  </div>
);

// ── Images Tab ──
const ImagesTab = ({ images, onAddImages, onRemoveImage }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    const promises = fileArray.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ name: file.name, dataUrl: e.target.result, size: file.size });
      reader.readAsDataURL(file);
    }));
    Promise.all(promises).then(results => onAddImages(results));
  }, [onAddImages]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div>
      <h3 className="text-base font-semibold text-white mb-1">Upload images</h3>
      <p className="text-xs text-text-tertiary mb-4">Upload 0 to 10 images. Click the drop zone or drag files in.</p>
      
      <div className="grid grid-cols-5 gap-3">
        {/* Drop Zone */}
        <div
          className={`col-span-2 row-span-2 border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all min-h-[220px] ${
            isDragging ? 'border-primary-accent bg-primary-accent/10' : 'border-white/20 bg-white/2 hover:bg-white/5 hover:border-primary-accent/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <UploadCloud size={28} className={`mb-3 ${isDragging ? 'text-primary-accent' : 'text-text-tertiary'}`} />
          <span className="text-sm text-white font-medium">Upload or drag</span>
          <span className="text-xs text-text-tertiary mt-1">Max file size 5MB</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Uploaded Images */}
        {images.map((img, idx) => (
          <div key={idx} className="col-span-1 row-span-1 rounded-xl overflow-hidden relative group aspect-square">
            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => onRemoveImage(idx)}
                className="w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="absolute bottom-1 left-1 right-1 text-[8px] text-white bg-black/60 rounded px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {img.name}
            </div>
          </div>
        ))}

        {/* Empty Slots */}
        {Array.from({ length: Math.max(0, 8 - images.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="col-span-1 row-span-1 bg-white/5 border border-white/5 rounded-xl aspect-square cursor-pointer hover:border-white/20 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          />
        ))}
      </div>
    </div>
  );
};

// ── Product List View ──
const ProductListView = ({ products, onDelete }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-white">Products ({products.length})</h2>
    {products.length === 0 && (
      <div className="text-center py-12 text-text-tertiary">
        <Package size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No products yet. Add your first product!</p>
      </div>
    )}
    {products.map(p => (
      <div key={p.id} className="flex items-center gap-4 p-4 bg-glass-surface border border-glass-border rounded-xl hover:bg-white/5 transition-colors">
        {p.images?.[0] ? (
          <img src={p.images[0].dataUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary"><Package size={20} /></div>
        )}
        <div className="flex-grow min-w-0">
          <div className="text-sm font-semibold text-white truncate">{p.name || 'Untitled Product'}</div>
          <div className="text-xs text-text-tertiary">{p.category || 'No category'} · {p.sku || 'No SKU'}</div>
        </div>
        {p.price && <div className="text-sm font-bold text-green-400">${p.price}</div>}
        <button onClick={() => onDelete(p.id)} className="text-text-tertiary hover:text-red-400 transition-colors"><X size={16} /></button>
      </div>
    ))}
  </div>
);

// ── Approvals View ──
const ApprovalsView = () => {
  const { pendingApprovals, approveRequest, rejectRequest } = useSynapse();

  return (
    <div className="space-y-4 h-full overflow-y-auto no-scrollbar">
      <div>
        <h2 className="text-2xl font-bold text-white">Approvals & Reviews</h2>
        <p className="text-sm text-text-tertiary">Review tasks requiring human authorization</p>
      </div>

      {pendingApprovals.length === 0 && (
        <div className="text-center py-12 text-text-tertiary border-2 border-dashed border-white/10 rounded-xl bg-black/10 mt-6">
          <CheckCircle2 size={40} className="mx-auto mb-3 opacity-40 text-green-400" />
          <p className="text-sm">No pending approvals. You're all caught up!</p>
        </div>
      )}

      <div className="grid gap-4 mt-6">
        {pendingApprovals.map(approval => (
          <div key={approval.id} className="p-5 bg-glass-surface-solid border border-glass-border rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-accent/20 flex items-center justify-center text-xl shrink-0">
                {approval.agentIcon || '🤖'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{approval.description}</h3>
                <div className="text-xs text-text-tertiary mt-1 mb-2">
                  Requested by <span className="text-white font-medium">{approval.agentName}</span>
                </div>
                {approval.details && (
                  <div className="bg-black/30 p-2 rounded-lg border border-white/5 text-xs text-text-secondary font-mono">
                    {Object.entries(approval.details).map(([k, v]) => (
                      <div key={k}><span className="text-text-tertiary">{k}:</span> {v}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {approval.status === 'pending' ? (
              <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
                <button 
                  onClick={() => rejectRequest(approval.id)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/10 transition-colors"
                >
                  Reject
                </button>
                <button 
                  onClick={() => approveRequest(approval.id)}
                  className="flex-1 sm:flex-none px-6 py-2 bg-green-500 text-background rounded-lg text-sm font-bold hover:bg-green-600 transition-colors shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                >
                  Approve
                </button>
              </div>
            ) : (
              <div className={`px-4 py-2 rounded-lg text-xs font-bold border shrink-0 ${
                approval.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {approval.status.toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


// ── Main Component ──
const TABS = ['Basic information', 'Vital information', 'Variations and price', 'Images', 'Descriptions', 'Shipping & returns'];

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Bot, label: 'Agent Swarms' },
  { icon: GitBranch, label: 'Workflow Canvas' },
  { icon: UploadCloud, label: 'Data Ingestion' },
  { icon: Network, label: 'Multi-Branch Control' },
  { icon: LayoutDashboard, label: 'Report' },
  { icon: Users, label: 'Support' },
  { icon: CreditCard, label: 'Finance' },
  { icon: Users, label: 'Referrals' },
  { icon: Settings, label: 'Settings' },
];

const MultiModalInbox = () => {
  const { addProduct, products, deleteProduct, addToast, pendingApprovals } = useSynapse();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Basic information');
  const [activeSidebar, setActiveSidebar] = useState('Agent Swarms');
  const [form, setForm] = useState({});
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const pendingCount = pendingApprovals.filter(a => a.status === 'pending').length;

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }, [errors]);

  const handleAddImages = useCallback((newImages) => {
    setImages(prev => {
      const total = [...prev, ...newImages];
      if (total.length > 10) {
        addToast('warning', 'Limit Reached', 'Maximum 10 images allowed');
        return total.slice(0, 10);
      }
      addToast('success', 'Images Added', `${newImages.length} image(s) uploaded`);
      return total;
    });
  }, [addToast]);

  const handleRemoveImage = useCallback((idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    addToast('info', 'Image Removed', 'Image deleted');
  }, [addToast]);

  const validate = useCallback(() => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Product name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleSave = useCallback(() => {
    if (!validate()) {
      addToast('error', 'Validation Error', 'Please fill in required fields');
      setActiveTab('Basic information');
      return;
    }
    addProduct({ ...form, images });
    setForm({});
    setImages([]);
    setActiveSidebar('Agent Swarms');
  }, [form, images, validate, addProduct, addToast]);

  const handleContinue = useCallback(() => {
    const currentIdx = TABS.indexOf(activeTab);
    if (currentIdx < TABS.length - 1) {
      setActiveTab(TABS[currentIdx + 1]);
    } else {
      handleSave();
    }
  }, [activeTab, handleSave]);

  const handleCancel = useCallback(() => {
    setForm({});
    setImages([]);
    setErrors({});
    addToast('info', 'Cancelled', 'Product form cleared');
    setActiveSidebar('Products');
  }, [addToast]);

  const handleSidebarClick = (label) => {
    if (label === 'Settings') {
      navigate('/app/settings');
    } else if (label === 'Dashboard') {
      setActiveSidebar('Dashboard');
    } else {
      setActiveSidebar(label);
    }
  };

  return (
    <div className="flex h-full w-full bg-transparent">
      
      {/* Secondary Sidebar */}
      <div className="w-64 h-full flex flex-col bg-white/5 backdrop-blur-2xl border-r border-white/10 shrink-0 shadow-2xl overflow-y-auto">
        <div className="p-6 pb-2 border-b border-transparent">
          <div className="cursor-pointer mb-8 flex items-center justify-start animate-fade-in bg-transparent" onClick={() => navigate('/')}>
            <div className="w-40 h-12 bg-contain bg-no-repeat bg-left mix-blend-screen contrast-[1.5] brightness-[1.2]" style={{ backgroundImage: `url(${logoImg})` }} />
          </div>
          <div className="flex flex-col gap-1">
            {SIDEBAR_ITEMS.map((item, idx) => (
              <div key={idx} className="relative">
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  active={activeSidebar === item.label && activeSidebar !== 'Dashboard'}
                  onClick={() => handleSidebarClick(item.label)}
                />
                {item.label === 'Orders & Reviews' && pendingCount > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-primary-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse-ring">
                    {pendingCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-auto p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.user_metadata?.full_name || 'User'}</div>
              <div className="text-[10px] text-text-tertiary truncate">{user?.email || ''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden bg-transparent">
        {activeSidebar === 'Agent Swarms' && (
          <div className="flex-grow overflow-y-auto p-8 no-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Agent Swarms</h1>
                <div className="text-sm text-text-tertiary">{products.length} products</div>
              </div>
              <button
                onClick={() => { setActiveSidebar('Dashboard'); setActiveTab('Basic information'); }}
                className="px-6 py-2.5 rounded-lg bg-white text-background text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg"
              >
                + Deploy New Swarm
              </button>
            </div>
            <ProductListView products={products} onDelete={deleteProduct} />
          </div>
        )}

        {activeSidebar === 'Workflow Canvas' && (
          <div className="p-8 h-full">
            <ApprovalsView />
          </div>
        )}

        {activeSidebar === 'Support' && (
          <div className="p-8 h-full max-w-4xl mx-auto w-full">
            <SupportPage />
          </div>
        )}

        {activeSidebar === 'Finance' && (
          <div className="p-8 h-full">
            <FinancePage />
          </div>
        )}

        {activeSidebar === 'Report' && (
          <div className="p-8 h-full">
            <ReportPage />
          </div>
        )}

        {activeSidebar === 'Multi-Branch Control' && (
          <div className="p-8 h-full">
            <MyStorePage />
          </div>
        )}

        {activeSidebar === 'Data Ingestion' && (
          <div className="p-8 h-full">
            <SellerToolsPage />
          </div>
        )}

        {activeSidebar === 'Referrals' && (
          <div className="p-8 h-full">
            <ReferralsPage />
          </div>
        )}

        {/* Dashboard handles the Product form currently */}
        {activeSidebar === 'Dashboard' && (
          <>
            <div className="px-8 pt-8 pb-4 shrink-0">
              <h1 className="text-2xl font-bold text-white mb-2">Deploy new swarm</h1>
              <div className="text-sm text-text-tertiary flex gap-2">
                <span className="cursor-pointer hover:text-white transition-colors" onClick={() => setActiveSidebar('Agent Swarms')}>Agent Swarms</span>
                <span className="text-white/30">/</span>
                <span className="text-text-primary font-medium">Deploy new swarm</span>
              </div>
            </div>
            
            <div className="px-8 border-b border-glass-border">
              <div className="flex gap-8">
                {TABS.map((tab) => (
                  <div 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium cursor-pointer transition-all relative ${
                      activeTab === tab ? 'text-white' : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-text-primary" />
                    )}
                    {tab === 'Basic information' && errors.name && (
                      <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-8 no-scrollbar">
              <div className="bg-glass-surface backdrop-blur-xl border border-glass-border rounded-xl p-8 shadow-sm">
                {activeTab === 'Basic information' && <BasicInfoTab form={form} onChange={handleChange} />}
                {activeTab === 'Vital information' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-white mb-2 block">Condition</label>
                        <select value={form.condition || ''} onChange={e => handleChange('condition', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors">
                          <option value="">Select</option>
                          <option value="new">New</option>
                          <option value="used">Used</option>
                          <option value="refurbished">Refurbished</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-white mb-2 block">Material</label>
                        <input value={form.material || ''} onChange={e => handleChange('material', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="e.g. Cotton, Polyester" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white mb-2 block">Tags</label>
                      <input value={form.tags || ''} onChange={e => handleChange('tags', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary-accent transition-colors" placeholder="Comma separated tags" />
                    </div>
                  </div>
                )}
                {activeTab === 'Variations and price' && <VariationsTab form={form} onChange={handleChange} />}
                {activeTab === 'Images' && <ImagesTab images={images} onAddImages={handleAddImages} onRemoveImage={handleRemoveImage} />}
                {activeTab === 'Descriptions' && <DescriptionsTab form={form} onChange={handleChange} />}
                {activeTab === 'Shipping & returns' && <ShippingTab form={form} onChange={handleChange} />}
              </div>
            </div>
            
            <div className="px-8 py-4 bg-background border-t border-glass-border flex justify-between items-center shrink-0">
              <button onClick={handleCancel} className="text-sm font-semibold text-text-primary hover:text-white transition-colors underline decoration-white/30 underline-offset-4">Cancel</button>
              <div className="flex gap-3">
                <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-glass-surface text-sm font-semibold text-white hover:bg-white/10 transition-colors border border-white/10">Save</button>
                <button onClick={handleContinue} className="px-6 py-2 rounded-lg bg-white text-background text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg">
                  {TABS.indexOf(activeTab) === TABS.length - 1 ? 'Save & Finish' : 'Continue'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MultiModalInbox;
