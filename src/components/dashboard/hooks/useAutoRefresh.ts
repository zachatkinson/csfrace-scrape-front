/**
 * Auto Refresh Hook
 * SOLID: Single Responsibility - Handles only auto-refresh functionality
 * DRY: Consolidates auto-refresh patterns from DashboardManager
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ConnectionStatus } from './useConnectionStatus.ts';

export interface UseAutoRefreshOptions {
  enabled?: boolean;
  interval?: number;
  connectionStatus?: ConnectionStatus;
  isLoading?: boolean;
}

export function useAutoRefresh(
  refreshFunction: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const {
    enabled = true,
    interval = 10000, // 10 seconds
    connectionStatus = 'connected',
    isLoading = false
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshFunctionRef = useRef(refreshFunction);

  // Keep refresh function reference up to date
  useEffect(() => {
    refreshFunctionRef.current = refreshFunction;
  }, [refreshFunction]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) return; // Already running

    intervalRef.current = setInterval(() => {
      if (connectionStatus === 'connected' && !isLoading) {
        refreshFunctionRef.current();
      }
    }, interval);
  }, [interval, connectionStatus, isLoading]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const restartAutoRefresh = useCallback(() => {
    stopAutoRefresh();
    if (enabled) {
      startAutoRefresh();
    }
  }, [enabled, startAutoRefresh, stopAutoRefresh]);

  // Setup auto-refresh based on options
  useEffect(() => {
    if (enabled && connectionStatus === 'connected') {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return stopAutoRefresh;
  }, [enabled, connectionStatus, startAutoRefresh, stopAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return stopAutoRefresh;
  }, [stopAutoRefresh]);

  return {
    startAutoRefresh,
    stopAutoRefresh,
    restartAutoRefresh,
    isRunning: intervalRef.current !== null
  };
}