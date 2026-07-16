import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../utils/constants';

const MAX_EVENTS = 100;

export function useSwarmSocket() {
  const [agents, setAgents] = useState({});
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tokenHistory, setTokenHistory] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    totalCost: 0,
    totalTokens: 0,
    activeAgents: 0,
    alertCount: 0,
    systemHealth: 'nominal',
    burnRatePerSec: 0,
    burnRatePerMin: 0,
    uptime: 0,
  });
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const agentsRef = useRef({});
  const eventIdCounter = useRef(0);

  const nextEventId = () => {
    eventIdCounter.current += 1;
    return `evt-${Date.now()}-${eventIdCounter.current}`;
  };

  const addEvent = useCallback((type, agent, agentName, description) => {
    setEvents(prev => [{
      id: nextEventId(),
      timestamp: new Date().toISOString(),
      type,
      agent,
      agentName,
      description,
    }, ...prev].slice(0, MAX_EVENTS));
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

    socket.on('agent:update', (data) => {
      const prevAgent = agentsRef.current[data.agentId];
      agentsRef.current = { ...agentsRef.current, [data.agentId]: data };
      setAgents({ ...agentsRef.current });

      if (prevAgent && prevAgent.status !== data.status) {
        const eventType = data.status === 'critical' ? 'CRITICAL'
          : data.status === 'warning' ? 'WARNING'
          : data.status === 'killed' ? 'ERROR'
          : data.status === 'paused' ? 'WARNING'
          : 'INFO';
        addEvent(eventType, data.agentId, data.agentName,
          `Status → ${data.status.toUpperCase()}${data.status === 'killed' ? ' — Agent terminated' : ''}`);
      }

      const now = Date.now();
      setTokenHistory(prev => {
        const twoMinAgo = now - 120000;
        const filtered = prev.filter(p => p.time > twoMinAgo);
        const agents = agentsRef.current;
        const point = {
          time: now,
          timeLabel: new Date(now).toLocaleTimeString('en-US', {
            hour12: false,
            minute: '2-digit',
            second: '2-digit',
          }),
          alpha: agents.alpha?.tokenUsage?.total || 0,
          beta: agents.beta?.tokenUsage?.total || 0,
          gamma: agents.gamma?.tokenUsage?.total || 0,
          delta: agents.delta?.tokenUsage?.total || 0,
        };
        return [...filtered, point];
      });
    });

    socket.on('agent:communication', (data) => {
      const type = data.status === 'corrupted' ? 'ERROR' : 'INFO';
      const prefix = data.status === 'corrupted' ? '⚠ CORRUPTED: ' : '';
      addEvent(type, data.from, data.fromName,
        `${data.fromName} → ${data.toName}: ${prefix}${data.message}`);
    });

    socket.on('alert:hallucination', (data) => {
      setAlerts(prev => [...prev, {
        id: `alert-hall-${Date.now()}`,
        type: 'hallucination',
        agentId: data.agentId,
        agentName: data.agentName,
        message: data.message,
        confidence: data.confidence,
        timestamp: data.timestamp,
        dismissed: false,
      }]);
      addEvent('CRITICAL', data.agentId, data.agentName,
        `🚨 HALLUCINATION: ${data.message}`);
    });

    socket.on('alert:cost-spike', (data) => {
      setAlerts(prev => [...prev, {
        id: `alert-cost-${Date.now()}`,
        type: 'cost-spike',
        agentId: data.agentId,
        agentName: data.agentName,
        message: data.message,
        currentRate: data.currentRate,
        timestamp: data.timestamp,
        dismissed: false,
      }]);
      addEvent('CRITICAL', data.agentId, data.agentName,
        `💰 COST SPIKE: ${data.message}`);
    });

    socket.on('alert:cascade', (data) => {
      setAlerts(prev => [...prev, {
        id: `alert-cascade-${Date.now()}`,
        type: 'cascade',
        agentId: data.agentId,
        agentName: data.agentName,
        source: data.source,
        sourceName: data.sourceName,
        message: data.message,
        timestamp: data.timestamp,
        dismissed: false,
      }]);
      addEvent('CRITICAL', data.agentId, data.agentName,
        `🔗 CASCADE: ${data.message}`);
    });

    socket.on('alert:safeguard', (data) => {
      addEvent('WARNING', 'SYSTEM', 'Auto-Safeguard', `🛡️ ${data.message}`);
    });

    socket.on('system:status', (data) => {
      setSystemStatus(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [addEvent]);

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
      setAlerts([]);
    } catch (err) {
      console.error('Restart agent failed:', err);
    }
  }, []);

  const restartAll = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/api/restart-all`, { method: 'POST' });
      setAlerts([]);
      setEvents([]);
      setTokenHistory([]);
    } catch (err) {
      console.error('Restart all failed:', err);
    }
  }, []);

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
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    agents,
    events,
    alerts,
    tokenHistory,
    systemStatus,
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
