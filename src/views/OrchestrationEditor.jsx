import React, { useState } from 'react';
import { ENGINE_URL } from '../utils/constants';

export default function OrchestrationEditor() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="w-full h-full relative bg-transparent text-foreground flex flex-col overflow-hidden">
      <div className="flex-1 w-full h-full relative z-10 bg-transparent">
        <iframe 
          src={ENGINE_URL}
          width="100%" 
          height="100%"
          frameBorder="0"
          className={`w-full h-full border-0 absolute inset-0 z-10 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          title="Synapse Orchestration"
          allow="clipboard-read; clipboard-write"
          onLoad={() => setIsLoaded(true)}
        />

        {!isLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-transparent backdrop-blur-md">
            <div className="bg-white/70 dark:bg-black/70 p-8 border border-black/10 dark:border-white/10 shadow-[8px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0_rgba(255,255,255,0.1)]">
              <div className="font-mono text-xs text-black dark:text-white space-y-2">
                <div>&gt; _<span className="animate-pulse bg-black dark:bg-white w-2 h-3 inline-block align-middle ml-1"></span></div>
                <div className="text-black/50 dark:text-white/50">[SYS] Initializing connection to core engine...</div>
                <div className="text-black/50 dark:text-white/50">[SYS] Target: http://localhost:5678</div>
                <div className="pt-4 text-black dark:text-white font-bold tracking-tighter text-lg uppercase">
                  Engine Offline / Awaiting Connection
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
