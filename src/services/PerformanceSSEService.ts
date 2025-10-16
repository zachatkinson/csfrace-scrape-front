/**
 * Performance SSE Service - SOLID Single Responsibility Principle
 * Dedicated service for consuming performance metrics from /performance/stream
 *
 * REFACTORED: Was 250 lines with manual connection management.
 * NOW: 80 lines using BaseSSEClient abstraction (DRY compliance).
 *
 * Following SOLID principles: Only handles performance metrics streaming
 */

import { BaseSSEClient } from "./BaseSSEClient";
import type { SSEEvent } from "./BaseSSEClient";

export interface PerformanceMetrics {
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

export interface PerformanceUpdateEvent extends SSEEvent {
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
 * - Uses BaseSSEClient for connection lifecycle (DRY)
 */
export class PerformanceSSEService extends BaseSSEClient {
  constructor() {
    super("PerformanceSSEService", false); // No credentials needed
  }

  // ========================================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ========================================================================

  protected getEndpoint(): string {
    return "/performance/stream";
  }

  protected registerEventHandlers(): void {
    // Handle performance-update events
    this.on<PerformanceUpdateEvent>(
      "performance-update",
      async (event: PerformanceUpdateEvent) => {
        await this._handlePerformanceUpdate(event);
      },
    );
  }

  protected handleConnectionEvent(event: MessageEvent): void {
    try {
      const connectionData = JSON.parse(event.data);
      this.logger.info("Performance SSE connection event", { connectionData });
    } catch (error) {
      this.logger.error("Error processing performance connection event", {
        error,
      });
    }
  }

  protected handleInitialData(event: MessageEvent): void {
    try {
      const initialData = JSON.parse(event.data) as PerformanceUpdateEvent;
      this.logger.info("Initial performance metrics received via SSE", {
        initialData,
      });

      // Process initial data same as updates
      this._handlePerformanceUpdate(initialData);
    } catch (error) {
      this.logger.error("Error processing initial performance data", {
        error,
      });
    }
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  private async _handlePerformanceUpdate(
    performanceUpdate: PerformanceUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.debug("Performance metrics received via SSE", {
        performanceUpdate,
      });

      if (!performanceUpdate.data) {
        return;
      }

      // Update performance metrics in nanostore (Astro pattern)
      const { updatePerformanceMetrics } = await import(
        "/src/stores/healthStore"
      );

      // Extract performance metrics from dedicated performance stream
      const systemMetrics = performanceUpdate.data.system_metrics || {};
      const applicationMetrics =
        performanceUpdate.data.application_metrics || {};

      const performanceMetrics: PerformanceMetrics = {
        memory_usage: (systemMetrics.memory_percent as number) || 0,
        disk_usage: (systemMetrics.disk_percent as number) || 0,
        network_io:
          (((systemMetrics.network_bytes_sent as number) || 0) +
            ((systemMetrics.network_bytes_recv as number) || 0)) /
            (1024 * 1024) || 0, // Convert to MB total
        avg_response: (applicationMetrics.avg_response as number) || 0,
        p95_response: (applicationMetrics.p95_response as number) || 0,
        max_response: (applicationMetrics.max_response as number) || 0,
        active_connections:
          (applicationMetrics.active_connections as number) || 0,
        queue_length: (applicationMetrics.queue_length as number) || 0,
        uptime: (applicationMetrics.uptime as string) || "Unknown",
      };

      updatePerformanceMetrics(performanceMetrics);
      this.logger.debug(
        "Performance metrics updated in store via dedicated stream",
        { performanceMetrics },
      );
    } catch (error) {
      this.logger.error("Error processing performance metrics update", {
        error,
      });
    }
  }
}

/**
 * Singleton instance following DRY principles
 * Single instance across the application for performance metrics
 */
export const performanceSSEService = new PerformanceSSEService();
