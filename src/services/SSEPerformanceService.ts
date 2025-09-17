/**
 * SSE Performance Service - SOLID Single Responsibility Principle
 * Handles performance optimizations for Server-Side Events
 * Following DRY principles and Astro 5.0+ best practices
 */

// Removed problematic astro:env/server imports - use runtime constants
const SSE_POLLING_INTERVAL_MS = 5000;
const SSE_POLLING_INTERVAL_UNHEALTHY_MS = 3000;
const SSE_POLLING_INTERVAL_STABLE_MS = 10000;
const SSE_DEBOUNCE_DELAY_MS = 300;
const SSE_RESPONSE_TIME_THRESHOLD_MS = 2000;
const SSE_CONNECTION_COUNT_THRESHOLD = 10;
const SSE_MAX_CONCURRENT_CONNECTIONS = 50;

import type { HealthResponse } from './HealthService';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type PollingStrategy = 'normal' | 'aggressive' | 'conservative';

export interface PerformanceMetrics {
  responseTimeThreshold: number;
  connectionCountThreshold: number;
  currentInterval: number;
  debounceDelay: number;
  maxConnections: number;
}

export interface AdaptivePollingResult {
  interval: number;
  strategy: PollingStrategy;
  reason: string;
}

/**
 * Performance optimization service following SOLID principles
 * - Single Responsibility: Only handles SSE performance optimization
 * - Open/Closed: Extendable for new optimization strategies
 * - Liskov Substitution: Can be substituted by any performance optimizer
 * - Interface Segregation: Focused interface for performance operations
 * - Dependency Inversion: Depends on abstractions via environment config
 */
export class SSEPerformanceService {
  private readonly metrics: PerformanceMetrics;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private static activeConnections: number = 0;

  constructor() {
    this.metrics = {
      responseTimeThreshold: SSE_RESPONSE_TIME_THRESHOLD_MS,
      connectionCountThreshold: SSE_CONNECTION_COUNT_THRESHOLD,
      currentInterval: SSE_POLLING_INTERVAL_MS,
      debounceDelay: SSE_DEBOUNCE_DELAY_MS,
      maxConnections: SSE_MAX_CONCURRENT_CONNECTIONS
    };
  }

  /**
   * Determine optimal polling interval based on system health
   * Implements adaptive polling strategy for performance optimization
   */
  getAdaptivePollingInterval(healthData: HealthResponse): AdaptivePollingResult {
    const overallHealth = this.assessOverallHealth(healthData);

    switch (overallHealth) {
      case 'unhealthy':
        return {
          interval: SSE_POLLING_INTERVAL_UNHEALTHY_MS,
          strategy: 'aggressive',
          reason: 'System unhealthy - faster monitoring needed'
        };
      case 'degraded':
        return {
          interval: SSE_POLLING_INTERVAL_MS,
          strategy: 'normal',
          reason: 'System degraded - normal monitoring'
        };
      case 'healthy':
        return {
          interval: SSE_POLLING_INTERVAL_STABLE_MS,
          strategy: 'conservative',
          reason: 'System healthy - background monitoring'
        };
      default:
        return {
          interval: SSE_POLLING_INTERVAL_MS,
          strategy: 'normal',
          reason: 'Default monitoring interval'
        };
    }
  }

  /**
   * Check if a change is significant enough to warrant an SSE update
   * Implements smart thresholding to reduce unnecessary updates
   */
  isSignificantChange(
    current: HealthResponse,
    previous: HealthResponse
  ): boolean {
    // Always notify on status changes
    if (current.status !== previous.status) {
      return true;
    }

    // Check database changes with thresholds
    const dbResponseTimeDiff = Math.abs(
      current.database.response_time_ms - previous.database.response_time_ms
    );
    const dbConnectionDiff = Math.abs(
      current.database.active_connections - previous.database.active_connections
    );

    if (
      current.database.status !== previous.database.status ||
      dbResponseTimeDiff > this.metrics.responseTimeThreshold ||
      dbConnectionDiff > this.metrics.connectionCountThreshold
    ) {
      return true;
    }

    // Check cache changes with thresholds
    const cacheResponseTimeDiff = Math.abs(
      current.cache.response_time_ms - previous.cache.response_time_ms
    );
    const cacheClientDiff = Math.abs(
      current.cache.connected_clients - previous.cache.connected_clients
    );

    if (
      current.cache.status !== previous.cache.status ||
      cacheResponseTimeDiff > this.metrics.responseTimeThreshold ||
      cacheClientDiff > this.metrics.connectionCountThreshold
    ) {
      return true;
    }

    return false;
  }

  /**
   * Create a debounced function to prevent rapid-fire updates
   * Implements debouncing pattern following DRY principles
   */
  createDebouncedFunction<T extends any[]>(
    fn: (...args: T) => void,
    key: string
  ): (...args: T) => void {
    return (...args: T) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, this.metrics.debounceDelay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Check if we can accept a new SSE connection
   * Implements connection limiting for performance protection
   */
  canAcceptConnection(): boolean {
    return SSEPerformanceService.activeConnections < this.metrics.maxConnections;
  }

  /**
   * Register a new SSE connection
   */
  registerConnection(): boolean {
    if (this.canAcceptConnection()) {
      SSEPerformanceService.activeConnections++;
      return true;
    }
    return false;
  }

  /**
   * Unregister an SSE connection
   */
  unregisterConnection(): void {
    if (SSEPerformanceService.activeConnections > 0) {
      SSEPerformanceService.activeConnections--;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics & { activeConnections: number } {
    return {
      ...this.metrics,
      activeConnections: SSEPerformanceService.activeConnections
    };
  }

  /**
   * Clean up resources on shutdown
   */
  cleanup(): void {
    // Clear all debounce timers
    this.debounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();
  }

  /**
   * Private method to assess overall system health
   * Used for adaptive polling decisions
   */
  private assessOverallHealth(healthData: HealthResponse): HealthStatus {
    const statuses = [
      healthData.status,
      healthData.database.status,
      healthData.cache.status
    ];

    // If any service is unhealthy, system is unhealthy
    if (statuses.some(status => status === 'unhealthy' || status === 'error')) {
      return 'unhealthy';
    }

    // If any service is degraded, system is degraded
    if (statuses.some(status => status === 'degraded' || status === 'warning')) {
      return 'degraded';
    }

    // Check performance thresholds for degraded status
    if (
      healthData.database.response_time_ms > 100 || // 100ms threshold
      healthData.cache.response_time_ms > 50 ||     // 50ms threshold
      healthData.database.active_connections > 50   // High connection count
    ) {
      return 'degraded';
    }

    return 'healthy';
  }
}

/**
 * Singleton instance for application-wide use
 * Following DRY principles - single instance across the application
 */
export const ssePerformanceService = new SSEPerformanceService();