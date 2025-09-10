// =============================================================================
// REDIS CACHE SERVICE METRICS - DRY/SOLID IMPLEMENTATION  
// =============================================================================
// Single Responsibility: Update Redis cache service metrics after health check
// Following same efficient pattern as frontend, backend, and PostgreSQL metrics
// =============================================================================

import { CacheServiceChecker } from '../utils/serviceCheckers.js';

interface RedisMetrics {
  version: string;
  mode: string;
  memoryUsed: string;
  hitRate: string;
  backend: string;
  uptime: string;
  connectedClients: number;
  configStatus: string;
}

class RedisMetricsUpdater {
  private static instance: RedisMetricsUpdater;
  
  static getInstance(): RedisMetricsUpdater {
    if (!RedisMetricsUpdater.instance) {
      RedisMetricsUpdater.instance = new RedisMetricsUpdater();
    }
    return RedisMetricsUpdater.instance;
  }

  async updateRedisMetrics(): Promise<void> {
    console.log('🔴 Updating Redis cache service metrics...');
    
    try {
      // Get health data from Redis via backend
      const healthResult = await CacheServiceChecker.checkHealth();
      
      // Prepare metrics using build-time efficiency for static data
      const metrics: RedisMetrics = {
        version: healthResult.metrics.version || '7.4.5',
        mode: healthResult.metrics.mode || 'Standalone',
        memoryUsed: healthResult.metrics.memory_used || 'Unknown',
        hitRate: healthResult.metrics.hit_rate || 'Unknown',
        backend: healthResult.metrics.backend || 'Redis',
        uptime: healthResult.metrics.uptime || 'Unknown',
        connectedClients: healthResult.metrics.connected_clients || 0,
        configStatus: healthResult.status === 'up' ? 'Configuration OK' : 'Configuration Failed'
      };

      // Update service info using DRY utilities
      this.updateCacheInfo(metrics);
      
      // Update performance metrics
      this.updatePerformanceMetrics(metrics);
      
      // Update configuration status
      this.updateConfigStatus(metrics);
      
      // Update overall service status
      this.updateServiceStatus(healthResult.status, healthResult.message);
      
      console.log('✅ Redis cache metrics updated successfully', metrics);
      
    } catch (error) {
      console.error('❌ Failed to update Redis cache metrics:', error);
      this.updateServiceStatus('error', 'Failed to fetch cache metrics');
    }
  }

  // SOLID: Single Responsibility - Cache info updates (direct DOM like other services)
  private updateCacheInfo(metrics: RedisMetrics): void {
    // Update version (make it dynamic instead of hardcoded)
    const versionElement = document.querySelector('[data-redis-version]') as HTMLElement;
    if (versionElement) {
      versionElement.textContent = metrics.version;
    }

    // Update mode
    const modeElement = document.getElementById('redis-mode');
    if (modeElement) {
      modeElement.textContent = metrics.mode;
    }

    // Update backend type if available
    const backendElement = document.getElementById('redis-backend');
    if (backendElement) {
      backendElement.textContent = metrics.backend;
    }

    // Update uptime if element exists
    const uptimeElement = document.getElementById('redis-uptime');
    if (uptimeElement) {
      uptimeElement.textContent = metrics.uptime;
    }
  }

  // SOLID: Single Responsibility - Performance metrics updates
  private updatePerformanceMetrics(metrics: RedisMetrics): void {
    // Update memory used
    const memoryElement = document.getElementById('redis-memory-used');
    if (memoryElement) {
      memoryElement.textContent = metrics.memoryUsed;
    }

    // Update hit rate
    const hitRateElement = document.getElementById('redis-hit-rate');
    if (hitRateElement) {
      hitRateElement.textContent = metrics.hitRate;
    }

    // Update connected clients if element exists
    const clientsElement = document.getElementById('redis-connected-clients');
    if (clientsElement) {
      clientsElement.textContent = String(metrics.connectedClients);
    }
  }

  // SOLID: Single Responsibility - Configuration status updates
  private updateConfigStatus(metrics: RedisMetrics): void {
    const configElement = document.getElementById('redis-config-test');
    if (configElement) {
      const { icon, text, className } = this.getConfigDisplay(metrics.configStatus);
      configElement.textContent = `${icon} ${text}`;
      configElement.className = className;
    }
  }

  // SOLID: Single Responsibility - Service status updates (direct DOM like other services)
  private updateServiceStatus(status: string, message: string): void {
    const statusIndicator = document.getElementById('redis-status-indicator');
    if (statusIndicator) {
      const { color } = this.getStatusStyling(status);
      statusIndicator.className = `w-3 h-3 rounded-full ${color}`;
    }
    
    const statusText = document.getElementById('redis-status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // DRY: Configuration display formatting
  private getConfigDisplay(configStatus: string): { icon: string; text: string; className: string } {
    if (configStatus.includes('OK')) {
      return {
        icon: '✅',
        text: 'Configuration OK',
        className: 'text-green-400'
      };
    } else {
      return {
        icon: '❌',
        text: 'Configuration Failed',
        className: 'text-red-400'
      };
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

  // Handle hardcoded Redis info in HTML
  private updateHardcodedElements(): void {
    // Check if version is hardcoded and update
    const hardcodedVersion = document.querySelector('[data-hardcoded="redis-version"]');
    if (hardcodedVersion) {
      // Will be updated by updateCacheInfo method with dynamic value
    }
  }
}

// Auto-initialize when script loads (following same pattern as other services)
if (typeof window !== 'undefined') {
  const updater = RedisMetricsUpdater.getInstance();
  
  console.log('🔴 Redis cache metrics script loaded');
  
  // Initial update after page load
  if (document.readyState === 'complete') {
    console.log('📊 Document ready - updating Redis cache metrics immediately');
    updater.updateRedisMetrics();
  } else {
    console.log('⏳ Waiting for page load');
    window.addEventListener('load', () => {
      console.log('📊 Page loaded - updating Redis cache metrics now');
      updater.updateRedisMetrics();
    });
  }
  
  // Set up periodic updates (every 30 seconds for dynamic data)
  setInterval(() => {
    console.log('🔄 Periodic Redis cache metrics update');
    updater.updateRedisMetrics();
  }, 30000);
}

export default RedisMetricsUpdater;