// =============================================================================
// HEALTH UI UTILITIES - EXTRACTED FOR DRY COMPLIANCE
// =============================================================================
// PURPOSE: Shared UI utility functions for health components
// EXTRACTED FROM: RealtimeHealthEnhancer (violating DRY principle)
// FOLLOWS: Interface Segregation Principle - pure functions only
// =============================================================================

/**
 * Get Tailwind CSS color class for health status
 * @param status - Health status string
 * @returns Tailwind CSS background color class
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "up":
      return "bg-green-400";
    case "degraded":
      return "bg-yellow-400";
    case "down":
    case "error":
      return "bg-red-400";
    case "loading":
      return "bg-yellow-400 animate-pulse";
    default:
      return "bg-gray-400";
  }
}

/**
 * Get Tailwind CSS border class for health status
 * @param status - Health status string
 * @returns Tailwind CSS border color class
 */
export function getStatusBorderClass(status: string): string {
  switch (status) {
    case "up":
      return "border-green-200";
    case "degraded":
      return "border-yellow-200";
    case "down":
    case "error":
      return "border-red-200";
    case "loading":
      return "border-yellow-200";
    default:
      return "border-gray-200";
  }
}

/**
 * Get text color class for health status
 * @param status - Health status string
 * @returns Tailwind CSS text color class
 */
export function getStatusTextColor(status: string): string {
  switch (status) {
    case "up":
      return "text-green-600";
    case "degraded":
      return "text-yellow-600";
    case "down":
    case "error":
      return "text-red-600";
    case "loading":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Format response time for display
 * @param responseTime - Response time in milliseconds or string
 * @returns Formatted response time string
 */
export function formatResponseTime(
  responseTime: number | string | undefined,
): string {
  if (responseTime === undefined || responseTime === null) {
    return "N/A";
  }

  if (typeof responseTime === "number") {
    return `${responseTime}ms`;
  }

  if (typeof responseTime === "string") {
    return responseTime;
  }

  return "N/A";
}

/**
 * Get status priority for sorting (lower = higher priority)
 * @param status - Health status string
 * @returns Priority number for sorting
 */
export function getStatusPriority(status: string): number {
  switch (status) {
    case "down":
    case "error":
      return 1; // Highest priority - show errors first
    case "degraded":
      return 2;
    case "loading":
      return 3;
    case "up":
      return 4; // Lowest priority - show healthy services last
    default:
      return 5;
  }
}

/**
 * Check if status indicates a healthy service
 * @param status - Health status string
 * @returns True if service is healthy
 */
export function isHealthyStatus(status: string): boolean {
  return status === "up";
}

/**
 * Check if status indicates an unhealthy service
 * @param status - Health status string
 * @returns True if service is unhealthy
 */
export function isUnhealthyStatus(status: string): boolean {
  return status === "down" || status === "error";
}

/**
 * Check if status indicates a degraded service
 * @param status - Health status string
 * @returns True if service is degraded
 */
export function isDegradedStatus(status: string): boolean {
  return status === "degraded";
}

/**
 * Get human-readable status message
 * @param status - Health status string
 * @returns Human-readable status message
 */
export function getStatusMessage(status: string): string {
  switch (status) {
    case "up":
      return "Service is operational";
    case "degraded":
      return "Service is experiencing issues";
    case "down":
      return "Service is unavailable";
    case "error":
      return "Service encountered an error";
    case "loading":
      return "Checking service status...";
    default:
      return "Service status unknown";
  }
}
