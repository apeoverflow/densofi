import { useState, useCallback, useEffect } from 'react';

interface TimedEventStatus {
  isActive: boolean;
  startTime: number | null;
  duration: number; // in seconds
  remainingTime: number; // in seconds
  autoRestart: boolean;
  maxRestarts: number;
  restartCount: number;
}

interface UseTimedEventManagerReturn {
  status: TimedEventStatus | null;
  isLoading: boolean;
  error: string | null;
  startListeners: (reason?: string, duration?: number) => Promise<void>;
  stopListeners: (reason?: string) => Promise<void>;
  extendListeners: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

/**
 * Hook to manage timed event listeners on the backend
 * Automatically starts listeners when needed and provides status updates
 */
export function useTimedEventManager(): UseTimedEventManagerReturn {
  const [status, setStatus] = useState<TimedEventStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const apiCall = useCallback(async (endpoint: string, method: string = 'GET', body?: any) => {
    const response = await fetch(`${BASE_URL}/api/event-control${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
  }, [BASE_URL]);

  const refreshStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await apiCall('/status');
      if (response.success) {
        setStatus(response.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get status');
      console.error('Error refreshing event listener status:', err);
    }
  }, [apiCall]);

  const startListeners = useCallback(async (reason?: string, duration?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const body: any = {};
      if (reason) body.reason = reason;
      if (duration) body.duration = duration;
      
      const response = await apiCall('/start', 'POST', body);
      
      if (response.success) {
        setStatus(response.status);
        console.log('Event listeners started:', response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start listeners');
      console.error('Error starting event listeners:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const stopListeners = useCallback(async (reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const body: any = {};
      if (reason) body.reason = reason;
      
      const response = await apiCall('/stop', 'POST', body);
      
      if (response.success) {
        await refreshStatus(); // Refresh to get updated status
        console.log('Event listeners stopped:', response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop listeners');
      console.error('Error stopping event listeners:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, refreshStatus]);

  const extendListeners = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiCall('/extend', 'POST');
      
      if (response.success) {
        setStatus(response.status);
        console.log('Event listener duration extended');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend listeners');
      console.error('Error extending event listeners:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Auto-refresh status when listeners are active
  useEffect(() => {
    if (!status?.isActive) return;

    const interval = setInterval(() => {
      refreshStatus();
    }, 10000); // Refresh every 10 seconds when active

    return () => clearInterval(interval);
  }, [status?.isActive, refreshStatus]);

  // Initial status fetch
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    isLoading,
    error,
    startListeners,
    stopListeners,
    extendListeners,
    refreshStatus
  };
}

/**
 * Hook that automatically starts timed event listeners when a user action occurs
 * Useful for domain registration, NFT minting, etc.
 */
export function useAutoTimedEventManager(trigger: boolean, reason: string) {
  const { startListeners, status } = useTimedEventManager();

  useEffect(() => {
    if (trigger && (!status?.isActive)) {
      startListeners(reason, 300) // 5 minutes
        .then(() => {
          console.log(`Auto-started event listeners for: ${reason}`);
        })
        .catch((error) => {
          console.error(`Failed to auto-start event listeners for ${reason}:`, error);
        });
    }
  }, [trigger, reason, startListeners, status?.isActive]);

  return status;
}