// =============================================================================
// HYBRID APPROACH: SERVER ISLANDS + REAL-TIME REACT POLLING
// Enhances existing Server Islands with optional real-time updates
// =============================================================================

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
  backend?: IServiceResult | null;
  database?: IServiceResult | null;
  cache?: IServiceResult | null;
}

export const RealtimeHealthEnhancer: React.FC<RealtimeHealthEnhancerProps> = ({
  enabled = true,
  showIndicator = true,
  refreshInterval
}) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Use our modern polling hooks
  const { backend, database, cache, isPolling, isVisible } = useAllServicesPolling(enabled);

  // Update DOM elements when we get new data (hybrid enhancement)
  useEffect(() => {
    if (!backend && !database && !cache) return;

    // Skip initial load (Server Islands already rendered)
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    updateDOMElements({ backend, database, cache });
    setLastUpdate(new Date());
  }, [backend, database, cache, isInitialLoad]);

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
                {lastUpdate.toLocaleTimeString()}
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
  // Update footer compact status
  updateFooterStatus(services);
  
  // Update detailed health cards if on test-health page
  updateHealthCards(services);
  
  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent('healthStatusUpdated', { 
    detail: services 
  }));
}

function updateFooterStatus(services: ServiceStatuses) {
  // Find footer health status elements
  const footerContainer = document.querySelector('.footer-health-status');
  if (!footerContainer) return;

  Object.entries(services).forEach(([serviceName, result]) => {
    if (!result) return;
    
    const serviceElement = footerContainer.querySelector(`[data-service="${serviceName}"]`);
    if (!serviceElement) return;

    // Update status indicator
    const indicator = serviceElement.querySelector('.status-indicator');
    if (indicator) {
      // Remove old status classes
      indicator.classList.remove('bg-green-400', 'bg-yellow-400', 'bg-red-400', 'bg-orange-400');
      
      // Add new status class
      const colorClass = getStatusColor(result.status);
      indicator.classList.add(colorClass);
    }

    // Update status text
    const statusText = serviceElement.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = result.message;
    }

    // Update metrics if available
    const metricsText = serviceElement.querySelector('.metrics-text');
    if (metricsText && result.metrics?.responseTime) {
      metricsText.textContent = `${result.metrics.responseTime}ms`;
    }
  });
}

function updateHealthCards(services: ServiceStatuses) {
  Object.entries(services).forEach(([serviceName, result]) => {
    if (!result) return;
    
    const cardElement = document.querySelector(`[data-health-card="${serviceName}"]`);
    if (!cardElement) return;

    // Update card border and background
    const card = cardElement.querySelector('.glass-card');
    if (card) {
      // Remove old border classes
      card.classList.remove('border-green-500', 'border-yellow-500', 'border-red-500', 'border-orange-500');
      card.classList.remove('bg-green-500/5', 'bg-yellow-500/5', 'bg-red-500/5', 'bg-orange-500/5');
      
      // Add new classes based on status
      const borderClass = getStatusBorderClass(result.status);
      const bgClass = getStatusBgClass(result.status);
      card.classList.add(borderClass, bgClass);
    }

    // Update status message
    const messageElement = cardElement.querySelector('.status-message');
    if (messageElement) {
      messageElement.textContent = result.message;
    }

    // Update response time
    const responseTimeElement = cardElement.querySelector('.response-time');
    if (responseTimeElement && result.metrics?.responseTime) {
      responseTimeElement.textContent = `${result.metrics.responseTime}ms`;
    }

    // Update timestamp
    const timestampElement = cardElement.querySelector('.timestamp');
    if (timestampElement) {
      timestampElement.textContent = new Date(result.timestamp).toLocaleTimeString();
    }
  });
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