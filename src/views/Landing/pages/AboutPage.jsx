import React, { useEffect } from 'react';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import AboutHero from '../components/About/AboutHero';
import LogosSection from '../components/LogosSection';
import AboutProcess from '../components/About/AboutProcess';
import AboutStats from '../components/About/AboutStats';
import AboutTeam from '../components/About/AboutTeam';
import AboutBooking from '../components/About/AboutBooking';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary selection:bg-primary/20 selection:text-primary">
      <div className="max-w-[1440px] mx-auto border-x border-border/50 min-h-screen relative shadow-2xl shadow-black/5 bg-white">
        <TopNav />
        <main>
          <AboutHero />
          <LogosSection />
          <AboutProcess />
          <AboutStats />
          <AboutTeam />
          <AboutBooking />
        </main>
        <Footer />
      </div>
    </div>
  );
}
