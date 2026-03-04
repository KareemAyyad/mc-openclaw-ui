import { useState, useEffect, useCallback, useRef } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WsEvent {
  type: string;
  agentId?: string;
  data: any;
  timestamp: string;
}

export function useGatewayWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_DELAY = 60000;

  const connect = useCallback(() => {
    // Only connect if we have a token (Client-side env fallback or fetched from a secure config endpoint)
    // Note: In an actual production scenario, you would fetch a short-lived WSS token 
    // from a Next.js API route first rather than exposing NEXT_PUBLIC_..., 
    // but for the CEO dashboard running locally, this is acceptable.
    const wssUrl = process.env.NEXT_PUBLIC_GATEWAY_WSS_URL || 'wss://openclaw-teammates.onrender.com';
    const token = process.env.NEXT_PUBLIC_GATEWAY_TOKEN;

    if (!token) {
      console.warn('WSS Token missing, skipping live gateway connection for local dev.');
      return;
    }

    try {
      setStatus('connecting');
      // The gateway expects the token either in protocols or query string depending on OpenClaw version
      const ws = new WebSocket(`${wssUrl}/v1/stream?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0; // Reset backoff on success
        console.log('Gateway WebSocket Connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          const wsEvent: WsEvent = {
            type: payload.type || 'unknown',
            agentId: payload.agentId,
            data: payload,
            timestamp: new Date().toISOString()
          };

          setLastEvent(wsEvent);

          // Standardize tracking of online agents based on Gateway heartbeats
          if (payload.type === 'agent_heartbeat' && payload.agentId) {
            setActiveAgents(prev => {
              if (!prev.includes(payload.agentId)) {
                return [...prev, payload.agentId];
              }
              return prev;
            });
          }
          if (payload.type === 'agent_shutdown' && payload.agentId) {
            setActiveAgents(prev => prev.filter(id => id !== payload.agentId));
          }

        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');

        reconnectAttemptsRef.current++;
        const baseDelay = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current - 1), MAX_RECONNECT_DELAY);
        const delay = baseDelay + Math.random() * 1000; // jitter

        console.log(`Gateway WebSocket scheduling reconnect in ${Math.round(delay / 1000)}s (attempt ${reconnectAttemptsRef.current})`);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setStatus('error');
        // Sanitize error log to prevent token leak in URL
        console.error('Gateway WebSocket Error occurred');
      };

    } catch (err) {
      console.error('Failed to init Gateway WebSocket');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { status, lastEvent, activeAgents };
}
