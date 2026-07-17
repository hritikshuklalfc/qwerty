import React, { useEffect } from 'react';
import TopNav from './components/TopNav';
import HeroSection from './components/HeroSection';
import LogosSection from './components/LogosSection';
import HumanAIIntersection from './components/HumanAIIntersection';
import FeaturesSection from './components/FeaturesSection';
import IntegrationSection from './components/IntegrationSection';

import Footer from './components/Footer';

export default function LandingPage() {
  // Ensure we start at the top of the page when this mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-text-primary selection:bg-primary/20 selection:text-primary">
      <div className="max-w-[1440px] mx-auto border-x border-border/50 min-h-screen relative shadow-2xl shadow-black/5 bg-white">
        <TopNav />
        <main>
        <HeroSection />
        <LogosSection />
        <HumanAIIntersection />
        <FeaturesSection />
        <IntegrationSection />

      </main>
      <Footer />
      </div>
    </div>
  );
}
