// =============================================================================
// EVENT-DRIVEN FOOTER STATUS COMPONENT
// Listens to consolidatedHealthUpdate events instead of making API calls
// =============================================================================

import { useState, useEffect } from 'react';
import type { IServiceResult } from '../../utils/serviceCheckers.js';
import { formatTimestamp, onTimezoneChange } from '../../utils/timezone.js';

interface ServiceStatuses {
  frontend: IServiceResult | null;
  backend: IServiceResult | null;
  database: IServiceResult | null;
  cache: IServiceResult | null;
}

interface FooterStatusData {
  services: ServiceStatuses;
  overallStatus: {
    status: string;
    text: string;
    summary: string;
    color: string;
  };
  timestamp: number;
  upCount: number;
  totalCount: number;
}

export const EventDrivenFooterStatus: React.FC = () => {
  const [statusData, setStatusData] = useState<FooterStatusData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastUpdateFormatted, setLastUpdateFormatted] = useState<string>('Loading...');

  useEffect(() => {
    const handleHealthUpdate = (event: CustomEvent) => {
      console.log('🏁 EventDrivenFooterStatus: Received consolidatedHealthUpdate', event.detail);

      const { services, overallStatus, timestamp } = event.detail;

      // Calculate service counts
      const serviceList = Object.values(services).filter(Boolean);
      const upCount = serviceList.filter((s: any) => s.status === 'up').length;
      const totalCount = 4;

      setStatusData({
        services,
        overallStatus,
        timestamp,
        upCount,
        totalCount
      });

      const now = new Date();
      setLastUpdate(now);
      setLastUpdateFormatted(formatTimestamp(now));
    };

    // Listen for health updates
    window.addEventListener('consolidatedHealthUpdate', handleHealthUpdate);

    // Listen for timezone changes
    const cleanupTimezoneListener = onTimezoneChange(() => {
      if (lastUpdate) {
        setLastUpdateFormatted(formatTimestamp(lastUpdate));
      }
    });

    console.log('🏁 EventDrivenFooterStatus: Event listeners attached');

    return () => {
      window.removeEventListener('consolidatedHealthUpdate', handleHealthUpdate);
      cleanupTimezoneListener();
    };
  }, [lastUpdate]);

  if (!statusData) {
    return (
      <div className="flex items-center space-x-4 footer-health-status">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>
          <span className="text-white/80 text-sm font-medium">
            Loading system status...
          </span>
        </div>
      </div>
    );
  }

  const { services, overallStatus, upCount, totalCount } = statusData;

  // Service mappings for display
  const serviceDisplay = [
    { key: 'frontend', name: 'Frontend', icon: '🌐', service: services.frontend },
    { key: 'backend', name: 'Backend', icon: '🔧', service: services.backend },
    { key: 'database', name: 'Database', icon: '🐘', service: services.database },
    { key: 'cache', name: 'Cache', icon: '⚡', service: services.cache }
  ];

  // Get status color class
  const getStatusColorClass = (status: string): string => {
    switch (status) {
      case 'up': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center space-x-4 footer-health-status" data-component="health-status">
      {/* Overall Status */}
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full status-indicator ${getStatusColorClass(overallStatus.status)}`}
          data-status={overallStatus.status}
        />
        <span className="text-white/80 text-sm font-medium status-text" id="overall-status-text">
          System: {upCount}/{totalCount} Services
        </span>
      </div>

      {/* Individual Service Indicators */}
      <div className="flex items-center space-x-2">
        {serviceDisplay.map((item, index) => {
          const { key, name, icon, service } = item;

          if (!service) {
            return (
              <div key={key} className="flex items-center space-x-1 group relative">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
              </div>
            );
          }

          const responseTime = service.metrics?.responseTime;
          const formattedTime = typeof responseTime === 'number' ?
            `${responseTime}ms` :
            (typeof responseTime === 'string' ? responseTime : 'N/A');

          return (
            <div
              key={key}
              className="flex items-center space-x-1 group relative"
              data-service={name.toLowerCase()}
              data-service-index={index}
            >
              <div
                className={`w-2 h-2 rounded-full status-indicator ${getStatusColorClass(service.status)}`}
                data-status={service.status}
              />

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1
                              bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100
                              transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <span className="service-tooltip">
                  {icon} {name}: <span className="status-text">{service.status.toUpperCase()}</span>
                  <span className="metrics-text"> | Response: {formattedTime}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Update Time */}
      <div className="text-white/50 text-xs timestamp" id="overall-status-timestamp">
        Updated: {lastUpdateFormatted}
      </div>
    </div>
  );
};