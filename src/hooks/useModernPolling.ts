// =============================================================================
// MODERN 2025 POLLING HOOKS - BASED ON REACT BEST PRACTICES
// Implementing patterns from latest industry standards for efficient real-time data fetching
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { adaptivePoller, type IServiceResult } from '../utils/serviceCheckers.js';

// =============================================================================
// 1. ENCAPSULATED INTERVAL HOOK (Following article pattern)
// =============================================================================
type UseInterval = <T, U>(
  callback: (vars?: U) => T,
  delay: number | null,
) => void;

export const useInterval: UseInterval = (callback, delay) => {
  const callbackRef = useRef<typeof callback | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    };
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

// =============================================================================
// 2. VISIBILITY CHANGE HOOK (Following article pattern)
// =============================================================================
export const useVisibilityChange = () => {
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

// =============================================================================
// 3. ADAPTIVE POLLING HOOK (Modern 2025 Enhancement)
// =============================================================================
interface UseAdaptivePollingOptions {
  serviceName: string;
  enabled?: boolean;
  onSuccess?: (data: IServiceResult) => void;
  onError?: (error: Error) => void;
}

export const useAdaptivePolling = (
  pollFunction: () => Promise<IServiceResult>,
  options: UseAdaptivePollingOptions
) => {
  const { serviceName, enabled = true, onSuccess, onError } = options;
  const [pollingInterval, setPollingInterval] = useState<number | null>(15000); // Default 15s
  const [lastResult, setLastResult] = useState<IServiceResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const isPageVisible = useVisibilityChange();

  // Adaptive interval calculation based on service status and browser state
  const calculateInterval = useCallback((result: IServiceResult) => {
    const baseInterval = adaptivePoller.getAdaptiveInterval(serviceName, result);
    
    // Apply visibility-based optimizations (following article pattern)
    if (!isPageVisible) {
      return null; // Stop polling when page is hidden
    }

    return baseInterval;
  }, [serviceName, isPageVisible]);

  // Update polling interval based on visibility and last result
  useEffect(() => {
    if (!enabled) {
      setPollingInterval(null);
      return;
    }

    if (lastResult) {
      const newInterval = calculateInterval(lastResult);
      setPollingInterval(newInterval);
    } else if (isPageVisible) {
      setPollingInterval(15000); // Default interval
    } else {
      setPollingInterval(null); // Stop when hidden
    }
  }, [enabled, lastResult, isPageVisible, calculateInterval]);

  // Polling execution with modern error handling and circuit breaker
  const executePoll = useCallback(async () => {
    if (isPolling) return; // Prevent concurrent polls
    
    // Check circuit breaker
    if (adaptivePoller.shouldSkipPoll(serviceName)) {
      return;
    }

    setIsPolling(true);
    const startTime = Date.now();

    try {
      const result = await pollFunction();
      const responseTime = Date.now() - startTime;
      
      // Record successful response for adaptive optimization
      adaptivePoller.recordResponse(serviceName, responseTime, true);
      
      setLastResult(result);
      onSuccess?.(result);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failed response for circuit breaker
      adaptivePoller.recordResponse(serviceName, responseTime, false);
      
      onError?.(error as Error);
      
      // Create error result for interval calculation
      const errorResult: IServiceResult = {
        status: 'error',
        message: `${serviceName} Error`,
        metrics: { responseTime },
        error: (error as Error).message,
        timestamp: Date.now()
      };
      setLastResult(errorResult);
      
    } finally {
      setIsPolling(false);
    }
  }, [isPolling, serviceName, pollFunction, onSuccess, onError]);

  // Use the encapsulated interval hook (following article pattern)
  useInterval(executePoll, pollingInterval);

  return {
    lastResult,
    isPolling,
    pollingInterval,
    isVisible: isPageVisible
  };
};

// =============================================================================
// 4. SPECIFIC SERVICE POLLING HOOKS (Ready-to-use implementations)
// =============================================================================
export const useBackendPolling = (options: Omit<UseAdaptivePollingOptions, 'serviceName'> = {}) => {
  return useAdaptivePolling(
    async () => {
      const { BackendServiceChecker } = await import('../utils/serviceCheckers.js');
      return BackendServiceChecker.checkHealth();
    },
    { ...options, serviceName: 'backend' }
  );
};

export const useDatabasePolling = (options: Omit<UseAdaptivePollingOptions, 'serviceName'> = {}) => {
  return useAdaptivePolling(
    async () => {
      const { DatabaseServiceChecker } = await import('../utils/serviceCheckers.js');
      return DatabaseServiceChecker.checkHealth();
    },
    { ...options, serviceName: 'database' }
  );
};

export const useCachePolling = (options: Omit<UseAdaptivePollingOptions, 'serviceName'> = {}) => {
  return useAdaptivePolling(
    async () => {
      const { CacheServiceChecker } = await import('../utils/serviceCheckers.js');
      return CacheServiceChecker.checkHealth();
    },
    { ...options, serviceName: 'cache' }
  );
};

// =============================================================================
// 5. COMBINED SERVICES POLLING HOOK (For components that need multiple services)
// =============================================================================
export const useAllServicesPolling = (enabled: boolean = true) => {
  const backend = useBackendPolling({ enabled });
  const database = useDatabasePolling({ enabled });
  const cache = useCachePolling({ enabled });
  
  return {
    backend: backend.lastResult,
    database: database.lastResult,
    cache: cache.lastResult,
    isPolling: backend.isPolling || database.isPolling || cache.isPolling,
    isVisible: backend.isVisible
  };
};

// =============================================================================
// EXAMPLE USAGE (Following article composition pattern):
// 
// const HealthDashboard = ({ children }: { children: React.ReactNode }) => {
//   const { backend, database, cache } = useAllServicesPolling();
//   
//   return (
//     <div>
//       <ServiceStatus services={{ backend, database, cache }} />
//       {children} {/* Children won't re-render from polling */}
//     </div>
//   );
// };
// =============================================================================