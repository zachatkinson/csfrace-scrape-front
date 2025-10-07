/**
 * Health Dashboard Manager - SOLID Principles Implementation
 * Single Responsibility: Coordinate all health dashboard functionality
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 * Open/Closed: Open for extension (new service checkers), closed for modification
 */

/* eslint-disable no-console */

import type { IServiceResult } from "../types/health";
import { HealthUIHelper } from "../utils/health-ui";
import { createContextLogger } from "../utils/logger";

// ASTRO MCP BEST PRACTICE: No direct API calls - purely read from Nano Store
// Single source of truth pattern - all data flows through MainLayout SSE → Nano Store → UI

const logger = createContextLogger("HealthDashboardManager");

export class HealthDashboardManager {
  private refreshInterval: number | null = null;
  private storeCleanupCallbacks: Array<() => void> = [];

  constructor(
    public config: {
      apiBaseUrl: string;
      refreshIntervalMs?: number;
      useSSE?: boolean;
    },
  ) {
    // ASTRO MCP BEST PRACTICE: Only setup Nano Store listeners, no direct API calls
    this.setupSSEListeners();
  }

  // ASTRO MCP BEST PRACTICE: No refresh methods - data comes from MainLayout SSE
  // Single source of truth: MainLayout SSE → Nano Store → UI updates

  startAutoRefresh(): void {
    // DEPRECATED: No longer needed - SSE provides real-time updates
    logger.info("Auto-refresh not needed - using SSE real-time updates");
  }

  stopAutoRefresh(): void {
    // DEPRECATED: No longer needed - SSE managed by MainLayout
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Observer Pattern - notify about overall status changes
  private updateOverallStatus(
    results: Array<{
      name: string;
      result: IServiceResult | null;
      success: boolean;
    }>,
  ): void {
    const successfulResults = results.filter((r) => r.success && r.result);
    const totalServices = results.length;
    const healthyServices = successfulResults.filter(
      (r) => r.result?.status === "up",
    ).length;
    const degradedServices = successfulResults.filter(
      (r) => r.result?.status === "degraded",
    ).length;
    const downServices = totalServices - healthyServices - degradedServices;

    let overallStatus: "up" | "degraded" | "down";
    let statusMessage: string;

    if (downServices > 0) {
      overallStatus = "down";
      statusMessage = `${downServices} service(s) down`;
    } else if (degradedServices > 0) {
      overallStatus = "degraded";
      statusMessage = `${degradedServices} service(s) degraded`;
    } else {
      overallStatus = "up";
      statusMessage = "All services operational";
    }

    // Update UI using helper (Single Responsibility)
    HealthUIHelper.updateStatusIndicator("overall-status", overallStatus);
    HealthUIHelper.updateTextElement("overall-message", statusMessage);
    HealthUIHelper.updateLastRefresh("overall-last-updated");

    // Dispatch custom event for other components (Observer Pattern)
    window.dispatchEvent(
      new CustomEvent("healthStatusUpdate", {
        detail: {
          overallStatus,
          statusMessage,
          serviceResults: successfulResults,
        },
      }),
    );
  }

  // ASTRO MCP BEST PRACTICE: Refreshing state managed by SSE connection status

  // Nano Store Integration - Listen to store changes (replaces SSE)
  private setupSSEListeners(): void {
    logger.info(
      "Setting up Nano Store listeners for health dashboard (SSE replacement)",
    );

    // Import nano stores dynamically (may not be available at initialization time)
    import("/src/stores/healthStore")
      .then(({ $healthData, $serviceMetrics, $performanceMetrics }) => {
        if ($healthData && $serviceMetrics && $performanceMetrics) {
          logger.info("Nano stores available, subscribing to changes");

          // Subscribe to health data changes
          const unsubscribeHealth = $healthData.subscribe((healthData) => {
            logger.info("Health dashboard received store update", {
              healthData,
            });
            this.handleStoreHealthUpdate(healthData);
          });

          // Subscribe to service metrics changes
          const unsubscribeMetrics = $serviceMetrics.subscribe(
            (serviceMetrics) => {
              logger.info("Service metrics received via store", {
                serviceMetrics,
              });
              this.handleStoreMetricsUpdate(serviceMetrics);
            },
          );

          // Subscribe to performance metrics changes
          const unsubscribePerformance = $performanceMetrics.subscribe(
            (performanceMetrics) => {
              logger.info("Performance metrics received via store", {
                performanceMetrics,
              });
              this.handleStorePerformanceUpdate(performanceMetrics);
            },
          );

          // Store cleanup functions for later use
          this.storeCleanupCallbacks = [
            unsubscribeHealth,
            unsubscribeMetrics,
            unsubscribePerformance,
          ];
        } else {
          logger.warn(
            "Nano stores not available, falling back to polling only",
          );
        }
      })
      .catch((error) => {
        logger.error("Failed to import nano stores", { error });
        logger.info("Falling back to polling only");
      });
  }

  // Handle health data updates from Nano Store
  private handleStoreHealthUpdate(healthData: Record<string, unknown>): void {
    if (!healthData?.services) return;

    const services = healthData.services as Record<
      string,
      Record<string, unknown>
    >;

    // Map nano store service keys to our expected names
    const serviceMapping = {
      frontend: "frontend",
      backend: "backend",
      database: "postgresql",
      cache: "redis",
    };

    // Update individual services using the mapping
    Object.keys(serviceMapping).forEach((storeKey) => {
      const ourServiceName =
        serviceMapping[storeKey as keyof typeof serviceMapping];
      const serviceData = services[storeKey];

      if (serviceData) {
        this.updateServiceDisplay(ourServiceName, serviceData);
      }
    });

    // Update overall status
    const mockResults = Object.keys(serviceMapping).map((storeKey) => {
      const ourServiceName =
        serviceMapping[storeKey as keyof typeof serviceMapping];
      const serviceData = services[storeKey];

      return {
        name: ourServiceName,
        result: {
          status: serviceData?.status || "unknown",
          message: serviceData?.message || "No data",
          metrics: serviceData?.metrics || {},
        } as IServiceResult,
        success: !!serviceData,
      };
    });

    this.updateOverallStatus(mockResults);
  }

  // Handle service metrics updates from Nano Store
  private handleStoreMetricsUpdate(
    serviceMetrics: Record<string, unknown>,
  ): void {
    logger.info("Service metrics updated via store", { serviceMetrics });
    // Metrics are handled by the health data updates
  }

  // Handle performance metrics updates from Nano Store
  private handleStorePerformanceUpdate(
    performanceMetrics: Record<string, unknown>,
  ): void {
    logger.info("Performance metrics updated via store", {
      performanceMetrics,
    });

    // Only dispatch if we have real performance data (not fallback zeros)
    const hasRealData =
      performanceMetrics &&
      ((performanceMetrics.memory_usage as number) > 0 ||
        (performanceMetrics.disk_usage as number) > 0 ||
        (performanceMetrics.network_io as number) > 0);

    if (hasRealData) {
      console.log(
        "🔔 [HealthDashboardManager] Dispatching performanceMetricsUpdate event (real data):",
        performanceMetrics,
      );
      window.dispatchEvent(
        new CustomEvent("performanceMetricsUpdate", {
          detail: { performanceMetrics },
        }),
      );
      console.log(
        "✅ [HealthDashboardManager] performanceMetricsUpdate event dispatched",
      );
    } else {
      console.log(
        "🚫 [HealthDashboardManager] Skipping dispatch of zero/default performance data",
      );
    }
  }

  // Update service display using existing UI helper
  private updateServiceDisplay(
    serviceName: string,
    serviceData: Record<string, unknown>,
  ): void {
    const mockResult: IServiceResult = {
      status:
        (serviceData.status as "up" | "degraded" | "down" | "error") ||
        "unknown",
      message: serviceData.message as string,
      metrics: (serviceData.metrics as Record<string, unknown>) || {},
      timestamp: Date.now(),
    };

    // Use existing UI update logic
    HealthUIHelper.updateStatusIndicator(
      `${serviceName}-status`,
      mockResult.status,
    );
    HealthUIHelper.updateTextElement(
      `${serviceName}-message`,
      mockResult.message,
    );

    if (mockResult.metrics.responseTime) {
      HealthUIHelper.updateLatencyElement(
        `${serviceName}-latency`,
        `${mockResult.metrics.responseTime}ms`,
        mockResult.metrics.responseTime as number,
        "API",
      );
    }

    HealthUIHelper.updateLastRefresh(`${serviceName}-last-updated`);
  }

  // Cleanup method (Resource Management)
  destroy(): void {
    this.stopAutoRefresh();

    // Clean up nano store subscriptions
    this.storeCleanupCallbacks.forEach((cleanup) => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    });
    this.storeCleanupCallbacks = [];
  }
}
