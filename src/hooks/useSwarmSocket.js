import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../utils/constants';

const MAX_EVENTS = 100;

const defaultSystemStatus = {
  totalCost: 0,
  totalTokens: 0,
  activeAgents: 0,
  alertCount: 0,
  systemHealth: 'nominal',
  burnRatePerSec: 0,
  burnRatePerMin: 0,
  uptime: 0,
};

const createEmptySwarm = () => ({
  agents: {},
  events: [],
  alerts: [],
  tokenHistory: [],
  hrsScores: {},
  systemStatus: { ...defaultSystemStatus },
  metadata: { title: 'Unknown Swarm', description: '', icon: '🧠', steps: [] },
  isWaitingForEvent: true, // true until first event
});

export function useSwarmSocket(activeSwarmId = 'demo') {
  const [swarms, setSwarms] = useState({
    demo: createEmptySwarm(),
  });
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const eventIdCounter = useRef(0);

  // We need refs to avoid stale closures in socket callbacks
  const swarmsRef = useRef(swarms);
  useEffect(() => {
    swarmsRef.current = swarms;
  }, [swarms]);

  const nextEventId = () => {
    eventIdCounter.current += 1;
    return `evt-${Date.now()}-${eventIdCounter.current}`;
  };

  const addEvent = useCallback((swarmId, type, agent, agentName, description) => {
    setSwarms(prev => {
      const s = prev[swarmId] || createEmptySwarm();
      const newEvent = {
        id: nextEventId(),
        timestamp: new Date().toISOString(),
        type,
        agent,
        agentName,
        description,
      };
      return {
        ...prev,
        [swarmId]: {
          ...s,
          isWaitingForEvent: false,
          events: [newEvent, ...s.events].slice(0, MAX_EVENTS),
        }
      };
    });
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Swarm Socket] Connected to Synapse Observatory server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Swarm Socket] Disconnected from server');
    });

    socket.on('live:scenario-start', (data) => {
      const sId = data.scenarioId || 'demo';
      setSwarms(prev => {
        const s = prev[sId] || createEmptySwarm();
        return {
          ...prev,
          [sId]: {
            ...s,
            metadata: {
              title: data.title || sId,
              icon: data.icon || '🧠',
              description: data.description || '',
              steps: data.steps || [],
            }
          }
        };
      });
    });

    socket.on('agent:update', (data) => {
      const sId = data.swarmId || 'demo';
      
      setSwarms(prev => {
        const s = prev[sId] || createEmptySwarm();
        const prevAgent = s.agents[data.agentId];
        
        // Generate event if status changed
        if (prevAgent && prevAgent.status !== data.status) {
          const eventType = data.status === 'critical' ? 'CRITICAL'
            : data.status === 'warning' ? 'WARNING'
            : data.status === 'killed' ? 'ERROR'
            : data.status === 'paused' ? 'WARNING'
            : 'INFO';
          
          // Queue event generation (we can't call addEvent inside setState easily, so we just append it here)
          const newEvent = {
            id: nextEventId(),
            timestamp: new Date().toISOString(),
            type: eventType,
            agent: data.agentId,
            agentName: data.agentName,
            description: `Status → ${data.status.toUpperCase()}${data.status === 'killed' ? ' — Agent terminated' : ''}`
          };
          s.events = [newEvent, ...s.events].slice(0, MAX_EVENTS);
        }

        const newAgents = { ...s.agents, [data.agentId]: data };
        
        // Token history
        const now = Date.now();
        const twoMinAgo = now - 120000;
        const filtered = s.tokenHistory.filter(p => p.time > twoMinAgo);
        
        const point = {
          time: now,
          timeLabel: new Date(now).toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }),
        };
        // Dynamically add all agents to point
        for (const [id, agent] of Object.entries(newAgents)) {
          point[id] = agent.tokenUsage?.total || 0;
        }

        return {
          ...prev,
          [sId]: {
            ...s,
            isWaitingForEvent: false,
            agents: newAgents,
            tokenHistory: [...filtered, point],
          }
        };
      });
    });

    socket.on('agent:communication', (data) => {
      const sId = data.swarmId || 'demo';
      const type = data.status === 'corrupted' ? 'ERROR' : 'INFO';
      const prefix = data.status === 'corrupted' ? '⚠ CORRUPTED: ' : '';
      addEvent(sId, type, data.from, data.fromName, `${data.fromName} → ${data.toName}: ${prefix}${data.message}`);
    });
    
    socket.on('live:activity', (data) => {
      const sId = data.swarmId || 'demo';
      let type = 'INFO';
      if (data.type === 'tool_call') type = 'INFO'; // could be WARNING if high risk
      addEvent(sId, type, data.agentId, data.agentName, data.message);
    });

    socket.on('alert:hallucination', (data) => {
      const sId = data.swarmId || 'demo';
      setSwarms(prev => {
        const s = prev[sId] || createEmptySwarm();
        return {
          ...prev,
          [sId]: {
            ...s,
            isWaitingForEvent: false,
            alerts: [...s.alerts, {
              id: `alert-hall-${Date.now()}`,
              type: 'hallucination',
              agentId: data.agentId,
              agentName: data.agentName,
              message: data.message,
              confidence: data.confidence,
              timestamp: data.timestamp,
              dismissed: false,
            }]
          }
        };
      });
      addEvent(sId, 'CRITICAL', data.agentId, data.agentName, `🚨 HALLUCINATION: ${data.message}`);
    });

    socket.on('alert:cost-spike', (data) => {
      const sId = data.swarmId || 'demo';
      setSwarms(prev => {
        const s = prev[sId] || createEmptySwarm();
        return {
          ...prev,
          [sId]: {
            ...s,
            isWaitingForEvent: false,
            alerts: [...s.alerts, {
              id: `alert-cost-${Date.now()}`,
              type: 'cost-spike',
              agentId: data.agentId,
              agentName: data.agentName,
              message: data.message,
              currentRate: data.currentRate,
              timestamp: data.timestamp,
              dismissed: false,
            }]
          }
        };
      });
      addEvent(sId, 'CRITICAL', data.agentId, data.agentName, `💰 COST SPIKE: ${data.message}`);
    });

    socket.on('alert:cascade', (data) => {
      const sId = data.swarmId || 'demo';
      setSwarms(prev => {
        const s = prev[sId] || createEmptySwarm();
        return {
          ...prev,
          [sId]: {
            ...s,
            isWaitingForEvent: false,
            alerts: [...s.alerts, {
              id: `alert-cascade-${Date.now()}`,
              type: 'cascade',
              agentId: data.agentId,
              agentName: data.agentName,
              source: data.source,
              sourceName: data.sourceName,
              message: data.message,
              timestamp: data.timestamp,
              dismissed: false,
            }]
          }
        };
      });
      addEvent(sId, 'CRITICAL', data.agentId, data.agentName, `🔗 CASCADE: ${data.message}`);
    });

    socket.on('alert:safeguard', (data) => {
      const sId = data.swarmId || 'demo';
      addEvent(sId, 'WARNING', 'SYSTEM', 'Auto-Safeguard', `🛡️ ${data.message}`);
    });

    socket.on('system:status', (data) => {
      const sId = data.swarmId || 'demo';
      setSwarms(prev => {
        const s = prev[sId] || createEmptySwarm();
        return {
          ...prev,
          [sId]: {
            ...s,
            isWaitingForEvent: false,
            systemStatus: data
          }
        };
      });
    });
    
    socket.on('live:telemetry', (data) => {
      const sId = data.swarmId || 'demo';
      setSwarms(prev => {
        const s = prev[sId] || createEmptySwarm();
        return {
          ...prev,
          [sId]: {
            ...s,
            isWaitingForEvent: false,
            systemStatus: {
              ...s.systemStatus,
              totalCost: data.totalCost || 0,
              totalTokens: data.totalTokens || 0,
              activeAgents: Object.keys(s.agents).length,
              uptime: data.totalLatency || 0,
            }
          }
        };
      });
    });

    socket.on('hallucination:score', (data) => {
      const sId = data.swarmId || 'demo';
      setSwarms(prev => {
        const s = prev[sId] || createEmptySwarm();
        return {
          ...prev,
          [sId]: {
            ...s,
            hrsScores: {
              ...s.hrsScores,
              [data.agentId]: data,
            }
          }
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [addEvent]);

  // Api controls (currently hardcoded for demo agents, but for dynamic we might need to change backend api too)
  // To keep it simple, we will just send agentId.
  const killAgent = useCallback(async (agentId) => {
    try {
      await fetch(`${BACKEND_URL}/api/kill/${agentId}`, { method: 'POST' });
    } catch (err) {
      console.error('Kill agent failed:', err);
    }
  }, []);

  const killAll = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/api/kill-all`, { method: 'POST' });
    } catch (err) {
      console.error('Kill all failed:', err);
    }
  }, []);

  const restartAgent = useCallback(async (agentId) => {
    try {
      await fetch(`${BACKEND_URL}/api/restart/${agentId}`, { method: 'POST' });
      // clear alerts for active swarm
      setSwarms(prev => {
        const s = prev[activeSwarmId];
        if (!s) return prev;
        return { ...prev, [activeSwarmId]: { ...s, alerts: [] } };
      });
    } catch (err) {
      console.error('Restart agent failed:', err);
    }
  }, [activeSwarmId]);

  const restartAll = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/api/restart-all`, { method: 'POST' });
      setSwarms(prev => {
        const s = prev[activeSwarmId];
        if (!s) return prev;
        return { ...prev, [activeSwarmId]: { ...s, alerts: [], events: [], tokenHistory: [] } };
      });
    } catch (err) {
      console.error('Restart all failed:', err);
    }
  }, [activeSwarmId]);

  const resumeAgent = useCallback(async (agentId) => {
    try {
      await fetch(`${BACKEND_URL}/api/resume/${agentId}`, { method: 'POST' });
    } catch (err) {
      console.error('Resume agent failed:', err);
    }
  }, []);

  const triggerRogue = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/api/demo/trigger-rogue`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to trigger demo', err);
    }
  }, []);

  const dismissAlert = useCallback((alertId) => {
    setSwarms(prev => {
      const s = prev[activeSwarmId];
      if (!s) return prev;
      return { ...prev, [activeSwarmId]: { ...s, alerts: s.alerts.filter(a => a.id !== alertId) } };
    });
  }, [activeSwarmId]);

  const clearAlerts = useCallback(() => {
    setSwarms(prev => {
      const s = prev[activeSwarmId];
      if (!s) return prev;
      return { ...prev, [activeSwarmId]: { ...s, alerts: [] } };
    });
  }, [activeSwarmId]);

  // Return the full dictionary plus the specific active swarm state
  const activeSwarm = swarms[activeSwarmId] || createEmptySwarm();

  return {
    swarms,
    agents: activeSwarm.agents,
    events: activeSwarm.events,
    alerts: activeSwarm.alerts,
    tokenHistory: activeSwarm.tokenHistory,
    hrsScores: activeSwarm.hrsScores,
    systemStatus: activeSwarm.systemStatus,
    isWaitingForEvent: activeSwarm.isWaitingForEvent,
    isConnected,
    killAgent,
    killAll,
    restartAgent,
    restartAll,
    resumeAgent,
    triggerRogue,
    dismissAlert,
    clearAlerts,
  };
}
