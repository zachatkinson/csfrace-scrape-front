// =============================================================================
// EVENT-DRIVEN HEALTH CARD COMPONENT
// Listens to consolidatedHealthUpdate events and updates specific service data
// =============================================================================

import { useState, useEffect } from 'react';
import { getStatusColor, getStatusBorderClass } from './RealtimeHealthEnhancer.js';
import type { IServiceResult } from '../../utils/serviceCheckers.js';
import { formatTimestamp, onTimezoneChange } from '../../utils/timezone.js';

interface EventDrivenHealthCardProps {
  serviceName: 'frontend' | 'backend' | 'database' | 'cache';
  domPrefix: string; // e.g., 'frontend', 'backend', 'postgres', 'redis'
  title: string;
  icon: string;
  description: string;
}

export const EventDrivenHealthCard: React.FC<EventDrivenHealthCardProps> = ({
  serviceName,
  domPrefix,
  title,
  icon,
  description
}) => {
  const [serviceData, setServiceData] = useState<IServiceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [lastRefreshedFormatted, setLastRefreshedFormatted] = useState<string>('Loading...');

  useEffect(() => {
    const handleHealthUpdate = (event: CustomEvent) => {
      console.log(`🔧 EventDrivenHealthCard (${serviceName}): Received consolidatedHealthUpdate`);

      const { services } = event.detail;
      const serviceResult = services[serviceName];

      if (serviceResult) {
        console.log(`🔧 EventDrivenHealthCard (${serviceName}): Updating with data:`, serviceResult);
        setServiceData(serviceResult);
        setIsLoading(false);

        const now = new Date();
        setLastRefreshed(now);
        setLastRefreshedFormatted(formatTimestamp(now));

        // Update DOM elements for backward compatibility with existing scripts
        updateDOMElements(serviceResult);
      }
    };

    // Update DOM elements for backward compatibility
    const updateDOMElements = (result: IServiceResult) => {
      // Update status indicator
      const statusIndicator = document.getElementById(`${domPrefix}-status-indicator`);
      if (statusIndicator) {
        const statusClass = getStatusColor(result.status);
        statusIndicator.className = `w-3 h-3 rounded-full ${statusClass}`;
      }

      // Update status text
      const statusText = document.getElementById(`${domPrefix}-status-text`);
      if (statusText) {
        statusText.textContent = result.status.toUpperCase();
      }

      // Update last refreshed
      const lastRefreshedElement = document.getElementById(`${domPrefix}-last-refreshed`);
      if (lastRefreshedElement) {
        lastRefreshedElement.textContent = formatTimestamp();
      }

      // Update detailed metrics based on service type
      updateDetailedMetrics(result);
    };

    const updateDetailedMetrics = (result: IServiceResult) => {
      const { metrics } = result;
      if (!metrics) return;

      // Service-specific metric updates
      switch (serviceName) {
        case 'frontend':
          updateElements({
            [`${domPrefix}-response-time`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-memory-usage`]: metrics.memory?.used || 'N/A',
            [`${domPrefix}-page-load`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-framework`]: metrics.framework?.name || 'React/Astro',
            [`${domPrefix}-version`]: metrics.framework?.version || 'N/A',
            [`${domPrefix}-port`]: metrics.port || window.location.port || '3000'
          });
          break;

        case 'backend':
          updateElements({
            [`${domPrefix}-response-time`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-uptime`]: metrics.uptime || 'N/A',
            [`${domPrefix}-memory`]: metrics.memory || 'N/A',
            [`${domPrefix}-cpu`]: metrics.cpu || 'N/A',
            [`${domPrefix}-version`]: metrics.version || 'N/A'
          });
          break;

        case 'database':
          updateElements({
            [`${domPrefix}-response-time`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-connections`]: metrics.connections || 'N/A',
            [`${domPrefix}-version`]: metrics.version || 'PostgreSQL',
            [`${domPrefix}-status`]: metrics.status || 'Connected'
          });
          break;

        case 'cache':
          updateElements({
            [`${domPrefix}-response-time`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-memory`]: metrics.memory || 'N/A',
            [`${domPrefix}-version`]: metrics.version || 'Redis',
            [`${domPrefix}-connections`]: metrics.connections || 'N/A'
          });
          break;
      }
    };

    const updateElements = (updates: Record<string, string>) => {
      Object.entries(updates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value;
        }
      });
    };

    // Listen for health updates
    window.addEventListener('consolidatedHealthUpdate', handleHealthUpdate);

    // Listen for timezone changes
    const cleanupTimezoneListener = onTimezoneChange(() => {
      if (lastRefreshed) {
        setLastRefreshedFormatted(formatTimestamp(lastRefreshed));
      }
    });

    console.log(`🔧 EventDrivenHealthCard (${serviceName}): Event listeners attached`);

    return () => {
      window.removeEventListener('consolidatedHealthUpdate', handleHealthUpdate);
      cleanupTimezoneListener();
    };
  }, [serviceName, domPrefix, lastRefreshed]);

  // Loading state
  if (isLoading || !serviceData) {
    return (
      <div className={`p-4 border border-gray-200 bg-gray-50 rounded-lg`}>
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="text-gray-600 text-sm font-medium">
            {icon} {title}
          </span>
        </div>
        <p className="text-gray-500 text-sm">Loading {serviceName} status...</p>
      </div>
    );
  }

  // Render with live data
  const statusColorClass = getStatusColor(serviceData.status);
  const borderClass = getStatusBorderClass(serviceData.status);

  return (
    <div className={`p-4 border rounded-lg ${borderClass} bg-white`}>
      <div className="flex items-center space-x-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${statusColorClass}`}></div>
        <span className="text-gray-800 text-sm font-medium">
          {icon} {title}
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          {lastRefreshedFormatted}
        </span>
      </div>

      <div className="text-sm">
        <p className="text-gray-600 mb-2">{description}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">Status:</span>{' '}
            <span className={`${serviceData.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {serviceData.status.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-medium">Response:</span>{' '}
            {serviceData.metrics?.responseTime || 'N/A'}
            {typeof serviceData.metrics?.responseTime === 'number' ? 'ms' : ''}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {serviceData.message}
      </div>
    </div>
  );
};