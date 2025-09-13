// =============================================================================
// SINGLE SOURCE OF TRUTH: REAL-TIME HEALTH MONITORING
// Polls all 4 services and emits consolidated events for other components
// Following DRY/SOLID principles - all health data originates here
// =============================================================================

// Force immediate execution check
console.log('🔥 CRITICAL: RealtimeHealthEnhancer module loading at', new Date().toISOString());

import React, { useEffect, useState } from 'react';
import { useAllServicesPolling } from '../../hooks/useModernPolling';
import type { IServiceResult } from '../../utils/serviceCheckers';

interface RealtimeHealthEnhancerProps {
  /** Enable real-time polling (default: true) */
  enabled?: boolean;
  /** Show polling indicator (default: true) */
  showIndicator?: boolean;
  /** Custom refresh interval override */
  refreshInterval?: number;
}

interface ServiceStatuses {
  frontend?: IServiceResult | null;
  backend?: IServiceResult | null;
  database?: IServiceResult | null;
  cache?: IServiceResult | null;
}

export const RealtimeHealthEnhancer: React.FC<RealtimeHealthEnhancerProps> = ({
  enabled = true,
  showIndicator = true,
  refreshInterval
}) => {
  console.log('🔄 RealtimeHealthEnhancer: COMPONENT FUNCTION EXECUTING', { enabled, showIndicator }); // DEBUG
  
  // CRITICAL: Force immediate console log to verify component execution
  if (typeof window !== 'undefined') {
    console.log('🔥 RealtimeHealthEnhancer: Component is executing in browser!', new Date().toISOString());
  }
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Initialize timestamp and loading states after hydration to prevent mismatch
  useEffect(() => {
    console.log('🔄 RealtimeHealthEnhancer: Component mounted', { enabled, showIndicator });
    console.log('🔄 RealtimeHealthEnhancer: Will start polling services');
    setLastUpdate(new Date());
    
    // Set initial loading states for all service cards (like original scripts)
    initializeLoadingStates();
  }, []);
  
  // SINGLE SOURCE OF TRUTH: All health data comes from here
  const pollingResults = useAllServicesPolling(enabled);
  console.log('🔥 POLLING RESULTS:', pollingResults); // CRITICAL DEBUG
  
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

  // Update DOM elements when we get new data AND emit events for dashboard
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

    // Handle initial load - update loading states to real data
    if (isInitialLoad) {
      console.log('🔄 RealtimeHealthEnhancer: Initial load, proceeding with first real DOM updates');
      setIsInitialLoad(false);
      // Continue with DOM updates - don't return
    }

    const services = { frontend, backend, database, cache };
    console.log('🔄 RealtimeHealthEnhancer: Updating DOM with services:', Object.keys(services).filter(k => services[k]));
    
    // Update DOM elements directly
    console.log('🔄 RealtimeHealthEnhancer: About to call updateDOMElements...');
    updateDOMElements(services);
    console.log('🔄 RealtimeHealthEnhancer: updateDOMElements completed');
    setLastUpdate(new Date());
    
    // Emit consolidated health data event for dashboard to consume
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
  }, [frontend, backend, database, cache, isInitialLoad, isPolling, isVisible]);

  return (
    <>
      {showIndicator && enabled && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-black/80 backdrop-blur-lg rounded-lg px-4 py-2 text-white text-sm border border-white/10">
            <div className="flex items-center space-x-2">
              {/* Polling status indicator */}
              <div className={`w-2 h-2 rounded-full ${
                isPolling ? 'bg-blue-400 animate-pulse' : 
                isVisible ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              
              <span className="text-white/80">
                {isPolling ? 'Updating...' : 
                 !isVisible ? 'Paused (hidden)' : 
                 'Real-time monitoring'}
              </span>
              
              {/* Last update time */}
              <span className="text-white/50 text-xs">
                {lastUpdate ? lastUpdate.toLocaleTimeString(undefined, { 
                  hour12: true, 
                  timeZoneName: 'short' 
                }) : '--:--:--'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================================================
// DOM UPDATE UTILITIES - ENHANCE SERVER ISLANDS WITH FRESH DATA
// =============================================================================
function updateDOMElements(services: ServiceStatuses) {
  console.log('🔧 updateDOMElements called with services:', Object.keys(services).filter(k => services[k]));
  
  // Update footer compact status
  updateFooterStatus(services);
  
  // Update detailed health cards if on test-health page
  console.log('🔧 updateDOMElements: About to call updateHealthCards...');
  try {
    updateHealthCards(services);
    console.log('🔧 updateDOMElements: updateHealthCards completed successfully');
  } catch (error) {
    console.error('🔧 updateDOMElements: updateHealthCards failed:', error);
  }
  
  // Update summary status directly (better than events)
  updateSummaryStatus(services);
  
  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent('healthStatusUpdated', { 
    detail: services 
  }));
}

function updateFooterStatus(services: ServiceStatuses) {
  // Find footer health status elements
  const footerContainer = document.querySelector('.footer-health-status');
  if (!footerContainer) return;

  // Calculate service counts
  const serviceList = Object.values(services).filter(Boolean);
  const upCount = serviceList.filter(s => s.status === 'up').length;
  const totalCount = 4; // Always 4 services (frontend, backend, database, cache)

  // Update overall system status text
  const systemStatusText = footerContainer.querySelector('.status-text');
  if (systemStatusText) {
    systemStatusText.textContent = `System: ${upCount}/${totalCount} Services`;
  }

  // Update overall status indicator color
  const overallIndicator = footerContainer.querySelector('.status-indicator');
  if (overallIndicator) {
    // Remove old status classes
    overallIndicator.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-gray-500');
    
    // Determine overall status color
    let statusClass = 'bg-gray-500'; // default
    if (upCount === totalCount) {
      statusClass = 'bg-green-500';
    } else if (upCount >= totalCount * 0.5) {
      statusClass = 'bg-yellow-500';
    } else {
      statusClass = 'bg-red-500';
    }
    
    overallIndicator.classList.add(statusClass);
  }

  Object.entries(services).forEach(([serviceName, result]) => {
    if (!result) return;
    
    const serviceElement = footerContainer.querySelector(`[data-service="${serviceName}"]`);
    if (!serviceElement) return;

    // Update individual service status indicator
    const indicator = serviceElement.querySelector('.status-indicator');
    if (indicator) {
      // Remove old status classes
      indicator.classList.remove('bg-green-400', 'bg-yellow-400', 'bg-red-400', 'bg-orange-400');
      
      // Add new status class
      const colorClass = getStatusColor(result.status);
      indicator.classList.add(colorClass);
    }

    // Update service tooltip status text
    const statusText = serviceElement.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = result.status.toUpperCase();
    }

    // Update metrics if available
    const metricsText = serviceElement.querySelector('.metrics-text');
    if (metricsText && result.metrics?.responseTime) {
      metricsText.textContent = ` | Response: ${result.metrics.responseTime}ms`;
    }
  });

  // Update footer timestamp with timezone info for better clarity
  const footerTimestamp = footerContainer.querySelector('.timestamp');
  if (footerTimestamp) {
    const now = new Date();
    const timeString = now.toLocaleTimeString(undefined, { 
      hour12: true, 
      timeZoneName: 'short' 
    });
    footerTimestamp.textContent = `Updated: ${timeString}`;
  }
}

function updateHealthCards(services: ServiceStatuses) {
  console.log('🔍 updateHealthCards: Function called with services:', services);
  
  // Map logical service names to actual DOM element prefixes
  const serviceNameMapping: Record<string, string> = {
    frontend: 'frontend',
    backend: 'backend', 
    database: 'postgres',  // database service uses postgres- prefixed IDs
    cache: 'redis'         // cache service uses redis- prefixed IDs
  };

  const serviceEntries = Object.entries(services);
  console.log('🔍 updateHealthCards: Service entries:', serviceEntries.length, serviceEntries.map(([name, result]) => ({name, hasResult: !!result})));

  serviceEntries.forEach(([serviceName, result]) => {
    console.log(`🔍 updateHealthCards: Processing ${serviceName}, result:`, !!result);
    if (!result) {
      console.log(`🔍 updateHealthCards: Skipping ${serviceName} - no result`);
      return;
    }
    
    // Skip data-health-card attribute issue - update elements directly by ID
    console.log(`🔍 updateHealthCards: Updating ${serviceName} service details...`);
    
    // Get the correct DOM element prefix for this service
    const domPrefix = serviceNameMapping[serviceName] || serviceName;
    console.log(`🔍 updateHealthCards: Using DOM prefix "${domPrefix}" for service "${serviceName}"`);

    // Update status indicator
    const statusIndicator = document.getElementById(`${domPrefix}-status-indicator`);
    if (statusIndicator) {
      // Remove old status classes
      statusIndicator.classList.remove('bg-green-400', 'bg-yellow-400', 'bg-red-400', 'bg-orange-400', 'animate-pulse');
      
      // Add new status class and remove pulse animation for successful checks
      const colorClass = getStatusColor(result.status);
      statusIndicator.classList.add(colorClass);
      if (result.status === 'up') {
        statusIndicator.classList.remove('animate-pulse');
      }
      console.log(`🔍 updateHealthCards: Updated ${domPrefix}-status-indicator with ${colorClass}`);
    } else {
      console.log(`🔍 updateHealthCards: Status indicator not found for ${domPrefix}-status-indicator`);
    }

    // Update status text message
    const statusText = document.getElementById(`${domPrefix}-status-text`);
    if (statusText) {
      statusText.textContent = result.message;
      console.log(`🔍 updateHealthCards: Updated ${domPrefix}-status-text to "${result.message}"`);
    } else {
      console.log(`🔍 updateHealthCards: Status text not found for ${domPrefix}-status-text`);
    }

    // Update last refreshed timestamp
    const lastRefreshed = document.getElementById(`${domPrefix}-last-refreshed`);
    if (lastRefreshed) {
      const timestamp = new Date(result.timestamp);
      const timeString = timestamp.toLocaleTimeString(undefined, { 
        hour12: true, 
        timeZoneName: 'short' 
      });
      lastRefreshed.textContent = `Last checked: ${timeString}`;
      console.log(`🔍 updateHealthCards: Updated ${domPrefix}-last-refreshed`);
    } else {
      console.log(`🔍 updateHealthCards: Last refreshed not found for ${domPrefix}-last-refreshed`);
    }

    // Update detailed metrics for each service type
    updateDetailedMetrics(serviceName, domPrefix, result);
  });
}

function updateDetailedMetrics(serviceName: string, domPrefix: string, result: IServiceResult) {
  if (!result.metrics) {
    console.log(`🔍 updateDetailedMetrics: No metrics data for ${serviceName}`);
    return;
  }

  console.log(`📊 updateDetailedMetrics: Updating detailed metrics for ${serviceName}:`, result.metrics);

  switch (serviceName) {
    case 'frontend':
      updateFrontendMetrics(result.metrics);
      break;
    case 'backend':
      updateBackendMetrics(result.metrics);
      break;
    case 'database':
      updateDatabaseMetrics(result.metrics);
      break;
    case 'cache':
      updateCacheMetrics(result.metrics);
      break;
  }
}

function updateFrontendMetrics(metrics: any) {
  // Update frontend performance metrics
  const loadTimeElement = document.getElementById('frontend-load-time');
  if (loadTimeElement && metrics.responseTime) {
    loadTimeElement.textContent = `${metrics.responseTime}ms`;
  }

  const memoryElement = document.getElementById('frontend-memory');
  if (memoryElement && metrics.memory) {
    memoryElement.textContent = metrics.memory;
  }

  const frameworkElement = document.getElementById('frontend-framework');
  if (frameworkElement && metrics.framework) {
    frameworkElement.textContent = metrics.framework;
  }

  const portElement = document.getElementById('frontend-port');
  if (portElement && metrics.port) {
    portElement.textContent = metrics.port;
  }

  console.log('✅ Frontend detailed metrics updated');
}

function updateBackendMetrics(metrics: any) {
  // Update backend version and framework info
  const versionElement = document.getElementById('backend-version');
  if (versionElement && metrics.version) {
    versionElement.textContent = metrics.version;
  }

  const frameworkElement = document.getElementById('backend-framework');
  if (frameworkElement && metrics.framework) {
    frameworkElement.textContent = metrics.framework;
  }

  console.log('✅ Backend detailed metrics updated');
}

function updateDatabaseMetrics(metrics: any) {
  // Update PostgreSQL performance stats
  const queryTimeElement = document.getElementById('postgres-query-time');
  if (queryTimeElement && metrics.queryTime) {
    queryTimeElement.textContent = metrics.queryTime;
  }

  const cacheHitElement = document.getElementById('postgres-cache-hit');
  if (cacheHitElement && metrics.cache_hit_ratio) {
    cacheHitElement.textContent = `${metrics.cache_hit_ratio}%`;
  }

  // Update connection stats if available
  const activeConnectionsElement = document.getElementById('active-connections');
  if (activeConnectionsElement && metrics.connections) {
    activeConnectionsElement.textContent = metrics.connections.toString();
  }

  console.log('✅ Database detailed metrics updated');
}

function updateCacheMetrics(metrics: any) {
  // Update Redis cache metrics
  const memoryUsedElement = document.getElementById('redis-memory-used');
  if (memoryUsedElement && metrics.memoryUsed) {
    memoryUsedElement.textContent = metrics.memoryUsed;
  }

  const hitRateElement = document.getElementById('redis-hit-rate');
  if (hitRateElement && metrics.hitRate) {
    hitRateElement.textContent = metrics.hitRate;
  }

  console.log('✅ Cache detailed metrics updated');
}

function updateSummaryStatus(services: ServiceStatuses) {
  // Calculate overall system status from all 4 services
  const serviceList = Object.values(services).filter(Boolean);
  if (serviceList.length === 0) return;
  
  const upCount = serviceList.filter(s => s.status === 'up').length;
  const downCount = serviceList.filter(s => s.status === 'down' || s.status === 'error').length;
  const totalCount = 4; // Always 4 services (frontend, backend, database, cache)
  
  // Determine overall status
  let overallStatus: string;
  let statusColor: string;
  let statusIcon: string;
  let statusSummary: string;
  
  if (upCount === 3 && serviceList.length >= 3) {
    // All supporting services are up - use consistent messaging
    overallStatus = 'up';
    statusColor = 'bg-green-500';
    statusIcon = 'All Systems Live';
    statusSummary = 'Four services running normally';
  } else if (downCount >= 2) {
    overallStatus = 'down';
    statusColor = 'bg-red-500';
    statusIcon = 'Service Error';
    statusSummary = 'Check service cards for more information';
  } else if (downCount >= 1) {
    overallStatus = 'degraded';
    statusColor = 'bg-yellow-500';
    statusIcon = 'Service Error';
    statusSummary = 'Check service cards for more information';
  } else {
    overallStatus = 'up';
    statusColor = 'bg-green-500';
    statusIcon = 'All Systems Live';
    statusSummary = 'Four services running normally';
  }
  
  // Update summary elements if they exist (test-health page)
  const statusIndicator = document.getElementById('overall-status-indicator');
  const statusText = document.getElementById('overall-status-text');
  const statusSummaryElement = document.getElementById('overall-status-summary');
  const lastChecked = document.getElementById('overall-last-checked');
  
  if (statusIndicator) {
    statusIndicator.className = `w-4 h-4 rounded-full ${statusColor}`;
  }
  
  if (statusText) {
    statusText.textContent = statusIcon;
  }
  
  if (statusSummaryElement) {
    statusSummaryElement.textContent = statusSummary;
  }
  
  if (lastChecked) {
    const now = new Date();
    const timeString = now.toLocaleTimeString(undefined, { 
      hour12: true, 
      timeZoneName: 'short' 
    });
    lastChecked.textContent = `Last Checked at: ${timeString}`;
  }
}

// =============================================================================
// OVERALL STATUS CALCULATION (SINGLE SOURCE OF TRUTH)
// =============================================================================
function calculateOverallStatus(services: ServiceStatuses) {
  const serviceList = Object.values(services).filter(Boolean);
  if (serviceList.length === 0) {
    return {
      status: 'degraded',
      text: 'Loading...',
      summary: 'Services starting up',
      color: 'bg-gray-500 animate-pulse'
    };
  }
  
  const upCount = serviceList.filter(s => s.status === 'up').length;
  const downCount = serviceList.filter(s => s.status === 'down' || s.status === 'error').length;
  
  if (upCount >= 3 && serviceList.length >= 3) {
    return {
      status: 'up',
      text: 'All Systems Live',
      summary: 'Four services running normally',
      color: 'bg-green-500'
    };
  } else if (downCount >= 2) {
    return {
      status: 'down',
      text: 'Service Error',
      summary: 'Check service cards for more information',
      color: 'bg-red-500'
    };
  } else if (downCount >= 1) {
    return {
      status: 'degraded',
      text: 'Service Error',
      summary: 'Check service cards for more information',
      color: 'bg-yellow-500'
    };
  } else {
    return {
      status: 'up',
      text: 'All Systems Live',
      summary: 'Four services running normally',
      color: 'bg-green-500'
    };
  }
}

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================
function initializeLoadingStates() {
  console.log('🔄 RealtimeHealthEnhancer: Setting initial loading states');
  
  // Set loading states for all service cards (like original individual scripts)
  const services = ['frontend', 'backend', 'postgres', 'redis'];
  
  services.forEach(service => {
    // Set status text to "Checking..." initially
    const statusText = document.getElementById(`${service}-status-text`);
    if (statusText) {
      statusText.textContent = 'Checking...';
    }
    
    // Set last refreshed to "Initializing..."
    const lastRefreshed = document.getElementById(`${service}-last-refreshed`);
    if (lastRefreshed) {
      lastRefreshed.textContent = 'Last checked: Initializing...';
    }
  });
  
  // Set loading states for specific metrics (like original scripts)
  const queryTimeElement = document.getElementById('postgres-query-time');
  if (queryTimeElement) {
    queryTimeElement.textContent = 'CALCULATING...';
    queryTimeElement.className = 'text-blue-400';
  }
  
  const cacheHitElement = document.getElementById('postgres-cache-hit');
  if (cacheHitElement) {
    cacheHitElement.textContent = 'CALCULATING...';
    cacheHitElement.className = 'text-blue-400';
  }
  
  const memoryElement = document.getElementById('redis-memory-used');
  if (memoryElement) {
    memoryElement.textContent = 'CALCULATING...';
  }
  
  const hitRateElement = document.getElementById('redis-hit-rate');
  if (hitRateElement) {
    hitRateElement.textContent = 'CALCULATING...';
  }
  
  console.log('✅ Initial loading states set for all service cards');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
function getStatusColor(status: string): string {
  switch (status) {
    case 'up': return 'bg-green-400';
    case 'degraded': return 'bg-yellow-400';
    case 'down': return 'bg-red-400';
    case 'error': return 'bg-orange-400';
    default: return 'bg-gray-400';
  }
}

function getStatusBorderClass(status: string): string {
  switch (status) {
    case 'up': return 'border-green-500';
    case 'degraded': return 'border-yellow-500';
    case 'down': return 'border-red-500';
    case 'error': return 'border-orange-500';
    default: return 'border-gray-500';
  }
}

function getStatusBgClass(status: string): string {
  switch (status) {
    case 'up': return 'bg-green-500/5';
    case 'degraded': return 'bg-yellow-500/5';
    case 'down': return 'bg-red-500/5';
    case 'error': return 'bg-orange-500/5';
    default: return 'bg-gray-500/5';
  }
}

export default RealtimeHealthEnhancer;