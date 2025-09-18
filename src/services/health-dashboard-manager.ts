/**
 * Health Dashboard Manager - SOLID Principles Implementation
 * Single Responsibility: Coordinate all health dashboard functionality
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 * Open/Closed: Open for extension (new service checkers), closed for modification
 */

import type { IServiceChecker, IServiceResult } from '../types/health';
import { BackendHealthChecker } from './backend-health-checker';
import { HealthUIHelper } from '../utils/health-ui';
import { createContextLogger } from '../utils/logger';

// Simple health checker implementations for new services
class FrontendHealthChecker implements IServiceChecker {
  readonly serviceName = 'frontend';
  readonly endpoint = '/frontend';

  async checkHealth(): Promise<IServiceResult> {
    const startTime = Date.now();
    return {
      status: 'up',
      message: 'Frontend Active',
      metrics: { responseTime: Date.now() - startTime },
      timestamp: Date.now()
    };
  }

  updateUI(result: IServiceResult): void {
    HealthUIHelper.updateStatusIndicator('frontend-status', result.status);
    HealthUIHelper.updateTextElement('frontend-message', result.message);
    HealthUIHelper.updateLatencyElement('frontend-latency', `${result.metrics.responseTime}ms`, result.metrics.responseTime as number, 'API');
    HealthUIHelper.updateLastRefresh('frontend-last-updated');
  }
}

class PostgreSQLHealthChecker implements IServiceChecker {
  readonly serviceName = 'postgresql';
  readonly endpoint = '/health';

  constructor(private apiBaseUrl: string) {}

  async checkHealth(): Promise<IServiceResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      const data = await response.json();
      return {
        status: data.database?.status === 'healthy' ? 'up' : 'down',
        message: data.database?.message || 'Via Backend Health Check',
        metrics: { responseTime: data.database?.response_time_ms || 0 },
        timestamp: Date.now()
      };
    } catch {
      return {
        status: 'down',
        message: 'PostgreSQL unreachable via backend',
        metrics: { responseTime: 0 },
        timestamp: Date.now()
      };
    }
  }

  updateUI(result: IServiceResult): void {
    HealthUIHelper.updateStatusIndicator('postgresql-status', result.status);
    HealthUIHelper.updateTextElement('postgresql-message', result.message);
    if (result.metrics.responseTime) {
      HealthUIHelper.updateLatencyElement('postgresql-latency', `${result.metrics.responseTime}ms`, result.metrics.responseTime as number, 'DATABASE');
    }
    HealthUIHelper.updateLastRefresh('postgresql-last-updated');
  }
}

class RedisHealthChecker implements IServiceChecker {
  readonly serviceName = 'redis';
  readonly endpoint = '/health';

  constructor(private apiBaseUrl: string) {}

  async checkHealth(): Promise<IServiceResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      const data = await response.json();
      return {
        status: data.cache?.status === 'healthy' ? 'up' : 'down',
        message: data.cache?.message || 'Via Backend Health Check',
        metrics: { responseTime: data.cache?.response_time_ms || 0 },
        timestamp: Date.now()
      };
    } catch {
      return {
        status: 'down',
        message: 'Redis unreachable via backend',
        metrics: { responseTime: 0 },
        timestamp: Date.now()
      };
    }
  }

  updateUI(result: IServiceResult): void {
    HealthUIHelper.updateStatusIndicator('redis-status', result.status);
    HealthUIHelper.updateTextElement('redis-message', result.message);
    if (result.metrics.responseTime) {
      HealthUIHelper.updateLatencyElement('redis-latency', `${result.metrics.responseTime}ms`, result.metrics.responseTime as number, 'CACHE');
    }
    HealthUIHelper.updateLastRefresh('redis-last-updated');
  }
}

const logger = createContextLogger('HealthDashboardManager');

export class HealthDashboardManager {
  private serviceCheckers: Map<string, IServiceChecker> = new Map();
  private refreshInterval: number | null = null;
  private isRefreshing = false;
  private useSSE = false;
  private boundHealthUpdateHandler?: (event: Event) => void;
  private boundServiceUpdateHandler?: (event: Event) => void;
  private storeCleanupCallbacks: Array<() => void> = [];

  constructor(public config: { apiBaseUrl: string; refreshIntervalMs?: number; useSSE?: boolean }) {
    this.useSSE = config.useSSE || false;
    this.initializeServiceCheckers();

    if (this.useSSE) {
      this.setupSSEListeners();
    }
  }

  // Dependency Injection - easily extensible for new services
  private initializeServiceCheckers(): void {
    // Single source of truth for service configuration
    this.serviceCheckers.set('frontend', new FrontendHealthChecker());
    this.serviceCheckers.set('backend', new BackendHealthChecker(this.config.apiBaseUrl));
    this.serviceCheckers.set('postgresql', new PostgreSQLHealthChecker(this.config.apiBaseUrl));
    this.serviceCheckers.set('redis', new RedisHealthChecker(this.config.apiBaseUrl));
  }

  // Template Method Pattern - defines the refresh algorithm
  async refreshAllServices(): Promise<void> {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    this.updateRefreshingState(true);

    try {
      // Process all services concurrently for performance
      const checkPromises = Array.from(this.serviceCheckers.entries()).map(
        async ([name, checker]) => {
          try {
            const result = await checker.checkHealth();
            checker.updateUI(result);
            return { name, result, success: true };
          } catch (error) {
            logger.error('Failed to check service', { name, error });
            return { name, result: null, success: false, error: error as Error };
          }
        }
      );

      const results = await Promise.all(checkPromises);
      this.updateOverallStatus(results);

    } finally {
      this.isRefreshing = false;
      this.updateRefreshingState(false);
    }
  }

  // Strategy Pattern - different refresh strategies (Enhanced with SSE integration)
  startAutoRefresh(): void {
    if (this.refreshInterval) return;

    const intervalMs = this.useSSE
      ? (this.config.refreshIntervalMs || 30000) * 2  // Less frequent with SSE
      : (this.config.refreshIntervalMs || 30000);     // Normal frequency without SSE

    if (this.useSSE) {
      logger.info('SSE is active - auto-refresh serves as fallback');
    }

    this.refreshInterval = window.setInterval(() => {
      if (this.useSSE) {
        logger.info('Fallback refresh while SSE is active');
      }
      this.refreshAllServices();
    }, intervalMs);

    // Initial refresh
    this.refreshAllServices();
  }

  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Command Pattern - encapsulate refresh requests
  async refreshSingleService(serviceName: string): Promise<void> {
    const checker = this.serviceCheckers.get(serviceName);
    if (!checker) {
      logger.warn('Service checker not found', { serviceName });
      return;
    }

    try {
      const result = await checker.checkHealth();
      checker.updateUI(result);
    } catch (error) {
      logger.error('Failed to refresh service', { serviceName, error });
    }
  }

  // Observer Pattern - notify about overall status changes
  private updateOverallStatus(results: Array<{name: string, result: IServiceResult | null, success: boolean}>): void {
    const successfulResults = results.filter(r => r.success && r.result);
    const totalServices = results.length;
    const healthyServices = successfulResults.filter(r => r.result?.status === 'up').length;
    const degradedServices = successfulResults.filter(r => r.result?.status === 'degraded').length;
    const downServices = totalServices - healthyServices - degradedServices;

    let overallStatus: 'up' | 'degraded' | 'down';
    let statusMessage: string;

    if (downServices > 0) {
      overallStatus = 'down';
      statusMessage = `${downServices} service(s) down`;
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
      statusMessage = `${degradedServices} service(s) degraded`;
    } else {
      overallStatus = 'up';
      statusMessage = 'All services operational';
    }

    // Update UI using helper (Single Responsibility)
    HealthUIHelper.updateStatusIndicator('overall-status', overallStatus);
    HealthUIHelper.updateTextElement('overall-message', statusMessage);
    HealthUIHelper.updateLastRefresh('overall-last-updated');

    // Dispatch custom event for other components (Observer Pattern)
    window.dispatchEvent(new CustomEvent('healthStatusUpdate', {
      detail: { overallStatus, statusMessage, serviceResults: successfulResults }
    }));
  }

  private updateRefreshingState(isRefreshing: boolean): void {
    const refreshButton = document.getElementById('refresh-all-btn');
    if (refreshButton) {
      refreshButton.classList.toggle('refresh-pulse', isRefreshing);
      (refreshButton as HTMLButtonElement).disabled = isRefreshing;
    }

    const statusIndicators = document.querySelectorAll('.status-circle');
    statusIndicators.forEach(indicator => {
      indicator.classList.toggle('animate-pulse', isRefreshing);
    });
  }

  // Nano Store Integration - Listen to store changes (replaces SSE)
  private setupSSEListeners(): void {
    logger.info('Setting up Nano Store listeners for health dashboard (SSE replacement)');

    // Import nano stores dynamically (may not be available at initialization time)
    import('/src/stores/healthStore').then(({ $healthData, $serviceMetrics }) => {
      if ($healthData && $serviceMetrics) {
        logger.info('Nano stores available, subscribing to changes');

        // Subscribe to health data changes
        const unsubscribeHealth = $healthData.subscribe((healthData) => {
          logger.info('Health dashboard received store update', { healthData });
          this.handleStoreHealthUpdate(healthData);
        });

        // Subscribe to service metrics changes
        const unsubscribeMetrics = $serviceMetrics.subscribe((serviceMetrics) => {
          logger.info('Service metrics received via store', { serviceMetrics });
          this.handleStoreMetricsUpdate(serviceMetrics);
        });

        // Store cleanup functions for later use
        this.storeCleanupCallbacks = [unsubscribeHealth, unsubscribeMetrics];
      } else {
        logger.warn('Nano stores not available, falling back to polling only');
      }
    }).catch((error) => {
      logger.error('Failed to import nano stores', { error });
      logger.info('Falling back to polling only');
    });
  }

  // Handle health data updates from Nano Store
  private handleStoreHealthUpdate(healthData: Record<string, unknown>): void {
    if (!healthData?.services) return;

    const services = healthData.services;

    // Map nano store service keys to our expected names
    const serviceMapping = {
      'frontend': 'frontend',
      'backend': 'backend',
      'database': 'postgresql',
      'cache': 'redis'
    };

    // Update individual services using the mapping
    Object.keys(serviceMapping).forEach(storeKey => {
      const ourServiceName = serviceMapping[storeKey as keyof typeof serviceMapping];
      const serviceData = services[storeKey];

      if (serviceData) {
        this.updateServiceDisplay(ourServiceName, serviceData);
      }
    });

    // Update overall status
    const mockResults = Object.keys(serviceMapping).map(storeKey => {
      const ourServiceName = serviceMapping[storeKey as keyof typeof serviceMapping];
      const serviceData = services[storeKey];

      return {
        name: ourServiceName,
        result: {
          status: serviceData?.status || 'unknown',
          message: serviceData?.message || 'No data',
          metrics: serviceData?.metrics || {}
        } as IServiceResult,
        success: !!serviceData
      };
    });

    this.updateOverallStatus(mockResults);
  }

  // Handle service metrics updates from Nano Store
  private handleStoreMetricsUpdate(serviceMetrics: Record<string, unknown>): void {
    logger.info('Service metrics updated via store', { serviceMetrics });
    // Metrics are handled by the health data updates
  }

  // Update service display using existing UI helper
  private updateServiceDisplay(serviceName: string, serviceData: Record<string, unknown>): void {
    const mockResult: IServiceResult = {
      status: serviceData.status as 'up' | 'degraded' | 'down' | 'error' | 'unknown',
      message: serviceData.message as string,
      metrics: (serviceData.metrics as Record<string, unknown>) || {},
      timestamp: Date.now()
    };

    // Use existing UI update logic
    HealthUIHelper.updateStatusIndicator(`${serviceName}-status`, mockResult.status);
    HealthUIHelper.updateTextElement(`${serviceName}-message`, mockResult.message);

    if (mockResult.metrics.responseTime) {
      HealthUIHelper.updateLatencyElement(
        `${serviceName}-latency`,
        `${mockResult.metrics.responseTime}ms`,
        mockResult.metrics.responseTime as number,
        'API'
      );
    }

    HealthUIHelper.updateLastRefresh(`${serviceName}-last-updated`);
  }


  // Cleanup method (Resource Management)
  destroy(): void {
    this.stopAutoRefresh();
    this.serviceCheckers.clear();

    // Clean up nano store subscriptions
    this.storeCleanupCallbacks.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
    this.storeCleanupCallbacks = [];

    // Remove old SSE listeners (fallback - should not be needed with nano stores)
    if (this.useSSE) {
      if (this.boundHealthUpdateHandler) {
        window.removeEventListener('healthDataUpdate', this.boundHealthUpdateHandler);
      }
      if (this.boundServiceUpdateHandler) {
        window.removeEventListener('serviceHealthUpdate', this.boundServiceUpdateHandler);
      }
    }
  }
}