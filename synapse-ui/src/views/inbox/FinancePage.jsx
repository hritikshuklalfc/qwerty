import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { useSynapse } from '../../context/SynapseContext';
import { supabase } from '../../lib/supabase';

const FinancePage = () => {
  const { products, leases } = useSynapse();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err.message);
        // Fallback to mock data if table doesn't exist yet
        setTransactions([
          { id: 'TX-1001', date: '2026-07-06', desc: 'Subscription Revenue', amount: 450, type: 'in' },
          { id: 'TX-1002', date: '2026-07-05', desc: 'Azure AI API Usage', amount: 120, type: 'out' },
          { id: 'TX-1003', date: '2026-07-04', desc: 'Client Retainer', amount: 2500, type: 'in' },
          { id: 'TX-1004', date: '2026-07-02', desc: 'Cloud Hosting', amount: 85, type: 'out' },
          { id: 'TX-1005', date: '2026-07-01', desc: 'Product Sales (Batch)', amount: Math.max(0, products.length * 120), type: 'in' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [products.length]);

  const totalRevenue = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Finance Overview</h2>
          <p className="text-sm text-text-tertiary">Monitor your cash flow and transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-glass-surface border border-glass-border rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-text-secondary mb-4">
            <DollarSign size={18} /> <span className="font-semibold text-sm">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +12.5% from last month</div>
        </div>
        <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-text-secondary mb-4">
            <ArrowDownRight size={18} className="text-red-400" /> <span className="font-semibold text-sm">Expenses</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">${totalExpenses.toLocaleString()}</div>
          <div className="text-xs text-red-400 flex items-center gap-1"><TrendingUp size={12} /> +4.2% from last month</div>
        </div>
        <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-text-secondary mb-4">
            <ArrowUpRight size={18} className="text-green-400" /> <span className="font-semibold text-sm">Net Profit</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">${netProfit.toLocaleString()}</div>
          <div className="text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +18.1% from last month</div>
        </div>
      </div>

      <div className="bg-glass-surface-solid border border-glass-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
        </div>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 text-text-tertiary text-xs">
            <tr>
              <th className="py-3 px-6 font-medium">Transaction ID</th>
              <th className="py-3 px-6 font-medium">Date</th>
              <th className="py-3 px-6 font-medium">Description</th>
              <th className="py-3 px-6 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {transactions.map(t => (
              <tr key={t.id} className="border-b border-glass-border hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 text-text-secondary">{t.id}</td>
                <td className="py-4 px-6">{t.date}</td>
                <td className="py-4 px-6 font-medium">{t.desc}</td>
                <td className={`py-4 px-6 font-bold text-right ${t.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'in' ? '+' : '-'}${t.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancePage;
