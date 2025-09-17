/**
 * Base Health Checker - Abstract Base Class (Open/Closed Principle)
 * Single Responsibility: Base functionality for all service health checkers
 * Follows Template Method Pattern for consistent health checking
 */

import type { IServiceChecker, IServiceResult, ServiceStatus } from '../types/health';

export abstract class BaseHealthChecker implements IServiceChecker {
  abstract readonly serviceName: string;
  abstract readonly endpoint: string;

  // Template method - defines the algorithm structure
  protected async fetchWithTimeout(url: string, timeout: number = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  protected createResult(status: ServiceStatus, message: string, metrics: any, error?: string): IServiceResult {
    return {
      status,
      message,
      metrics: {
        responseTime: metrics.responseTime || 0,
        ...metrics
      },
      error,
      timestamp: Date.now()
    };
  }

  // Abstract methods that subclasses must implement
  abstract checkHealth(): Promise<IServiceResult>;
  abstract updateUI(result: IServiceResult): void;
}