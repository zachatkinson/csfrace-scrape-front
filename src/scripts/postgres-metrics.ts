// =============================================================================
// POSTGRESQL SERVICE METRICS - DRY/SOLID IMPLEMENTATION  
// =============================================================================
// Single Responsibility: Update PostgreSQL service metrics after health check
// Following same efficient pattern as frontend and backend metrics
// =============================================================================

import { DatabaseServiceChecker } from '../utils/serviceCheckers.js';

interface PostgreSQLMetrics {
  version: string;
  maxConnections: number;
  activeConnections: number;
  totalConnections: number;
  queryTime: string;
  cacheHitRatio: string;
  databaseSize: string;
  uptime: string;
  monitoring: Record<string, string>;
}

class PostgreSQLMetricsUpdater {
  private static instance: PostgreSQLMetricsUpdater;
  private lastGoodQueryTime: string | null = null;
  private lastGoodCacheHitRatio: string | null = null;
  
  static getInstance(): PostgreSQLMetricsUpdater {
    if (!PostgreSQLMetricsUpdater.instance) {
      PostgreSQLMetricsUpdater.instance = new PostgreSQLMetricsUpdater();
    }
    return PostgreSQLMetricsUpdater.instance;
  }

  async updatePostgreSQLMetrics(): Promise<void> {
    console.log('🗄️ Updating PostgreSQL service metrics...');
    
    try {
      // Get health data from PostgreSQL via backend
      const healthResult = await DatabaseServiceChecker.checkHealth();
      
      // DEBUG: Log what we're getting from the backend
      console.log('🔍 Backend response:', {
        queryTime: healthResult.metrics.queryTime,
        response_time_ms: healthResult.metrics.response_time_ms,
        cache_hit_ratio: healthResult.metrics.cache_hit_ratio,
        fullHealthResult: healthResult
      });
      
      // Prepare metrics using build-time efficiency for static data
      const rawQueryTime = healthResult.metrics.queryTime === 'Unknown' ? 'CALCULATING...' : healthResult.metrics.queryTime;
      const rawCacheHitRatio = healthResult.metrics.cache_hit_ratio ? `${healthResult.metrics.cache_hit_ratio}%` : 'CALCULATING...';
      
      console.log('🔍 Raw values before preservation:', {
        rawQueryTime,
        rawCacheHitRatio,
        lastGoodQueryTime: this.lastGoodQueryTime,
        lastGoodCacheHitRatio: this.lastGoodCacheHitRatio
      });
      
      const metrics: PostgreSQLMetrics = {
        version: healthResult.metrics.version || 'PostgreSQL 15',
        maxConnections: healthResult.metrics.max_connections || 200,
        activeConnections: healthResult.metrics.connections || 0,
        totalConnections: healthResult.metrics.total_connections || 0,
        queryTime: this.getPreservedValue(rawQueryTime, this.lastGoodQueryTime, 'queryTime'),
        cacheHitRatio: this.getPreservedValue(rawCacheHitRatio, this.lastGoodCacheHitRatio, 'cacheHitRatio'),
        databaseSize: healthResult.metrics.size || 'Unknown',
        uptime: healthResult.metrics.uptime || 'Unknown',
        monitoring: healthResult.metrics.monitoring || {}
      };

      // Update service info using DRY utilities
      this.updateDatabaseInfo(metrics);
      
      // Update performance stats
      this.updatePerformanceStats(metrics);
      
      // Update connection pool info
      this.updateConnectionPool(metrics);
      
      // Update overall service status
      this.updateServiceStatus(healthResult.status, healthResult.message);
      
      console.log('✅ PostgreSQL metrics updated successfully', metrics);
      
    } catch (error) {
      console.error('❌ Failed to update PostgreSQL metrics:', error);
      this.updateServiceStatus('error', 'Failed to fetch database metrics');
    }
  }

  // DRY: Value preservation logic to prevent regression from good to bad values
  private getPreservedValue(newValue: string, lastGoodValue: string | null, metricType: 'queryTime' | 'cacheHitRatio'): string {
    const isMeaningful = this.isMeaningfulValue(newValue, metricType);
    console.log(`🔍 getPreservedValue ${metricType}:`, {
      newValue,
      lastGoodValue,
      isMeaningful,
      decision: isMeaningful ? 'use new' : (lastGoodValue ? 'preserve last good' : 'use new anyway')
    });
    
    // If new value is meaningful (not CALCULATING... and not 0 ms), use it and store it
    if (isMeaningful) {
      if (metricType === 'queryTime') {
        this.lastGoodQueryTime = newValue;
      } else if (metricType === 'cacheHitRatio') {
        this.lastGoodCacheHitRatio = newValue;
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
  private isMeaningfulValue(value: string, metricType: 'queryTime' | 'cacheHitRatio'): boolean {
    if (value === 'CALCULATING...' || value === 'Unknown') {
      console.log(`🔍 isMeaningfulValue ${metricType}: "${value}" -> false (loading/unknown state)`);
      return false;
    }

    if (metricType === 'queryTime') {
      // For query time, reject "0 ms" or any zero values
      const isZero = value.match(/^0(\.\d+)?\s*ms$/i);
      const result = !isZero;
      console.log(`🔍 isMeaningfulValue ${metricType}: "${value}" -> ${result} (isZero: ${!!isZero})`);
      return result;
    }

    if (metricType === 'cacheHitRatio') {
      // For cache hit ratio, reject "0%" or any zero values  
      const isZero = value.match(/^0(\.\d+)?%$/i);
      const result = !isZero;
      console.log(`🔍 isMeaningfulValue ${metricType}: "${value}" -> ${result} (isZero: ${!!isZero})`);
      return result;
    }

    console.log(`🔍 isMeaningfulValue ${metricType}: "${value}" -> true (default)`);
    return true;
  }

  // SOLID: Single Responsibility - Database info updates (direct DOM like frontend/backend)
  private updateDatabaseInfo(metrics: PostgreSQLMetrics): void {
    // Update version
    const versionElement = document.getElementById('postgres-version');
    if (versionElement) {
      versionElement.textContent = metrics.version;
    }

    // Update database size
    const sizeElement = document.getElementById('postgres-size');
    if (sizeElement) {
      sizeElement.textContent = metrics.databaseSize;
    }

    // Update uptime  
    const uptimeElement = document.getElementById('postgres-uptime');
    if (uptimeElement) {
      uptimeElement.textContent = metrics.uptime;
    }
  }

  // SOLID: Single Responsibility - Performance stats updates
  private updatePerformanceStats(metrics: PostgreSQLMetrics): void {
    // Update query time with smooth transition
    const queryTimeElement = document.getElementById('postgres-query-time');
    if (queryTimeElement) {
      // Add transition class for smooth updates
      queryTimeElement.style.transition = 'color 0.3s ease, opacity 0.2s ease';
      
      // Debug what's being set in DOM
      console.log(`🔍 DOM Update queryTime: "${queryTimeElement.textContent}" -> "${metrics.queryTime}"`);
      
      // Brief opacity transition for loading state changes
      if (queryTimeElement.textContent === 'CALCULATING...' && metrics.queryTime !== 'CALCULATING...') {
        queryTimeElement.style.opacity = '0.5';
        setTimeout(() => {
          console.log(`🔍 setTimeout DOM Update queryTime: -> "${metrics.queryTime}"`);
          queryTimeElement.textContent = metrics.queryTime;
          queryTimeElement.style.opacity = '1';
        }, 150);
      } else {
        queryTimeElement.textContent = metrics.queryTime;
      }
      
      // Color code based on query response time performance  
      if (metrics.queryTime !== 'Unknown' && metrics.queryTime !== 'CALCULATING...') {
        const timeMs = parseFloat(metrics.queryTime.replace(' ms', ''));
        if (timeMs <= 5) {
          queryTimeElement.className = 'text-green-400'; // Excellent: ≤5ms
        } else if (timeMs <= 20) {
          queryTimeElement.className = 'text-yellow-400'; // Good: 5-20ms
        } else {
          queryTimeElement.className = 'text-red-400'; // Slow: >20ms
        }
      } else {
        queryTimeElement.className = 'text-blue-400'; // Unknown/Default or Calculating
      }
    }

    // Update cache hit ratio with smooth transition
    const cacheHitElement = document.getElementById('postgres-cache-hit');
    if (cacheHitElement) {
      // Add transition class for smooth updates
      cacheHitElement.style.transition = 'color 0.3s ease, opacity 0.2s ease';
      
      // Debug what's being set in DOM
      console.log(`🔍 DOM Update cacheHitRatio: "${cacheHitElement.textContent}" -> "${metrics.cacheHitRatio}"`);
      
      // Brief opacity transition for loading state changes
      if (cacheHitElement.textContent === 'CALCULATING...' && metrics.cacheHitRatio !== 'CALCULATING...') {
        cacheHitElement.style.opacity = '0.5';
        setTimeout(() => {
          console.log(`🔍 setTimeout DOM Update cacheHitRatio: -> "${metrics.cacheHitRatio}"`);
          cacheHitElement.textContent = metrics.cacheHitRatio;
          cacheHitElement.style.opacity = '1';
        }, 150);
      } else {
        cacheHitElement.textContent = metrics.cacheHitRatio;
      }
      
      // Color code based on cache hit ratio performance
      if (metrics.cacheHitRatio !== 'Unknown' && metrics.cacheHitRatio !== 'CALCULATING...') {
        const ratio = parseFloat(metrics.cacheHitRatio.replace('%', ''));
        if (ratio >= 95) {
          cacheHitElement.className = 'text-green-400'; // Excellent: 95%+
        } else if (ratio >= 90) {
          cacheHitElement.className = 'text-yellow-400'; // Good: 90-94%
        } else {
          cacheHitElement.className = 'text-red-400'; // Poor: <90%
        }
      } else {
        cacheHitElement.className = 'text-blue-400'; // Unknown/Default or Calculating
      }
    }
  }

  // SOLID: Single Responsibility - Connection pool updates
  private updateConnectionPool(metrics: PostgreSQLMetrics): void {
    // Update max connections (make it dynamic instead of hardcoded)
    const maxConnectionsElement = document.querySelector('[data-postgres-max-connections]') as HTMLElement;
    if (maxConnectionsElement) {
      maxConnectionsElement.textContent = String(metrics.maxConnections);
    }

    // Update active connections
    const activeElement = document.getElementById('postgres-active-connections');
    if (activeElement) {
      activeElement.textContent = String(metrics.activeConnections);
    }

    // Update total connections if element exists
    const totalElement = document.getElementById('postgres-total-connections');
    if (totalElement) {
      totalElement.textContent = String(metrics.totalConnections);
    }
  }

  // SOLID: Single Responsibility - Service status updates (direct DOM like frontend/backend)
  private updateServiceStatus(status: string, message: string): void {
    const statusIndicator = document.getElementById('postgres-status-indicator');
    if (statusIndicator) {
      const { color } = this.getStatusStyling(status);
      statusIndicator.className = `w-3 h-3 rounded-full ${color}`;
    }
    
    const statusText = document.getElementById('postgres-status-text');
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

  // Handle hardcoded database info in HTML
  private updateHardcodedElements(): void {
    // Check if max connections is hardcoded and update
    const hardcodedMaxConnections = document.querySelector('[data-hardcoded="max-connections"]');
    if (hardcodedMaxConnections) {
      // Will be updated by updateConnectionPool method with dynamic value
    }
  }

  // Manual refresh with loading state (for refresh button)
  async manualRefresh(): Promise<void> {
    console.log('🔄 Manual PostgreSQL metrics refresh');
    
    // Set loading states before fetching
    this.setLoadingStates();
    
    // Wait a moment to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update metrics
    await this.updatePostgreSQLMetrics();
  }

  // Set loading states for manual refresh
  private setLoadingStates(): void {
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
  }
}

// Auto-initialize when script loads (following same pattern as frontend/backend)
if (typeof window !== 'undefined') {
  const updater = PostgreSQLMetricsUpdater.getInstance();
  
  console.log('🗄️ PostgreSQL metrics script loaded');
  
  // Initial update after page load
  if (document.readyState === 'complete') {
    console.log('📊 Document ready - updating PostgreSQL metrics immediately');
    updater.updatePostgreSQLMetrics();
  } else {
    console.log('⏳ Waiting for page load');
    window.addEventListener('load', () => {
      console.log('📊 Page loaded - updating PostgreSQL metrics now');
      updater.updatePostgreSQLMetrics();
    });
  }
  
  // Set up periodic updates (every 30 seconds for dynamic data)
  setInterval(() => {
    console.log('🔄 Periodic PostgreSQL metrics update');
    updater.updatePostgreSQLMetrics();
  }, 30000);

  // Hook up refresh button (look for postgres-refresh button)
  const refreshButton = document.getElementById('postgres-refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      console.log('🔄 Manual PostgreSQL refresh button clicked');
      await updater.manualRefresh();
    });
    console.log('🔄 PostgreSQL refresh button connected');
  } else {
    console.log('⚠️ PostgreSQL refresh button not found');
  }
}

export default PostgreSQLMetricsUpdater;