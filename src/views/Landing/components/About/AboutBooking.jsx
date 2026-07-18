import React from 'react';
import { Lock, User, Map } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutBooking() {
  const points = [
    { icon: Lock, text: "No aggressive sales pitches." },
    { icon: User, text: "Speak directly with a lead engineer." },
    { icon: Map, text: "Receive a clear deployment roadmap." }
  ];

  return (
    <section className="py-24 bg-white border-b border-border" id="booking">
      <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row gap-16 items-center">
        <div className="md:w-1/2">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-medium text-text-primary mb-6"
          >
            Scale Your Infrastructure.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-text-tertiary leading-relaxed text-[15px] mb-8"
          >
            Book a 30-minute technical assessment. We will audit your current manual workflows and tell you exactly which processes can be automated using AI.
          </motion.p>

          <div className="flex flex-col gap-3">
            {points.map((point, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className="bg-[#fcfcfc] border border-border border-dashed p-4 rounded flex items-center gap-3"
              >
                <point.icon size={16} className="text-text-primary" />
                <span className="font-medium text-sm text-text-secondary">{point.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="md:w-1/2 w-full">
          {/* Mockup Calendar UI */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-[#1c1c1e] text-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 overflow-hidden relative w-full max-w-sm sm:max-w-md md:max-w-none mx-auto"
          >
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h3 className="font-display font-semibold text-sm sm:text-base">July <span className="text-white/60 font-normal">2026</span></h3>
              <div className="flex gap-1 sm:gap-2">
                <button className="w-6 h-6 flex items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white transition-colors">&lt;</button>
                <button className="w-6 h-6 flex items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white transition-colors">&gt;</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-4 mb-2 sm:mb-4">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, index) => {
                const shortDay = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index];
                return (
                  <div key={day} className="text-center text-[9px] sm:text-[10px] font-semibold tracking-widest text-white/40">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{shortDay}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-xs sm:text-sm">
              {/* Empty slots for start of month */}
              <div></div><div></div><div></div>
              
              {/* Fake dates */}
              {[...Array(31)].map((_, i) => {
                const date = i + 1;
                // July 2026 starts on Wednesday (just making it fit nicely)
                const isSelected = date === 17;
                const isAvailable = [16, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31].includes(date);
                
                return (
                  <div key={date} className="flex justify-center items-center aspect-square relative group cursor-pointer">
                    {isAvailable && !isSelected && (
                      <div className="absolute inset-0 sm:inset-1 rounded bg-[#333336] opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                    )}
                    {isAvailable && !isSelected && (
                      <div className="absolute inset-0 sm:inset-1 rounded bg-[#333336] z-0"></div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 sm:inset-1 rounded bg-white z-0"></div>
                    )}
                    <span className={`relative z-10 flex items-center justify-center w-full h-full ${isSelected ? 'text-black font-semibold' : (isAvailable ? 'text-white' : 'text-white/30')}`}>
                      {date}
                    </span>
                    {date === 16 && (
                      <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full z-10"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Overlay a blur on bottom to simulate scroll/more dates */}
            <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
