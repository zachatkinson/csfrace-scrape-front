// =============================================================================
// REAL-TIME HEALTH MONITORING COMPONENT - SINGLE SOURCE OF TRUTH
// Pure data provider that polls services and emits events
// =============================================================================

import { useState, useEffect } from 'react';
import { useAllServicesPolling } from '../../hooks/useModernPolling.ts';
import type { IServiceResult } from '../../utils/serviceCheckers.js';
import { formatTimestamp, onTimezoneChange } from '../../utils/timezone.js';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
interface ServiceStatuses {
  frontend: IServiceResult | null;
  backend: IServiceResult | null;
  database: IServiceResult | null;
  cache: IServiceResult | null;
}

interface RealtimeHealthEnhancerProps {
  enabled?: boolean;
  showIndicator?: boolean;
}

// =============================================================================
// PURE DATA PROVIDER COMPONENT
// =============================================================================
const RealtimeHealthEnhancer: React.FC<RealtimeHealthEnhancerProps> = ({
  enabled = true,
  showIndicator = true
}) => {
  console.log('🔄 RealtimeHealthEnhancer: COMPONENT FUNCTION EXECUTING', { enabled, showIndicator });
  console.log('🔥 RealtimeHealthEnhancer: Component is executing in browser!', new Date().toISOString());

  // State for tracking updates
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastUpdateFormatted, setLastUpdateFormatted] = useState<string>('--:--:--');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize component and timezone handling
  useEffect(() => {
    console.log('🔄 RealtimeHealthEnhancer: Component mounted', { enabled, showIndicator });
    console.log('🔄 RealtimeHealthEnhancer: Will start polling services');

    const now = new Date();
    setLastUpdate(now);
    setLastUpdateFormatted(formatTimestamp(now));

    // Listen for timezone changes - DON'T trigger health events for timezone formatting
    const cleanupTimezoneListener = onTimezoneChange(() => {
      if (lastUpdate) {
        // Only update the formatting, don't trigger health event dispatch
        const newFormatted = formatTimestamp(lastUpdate);
        console.log('🌍 RealtimeHealthEnhancer: Timezone changed, updating format only:', newFormatted);
        setLastUpdateFormatted(newFormatted);
      }
    });

    return cleanupTimezoneListener;
  }, []);

  // SINGLE SOURCE OF TRUTH: All health data comes from here
  const pollingResults = useAllServicesPolling(enabled);
  console.log('🔥 POLLING RESULTS:', pollingResults);

  const { frontend, backend, database, cache, isPolling, isVisible } = pollingResults;

  // Debug polling state
  useEffect(() => {
    console.log('🔍 RealtimeHealthEnhancer: Polling state update', {
      frontend: frontend?.status,
      backend: backend?.status,
      database: database?.status,
      cache: cache?.status,
      isPolling,
      isVisible,
      enabled
    });
  }, [frontend, backend, database, cache, isPolling, isVisible, enabled]);

  // PURE DATA PROVIDER: Only emit events, let components handle their own DOM
  useEffect(() => {
    console.log('🔄 RealtimeHealthEnhancer: useEffect triggered', {
      frontend: !!frontend,
      backend: !!backend,
      database: !!database,
      cache: !!cache,
      isInitialLoad,
      enabled
    });

    if (!frontend && !backend && !database && !cache) {
      console.log('🔄 RealtimeHealthEnhancer: No service data yet, waiting...');
      return;
    }

    // Handle initial load
    if (isInitialLoad) {
      console.log('🔄 RealtimeHealthEnhancer: Initial load, emitting first health data');
      setIsInitialLoad(false);
    }

    const services = { frontend, backend, database, cache };
    console.log('🔄 RealtimeHealthEnhancer: New health data available:', Object.keys(services).filter(k => services[k]));

    const now = new Date();
    setLastUpdate(now);
    setLastUpdateFormatted(formatTimestamp(now));

    // PURE DATA EMISSION: Let components decide what to do with the data
    const eventDetail = {
      services,
      overallStatus: calculateOverallStatus(services),
      timestamp: Date.now(),
      isPolling,
      isVisible
    };
    console.log('🎯 RealtimeHealthEnhancer: Emitting consolidatedHealthUpdate event', eventDetail);
    window.dispatchEvent(new CustomEvent('consolidatedHealthUpdate', {
      detail: eventDetail
    }));
  }, [frontend, backend, database, cache, isInitialLoad, isPolling, isVisible, enabled]);

  return (
    <>
      {showIndicator && enabled && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-300">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg text-white text-sm">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isPolling ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="font-medium">Real-time monitoring</span>
            <span className="text-gray-300 text-xs">
              {lastUpdateFormatted}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================================================
// UTILITY FUNCTIONS FOR CALCULATING STATUS
// =============================================================================
function calculateOverallStatus(services: ServiceStatuses) {
  const serviceList = Object.values(services).filter(Boolean);
  const upCount = serviceList.filter(s => s.status === 'up').length;
  const downCount = serviceList.filter(s => s.status === 'down' || s.status === 'error').length;

  if (upCount === 4) {
    return {
      status: 'up',
      text: 'All Systems Operational',
      summary: 'All services are running normally',
      color: 'bg-green-500'
    };
  } else if (downCount === 0) {
    return {
      status: 'degraded',
      text: 'Some Systems Loading',
      summary: 'Services are starting up',
      color: 'bg-yellow-500'
    };
  } else if (downCount >= 2) {
    return {
      status: 'down',
      text: 'Service Error',
      summary: 'Multiple services are experiencing issues',
      color: 'bg-red-500'
    };
  } else if (downCount >= 1) {
    return {
      status: 'degraded',
      text: 'Degraded Performance',
      summary: 'One service is experiencing issues',
      color: 'bg-yellow-500'
    };
  } else {
    return {
      status: 'unknown',
      text: 'Unknown Status',
      summary: 'Unable to determine system status',
      color: 'bg-gray-500'
    };
  }
}

// Status utility functions for components to use
export function getStatusColor(status: string): string {
  switch (status) {
    case 'up': return 'bg-green-400';
    case 'degraded': return 'bg-yellow-400';
    case 'down': return 'bg-red-400';
    case 'error': return 'bg-orange-400';
    default: return 'bg-gray-400';
  }
}

export function getStatusBorderClass(status: string): string {
  switch (status) {
    case 'up': return 'border-green-400';
    case 'degraded': return 'border-yellow-400';
    case 'down': return 'border-red-400';
    case 'error': return 'border-orange-400';
    default: return 'border-gray-400';
  }
}

export function getStatusBgClass(status: string): string {
  switch (status) {
    case 'up': return 'bg-green-50 border-green-200';
    case 'degraded': return 'bg-yellow-50 border-yellow-200';
    case 'down': return 'bg-red-50 border-red-200';
    case 'error': return 'bg-orange-50 border-orange-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

// =============================================================================
// EVENT-DRIVEN ARCHITECTURE FOR HEALTH DATA
//
// Components should listen for 'consolidatedHealthUpdate' events to get data:
//
// useEffect(() => {
//   const handleHealthUpdate = (event: CustomEvent) => {
//     const { services, overallStatus, timestamp } = event.detail;
//     // Update component state here
//   };
//
//   window.addEventListener('consolidatedHealthUpdate', handleHealthUpdate);
//   return () => window.removeEventListener('consolidatedHealthUpdate', handleHealthUpdate);
// }, []);
//
// =============================================================================

// Default export for Astro
export default RealtimeHealthEnhancer;