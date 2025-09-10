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
      
      // Prepare metrics using build-time efficiency for static data
      const metrics: PostgreSQLMetrics = {
        version: healthResult.metrics.version || 'PostgreSQL 15',
        maxConnections: healthResult.metrics.max_connections || 200,
        activeConnections: healthResult.metrics.active_connections || 0,
        totalConnections: healthResult.metrics.total_connections || 0,
        queryTime: healthResult.metrics.avg_query_time ? `${healthResult.metrics.avg_query_time}ms` : '< 1ms',
        cacheHitRatio: healthResult.metrics.cache_hit_ratio ? `${healthResult.metrics.cache_hit_ratio}%` : '99%',
        databaseSize: healthResult.metrics.database_size || 'Unknown',
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
    // Update query time
    const queryTimeElement = document.getElementById('postgres-query-time');
    if (queryTimeElement) {
      queryTimeElement.textContent = metrics.queryTime;
    }

    // Update cache hit ratio
    const cacheHitElement = document.getElementById('postgres-cache-hit');
    if (cacheHitElement) {
      cacheHitElement.textContent = metrics.cacheHitRatio;
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
}

export default PostgreSQLMetricsUpdater;