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
  totalEntries: number;
  totalOperations: number;
  architecture: string;
  os: string;
}

class RedisMetricsUpdater {
  private static instance: RedisMetricsUpdater;
  private lastGoodHitRate: string | null = null;
  private lastGoodMemoryUsed: string | null = null;
  
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
      
      // DEBUG: Log what we're getting from the backend
      console.log('🔍 Backend response:', {
        hitRate: healthResult.metrics.hitRate,
        memoryUsed: healthResult.metrics.memoryUsed,
        fullHealthResult: healthResult
      });
      
      // Prepare metrics with value preservation logic
      const rawHitRate = healthResult.metrics.hitRate === 'Unknown' ? 'CALCULATING...' : healthResult.metrics.hitRate;
      const rawMemoryUsed = healthResult.metrics.memoryUsed === 'Unknown' ? 'CALCULATING...' : healthResult.metrics.memoryUsed;
      
      console.log('🔍 Raw values before preservation:', {
        rawHitRate,
        rawMemoryUsed,
        lastGoodHitRate: this.lastGoodHitRate,
        lastGoodMemoryUsed: this.lastGoodMemoryUsed
      });
      
      const metrics: RedisMetrics = {
        version: healthResult.metrics.version || '7.4.5',
        mode: healthResult.metrics.mode || 'Standalone',
        memoryUsed: this.getPreservedValue(rawMemoryUsed, this.lastGoodMemoryUsed, 'memoryUsed'),
        hitRate: this.getPreservedValue(rawHitRate, this.lastGoodHitRate, 'hitRate'),
        backend: healthResult.metrics.backend || 'Redis',
        uptime: healthResult.metrics.uptime || 'Unknown',
        connectedClients: healthResult.metrics.connectedClients || 0,
        totalEntries: healthResult.metrics.totalEntries || 0,
        totalOperations: healthResult.metrics.totalOperations || 0,
        architecture: healthResult.metrics.architecture || 'unknown',
        os: healthResult.metrics.os || 'unknown',
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
      
      // NEW: Emit completion event for header aggregation (DRY + Single Source of Truth)
      this.emitServiceCardCompleteEvent(healthResult);
      
    } catch (error) {
      console.error('❌ Failed to update Redis cache metrics:', error);
      this.updateServiceStatus('error', 'Failed to fetch cache metrics');
    }
  }

  // DRY: Value preservation logic to prevent regression from good to bad values
  private getPreservedValue(newValue: string, lastGoodValue: string | null, metricType: 'hitRate' | 'memoryUsed'): string {
    const isMeaningful = this.isMeaningfulValue(newValue, metricType);
    console.log(`🔍 getPreservedValue ${metricType}:`, {
      newValue,
      lastGoodValue,
      isMeaningful,
      decision: isMeaningful ? 'use new' : (lastGoodValue ? 'preserve last good' : 'use new anyway')
    });
    
    // If new value is meaningful (not CALCULATING... and not 0%), use it and store it
    if (isMeaningful) {
      if (metricType === 'hitRate') {
        this.lastGoodHitRate = newValue;
      } else if (metricType === 'memoryUsed') {
        this.lastGoodMemoryUsed = newValue;
      }
      console.log(`✅ Using and storing new ${metricType}: ${newValue}`);
      return newValue;
    }

    // If new value is bad but we have a good stored value, keep the good one
    if (lastGoodValue && this.isMeaningfulValue(lastGoodValue, metricType)) {
      console.log(`🛡️ Preserving last good ${metricType}: ${lastGoodValue} (ignoring: ${newValue})`);
      return lastGoodValue;
    }

    // Otherwise, return the new value (likely CALCULATING...)
    console.log(`📝 Using new ${metricType} (no good value to preserve): ${newValue}`);
    return newValue;
  }

  // Helper to determine if a value is meaningful and should be displayed
  private isMeaningfulValue(value: string, metricType: 'hitRate' | 'memoryUsed'): boolean {
    if (value === 'CALCULATING...' || value === 'Unknown') {
      console.log(`🔍 isMeaningfulValue ${metricType}: "${value}" -> false (loading/unknown state)`);
      return false;
    }

    if (metricType === 'hitRate') {
      // For hit rate, reject "0%" or any zero values
      const isZero = value.match(/^0(\.\d+)?%$/i);
      const result = !isZero;
      console.log(`🔍 isMeaningfulValue ${metricType}: "${value}" -> ${result} (isZero: ${!!isZero})`);
      return result;
    }

    if (metricType === 'memoryUsed') {
      // For memory used, reject "0B" or any zero memory values  
      const isZero = value.match(/^0(\.\d+)?(B|KB|MB|GB)$/i);
      const result = !isZero;
      console.log(`🔍 isMeaningfulValue ${metricType}: "${value}" -> ${result} (isZero: ${!!isZero})`);
      return result;
    }

    console.log(`🔍 isMeaningfulValue ${metricType}: "${value}" -> true (default)`);
    return true;
  }

  // SOLID: Single Responsibility - Cache info updates (direct DOM like other services)
  private updateCacheInfo(metrics: RedisMetrics): void {
    // Update version (make it dynamic instead of hardcoded)
    const versionElement = document.querySelector('[data-redis-version]') as HTMLElement;
    if (versionElement) {
      versionElement.textContent = metrics.version;
    }

    // Update mode and make it blue like other values
    const modeElement = document.getElementById('redis-mode');
    if (modeElement) {
      modeElement.textContent = metrics.mode;
      modeElement.className = 'ml-2 text-blue-400'; // Change from text-white to text-blue-400
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
    // Update memory used with smooth transition
    const memoryElement = document.getElementById('redis-memory-used');
    if (memoryElement) {
      // Add transition class for smooth updates
      memoryElement.style.transition = 'color 0.3s ease, opacity 0.2s ease';
      
      // Debug what's being set in DOM
      console.log(`🔍 DOM Update memoryUsed: "${memoryElement.textContent}" -> "${metrics.memoryUsed}"`);
      
      // Brief opacity transition for loading state changes
      if (memoryElement.textContent === 'CALCULATING...' && metrics.memoryUsed !== 'CALCULATING...') {
        memoryElement.style.opacity = '0.5';
        setTimeout(() => {
          console.log(`🔍 setTimeout DOM Update memoryUsed: -> "${metrics.memoryUsed}"`);
          memoryElement.textContent = metrics.memoryUsed;
          memoryElement.style.opacity = '1';
        }, 150);
      } else {
        memoryElement.textContent = metrics.memoryUsed;
      }
      
      // Color code based on memory usage if meaningful
      if (metrics.memoryUsed !== 'Unknown' && metrics.memoryUsed !== 'CALCULATING...') {
        // Extract numeric value for color coding
        const memoryMatch = metrics.memoryUsed.match(/^(\d+(?:\.\d+)?)(MB|GB|KB)/i);
        if (memoryMatch) {
          const value = parseFloat(memoryMatch[1]);
          const unit = memoryMatch[2].toLowerCase();
          let memoryMB = value;
          
          // Convert to MB for comparison
          if (unit === 'gb') memoryMB = value * 1024;
          if (unit === 'kb') memoryMB = value / 1024;
          
          if (memoryMB <= 50) {
            memoryElement.className = 'text-green-400'; // Low usage: ≤50MB
          } else if (memoryMB <= 200) {
            memoryElement.className = 'text-yellow-400'; // Medium usage: 50-200MB
          } else {
            memoryElement.className = 'text-red-400'; // High usage: >200MB
          }
        } else {
          memoryElement.className = 'text-blue-400'; // Default color
        }
      } else {
        memoryElement.className = 'text-blue-400'; // Unknown/Default or Calculating
      }
    }

    // Update hit rate with smooth transition and color coding
    const hitRateElement = document.getElementById('redis-hit-rate');
    if (hitRateElement) {
      // Add transition class for smooth updates
      hitRateElement.style.transition = 'color 0.3s ease, opacity 0.2s ease';
      
      // Debug what's being set in DOM
      console.log(`🔍 DOM Update hitRate: "${hitRateElement.textContent}" -> "${metrics.hitRate}"`);
      
      // Brief opacity transition for loading state changes
      if (hitRateElement.textContent === 'CALCULATING...' && metrics.hitRate !== 'CALCULATING...') {
        hitRateElement.style.opacity = '0.5';
        setTimeout(() => {
          console.log(`🔍 setTimeout DOM Update hitRate: -> "${metrics.hitRate}"`);
          hitRateElement.textContent = metrics.hitRate;
          hitRateElement.style.opacity = '1';
        }, 150);
      } else {
        hitRateElement.textContent = metrics.hitRate;
      }
      
      // Color code based on hit rate performance (similar to PostgreSQL cache hit ratio)
      if (metrics.hitRate !== 'Unknown' && metrics.hitRate !== 'CALCULATING...') {
        const ratio = parseFloat(metrics.hitRate.replace('%', ''));
        if (ratio >= 90) {
          hitRateElement.className = 'text-green-400'; // Excellent: 90%+
        } else if (ratio >= 75) {
          hitRateElement.className = 'text-yellow-400'; // Good: 75-89%
        } else {
          hitRateElement.className = 'text-red-400'; // Poor: <75%
        }
      } else {
        hitRateElement.className = 'text-blue-400'; // Unknown/Default or Calculating
      }
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

  // NEW: Emit completion event for header aggregation (DRY + Single Source of Truth)
  private emitServiceCardCompleteEvent(healthResult: any): void {
    const event = new CustomEvent('serviceCardComplete', {
      detail: {
        serviceName: 'redis',
        result: {
          status: healthResult.status,
          message: healthResult.message,
          metrics: healthResult.metrics,
          timestamp: Date.now()
        }
      }
    });
    
    console.log('📡 Redis card emitting completion event:', event.detail);
    window.dispatchEvent(event);
  }

  // Manual refresh with loading state (for refresh button)
  async manualRefresh(): Promise<void> {
    console.log('🔄 Manual Redis cache metrics refresh');
    
    // Set loading states before fetching
    this.setLoadingStates();
    
    // Wait a moment to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update metrics
    await this.updateRedisMetrics();
  }

  // Set loading states for manual refresh
  private setLoadingStates(): void {
    const memoryElement = document.getElementById('redis-memory-used');
    if (memoryElement) {
      memoryElement.textContent = 'CALCULATING...';
      memoryElement.className = 'text-blue-400';
    }

    const hitRateElement = document.getElementById('redis-hit-rate');
    if (hitRateElement) {
      hitRateElement.textContent = 'CALCULATING...';
      hitRateElement.className = 'text-blue-400';
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
  
  // Set up periodic updates (every 1 minute for dynamic data)
  setInterval(() => {
    console.log('🔄 Periodic Redis cache metrics update (1-minute poll)');
    updater.updateRedisMetrics();
  }, 60000);

  // Hook up refresh button (look for redis-refresh button)
  const refreshButton = document.getElementById('redis-refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      console.log('🔄 Manual Redis refresh button clicked');
      await updater.manualRefresh();
    });
    console.log('🔄 Redis refresh button connected');
  } else {
    console.log('⚠️ Redis refresh button not found');
  }
}

export default RedisMetricsUpdater;