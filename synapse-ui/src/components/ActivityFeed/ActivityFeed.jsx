import React, { useEffect, useRef } from 'react';
import { useSynapse } from '../../context/SynapseContext';

const typeColors = {
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-orange-400',
  error: 'text-red-400',
};

const typeDots = {
  info: 'bg-blue-400',
  success: 'bg-green-400',
  warning: 'bg-orange-400',
  error: 'bg-red-400',
};

const ActivityFeed = ({ maxItems = 50, className = '' }) => {
  const { activityLog } = useSynapse();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activityLog]);

  const entries = activityLog.slice(-maxItems);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto no-scrollbar font-mono text-xs leading-relaxed"
      >
        {entries.length === 0 && (
          <div className="text-text-tertiary text-center py-8 opacity-60">
            No activity yet. Run a demo scenario to see agent logs here.
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex gap-2 py-1.5 px-2 hover:bg-white/5 rounded transition-colors animate-slide-in"
          >
            <span className="text-text-tertiary shrink-0 w-16">
              {entry.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className={`shrink-0 flex items-center gap-1 w-20 ${typeColors[entry.type]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${typeDots[entry.type]}`} />
              {entry.agent?.icon || '🤖'}
            </span>
            <span className="text-text-secondary flex-grow">
              <span className="text-white/80 font-semibold">{entry.agent?.name?.split(' ')[0]}:</span>{' '}
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
