/**
 * Backend Health Checker - Single Responsibility
 * Handles health checking specifically for the backend API service
 */

import { BaseHealthChecker } from "./health-checker-base";
import { HealthUIHelper } from "../utils/health-ui";
import type { IServiceResult } from "../types/health";

export class BackendHealthChecker extends BaseHealthChecker {
  readonly serviceName = "Backend API";
  readonly endpoint: string;

  constructor(apiBaseUrl: string) {
    super();
    this.endpoint = `${apiBaseUrl}/health`;
  }

  async checkHealth(): Promise<IServiceResult> {
    const startTime = performance.now();

    try {
      const response = await this.fetchWithTimeout(this.endpoint);
      const responseTime = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return this.createResult(
          "error",
          `HTTP ${response.status}: ${response.statusText}`,
          { responseTime },
          `Backend API returned ${response.status}`,
        );
      }

      const data = await response.json();

      if (data.status === "healthy") {
        return this.createResult("up", "Backend API is operational", {
          responseTime,
          version: data.version,
        });
      } else {
        return this.createResult("degraded", "Backend API reports issues", {
          responseTime,
          details: data.details,
        });
      }
    } catch (error: unknown) {
      const responseTime = Math.round(performance.now() - startTime);

      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        return this.createResult(
          "error",
          "Backend API request timed out",
          { responseTime },
          "Request timeout",
        );
      }

      const errorMessage =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unknown error occurred";

      return this.createResult(
        "error",
        "Backend API is unreachable",
        { responseTime },
        errorMessage,
      );
    }
  }

  updateUI(result: IServiceResult): void {
    HealthUIHelper.updateStatusIndicator("backend-status", result.status);
    HealthUIHelper.updateTextElement("backend-message", result.message);
    HealthUIHelper.updateLatencyElement(
      "backend-latency",
      `${result.metrics.responseTime}ms`,
      result.metrics.responseTime || 0,
      "API",
    );
    HealthUIHelper.updateLastRefresh("backend-last-updated");
  }
}
