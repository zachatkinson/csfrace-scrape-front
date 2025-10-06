/**
 * Health Dashboard Initialization - External TypeScript File
 * Following Astro MCP best practices for client-side scripts
 * Single Responsibility: Initialize and coordinate health dashboard
 * DRY Principle: Uses HealthDashboardManager with SSE integration
 */

/* eslint-disable no-console */

import { HealthDashboardManager } from "../services/health-dashboard-manager.js";
import { getApiBaseUrl } from "../constants/api.js";

// Single Responsibility: Dashboard initialization and coordination
class HealthDashboard {
  private manager: HealthDashboardManager;

  constructor() {
    this.manager = new HealthDashboardManager({
      apiBaseUrl: getApiBaseUrl(),
      refreshIntervalMs: 30000, // Keep as fallback
      useSSE: true, // Enable SSE integration
    });

    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    // ASTRO MCP BEST PRACTICE: No initial load - data comes from MainLayout SSE
  }

  private setupEventListeners(): void {
    // REMOVED: Refresh buttons no longer needed as data auto-updates via nanostores/SSE
    // Health data updates automatically through SSE events from the backend

    // Export buttons
    document
      .getElementById("export-json-btn")
      ?.addEventListener("click", () => {
        this.exportHealthData("json");
      });

    document.getElementById("export-csv-btn")?.addEventListener("click", () => {
      this.exportHealthData("csv");
    });

    document
      .getElementById("generate-report-btn")
      ?.addEventListener("click", () => {
        this.generateDetailedReport();
      });

    // Initialize performance metrics
    this.initializePerformanceMetrics();

    // Setup performance metrics listener for SSE updates
    this.setupPerformanceMetricsListener();

    // Initialize raw health data preview
    this.initializeRawDataPreview();

    // Initialize CORS check
    this.initializeCORSCheck();

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      this.manager.destroy();
    });
  }

  private async initializeCORSCheck(): Promise<void> {
    // Run initial CORS check
    await this.checkCORS();

    // Set up periodic CORS check every 5 minutes
    setInterval(
      () => {
        this.checkCORS();
      },
      5 * 60 * 1000,
    );
  }

  private async checkCORS(): Promise<void> {
    const corsStatusEl = document.getElementById("cors-status");
    const corsMessageEl = document.getElementById("cors-message");
    const corsLastCheckedEl = document.getElementById("cors-last-checked");

    if (!corsStatusEl || !corsMessageEl || !corsLastCheckedEl) return;

    try {
      // Test CORS by making a simple same-origin request (nginx proxy architecture)
      // Since we're using nginx reverse proxy, all requests should be same-origin
      const response = await fetch(`${getApiBaseUrl()}/health`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
      });

      if (response.ok) {
        corsStatusEl.className = "status-circle status-up";
        corsMessageEl.textContent = "Nginx proxy routing correctly";
        corsLastCheckedEl.textContent = new Date().toLocaleTimeString();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      corsStatusEl.className = "status-circle status-error";
      corsMessageEl.textContent = `Proxy error: ${error}`;
      corsLastCheckedEl.textContent = new Date().toLocaleTimeString();
    }
  }

  private exportHealthData(format: "json" | "csv"): void {
    // Get current health data from the raw data preview
    const rawDataEl = document.getElementById("raw-health-data");
    if (!rawDataEl) return;

    const timestamp = new Date().toISOString();
    const filename = `health-data-${timestamp.split("T")[0]}.${format}`;

    try {
      const healthData = JSON.parse(rawDataEl.textContent || "{}");

      let content: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(healthData, null, 2);
        mimeType = "application/json";
      } else {
        // Convert to CSV
        content = this.convertToCSV(healthData);
        mimeType = "text/csv";
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message in diagnostic results
      const resultsEl = document.getElementById("diagnostic-results");
      if (resultsEl) {
        resultsEl.innerHTML = `<div class="text-green-400">[${new Date().toLocaleTimeString()}] Exported ${format.toUpperCase()}: ${filename}</div>`;
      }
    } catch (error) {
      const resultsEl = document.getElementById("diagnostic-results");
      if (resultsEl) {
        resultsEl.innerHTML = `<div class="text-red-400">[${new Date().toLocaleTimeString()}] Export failed: ${error}</div>`;
      }
    }
  }

  private convertToCSV(data: Record<string, unknown>): string {
    const headers = [
      "Service",
      "Status",
      "Response Time (ms)",
      "Last Check",
      "Message",
    ];
    const rows = [headers.join(",")];

    if (data.services) {
      const services = data.services as Record<string, Record<string, unknown>>;
      Object.keys(services).forEach((serviceName) => {
        const service = services[serviceName];
        if (service) {
          const row = [
            serviceName,
            service.status || "unknown",
            service.response_time || "",
            service.last_check || "",
            `"${service.message || ""}"`,
          ];
          rows.push(row.join(","));
        }
      });
    }

    return rows.join("\n");
  }

  private generateDetailedReport(): void {
    const includeHistorical =
      (document.getElementById("include-historical") as HTMLInputElement)
        ?.checked || false;
    const includeMetrics =
      (document.getElementById("include-metrics") as HTMLInputElement)
        ?.checked || false;
    const includeErrors =
      (document.getElementById("include-errors") as HTMLInputElement)
        ?.checked || false;
    const timeRange =
      (document.getElementById("time-range") as HTMLSelectElement)?.value ||
      "24h";

    const timestamp = new Date().toISOString();
    const reportData = {
      generated_at: timestamp,
      time_range: timeRange,
      options: {
        include_historical: includeHistorical,
        include_metrics: includeMetrics,
        include_errors: includeErrors,
      },
      current_status: JSON.parse(
        document.getElementById("raw-health-data")?.textContent || "{}",
      ),
      performance_metrics: includeMetrics
        ? this.gatherPerformanceMetrics()
        : null,
      historical_data: includeHistorical
        ? this.generateMockHistoricalData(timeRange)
        : null,
      error_logs: includeErrors ? this.generateMockErrorLogs() : null,
    };

    // Export as JSON
    const content = JSON.stringify(reportData, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `detailed-health-report-${timestamp.split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    const resultsEl = document.getElementById("diagnostic-results");
    if (resultsEl) {
      resultsEl.innerHTML = `<div class="text-green-400">[${new Date().toLocaleTimeString()}] Generated detailed report with ${Object.keys(reportData).length} sections</div>`;
    }
  }

  private initializePerformanceMetrics(): void {
    // Initialize with default values - real data comes via SSE
    const initialMetrics = {
      memory_usage: 0,
      disk_usage: 0,
      network_io: 0,
      avg_response: 0,
      p95_response: 0,
      max_response: 0,
      active_connections: 0,
      queue_length: 0,
      uptime: "Unknown",
    };
    this.updatePerformanceMetrics(initialMetrics);
  }

  // Setup reactive performance metrics listener (SSE replacement)
  private setupPerformanceMetricsListener(): void {
    console.log(
      "🎧 [HealthDashboard] Setting up performanceMetricsUpdate event listener",
    );

    // Listen for performance metrics updates from Nano Store
    window.addEventListener("performanceMetricsUpdate", ((
      event: CustomEvent,
    ) => {
      console.log(
        "🎯 [HealthDashboard] Received performanceMetricsUpdate event:",
        event.detail,
      );
      const performanceMetrics = event.detail.performanceMetrics;
      console.log(
        "📊 [HealthDashboard] Extracted performance metrics:",
        performanceMetrics,
      );
      // Performance metrics received via SSE - updating UI
      this.updatePerformanceMetrics(performanceMetrics);
      console.log("✅ [HealthDashboard] UI updated with performance metrics");
    }) as EventListener);

    console.log(
      "✅ [HealthDashboard] performanceMetricsUpdate event listener registered",
    );
  }

  private updatePerformanceMetrics(
    metrics: Record<string, number | string>,
  ): void {
    console.log(
      "🎨 [HealthDashboard] updatePerformanceMetrics called with:",
      metrics,
    );

    // Update UI elements with proper type checking
    const getMemoryUsage =
      typeof metrics.memory_usage === "number" ? metrics.memory_usage : 0;
    const getDiskUsage =
      typeof metrics.disk_usage === "number" ? metrics.disk_usage : 0;
    const getNetworkIo =
      typeof metrics.network_io === "number" ? metrics.network_io : 0;
    const getAvgResponse =
      typeof metrics.avg_response === "number" ? metrics.avg_response : 0;
    const getP95Response =
      typeof metrics.p95_response === "number" ? metrics.p95_response : 0;
    const getMaxResponse =
      typeof metrics.max_response === "number" ? metrics.max_response : 0;
    const getActiveConnections =
      typeof metrics.active_connections === "number"
        ? metrics.active_connections
        : 0;
    const getQueueLength =
      typeof metrics.queue_length === "number" ? metrics.queue_length : 0;

    console.log(
      "🔢 [HealthDashboard] Processed values - Memory:",
      getMemoryUsage,
      "Disk:",
      getDiskUsage,
      "Network:",
      getNetworkIo,
    );

    this.updateElementText("memory-usage", `${Math.round(getMemoryUsage)}%`);
    this.updateElementText("disk-usage", `${Math.round(getDiskUsage)}%`);
    this.updateElementText(
      "network-io",
      `${Math.round(getNetworkIo)} MB total`,
    );

    this.updateElementText(
      "avg-response",
      typeof getAvgResponse === "number"
        ? `${Math.round(getAvgResponse)}ms`
        : "N/A",
    );
    this.updateElementText(
      "p95-response",
      typeof getP95Response === "number"
        ? `${Math.round(getP95Response)}ms`
        : "N/A",
    );
    this.updateElementText(
      "max-response",
      typeof getMaxResponse === "number"
        ? `${Math.round(getMaxResponse)}ms`
        : "N/A",
    );

    this.updateElementText(
      "active-connections",
      typeof getActiveConnections === "number"
        ? Math.round(getActiveConnections).toString()
        : "N/A",
    );
    this.updateElementText(
      "queue-length",
      typeof getQueueLength === "number"
        ? Math.round(getQueueLength).toString()
        : "N/A",
    );
    this.updateElementText(
      "system-uptime",
      metrics.uptime ? metrics.uptime.toString() : "N/A",
    );

    // Update progress bars
    this.updateProgressBar("memory-progress", getMemoryUsage);
    this.updateProgressBar("disk-progress", getDiskUsage);
    this.updateProgressBar("network-progress", Math.min(100, getNetworkIo / 2)); // Scale network I/O

    // Update raw performance data preview whenever metrics are updated
    this.updateRawPerformanceData();

    console.log("✅ [HealthDashboard] All UI elements updated");
  }

  private updateElementText(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) {
      console.log(
        `🎯 [HealthDashboard] Updating element #${id} with text: "${text}"`,
      );
      el.textContent = text;
    } else {
      console.warn(`⚠️ [HealthDashboard] Element not found: #${id}`);
    }
  }

  private updateProgressBar(id: string, percentage: number): void {
    const el = document.getElementById(id);
    if (el) el.style.width = `${Math.round(percentage)}%`;
  }

  private gatherPerformanceMetrics(): Record<string, string | null> {
    return {
      memory_usage:
        document.getElementById("memory-usage")?.textContent || null,
      disk_usage: document.getElementById("disk-usage")?.textContent || null,
      network_io: document.getElementById("network-io")?.textContent || null,
      avg_response:
        document.getElementById("avg-response")?.textContent || null,
      p95_response:
        document.getElementById("p95-response")?.textContent || null,
      max_response:
        document.getElementById("max-response")?.textContent || null,
      active_connections:
        document.getElementById("active-connections")?.textContent || null,
      queue_length:
        document.getElementById("queue-length")?.textContent || null,
      uptime: document.getElementById("system-uptime")?.textContent || null,
    };
  }

  private generateMockHistoricalData(
    timeRange: string,
  ): Array<Record<string, unknown>> {
    const points =
      timeRange === "1h"
        ? 12
        : timeRange === "6h"
          ? 24
          : timeRange === "24h"
            ? 48
            : 168;
    const data = [];

    for (let i = 0; i < points; i++) {
      data.push({
        timestamp: new Date(
          Date.now() - (points - i) * (timeRange === "7d" ? 3600000 : 1800000),
        ).toISOString(),
        memory_usage: Math.floor(Math.random() * 50) + 30,
        response_time: Math.floor(Math.random() * 100) + 20,
      });
    }

    return data;
  }

  private generateMockErrorLogs(): Array<Record<string, unknown>> {
    return [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: "WARN",
        service: "backend",
        message: "High response time detected",
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: "ERROR",
        service: "postgresql",
        message: "Connection timeout",
      },
    ];
  }

  private initializeRawDataPreview(): void {
    const rawData = {
      timestamp: new Date().toISOString(),
      overall_status: "unknown",
      services: {
        frontend: {
          status: "unknown",
          response_time: null,
          last_check: null,
        },
        backend: {
          status: "unknown",
          response_time: null,
          last_check: null,
        },
        postgresql: {
          status: "unknown",
          response_time: null,
          last_check: null,
        },
        redis: {
          status: "unknown",
          response_time: null,
          last_check: null,
        },
      },
    };

    const rawDataEl = document.getElementById("raw-health-data");
    if (rawDataEl) {
      rawDataEl.textContent = JSON.stringify(rawData, null, 2);
    }

    // Update raw data every 10 seconds to simulate real-time updates
    setInterval(() => {
      this.updateRawDataPreview();
    }, 10000);
  }

  private updateRawDataPreview(): void {
    const rawData = {
      timestamp: new Date().toISOString(),
      overall_status: document
        .getElementById("overall-status")
        ?.className.includes("status-up")
        ? "healthy"
        : document
              .getElementById("overall-status")
              ?.className.includes("status-degraded")
          ? "degraded"
          : "unhealthy",
      services: {
        frontend: {
          status: document
            .getElementById("frontend-status")
            ?.className.includes("status-up")
            ? "healthy"
            : "unhealthy",
          response_time: this.extractNumericValue(
            document.getElementById("frontend-latency")?.textContent,
          ),
          last_check: document.getElementById("frontend-last-updated")
            ?.textContent,
        },
        backend: {
          status: document
            .getElementById("backend-status")
            ?.className.includes("status-up")
            ? "healthy"
            : "unhealthy",
          response_time: this.extractNumericValue(
            document.getElementById("backend-latency")?.textContent,
          ),
          last_check: document.getElementById("backend-last-updated")
            ?.textContent,
        },
        postgresql: {
          status: document
            .getElementById("postgresql-status")
            ?.className.includes("status-up")
            ? "healthy"
            : "unhealthy",
          response_time: this.extractNumericValue(
            document.getElementById("postgresql-latency")?.textContent,
          ),
          last_check: document.getElementById("postgresql-last-updated")
            ?.textContent,
        },
        redis: {
          status: document
            .getElementById("redis-status")
            ?.className.includes("status-up")
            ? "healthy"
            : "unhealthy",
          response_time: this.extractNumericValue(
            document.getElementById("redis-latency")?.textContent,
          ),
          last_check:
            document.getElementById("redis-last-updated")?.textContent,
        },
      },
    };

    const rawDataEl = document.getElementById("raw-health-data");
    if (rawDataEl) {
      rawDataEl.textContent = JSON.stringify(rawData, null, 2);
    }

    // Update performance metrics raw data preview
    this.updateRawPerformanceData();
  }

  private updateRawPerformanceData(): void {
    const performanceData = {
      timestamp: new Date().toISOString(),
      system_metrics: {
        memory_usage: this.extractNumericValue(
          document.getElementById("memory-usage")?.textContent,
        ),
        disk_usage: this.extractNumericValue(
          document.getElementById("disk-usage")?.textContent,
        ),
        network_io: this.extractNumericValue(
          document
            .getElementById("network-io")
            ?.textContent?.replace(/[^\d]/g, ""),
        ),
      },
      application_metrics: {
        avg_response: this.extractNumericValue(
          document.getElementById("avg-response")?.textContent,
        ),
        p95_response: this.extractNumericValue(
          document.getElementById("p95-response")?.textContent,
        ),
        max_response: this.extractNumericValue(
          document.getElementById("max-response")?.textContent,
        ),
        active_connections: this.extractNumericValue(
          document.getElementById("active-connections")?.textContent,
        ),
        queue_length: this.extractNumericValue(
          document.getElementById("queue-length")?.textContent,
        ),
        uptime:
          document.getElementById("system-uptime")?.textContent?.trim() ||
          "Unknown",
      },
    };

    const rawPerformanceEl = document.getElementById("raw-performance-data");
    if (rawPerformanceEl) {
      rawPerformanceEl.textContent = JSON.stringify(performanceData, null, 2);
    }
  }

  private extractNumericValue(text: string | null | undefined): number | null {
    if (!text) return null;
    const match = text.match(/(\d+)/);
    return match && match[1] ? parseInt(match[1]) : null;
  }
}

// Initialize dashboard when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new HealthDashboard();
  });
} else {
  new HealthDashboard();
}
