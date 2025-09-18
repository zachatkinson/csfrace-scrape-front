/**
 * Health Monitoring SSE Stream API Route
 * Refactored to follow SOLID principles and use astro:env
 */

import type { APIRoute } from "astro";

import {
  HealthService,
  HealthServiceError,
  type HealthResponse,
  type ServiceUpdate,
} from "../../../services/HealthService";
import { SSEStreamService } from "../../../services/SSEStreamService";
import {
  ssePerformanceService,
  type AdaptivePollingResult,
} from "../../../services/SSEPerformanceService";
import { webSocketFallbackService } from "../../../services/WebSocketFallbackService";
import { createContextLogger } from "../../../utils/logger";

const logger = createContextLogger("HealthStreamAPI");

export const GET: APIRoute = async ({ request }) => {
  // Check connection limits following performance optimization principles
  if (!ssePerformanceService.canAcceptConnection()) {
    return new Response(
      JSON.stringify({
        error: "Too many concurrent connections",
        maxConnections: ssePerformanceService.getMetrics().maxConnections,
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Register connection
  const connectionRegistered = ssePerformanceService.registerConnection();
  if (!connectionRegistered) {
    return new Response(
      JSON.stringify({
        error: "Failed to register connection",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Initialize services following Dependency Inversion Principle
  const healthService = new HealthService(import.meta.env.SERVER_API_BASE_URL);
  const sseService = new SSEStreamService();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectionMessage = sseService.createConnectionMessage();
      if (!sseService.sendMessage(controller, connectionMessage)) {
        return; // Controller already closed
      }

      let intervalId: number;
      let lastHealthData: HealthResponse | null = null;
      let currentPollingConfig: AdaptivePollingResult = {
        interval: 30000, // Default 30s interval
        strategy: "normal",
        reason: "Initial configuration",
      };

      // Create debounced update function to prevent rapid-fire updates
      const debouncedSendUpdates =
        ssePerformanceService.createDebouncedFunction(
          (changes: ServiceUpdate[]) => {
            for (const change of changes) {
              const updateMessage =
                sseService.createServiceUpdateMessage(change);
              if (!sseService.sendMessage(controller, updateMessage)) {
                return; // Controller closed
              }
            }
          },
          "health-updates",
        );

      const fetchAndCompareHealth = async () => {
        // Check if controller is still open
        if (!sseService.isControllerOpen(controller, request)) {
          logger.info(
            "SSE Controller closed or request aborted, stopping health fetch",
          );
          return;
        }

        try {
          const currentHealthData = await healthService.fetchHealthData();

          // If this is the first fetch, send all services
          if (!lastHealthData) {
            await sendAllServices(
              controller,
              sseService,
              healthService,
              currentHealthData,
            );
            lastHealthData = currentHealthData;

            // Set initial adaptive polling
            currentPollingConfig =
              ssePerformanceService.getAdaptivePollingInterval(
                currentHealthData,
              );
            logger.info(
              `Initial SSE polling: ${currentPollingConfig.interval}ms (${currentPollingConfig.strategy}) - ${currentPollingConfig.reason}`,
            );

            // Enable WebSocket fallback if needed for critical scenarios
            webSocketFallbackService.enableForCriticalScenarios(
              currentHealthData,
            );
            return;
          }

          // Compare with previous data and send updates only for changed services
          const changes = healthService.detectServiceChanges(
            currentHealthData,
            lastHealthData,
          );

          // Send updates through debounced function to prevent spam
          if (changes.length > 0) {
            debouncedSendUpdates(changes);
          }

          // Check if we need to adjust polling interval based on system health
          const newPollingConfig =
            ssePerformanceService.getAdaptivePollingInterval(currentHealthData);
          if (newPollingConfig.interval !== currentPollingConfig.interval) {
            currentPollingConfig = newPollingConfig;
            logger.info(
              `SSE polling adjusted: ${currentPollingConfig.interval}ms (${currentPollingConfig.strategy}) - ${currentPollingConfig.reason}`,
            );

            // Restart interval with new timing
            clearInterval(intervalId);
            startAdaptivePolling();
          }

          // Update WebSocket fallback based on current health
          webSocketFallbackService.enableForCriticalScenarios(
            currentHealthData,
          );

          lastHealthData = currentHealthData;
        } catch (error) {
          // Send error event
          const errorMessage = sseService.createErrorMessage(
            "backend",
            error instanceof HealthServiceError
              ? error.message
              : "Unknown error",
          );
          sseService.sendMessage(controller, errorMessage);
        }
      };

      const startAdaptivePolling = () => {
        intervalId = window.setInterval(() => {
          if (sseService.isControllerOpen(controller, request)) {
            fetchAndCompareHealth().catch((error) => {
              console.error("SSE health fetch error:", error);
            });
          } else {
            // Controller is closed, clear interval
            clearInterval(intervalId);
            ssePerformanceService.unregisterConnection();
          }
        }, currentPollingConfig.interval);
      };

      // Initial health check
      fetchAndCompareHealth();

      // Start adaptive polling
      setTimeout(() => {
        startAdaptivePolling();
      }, 1000); // Small delay to let initial fetch complete

      // Cleanup function with connection management
      const cleanup = () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        // Unregister connection from performance service
        ssePerformanceService.unregisterConnection();
        // Clean up performance service resources
        ssePerformanceService.cleanup();
        // Clean up WebSocket fallback
        webSocketFallbackService.cleanup();
        logger.info("SSE connection cleaned up, active connections:", {
          activeConnections:
            ssePerformanceService.getMetrics().activeConnections,
        });
      };

      // Handle client disconnect
      request.signal?.addEventListener("abort", () => {
        logger.info("Client disconnected, cleaning up SSE stream");
        cleanup();
      });
    },
  });

  return new Response(stream, { headers: sseService.getSSEHeaders() });
};

/**
 * Send all services initial status - following DRY principle
 * @param controller Stream controller
 * @param sseService SSE service
 * @param healthService Health service
 * @param healthData Current health data
 */
async function sendAllServices(
  controller: ReadableStreamDefaultController,
  sseService: SSEStreamService,
  healthService: HealthService,
  healthData: HealthResponse,
): Promise<void> {
  const services = ["frontend", "backend", "database", "cache"];

  for (const serviceName of services) {
    let serviceData: ServiceUpdate | undefined;

    switch (serviceName) {
      case "frontend":
        serviceData = createFrontendServiceData(healthData.timestamp);
        break;
      case "backend":
        serviceData = healthService.createBackendServiceUpdate(healthData);
        break;
      case "database":
        serviceData = healthService.createDatabaseServiceUpdate(healthData);
        break;
      case "cache":
        serviceData = healthService.createCacheServiceUpdate(healthData);
        break;
    }

    if (serviceData) {
      const updateMessage = sseService.createServiceUpdateMessage(serviceData);
      if (!sseService.sendMessage(controller, updateMessage)) {
        return; // Controller closed
      }
    }
  }
}

/**
 * Create frontend service data - DRY helper function
 * @param timestamp Backend timestamp for consistency
 */
function createFrontendServiceData(timestamp: string): ServiceUpdate {
  return {
    service: "frontend",
    status: "healthy", // Frontend is healthy if we can run this code
    timestamp,
    data: {
      version: import.meta.env.PUBLIC_ASTRO_VERSION || "unknown",
      port: import.meta.env.PUBLIC_SERVER_PORT || 3000,
      framework: "Astro + React + TypeScript",
      response_time_ms: 0, // Immediate for frontend
    },
  };
}
