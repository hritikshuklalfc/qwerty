import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Activity, Zap } from 'lucide-react';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';

const cases = [
  {
    id: 1,
    title: 'Autonomous Financial Arbitrage Intercept',
    icon: <Shield className="text-text-primary" size={24} />,
    scenario: 'A multi-agent swarm deployed across global liquidity pools initiated rapid arbitrage loops during high market volatility.',
    problem: 'Without central oversight, two sub-agents began a runaway reasoning loop, attempting to execute conflicting flash loans exceeding risk limits.',
    intervention: 'Synapse OS detected semantic drift and abnormal token velocity in real time (HRS > 82%), instantly triggering a Tier 3 Auto-Pause before transaction broadcast.',
    outcome: 'Prevented a potential $1.4M smart contract loss while allowing unaffected data-ingestion nodes to continue monitoring order books safely.'
  },
  {
    id: 2,
    title: 'Multi-Branch Enterprise Lease Audits',
    icon: <Activity className="text-text-primary" size={24} />,
    scenario: 'An autonomous legal dispatch service processing 4,000+ commercial property leases across decentralized regional offices.',
    problem: 'Agent hallucination caused draft lease renewals to miscalculate annual CPI escalations by 4.5% across 120 key contracts.',
    intervention: 'Synapse OS consensus validation layer (Tier 2) cross-verified Beta analysis against master compliance rules and flagged the deviation automatically.',
    outcome: 'Halved audit review cycles from 3 weeks to 4 hours while guaranteeing 100% computational accuracy across all executed lease agreements.'
  },
  {
    id: 3,
    title: 'Supply Chain Disruption & Fleet Routing',
    icon: <Zap className="text-text-primary" size={24} />,
    scenario: 'Autonomous logistics agents coordinating freight rerouting after sudden port closures in Southeast Asia.',
    problem: 'High API latency and conflicting vendor rate sheets caused agents to repeatedly query stale routes, exhausting token limits.',
    intervention: 'Observatory command center dynamically reallocated token limits and enforced rate-limiting safeguards while routing decisions through verified backup endpoints.',
    outcome: 'Successfully rerouted 45 cargo shipments with zero downtime and 40% lower token burn via optimized prompt caching.'
  }
];

export default function CaseStudiesPage() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary">
      <TopNav />

      <main className="flex-grow pt-32 pb-24 md:pt-48 md:pb-32 container mx-auto px-6 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-normal tracking-tight text-text-primary mb-6">Illustrative Use Cases</h1>
          <p className="text-base md:text-lg text-text-tertiary leading-relaxed font-sans">
            Discover how Synapse OS provides the critical observability and interception layer needed to safely deploy autonomous agent swarms in production.
          </p>
        </motion.div>

        <div className="space-y-12 mb-24 relative pl-4 md:pl-0">
          {cases.map((useCase) => (
            <motion.div 
              key={useCase.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border border-border border-dashed p-8 md:p-12 rounded-2xl shadow-sm relative z-10"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10 pb-8 border-b border-border border-dashed">
                <div className="w-14 h-14 bg-secondary/50 border border-border rounded-xl flex flex-shrink-0 items-center justify-center">
                  {useCase.icon}
                </div>
                <h3 className="text-3xl font-display font-medium text-text-primary">{useCase.title}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-8">
                  <div className="bg-secondary/30 p-6 rounded-xl border border-border/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Scenario</h4>
                    <p className="text-text-secondary leading-relaxed font-sans text-sm md:text-base">{useCase.scenario}</p>
                  </div>
                  <div className="bg-secondary/30 p-6 rounded-xl border border-border/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">The Problem</h4>
                    <p className="text-text-secondary leading-relaxed font-sans text-sm md:text-base">{useCase.problem}</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="bg-secondary/30 p-6 rounded-xl border border-border/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Synapse OS Intervention</h4>
                    <p className="text-text-primary font-medium leading-relaxed font-sans text-sm md:text-base">{useCase.intervention}</p>
                  </div>
                  <div className="bg-secondary/30 p-6 rounded-xl border border-border/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Outcome</h4>
                    <p className="text-text-secondary leading-relaxed font-sans text-sm md:text-base">{useCase.outcome}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-border border-dashed p-10 md:p-16 rounded-2xl text-center max-w-3xl mx-auto shadow-sm"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-normal text-text-primary mb-4">Ready to secure your agent swarms?</h2>
          <p className="text-base md:text-lg text-text-tertiary leading-relaxed font-sans max-w-xl mx-auto mb-8">
            We're currently onboarding select design partners. Want to be our first official case study? Get in touch.
          </p>
          <Link 
            to="/contact?message=I'd%20like%20to%20discuss%20a%20case%20study."
            className="bg-text-primary text-white hover:bg-text-secondary transition-colors text-sm font-medium rounded-full px-8 py-3 inline-flex items-center justify-center gap-2"
          >
            Contact Sales
            <ArrowRight size={16} />
          </Link>
        </motion.div>

      </main>
      <Footer />
    </div>
  );
}
