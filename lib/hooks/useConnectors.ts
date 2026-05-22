'use client';
import { useState, useEffect, useCallback } from 'react';

export interface ConnectorState {
  id: 'gmail' | 'outlook';
  name: string;
  connected: boolean;
  account?: string;
  connectedAt?: string;
}

const DEFAULTS: ConnectorState[] = [
  { id: 'gmail',   name: 'Gmail',   connected: false },
  { id: 'outlook', name: 'Outlook', connected: false },
];

export function useConnectors() {
  const [connectors, setConnectors] = useState<ConnectorState[]>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('stu-connectors');
      if (stored) setConnectors(JSON.parse(stored));
    } catch {}
    setReady(true);
  }, []);

  const save = useCallback((updated: ConnectorState[]) => {
    setConnectors(updated);
    localStorage.setItem('stu-connectors', JSON.stringify(updated));
  }, []);

  const connect = useCallback((id: ConnectorState['id'], account: string) => {
    setConnectors(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, connected: true, account, connectedAt: new Date().toISOString() } : c
      );
      localStorage.setItem('stu-connectors', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const disconnect = useCallback((id: ConnectorState['id']) => {
    setConnectors(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, connected: false, account: undefined, connectedAt: undefined } : c
      );
      localStorage.setItem('stu-connectors', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isConnected = useCallback((id: ConnectorState['id']) =>
    connectors.find(c => c.id === id)?.connected ?? false,
  [connectors]);

  const anyConnected = connectors.some(c => c.connected);

  return { connectors, connect, disconnect, isConnected, anyConnected, ready };
}
