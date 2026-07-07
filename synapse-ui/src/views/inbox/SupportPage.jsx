import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, ArrowRight } from 'lucide-react';

const QA_KNOWLEDGE = [
  { q: "how to use", a: "You can use the Orchestration Editor to drag-and-drop AI agents onto the canvas, connect them to build workflows, and click 'Run Demo' to watch them execute." },
  { q: "approvals", a: "When an agent requires human permission to proceed (like making a payment), it appears in the 'Orders & Reviews' (Approvals) tab in your Inbox. You can click Approve or Reject there." },
  { q: "add product", a: "Go to the Inbox, click 'Products' in the sidebar, and then click '+ Add New Product'. Fill out the details across the tabs and hit Save." },
  { q: "command center", a: "The Command Center lets you manage Leases. You can Add, Edit, or Delete them, view live agent stats, toggle permissions, and export everything to CSV." },
];

const SupportPage = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your Synapse OS AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Simple AI reply logic based on keyword matching
    setTimeout(() => {
      let reply = "I'm sorry, I don't have information on that yet. Try asking about how to use the app, approvals, adding products, or the command center.";
      const lowerMsg = userMsg.toLowerCase();
      
      if (lowerMsg.includes('status') || lowerMsg.includes('agents')) {
        reply = `| Agent Swarm | Status | Host |\n| :--- | :--- | :--- |\n| Ingestion Agent | 🟢 Online | Local Node |\n| Extraction Agent | 🟢 Online | Local Node |\n| AI Inference Agent | 🟢 Online | Cloud Service |\n| Action Sync Agent | 🟢 Online | Cloud Service |\n\n**Agent Swarm Operational Status: 4 Online, 0 Failed**`;
      } else if (lowerMsg.includes('lease') || lowerMsg.includes('abstract')) {
        reply = "Successfully extracted 14 clauses from the uploaded contract document. Financial ledgers updated.";
      } else if (lowerMsg.includes('revenue') || lowerMsg.includes('profit') || lowerMsg.includes('transactions')) {
        reply = "Based on current system data state, our analytical summary is as follows:\n- Total Revenue: $15,430\n- Total Expenses: $4,200\n- Net Profit: $11,230\n\nThe recent 5 transactions show healthy recurring subscription revenue and normal API/hosting expenses.";
      } else {
        for (const item of QA_KNOWLEDGE) {
          if (lowerMsg.includes(item.q)) {
            reply = item.a;
            break;
          }
        }
      }

      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    }, 600);
  };

  const handleQuickReply = (text) => {
    setInput(text);
  };

  return (
    <div className="flex flex-col h-full bg-glass-surface-solid rounded-xl border border-glass-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-glass-border bg-black/10 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot size={24} className="text-primary-accent" /> AI Support Assistant
          </h2>
          <p className="text-sm text-text-tertiary mt-1">System Orchestrator Core</p>
        </div>
        
        {/* WhatsApp Integration */}
        <a 
          href="https://wa.me/919263211969" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] rounded-lg text-sm font-bold hover:bg-[#25D366]/30 transition-colors"
        >
          <MessageCircle size={16} /> Contact Support
        </a>
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-primary-accent/20 border border-primary-accent/50 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-primary-accent" />
              </div>
            )}
            
            <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words border font-mono ${
              msg.role === 'user' 
                ? 'bg-primary-accent text-white rounded-br-none border-transparent' 
                : 'bg-white/5 border-white/10 text-text-secondary rounded-bl-none'
            }`}>
              {msg.text}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                <User size={14} className="text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/20 border-t border-glass-border shrink-0">
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
          {["How to use", "Approvals", "Add product", "Command center"].map((qr, i) => (
            <button 
              key={i} 
              onClick={() => handleQuickReply(qr)}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-text-tertiary whitespace-nowrap hover:bg-white/10 hover:text-white transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the app..."
            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary-accent transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-3 bg-white text-background rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportPage;
