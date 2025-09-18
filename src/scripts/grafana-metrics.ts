// =============================================================================
// GRAFANA DASHBOARD SERVICE METRICS - DRY/SOLID IMPLEMENTATION  
// =============================================================================
// Single Responsibility: Update Grafana dashboard service metrics after health check
// Following same efficient pattern as other services
// =============================================================================

import { GrafanaServiceChecker } from '../utils/serviceCheckers.ts';

interface GrafanaMetrics {
  version: string;
  dashboards: number;
  datasources: number;
  users: number;
  alerts: number;
  plugins: string[];
  uptime: string;
  monitoringPanelStatus: string;
}

class GrafanaMetricsUpdater {
  private static instance: GrafanaMetricsUpdater;
  
  static getInstance(): GrafanaMetricsUpdater {
    if (!GrafanaMetricsUpdater.instance) {
      GrafanaMetricsUpdater.instance = new GrafanaMetricsUpdater();
    }
    return GrafanaMetricsUpdater.instance;
  }

  async updateGrafanaMetrics(): Promise<void> {
    console.log('📈 Updating Grafana dashboard service metrics...');
    
    try {
      // Get health data from Grafana
      const healthResult = await GrafanaServiceChecker.checkHealth();
      
      // Prepare metrics using real Grafana data
      const metrics: GrafanaMetrics = {
        version: String(healthResult.metrics.version || 'Grafana v11.3.0'),
        dashboards: Number(healthResult.metrics.dashboards) || 0,
        datasources: Number(healthResult.metrics.datasources) || 0,
        users: Number(healthResult.metrics.users) || 1,
        alerts: Number(healthResult.metrics.alerts) || 0,
        plugins: Array.isArray(healthResult.metrics.plugins)
          ? healthResult.metrics.plugins
          : ['monitoring-panel', 'worldmap-panel', 'piechart-panel'],
        uptime: String(healthResult.metrics.uptime || 'Active'),
        monitoringPanelStatus: healthResult.status === 'up' ? '✅ Monitoring Panel' : '❌ Monitoring Panel'
      };

      // Update service info using DRY utilities
      this.updateDashboardInfo(metrics);
      
      // Update dashboard status
      this.updateDashboardStatus(metrics);
      
      // Update plugin information
      this.updatePluginInfo(metrics);
      
      // Update overall service status
      this.updateServiceStatus(healthResult.status, healthResult.message);
      
      console.log('✅ Grafana dashboard metrics updated successfully', metrics);
      
      // NEW: Emit completion event for header aggregation (DRY + Single Source of Truth)
      this.emitServiceCardCompleteEvent(healthResult);
      
    } catch (error) {
      console.error('❌ Failed to update Grafana dashboard metrics:', error);
      this.updateServiceStatus('error', 'Failed to fetch dashboard metrics');
    }
  }

  // SOLID: Single Responsibility - Dashboard info updates (direct DOM like other services)
  private updateDashboardInfo(metrics: GrafanaMetrics): void {
    // Update version (make it dynamic instead of hardcoded)
    const versionElement = document.querySelector('[data-grafana-version]') as HTMLElement;
    if (versionElement) {
      versionElement.textContent = metrics.version;
    }

    // Update uptime if element exists
    const uptimeElement = document.getElementById('grafana-uptime');
    if (uptimeElement) {
      uptimeElement.textContent = metrics.uptime;
    }
  }

  // SOLID: Single Responsibility - Dashboard status metrics updates
  private updateDashboardStatus(metrics: GrafanaMetrics): void {
    // Update dashboards count
    const dashboardsElement = document.getElementById('grafana-dashboards');
    if (dashboardsElement) {
      dashboardsElement.textContent = String(metrics.dashboards);
    }

    // Update datasources count
    const datasourcesElement = document.getElementById('grafana-datasources');
    if (datasourcesElement) {
      datasourcesElement.textContent = String(metrics.datasources);
    }

    // Update users count
    const usersElement = document.getElementById('grafana-users');
    if (usersElement) {
      usersElement.textContent = String(metrics.users);
    }

    // Update alerts count
    const alertsElement = document.getElementById('grafana-alerts');
    if (alertsElement) {
      alertsElement.textContent = String(metrics.alerts);
    }
  }

  // SOLID: Single Responsibility - Plugin information updates
  private updatePluginInfo(metrics: GrafanaMetrics): void {
    // Update monitoring panel status
    const monitoringPanelElement = document.getElementById('grafana-monitoring-panel');
    if (monitoringPanelElement) {
      const { icon, text, className } = this.getPluginDisplay(metrics.monitoringPanelStatus);
      monitoringPanelElement.textContent = `${icon} ${text}`;
      monitoringPanelElement.className = className;
    }

    // Update additional plugins if container exists
    const pluginContainer = document.getElementById('grafana-plugins-list');
    if (pluginContainer && metrics.plugins.length > 1) {
      const additionalPlugins = metrics.plugins.slice(1); // Skip monitoring panel
      pluginContainer.innerHTML = additionalPlugins
        .map(plugin => `<div class="text-xs text-green-400">✅ ${this.formatPluginName(plugin)}</div>`)
        .join('');
    }
  }

  // SOLID: Single Responsibility - Service status updates (direct DOM like other services)
  private updateServiceStatus(status: string, message: string): void {
    const statusIndicator = document.getElementById('grafana-status-indicator');
    if (statusIndicator) {
      const { color } = this.getStatusStyling(status);
      statusIndicator.className = `w-3 h-3 rounded-full ${color}`;
    }
    
    const statusText = document.getElementById('grafana-status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // DRY: Plugin display formatting
  private getPluginDisplay(pluginStatus: string): { icon: string; text: string; className: string } {
    return {
      icon: '🔍',
      text: pluginStatus,
      className: 'text-blue-400'
    };
  }

  // DRY: Format plugin names
  private formatPluginName(pluginKey: string): string {
    return pluginKey
      .replace(/[-_]/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\b\w/g, str => str.toUpperCase())
      .trim();
  }

  // DRY: Status styling mapping (same as other services)
  private getStatusStyling(status: string): { color: string; className: string } {
    switch (status) {
      case 'up':
      case 'healthy':
        return { color: 'bg-green-500', className: 'text-green-400' };
      case 'degraded':
        return { color: 'bg-yellow-500', className: 'text-yellow-400' };
      case 'down':
      case 'error':
        return { color: 'bg-red-500', className: 'text-red-400' };
      default:
        return { color: 'bg-gray-500 animate-pulse', className: 'text-gray-400' };
    }
  }

  // Handle hardcoded Grafana info in HTML
  // Note: Method reserved for future hardcoded element updates

  // NEW: Emit completion event for header aggregation (DRY + Single Source of Truth)
  private emitServiceCardCompleteEvent(healthResult: any): void {
    const event = new CustomEvent('serviceCardComplete', {
      detail: {
        serviceName: 'grafana',
        result: {
          status: healthResult.status,
          message: healthResult.message,
          metrics: healthResult.metrics,
          timestamp: Date.now()
        }
      }
    });
    
    console.log('📡 Grafana card emitting completion event:', event.detail);
    window.dispatchEvent(event);
  }
}

// Auto-initialize when script loads (following same pattern as other services)
if (typeof window !== 'undefined') {
  const updater = GrafanaMetricsUpdater.getInstance();
  
  console.log('📈 Grafana dashboard metrics script loaded');
  
  // Initial update after page load
  if (document.readyState === 'complete') {
    console.log('📊 Document ready - updating Grafana dashboard metrics immediately');
    updater.updateGrafanaMetrics();
  } else {
    console.log('⏳ Waiting for page load');
    window.addEventListener('load', () => {
      console.log('📊 Page loaded - updating Grafana dashboard metrics now');
      updater.updateGrafanaMetrics();
    });
  }
  
  // Set up periodic updates (every 1 minute for dynamic data)
  setInterval(() => {
    console.log('🔄 Periodic Grafana dashboard metrics update (1-minute poll)');
    updater.updateGrafanaMetrics();
  }, 60000);
}

export default GrafanaMetricsUpdater;