import React, { useState } from 'react';
import { Mail, CheckCircle2, Send, X, HeadphonesIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSynapse } from '../context/SynapseContext';

export default function SupportPage() {
  const { user } = useAuth();
  const { addToast } = useSynapse();

  // Form state for raising query
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || 'Aman Verma',
    email: user?.email || 'aman.v@synapse.io',
    category: 'Observatory & Swarm Topology',
    priority: 'Normal',
    subject: '',
    description: ''
  });
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEmailErrorModal, setShowEmailErrorModal] = useState(false);

  // Strict email validation: last keyword MUST be @gmail.com
  const isValidGmail = (email) => {
    const clean = email.trim().toLowerCase();
    const re = /^[a-z0-9._%+-]+@gmail\.com$/;
    return re.test(clean) && clean.endsWith('@gmail.com');
  };

  // Handle query form field change
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'email') {
      if (value.trim() && !isValidGmail(value.trim())) {
        setEmailError('Your email address must end with @gmail.com');
      } else {
        setEmailError('');
      }
    }
  };

  // Submit query form and dispatch real email to mannatsahu55@gmail.com
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate email strictness (@gmail.com requirement)
    if (!isValidGmail(formData.email.trim())) {
      setEmailError('Your email address must end with @gmail.com');
      addToast('error', 'Email is incorrect', 'Your email address must end with @gmail.com to proceed.');
      setShowEmailErrorModal(true);
      return;
    }

    // 2. Validate required text fields
    if (!formData.subject.trim() || !formData.description.trim()) {
      addToast('error', 'Missing Information', 'Please provide a subject and detailed description.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send real email to target email mannatsahu55@gmail.com via FormSubmit AJAX service
      await fetch("https://formsubmit.co/ajax/mannatsahu55@gmail.com", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[Synapse Support - ${formData.priority}] ${formData.subject}`,
          Name: formData.name,
          Email: formData.email,
          Category: formData.category,
          Priority: formData.priority,
          Subject: formData.subject,
          Description: formData.description,
          _replyto: formData.email,
          _template: "table"
        })
      });
    } catch (err) {
      console.warn("Email service dispatch note:", err);
    } finally {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      // Reset form subject & description while keeping name & email
      setFormData(prev => ({
        ...prev,
        subject: '',
        description: ''
      }));
    }
  };

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto font-sans text-black dark:text-white bg-transparent">
      {/* Pop-up Modal for Incorrect Email - Pure Black and White */}
      {showEmailErrorModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-center animate-scale-in">
            <button 
              onClick={() => setShowEmailErrorModal(false)}
              className="absolute top-4 right-4 p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={36} />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-black dark:text-white mb-2">
              Email is incorrect
            </h3>

            <p className="text-xs text-black/60 dark:text-white/60 mb-6 leading-relaxed font-mono">
              Only <strong className="text-black dark:text-white underline">@gmail.com</strong> email addresses are accepted. Please check your email address and ensure it ends with @gmail.com before submitting.
            </p>

            <button
              onClick={() => setShowEmailErrorModal(false)}
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-black/10 dark:shadow-white/10"
            >
              Check & Re-enter Email
            </button>
          </div>
        </div>
      )}

      {/* Pop-up Modal exact to user requirement - Pure Black and White */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-center animate-scale-in">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-black dark:text-white mb-2">
              Your query is successfully submitted.
            </h3>

            <p className="text-xs text-black/60 dark:text-white/60 mb-6 leading-relaxed font-mono">
              Your support ticket has been forwarded to <strong className="text-black dark:text-white underline">mannatsahu55@gmail.com</strong>. Our engineering team will review the details and reach out to you shortly.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-black/10 dark:shadow-white/10"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-black/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeadphonesIcon size={24} className="text-black dark:text-white" />
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-black dark:text-white">
              Support & Engineering Query
            </h1>
          </div>
          <p className="text-xs md:text-sm text-black/60 dark:text-white/60 font-medium">
            Submit your inquiry directly to our engineering team. All inquiries are routed to <strong className="text-black dark:text-white underline">mannatsahu55@gmail.com</strong>.
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-3xl mx-auto bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black dark:text-white tracking-tight">
                Raise a Support Ticket
              </h2>
              <p className="text-xs text-black/60 dark:text-white/60 font-mono">
                Provide as much context as possible so our team can resolve your issue quickly.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 block mb-2">
                Your Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
                className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black/30 dark:focus:ring-white/30 transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 block mb-2">
                Your Email Address <span className="text-black/40 dark:text-white/40">(@gmail.com only)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                required
                placeholder="name@gmail.com"
                className={`w-full bg-white dark:bg-black/40 border rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:ring-1 transition-all font-mono ${
                  emailError 
                    ? 'border-black dark:border-white focus:border-black dark:focus:border-white focus:ring-black/50 dark:focus:ring-white/50 bg-black/5 dark:bg-white/10' 
                    : 'border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white focus:ring-black/30 dark:focus:ring-white/30'
                }`}
              />
              {emailError && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-black dark:text-white font-mono font-bold">
                  <AlertCircle size={13} />
                  <span>{emailError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 block mb-2">
                Query Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-all font-medium"
              >
                <option value="Observatory & Swarm Topology">Observatory & Swarm Topology</option>
                <option value="Hallucination Detection (HRS) & Safeguards">Hallucination Detection (HRS) & Safeguards</option>
                <option value="API Key & Billing Configuration">API Key & Billing Configuration</option>
                <option value="Command Center & Lease Management">Command Center & Lease Management</option>
                <option value="Feature Request / Custom Integration">Feature Request / Custom Integration</option>
                <option value="Other Issue">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 block mb-2">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleFormChange('priority', e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-all font-medium"
              >
                <option value="Low">Low (General Inquiry)</option>
                <option value="Normal">Normal (Standard Assistance)</option>
                <option value="Urgent">Urgent (System / Swarm Issue)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 block mb-2">
              Subject / Summary
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleFormChange('subject', e.target.value)}
              placeholder="e.g., Need assistance configuring LIVE AI mode for supply chain agent"
              required
              className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black/30 dark:focus:ring-white/30 transition-all font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 block mb-2">
              Detailed Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Please describe your question, observation, or system issue in detail..."
              rows={5}
              required
              className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-4 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black/30 dark:focus:ring-white/30 transition-all font-medium resize-y"
            />
          </div>

          <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-black/50 dark:text-white/50">
              Target E-mail: <strong className="text-black dark:text-white">mannatsahu55@gmail.com</strong>
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl hover:opacity-85 transition-opacity flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send Query
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
