// =============================================================================
// NANO STORE HEALTH CARD COMPONENT - ASTRO MCP COMPLIANT
// Uses Nano Stores for reactive health data following Astro best practices
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $healthData } from '../../stores/healthStore.ts';
import { getStatusColor, getStatusBorderClass } from '../../utils/health-ui-utilities.ts';
import type { IServiceResult } from '../../utils/serviceCheckers.ts';
import { formatTimestamp, onTimezoneChange } from '/src/utils/timezone.ts';
import { createContextLogger } from '../../utils/logger';

interface EventDrivenHealthCardProps {
  serviceName: 'frontend' | 'backend' | 'database' | 'cache';
  domPrefix: string; // e.g., 'frontend', 'backend', 'postgres', 'redis'
  title: string;
  icon: string;
  description: string;
}

const logger = createContextLogger('EventDrivenHealthCard');

export const EventDrivenHealthCard: React.FC<EventDrivenHealthCardProps> = ({
  serviceName,
  domPrefix,
  title,
  icon,
  description
}) => {
  // Use Nano Stores for reactive health data (Astro MCP best practice)
  const healthData = useStore($healthData);
  const serviceData = healthData.services[serviceName];
  const isLoading = !serviceData;

  const [lastRefreshedFormatted, setLastRefreshedFormatted] = useState<string>('Loading...');

  useEffect(() => {
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
        const timestamp = result.timestamp || Date.now();
        lastRefreshedElement.textContent = formatTimestamp(new Date(timestamp));
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
            [`${domPrefix}-memory-usage`]: String((metrics.memory as Record<string, unknown>)?.used || 'N/A'),
            [`${domPrefix}-page-load`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-framework`]: String((metrics.framework as Record<string, unknown>)?.name || 'React/Astro'),
            [`${domPrefix}-version`]: String((metrics.framework as Record<string, unknown>)?.version || 'N/A'),
            [`${domPrefix}-port`]: String(metrics.port || window.location.port || '3000')
          });
          break;

        case 'backend':
          updateElements({
            [`${domPrefix}-response-time`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-uptime`]: String(metrics.uptime || 'N/A'),
            [`${domPrefix}-memory`]: String(metrics.memory || 'N/A'),
            [`${domPrefix}-cpu`]: String(metrics.cpu || 'N/A'),
            [`${domPrefix}-version`]: String(metrics.version || 'N/A')
          });
          break;

        case 'database':
          updateElements({
            [`${domPrefix}-response-time`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-connections`]: String(metrics.connections || 'N/A'),
            [`${domPrefix}-version`]: String(metrics.version || 'PostgreSQL'),
            [`${domPrefix}-status`]: String(metrics.status || 'Connected')
          });
          break;

        case 'cache':
          updateElements({
            [`${domPrefix}-response-time`]: `${metrics.responseTime || 'N/A'}${typeof metrics.responseTime === 'number' ? 'ms' : ''}`,
            [`${domPrefix}-memory`]: String(metrics.memory || 'N/A'),
            [`${domPrefix}-version`]: String(metrics.version || 'Redis'),
            [`${domPrefix}-connections`]: String(metrics.connections || 'N/A')
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

    // Update formatted timestamp when service data changes
    if (serviceData) {
      logger.info('Using Nano Store data', { serviceName, serviceData });

      const timestamp = serviceData.timestamp || new Date(healthData.metadata.timestamp);
      setLastRefreshedFormatted(formatTimestamp(timestamp));

      // Update DOM elements for backward compatibility with existing scripts
      updateDOMElements(serviceData);
    }

    // Listen for timezone changes
    const cleanupTimezoneListener = onTimezoneChange(() => {
      if (serviceData?.timestamp) {
        setLastRefreshedFormatted(formatTimestamp(serviceData.timestamp));
      }
    });

    logger.info('Using Nano Store reactive data', { serviceName });

    return () => {
      cleanupTimezoneListener();
    };
  }, [serviceData, serviceName, domPrefix, healthData.metadata.timestamp]);

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