// =============================================================================
// PROMETHEUS METRICS SERVICE METRICS - DRY/SOLID IMPLEMENTATION
// =============================================================================
// Single Responsibility: Update Prometheus metrics service after health check
// Following same efficient pattern as other services
// =============================================================================

import { PrometheusServiceChecker } from "../utils/serviceCheckers.ts";
import { createContextLogger } from "../utils/logger.js";

const moduleLogger = createContextLogger("PrometheusMetricsModule");

interface PrometheusMetrics {
  version: string;
  targets: number;
  activeTargets: number;
  failedTargets: number;
  tsdbSize: string;
  samples: string;
  uptime: string;
  queryEngine: string;
  scrapeInterval: string;
}

class PrometheusMetricsUpdater {
  private static instance: PrometheusMetricsUpdater;
  private readonly logger = createContextLogger("PrometheusMetricsUpdater");

  static getInstance(): PrometheusMetricsUpdater {
    if (!PrometheusMetricsUpdater.instance) {
      PrometheusMetricsUpdater.instance = new PrometheusMetricsUpdater();
    }
    return PrometheusMetricsUpdater.instance;
  }

  async updatePrometheusMetrics(): Promise<void> {
    this.logger.info("Updating Prometheus metrics service");

    try {
      // Get health data from Prometheus
      const healthResult = await PrometheusServiceChecker.checkHealth();

      // Prepare metrics using real Prometheus data from backend health check
      const metrics: PrometheusMetrics = {
        version: String(healthResult.metrics.version || "v2.40.0"),
        targets: Number(healthResult.metrics.totalTargets) || 2,
        activeTargets: Number(healthResult.metrics.activeTargets) || 2,
        failedTargets: Number(healthResult.metrics.failedTargets) || 0,
        tsdbSize: String(healthResult.metrics.tsdbSize || "Unknown"),
        samples: String(healthResult.metrics.samples || "Unknown"),
        uptime: String(healthResult.metrics.uptime || "Active"),
        queryEngine: "PromQL",
        scrapeInterval: String(healthResult.metrics.scrapeInterval || "15s"),
      };

      // Update service info using DRY utilities
      this.updateMetricsInfo(metrics);

      // Update scrape targets
      this.updateScrapeTargets(metrics);

      // Update storage information
      this.updateStorageInfo(metrics);

      // Update overall service status
      this.updateServiceStatus(healthResult.status, healthResult.message);

      this.logger.info("Prometheus metrics updated successfully", { metrics });

      // NEW: Emit completion event for header aggregation (DRY + Single Source of Truth)
      this.emitServiceCardCompleteEvent(healthResult);
    } catch (error) {
      this.logger.error("Failed to update Prometheus metrics", error);
      this.updateServiceStatus("error", "Failed to fetch metrics service data");
    }
  }

  // SOLID: Single Responsibility - Metrics info updates (direct DOM like other services)
  private updateMetricsInfo(metrics: PrometheusMetrics): void {
    // Update version (make it dynamic instead of hardcoded)
    const versionElement = document.querySelector(
      "[data-prometheus-version]",
    ) as HTMLElement;
    if (versionElement) {
      versionElement.textContent = metrics.version;
    }

    // Update uptime if element exists
    const uptimeElement = document.getElementById("prometheus-uptime");
    if (uptimeElement) {
      uptimeElement.textContent = metrics.uptime;
    }

    // Update query engine if element exists
    const queryEngineElement = document.getElementById(
      "prometheus-query-engine",
    );
    if (queryEngineElement) {
      queryEngineElement.textContent = metrics.queryEngine;
    }

    // Update scrape interval if element exists
    const scrapeIntervalElement = document.getElementById(
      "prometheus-scrape-interval",
    );
    if (scrapeIntervalElement) {
      scrapeIntervalElement.textContent = metrics.scrapeInterval;
    }
  }

  // SOLID: Single Responsibility - Scrape targets updates
  private updateScrapeTargets(metrics: PrometheusMetrics): void {
    // Update total targets
    const targetsElement = document.getElementById("prometheus-targets");
    if (targetsElement) {
      targetsElement.textContent = String(metrics.targets);
    }

    // Update active targets
    const activeElement = document.getElementById("prometheus-active");
    if (activeElement) {
      activeElement.textContent = String(metrics.activeTargets);
    }

    // Update failed targets
    const failedElement = document.getElementById("prometheus-failed");
    if (failedElement) {
      failedElement.textContent = String(metrics.failedTargets);
    }
  }

  // SOLID: Single Responsibility - Storage information updates
  private updateStorageInfo(metrics: PrometheusMetrics): void {
    // Update TSDB size
    const tsdbSizeElement = document.getElementById("prometheus-tsdb-size");
    if (tsdbSizeElement) {
      tsdbSizeElement.textContent = metrics.tsdbSize;
    }

    // Update samples count
    const samplesElement = document.getElementById("prometheus-samples");
    if (samplesElement) {
      samplesElement.textContent = metrics.samples;
    }
  }

  // SOLID: Single Responsibility - Service status updates (direct DOM like other services)
  private updateServiceStatus(status: string, message: string): void {
    const statusIndicator = document.getElementById(
      "prometheus-status-indicator",
    );
    if (statusIndicator) {
      const { color } = this.getStatusStyling(status);
      statusIndicator.className = `w-3 h-3 rounded-full ${color}`;
    }

    const statusText = document.getElementById("prometheus-status-text");
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // DRY: Status styling mapping (same as other services)
  private getStatusStyling(status: string): {
    color: string;
    className: string;
  } {
    switch (status) {
      case "up":
      case "healthy":
        return { color: "bg-green-500", className: "text-green-400" };
      case "degraded":
        return { color: "bg-yellow-500", className: "text-yellow-400" };
      case "down":
      case "error":
        return { color: "bg-red-500", className: "text-red-400" };
      default:
        return {
          color: "bg-gray-500 animate-pulse",
          className: "text-gray-400",
        };
    }
  }

  // Handle hardcoded Prometheus info in HTML
  // Note: Method reserved for future hardcoded element updates

  // NEW: Emit completion event for header aggregation (DRY + Single Source of Truth)
  private emitServiceCardCompleteEvent(healthResult: {
    status: string;
    message: string;
    metrics?: Record<string, unknown>;
  }): void {
    const event = new CustomEvent("serviceCardComplete", {
      detail: {
        serviceName: "prometheus",
        result: {
          status: healthResult.status,
          message: healthResult.message,
          metrics: healthResult.metrics,
          timestamp: Date.now(),
        },
      },
    });

    this.logger.info("Prometheus card emitting completion event", event.detail);
    window.dispatchEvent(event);
  }
}

// Auto-initialize when script loads (following same pattern as other services)
if (typeof window !== "undefined") {
  const updater = PrometheusMetricsUpdater.getInstance();

  moduleLogger.info("Prometheus metrics script loaded");

  // Initial update after page load
  if (document.readyState === "complete") {
    moduleLogger.info(
      "Document ready - updating Prometheus metrics immediately",
    );
    updater.updatePrometheusMetrics();
  } else {
    moduleLogger.info("Waiting for page load");
    window.addEventListener("load", () => {
      moduleLogger.info("Page loaded - updating Prometheus metrics now");
      updater.updatePrometheusMetrics();
    });
  }

  // Set up periodic updates (every 1 minute for dynamic data)
  setInterval(() => {
    moduleLogger.info("Periodic Prometheus metrics update (1-minute poll)");
    updater.updatePrometheusMetrics();
  }, 60000);
}

export default PrometheusMetricsUpdater;
