import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MorphingLogo from './MorphingLogo';

export default function TopNav() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 border-b border-border/50 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between md:justify-center gap-4 md:gap-24 text-sm font-medium text-text-secondary tracking-wide pt-8 pb-8 px-4">
        <Link to="/about" className="hover:text-primary transition-colors">
          [About]
        </Link>
        
        <Link to="/" className="text-text-primary hover:text-primary transition-colors">
          <MorphingLogo />
        </Link>
        
        <Link to="/pricing" className="hover:text-primary transition-colors">
          [Pricing]
        </Link>
      </div>
    </header>
  );
}
