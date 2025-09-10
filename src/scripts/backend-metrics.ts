// =============================================================================
// BACKEND SERVICE METRICS - DRY/SOLID IMPLEMENTATION  
// =============================================================================
// Single Responsibility: Update backend service metrics after health check
// Following same efficient pattern as frontend metrics (direct DOM manipulation)
// =============================================================================

import { BackendServiceChecker } from '../utils/serviceCheckers.js';

interface BackendMetrics {
  framework: string;
  version: string;
  monitoring: Record<string, string>;
}

class BackendMetricsUpdater {
  private static instance: BackendMetricsUpdater;
  
  static getInstance(): BackendMetricsUpdater {
    if (!BackendMetricsUpdater.instance) {
      BackendMetricsUpdater.instance = new BackendMetricsUpdater();
    }
    return BackendMetricsUpdater.instance;
  }

  async updateBackendMetrics(): Promise<void> {
    console.log('🔧 Updating backend service metrics...');
    
    try {
      // Get health data from backend
      const healthResult = await BackendServiceChecker.checkHealth();
      
      // DEBUG: Log what we're actually getting from the backend
      console.log('🔍 Backend health data received:', healthResult);
      console.log('🔍 Backend metrics data:', healthResult.metrics);
      
      // Prepare metrics using build-time efficiency for static data
      const metrics: BackendMetrics = {
        framework: BackendServiceChecker.getFrameworkInfo(), // Build-time efficiency
        version: healthResult.metrics.version || import.meta.env.VITE_BACKEND_VERSION || '1.0.0',
        monitoring: healthResult.metrics.monitoring || {}
      };

      // Update service info using DRY utilities
      this.updateServiceInfo(metrics);
      
      // Update component statuses using DRY utilities
      this.updateComponentStatuses(metrics.monitoring, healthResult.status);
      
      // Update overall service status
      this.updateServiceStatus(healthResult.status, healthResult.message);
      
      console.log('✅ Backend metrics updated successfully', metrics);
      
      // NEW: Emit completion event for header aggregation (DRY + Single Source of Truth)
      this.emitServiceCardCompleteEvent(healthResult);
      
    } catch (error) {
      console.error('❌ Failed to update backend metrics:', error);
      this.updateServiceStatus('error', 'Failed to fetch metrics');
    }
  }

  // SOLID: Single Responsibility - Service info updates (direct DOM like frontend)
  private updateServiceInfo(metrics: BackendMetrics): void {
    // Update framework (build-time efficiency)
    const frameworkElement = document.getElementById('backend-framework');
    if (frameworkElement) {
      frameworkElement.textContent = metrics.framework;
    }

    // Update version  
    const versionElement = document.getElementById('backend-version');
    if (versionElement) {
      versionElement.textContent = metrics.version;
    }
  }

  // SOLID: Single Responsibility - Component status updates using DRY principles
  private updateComponentStatuses(monitoring: Record<string, string>, overallStatus: string): void {
    console.log('🔍 Backend monitoring data:', monitoring); // DEBUG
    console.log('🔍 Overall backend status:', overallStatus); // DEBUG
    
    // DRY: Define component mapping to eliminate repetition
    const components = [
      { id: 'backend-observability', key: 'observabilityManager', name: 'Observability Manager' },
      { id: 'backend-metrics', key: 'metricsCollector', name: 'Metrics Collector' },
      { id: 'backend-health-checker', key: 'healthChecker', name: 'Health Checker' },
      { id: 'backend-alert-manager', key: 'alertManager', name: 'Alert Manager' },
      { id: 'backend-performance', key: 'performanceMonitor', name: 'Performance Monitor' }
    ];
    
    // Since backend doesn't provide individual component monitoring,
    // use overall backend status for all components when service is healthy
    const defaultComponentStatus = overallStatus === 'up' ? 'healthy' : 'down';
    
    // DRY: Single loop instead of 5 repeated calls
    components.forEach(component => {
      const status = monitoring[component.key] || defaultComponentStatus;
      this.updateComponentElement(component.id, status, overallStatus, component.name);
    });
  }

  // DRY: Reusable component update method
  private updateComponentElement(elementId: string, status: string, overallStatus: string, componentName: string): void {
    console.log(`🔍 Updating component ${elementId}: status="${status}", overall="${overallStatus}", name="${componentName}"`); // DEBUG
    
    const element = document.getElementById(elementId);
    if (element) {
      const { icon, text, className } = this.getComponentDisplay(status, overallStatus, componentName);
      console.log(`🔍 Component ${elementId} display: icon="${icon}", text="${text}", className="${className}"`); // DEBUG
      element.textContent = `${icon} ${text}`;
      element.className = className;
    }
  }

  // SOLID: Single Responsibility - Status display formatting
  private getComponentDisplay(status: string, overallStatus: string, componentName: string): { icon: string; text: string; className: string } {
    // If overall service is down, show all components as unavailable
    if (overallStatus === 'down' || overallStatus === 'error') {
      return {
        icon: '❌',
        text: componentName + ' (Service Down)',
        className: 'text-red-400'
      };
    }

    switch (status) {
      case 'healthy':
      case 'up':
        return {
          icon: '✅',
          text: componentName + ' (Healthy)',
          className: 'text-green-400'
        };
      case 'degraded':
        return {
          icon: '⚠️',
          text: componentName + ' (Degraded)', 
          className: 'text-yellow-400'
        };
      case 'down':
      case 'error':
        return {
          icon: '❌',
          text: componentName + ' (Down)',
          className: 'text-red-400'
        };
      default:
        return {
          icon: '⏳',
          text: componentName + ' (Checking...)',
          className: 'text-gray-400'
        };
    }
  }


  // SOLID: Single Responsibility - Service status updates (direct DOM like frontend)
  private updateServiceStatus(status: string, message: string): void {
    const statusIndicator = document.getElementById('backend-status-indicator');
    if (statusIndicator) {
      const { color } = this.getStatusStyling(status);
      statusIndicator.className = `w-3 h-3 rounded-full ${color}`;
    }
    
    const statusText = document.getElementById('backend-status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // DRY: Status styling mapping
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

  // Handle hardcoded framework in HTML
  private updateFrameworkInfo(framework: string): void {
    // Check if framework is hardcoded in HTML and update if needed
    const frameworkElements = document.querySelectorAll('[data-framework="backend"]');
    frameworkElements.forEach(element => {
      if (element.textContent?.includes('FastAPI')) {
        element.textContent = framework;
      }
    });
  }

  // NEW: Emit completion event for header aggregation (DRY + Single Source of Truth)
  private emitServiceCardCompleteEvent(healthResult: any): void {
    const event = new CustomEvent('serviceCardComplete', {
      detail: {
        serviceName: 'backend',
        result: {
          status: healthResult.status,
          message: healthResult.message,
          metrics: healthResult.metrics,
          timestamp: Date.now()
        }
      }
    });
    
    console.log('📡 Backend card emitting completion event:', event.detail);
    window.dispatchEvent(event);
  }
}

// Auto-initialize when script loads (following same pattern as frontend)
if (typeof window !== 'undefined') {
  const updater = BackendMetricsUpdater.getInstance();
  
  console.log('🔧 Backend metrics script loaded');
  
  // Initial update after page load
  if (document.readyState === 'complete') {
    console.log('📊 Document ready - updating backend metrics immediately');
    updater.updateBackendMetrics();
  } else {
    console.log('⏳ Waiting for page load');
    window.addEventListener('load', () => {
      console.log('📊 Page loaded - updating backend metrics now');
      updater.updateBackendMetrics();
    });
  }
  
  // Set up periodic updates (every 1 minute for dynamic data)
  setInterval(() => {
    console.log('🔄 Periodic backend metrics update (1-minute poll)');
    updater.updateBackendMetrics();
  }, 60000);
}

export default BackendMetricsUpdater;