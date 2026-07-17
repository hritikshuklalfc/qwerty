import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TeamMemberCard({ name, role, imageSrc, linkedin }) {
  const [isHovered, setIsHovered] = useState(false);
  const [asciiArt, setAsciiArt] = useState('');

  useEffect(() => {
    if (!imageSrc) return;
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      const cols = 80; 
      const aspect = img.height / img.width;
      const rows = Math.floor(cols * aspect * 0.55);
      
      offscreen.width = cols;
      offscreen.height = rows;
      
      const ctx = offscreen.getContext('2d');
      ctx.drawImage(img, 0, 0, cols, rows);
      
      try {
        const imageData = ctx.getImageData(0, 0, cols, rows).data;
        let asciiStr = '';
        // Density string from dark to light
        const chars = '@%#*+=-:. '; 
        
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i+1];
          const b = imageData[i+2];
          
          // Calculate brightness
          const brightness = (r + g + b) / 3;
          const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
          asciiStr += chars[charIndex];
          
          if ((i / 4 + 1) % cols === 0) {
            asciiStr += '\n';
          }
        }
        setAsciiArt(asciiStr);
      } catch (e) {
        console.error("Canvas read error:", e);
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col bg-white border border-border border-dashed relative overflow-hidden"
    >
      <div className="relative w-full aspect-square bg-[#fcfcfc] overflow-hidden flex items-center justify-center">
        {/* ASCII overlay - visible when not hovered */}
        <pre 
          className={`absolute inset-0 w-full h-full p-4 overflow-hidden text-[6px] leading-[6px] md:text-[7px] md:leading-[7px] font-mono text-text-primary/60 transition-opacity duration-500 flex items-center justify-center ${isHovered ? 'opacity-0' : 'opacity-100'}`}
        >
          {asciiArt}
        </pre>
        
        {/* Real image - visible on hover */}
        <img 
          src={imageSrc} 
          alt={name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div 
        className="p-6 border-t border-border flex flex-col cursor-crosshair hover:bg-secondary/20 transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h3 className="font-display font-medium text-text-primary text-lg mb-1">{name}</h3>
        <p className="text-text-tertiary text-sm mb-4">{role}</p>
        <a 
          href={linkedin || "#"} 
          target={linkedin ? "_blank" : undefined}
          rel={linkedin ? "noopener noreferrer" : undefined}
          className="text-text-tertiary hover:text-text-primary transition-colors inline-block w-fit font-display font-bold"
        >
          [in]
        </a>
      </div>
    </motion.div>
  );
}
