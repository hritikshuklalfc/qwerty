import React, { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Crosshair, Loader2 } from 'lucide-react';
import { useSynapse } from '../../context/SynapseContext';

const GEMINI_API_KEY = "";

const SellerToolsPage = () => {
  const { products } = useSynapse();
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("Click the button below to generate real-time AI pricing suggestions based on your active Agent Swarm data.");
  const [competitorInsights, setCompetitorInsights] = useState([
    { productName: "Premium Leather Jacket", yourPrice: "$199.99", marketAvg: "$245.00", recommendation: "Increase Price by $20" },
    { productName: "Basic T-Shirt", yourPrice: "$29.99", marketAvg: "$19.99", recommendation: "Offer Bundle Discount" }
  ]);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const productSummary = products.map(p => ({ name: p.name || 'Unknown', price: p.price || 0, category: p.category || 'General' }));
      const prompt = `You are an AI pricing analyst. Based on this product catalog: ${JSON.stringify(productSummary)}, provide a JSON response with exactly this format without markdown formatting:
      {
        "pricingSuggestion": "A brief 2-sentence actionable insight about overall pricing strategy.",
        "competitorInsights": [
          { "productName": "Product Name", "yourPrice": "$X.XX", "marketAvg": "$Y.YY", "recommendation": "Short action string" }
        ]
      }
      If the catalog is empty, generate generic insights for a SaaS business. Generate exactly 2 competitor insight rows based on the catalog.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      const data = await response.json();
      let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Strip markdown code blocks if Gemini includes them
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(textResponse);
      
      if (parsed.pricingSuggestion) setAiSuggestion(parsed.pricingSuggestion);
      if (parsed.competitorInsights) setCompetitorInsights(parsed.competitorInsights);
      
    } catch (error) {
      console.error("Gemini API Error:", error);
      setAiSuggestion("Failed to generate AI insights. Check API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Data Ingestion</h2>
        <p className="text-sm text-text-tertiary">Insights to optimize your data flows and inventory</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-text-secondary mb-4">
            <TrendingUp size={18} className="text-primary-accent" /> <span className="font-semibold text-sm">AI Pricing Optimizer</span>
          </div>
          <p className="text-sm text-text-tertiary mb-4 min-h-[60px]">{aiSuggestion}</p>
          <button 
            onClick={handleGenerateInsights}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-accent/20 border border-primary-accent/50 text-primary-accent rounded-lg text-sm font-semibold hover:bg-primary-accent/30 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Generating...' : 'Generate AI Suggestions'}
          </button>
        </div>

        <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-text-secondary mb-4">
            <AlertTriangle size={18} className="text-orange-400" /> <span className="font-semibold text-sm">Inventory Alerts</span>
          </div>
          <div className="space-y-3">
            {products.slice(0, 3).map((p, i) => (
              <div key={p.id || i} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <Package size={14} className="text-text-tertiary" />
                  <span className="text-sm text-white font-medium">{p.name || 'Unnamed Product'}</span>
                </div>
                <span className="text-xs font-bold text-orange-400">Low Stock ({(p.quantity || 0) + i} left)</span>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-sm text-text-tertiary">No low stock items.</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-glass-surface-solid border border-glass-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 text-text-secondary mb-6">
          <Crosshair size={18} /> <span className="font-semibold text-sm">Competitor Insights (Live AI Data)</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-text-tertiary text-xs border-b border-glass-border">
            <tr>
              <th className="pb-3 font-medium">Your Product</th>
              <th className="pb-3 font-medium">Your Price</th>
              <th className="pb-3 font-medium">Market Avg</th>
              <th className="pb-3 font-medium">Recommendation</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {competitorInsights.map((insight, i) => (
              <tr key={i} className="border-b border-glass-border">
                <td className="py-4">{insight.productName}</td>
                <td className="py-4">{insight.yourPrice}</td>
                <td className="py-4">{insight.marketAvg}</td>
                <td className={`py-4 text-xs font-bold ${insight.recommendation.toLowerCase().includes('increase') || insight.recommendation.toLowerCase().includes('raise') ? 'text-green-400' : 'text-orange-400'}`}>
                  {insight.recommendation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerToolsPage;
