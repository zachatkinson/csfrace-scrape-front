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

const logger = createContextLogger('HealthDashboardManager');

export class HealthDashboardManager {
  private serviceCheckers: Map<string, IServiceChecker> = new Map();
  private refreshInterval: number | null = null;
  private isRefreshing = false;

  constructor(private config: { apiBaseUrl: string; refreshIntervalMs?: number }) {
    this.initializeServiceCheckers();
  }

  // Dependency Injection - easily extensible for new services
  private initializeServiceCheckers(): void {
    // Single source of truth for service configuration
    this.serviceCheckers.set('backend', new BackendHealthChecker(this.config.apiBaseUrl));

    // Future services can be added here following Open/Closed principle:
    // this.serviceCheckers.set('database', new DatabaseHealthChecker());
    // this.serviceCheckers.set('cache', new CacheHealthChecker());
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
            return { name, result: null, success: false, error };
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

  // Strategy Pattern - different refresh strategies
  startAutoRefresh(): void {
    if (this.refreshInterval) return;

    const intervalMs = this.config.refreshIntervalMs || 30000; // Default 30 seconds
    this.refreshInterval = window.setInterval(() => {
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

  // Cleanup method (Resource Management)
  destroy(): void {
    this.stopAutoRefresh();
    this.serviceCheckers.clear();
  }
}