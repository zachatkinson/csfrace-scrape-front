/**
 * Connection Status Hook
 * SOLID: Single Responsibility - Handles only connection monitoring
 * DRY: Consolidates connection status patterns from DashboardManager
 */

import { useState, useEffect, useCallback } from "react";

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export interface UseConnectionStatusOptions {
  onStatusChange?: (status: ConnectionStatus) => void;
}

export function useConnectionStatus(options: UseConnectionStatusOptions = {}) {
  const { onStatusChange } = options;

  const [status, setStatus] = useState<ConnectionStatus>("connected");

  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      setStatus((prev) => {
        if (prev !== newStatus) {
          onStatusChange?.(newStatus);
          return newStatus;
        }
        return prev;
      });
    },
    [onStatusChange],
  );

  const markConnected = useCallback(() => {
    updateStatus("connected");
  }, [updateStatus]);

  const markDisconnected = useCallback(() => {
    updateStatus("disconnected");
  }, [updateStatus]);

  const markReconnecting = useCallback(() => {
    updateStatus("reconnecting");
  }, [updateStatus]);

  // Monitor online/offline events
  useEffect(() => {
    const handleOnline = () => markConnected();
    const handleOffline = () => markDisconnected();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [markConnected, markDisconnected]);

  return {
    status,
    markConnected,
    markDisconnected,
    markReconnecting,
  };
}
