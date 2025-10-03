/**
 * Performance SSE Service - SOLID Single Responsibility Principle
 * Dedicated service for consuming performance metrics from /health/stream
 * Following SOLID principles: Only handles performance metrics streaming
 */

/* eslint-disable no-console */

import { createContextLogger } from "../utils/logger";
import { getApiBaseUrl } from "../constants/api";

const logger = createContextLogger("PerformanceSSEService");

export interface PerformanceMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  avg_response: number;
  p95_response: number;
  max_response: number;
  active_connections: number;
  queue_length: number;
  uptime: string;
}

export interface PerformanceUpdateEvent {
  type: "performance_metrics";
  timestamp: string;
  data: {
    system_metrics: Record<string, unknown>;
    application_metrics: Record<string, unknown>;
    database_metrics: Record<string, unknown>;
  };
}

/**
 * Performance SSE Service following SOLID principles
 * - Single Responsibility: Only handles performance metrics streaming
 * - Interface Segregation: Focused interface for performance operations only
 * - Dependency Inversion: Depends on abstractions (EventSource, nano stores)
 */
export class PerformanceSSEService {
  private eventSource: EventSource | null = null;
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private readonly maxRetries: number = 5;
  private readonly retryDelay: number = 5000;

  async connect(): Promise<void> {
    console.log("🚀 [PerformanceSSE] connect() called");
    if (this.eventSource && this.isConnected) {
      console.log("⚠️ [PerformanceSSE] Already connected, skipping");
      logger.info("Performance SSE already connected, skipping");
      return;
    }

    try {
      const backendUrl = getApiBaseUrl();
      const sseUrl = `${backendUrl}/performance/stream`;
      console.log("🔗 [PerformanceSSE] Connecting to:", sseUrl);
      logger.info("Establishing performance SSE connection", { sseUrl });

      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.retryCount = 0;
        console.log("✅ [PerformanceSSE] Connection opened successfully");
        logger.info("Performance SSE connection established");
      };

      // Handle connection events
      this.eventSource.addEventListener("connection", (event: MessageEvent) => {
        try {
          console.log(
            "📡 [PerformanceSSE] Connection event received:",
            event.data,
          );
          const connectionData = JSON.parse(event.data);
          console.log(
            "📡 [PerformanceSSE] Parsed connection data:",
            connectionData,
          );
          logger.info("Performance SSE connection event", { connectionData });
        } catch (error) {
          console.error(
            "❌ [PerformanceSSE] Error processing connection event:",
            error,
          );
          logger.error("Error processing performance connection event", {
            error,
          });
        }
      });

      // Handle performance-update events (Single Responsibility)
      this.eventSource.addEventListener(
        "performance-update",
        async (event: MessageEvent) => {
          try {
            console.log(
              "📊 [PerformanceSSE] Performance update received:",
              event.data,
            );
            const performanceUpdate: PerformanceUpdateEvent = JSON.parse(
              event.data,
            );
            console.log(
              "📊 [PerformanceSSE] Parsed performance data:",
              performanceUpdate,
            );
            logger.info("Performance metrics received via dedicated SSE", {
              performanceUpdate,
            });

            // Update performance metrics in nanostore (Astro MCP pattern)
            const { updatePerformanceMetrics } = await import(
              "/src/stores/healthStore"
            );

            if (performanceUpdate.data) {
              // Extract performance metrics from dedicated performance stream
              const systemMetrics = performanceUpdate.data.system_metrics || {};
              const applicationMetrics =
                performanceUpdate.data.application_metrics || {};

              const performanceMetrics: PerformanceMetrics = {
                cpu_usage: (systemMetrics.cpu_percent as number) || 0,
                memory_usage: (systemMetrics.memory_percent as number) || 0,
                disk_usage: (systemMetrics.disk_percent as number) || 0,
                network_io:
                  (((systemMetrics.network_bytes_sent as number) || 0) +
                    ((systemMetrics.network_bytes_recv as number) || 0)) /
                    (1024 * 1024) || 0, // Convert to MB total
                avg_response:
                  (applicationMetrics.avg_response_time as number) || 0,
                p95_response:
                  (applicationMetrics.p95_response_time as number) || 0,
                max_response:
                  (applicationMetrics.max_response_time as number) || 0,
                active_connections:
                  (applicationMetrics.active_connections as number) || 0,
                queue_length: (applicationMetrics.queue_length as number) || 0,
                uptime: (applicationMetrics.uptime as string) || "Unknown",
              };

              console.log(
                "💾 [PerformanceSSE] Updating store with metrics:",
                performanceMetrics,
              );
              updatePerformanceMetrics(performanceMetrics);
              logger.debug(
                "Performance metrics updated in store via dedicated stream",
                { performanceMetrics },
              );
            }
          } catch (error) {
            console.error(
              "❌ [PerformanceSSE] Error processing performance update:",
              error,
            );
            logger.error("Error processing performance metrics update", {
              error,
            });
          }
        },
      );

      // Handle error events (SSE error events don't have JSON data)
      this.eventSource.addEventListener("error", (event: Event) => {
        console.log("⚠️ [PerformanceSSE] Error event received:", event.type);
        logger.error("Performance SSE error event", {
          type: event.type,
          readyState: this.eventSource?.readyState,
        });
        this.isConnected = false;
      });

      this.eventSource.onerror = (error: Event) => {
        // Check if this might be due to authentication/backend unavailable
        const isLikelyAuthIssue =
          this.eventSource?.readyState === EventSource.CLOSED;

        if (isLikelyAuthIssue) {
          console.info(
            "ℹ️ [PerformanceSSE] Connection failed - user may need to sign in or backend unavailable",
          );
          logger.info(
            "Performance SSE connection failed - authentication may be required",
            { error },
          );
        } else {
          console.error(
            "💔 [PerformanceSSE] Unexpected connection error:",
            error,
          );
          logger.error("Performance SSE connection error", { error });
        }

        this.isConnected = false;

        // Only retry if it's not an auth issue
        if (!isLikelyAuthIssue) {
          this.handleRetry();
        }
      };
    } catch (error) {
      console.error(
        "💥 [PerformanceSSE] Failed to create SSE connection:",
        error,
      );
      logger.error("Failed to create performance SSE connection", { error });
      this.handleRetry();
    }
  }

  private handleRetry(): void {
    if (this.retryCount < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(2, this.retryCount);
      this.retryCount++;
      logger.info("Retrying performance SSE connection", {
        delay,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
      });
      setTimeout(() => this.connect(), delay);
    } else {
      logger.error("Max retries exceeded for performance SSE connection");
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    logger.info("Performance SSE connection closed");
  }

  getConnectionStatus(): { isConnected: boolean; retryCount: number } {
    return {
      isConnected: this.isConnected,
      retryCount: this.retryCount,
    };
  }
}

/**
 * Singleton instance following DRY principles
 * Single instance across the application for performance metrics
 */
export const performanceSSEService = new PerformanceSSEService();
