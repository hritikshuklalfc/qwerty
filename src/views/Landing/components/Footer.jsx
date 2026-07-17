import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const links = [
    { name: 'About', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Careers', path: '/careers' },
    { name: 'Case Studies', path: '/case-studies' },
    { name: 'Contact', path: '/contact' }
  ];

  const legal = [
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms & Conditions', path: '/terms-and-conditions' },
    { name: 'Acceptable Use', path: '/acceptable-use' }
  ];

  return (
    <footer className="bg-white py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link 
              to="/" 
              className="flex items-center gap-2 mb-6"
              onClick={() => window.scrollTo(0, 0)}
            >
              <img src="/images/haqe2hzki2muozdla5wph5icqe.svg" alt="Synapse OS" className="w-8 h-8" />
              <span className="font-display font-semibold text-2xl tracking-tight">Synapse OS</span>
            </Link>
            <p className="text-text-tertiary max-w-sm">
              The OS for AI-driven enterprise. Deploy autonomous AI agents to orchestrate tenancy sync, data abstraction, and neural rosters.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-text-primary mb-6">Company</h4>
            <ul className="space-y-4">
              {links.map(link => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    onClick={() => window.scrollTo(0, 0)}
                    className="text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-text-primary mb-6">Legal</h4>
            <ul className="space-y-4">
              {legal.map(link => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    onClick={() => window.scrollTo(0, 0)}
                    className="text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border text-sm text-text-tertiary">
          <p>© {new Date().getFullYear()} Synapse OS. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a 
              href="https://x.com/ScamManLovesLFC" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors"
            >
              Twitter
            </a>
            <a 
              href="https://www.linkedin.com/in/mannat-kumar-91407837a?utm_source=share_via&utm_content=profile&utm_medium=member_android" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
