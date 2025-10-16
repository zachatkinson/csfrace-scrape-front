/**
 * Health Service - SOLID Single Responsibility Principle
 * Handles all backend health monitoring operations
 */

// Use runtime environment variable for API base URL
const SERVER_API_BASE_URL =
  import.meta.env.PUBLIC_API_URL || "https://localhost";

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  database: {
    status: string;
    connected: boolean;
    response_time_ms: number;
    size: string;
    size_bytes: number;
    active_connections: number;
    cache_hit_ratio: string;
  };
  cache: {
    status: string;
    connected: boolean;
    response_time_ms: number;
    backend: string;
    version: string;
    mode: string;
    used_memory: string;
    connected_clients: number;
    hit_rate: number;
    uptime: string;
    architecture: string;
    os: string;
    total_entries: number;
    total_operations: number;
    monitoring: {
      hits: number;
      misses: number;
      sets: number;
      deletes: number;
    };
  };
  monitoring: {
    metricsCollector: string;
    healthChecker: string;
    alertManager: string;
    performanceMonitor: string;
    observabilityManager: string;
  };
}

export interface ServiceUpdate {
  service: string;
  status: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Health Service implementation following SOLID principles
 * - Single Responsibility: Only handles health monitoring
 * - Open/Closed: Extendable for new health checks
 * - Liskov Substitution: Can be substituted by any IHealthService implementation
 * - Interface Segregation: Focused interface for health operations
 * - Dependency Inversion: Depends on abstractions, not concretions
 */
export class HealthService {
  private readonly backendUrl: string;
  private readonly timeout: number;

  constructor(
    backendUrl: string = SERVER_API_BASE_URL,
    timeout: number = 5000,
  ) {
    this.backendUrl = backendUrl;
    this.timeout = timeout;
  }

  /**
   * Fetch health data from backend API
   * @throws {HealthServiceError} When health check fails
   */
  async fetchHealthData(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/health/`, {
        signal: AbortSignal.timeout(this.timeout),
        headers: {
          Accept: "application/json",
          "User-Agent": "CSFrace-Frontend-Health/1.0",
        },
      });

      if (!response.ok) {
        throw new HealthServiceError(
          `Health check failed: ${response.status}`,
          "HEALTH_CHECK_FAILED",
          response.status,
        );
      }

      return (await response.json()) as HealthResponse;
    } catch (error) {
      if (error instanceof HealthServiceError) {
        throw error;
      }

      // Handle network and timeout errors
      if (error instanceof Error) {
        if (error.name === "TimeoutError") {
          throw new HealthServiceError(
            "Health check timed out",
            "TIMEOUT",
            408,
          );
        }
        throw new HealthServiceError(error.message, "NETWORK_ERROR", 0);
      }

      throw new HealthServiceError(
        "Unknown error during health check",
        "UNKNOWN_ERROR",
        0,
      );
    }
  }

  /**
   * Create service update for frontend service
   */
  createFrontendServiceUpdate(timestamp: string): ServiceUpdate {
    return {
      service: "frontend",
      status: "healthy", // Frontend is healthy if we can run this code
      timestamp,
      data: {
        version: "5.13.7", // Will be replaced by astro:env
        port: 3000, // Will be replaced by astro:env
        framework: "Astro + React + TypeScript",
        response_time_ms: 0, // Immediate for frontend
      },
    };
  }

  /**
   * Create service update for backend service
   */
  createBackendServiceUpdate(healthData: HealthResponse): ServiceUpdate {
    return {
      service: "backend",
      status: healthData.status,
      timestamp: healthData.timestamp,
      data: {
        version: healthData.version,
        framework: "FastAPI + Python 3.13", // Will be replaced by astro:env
        port: 8000, // Will be replaced by astro:env
        response_time_ms: 1, // Minimal since we just fetched
      },
    };
  }

  /**
   * Create service update for database service
   */
  createDatabaseServiceUpdate(healthData: HealthResponse): ServiceUpdate {
    return {
      service: "database",
      status: healthData.database.status,
      timestamp: healthData.timestamp,
      data: healthData.database,
    };
  }

  /**
   * Create service update for cache service
   */
  createCacheServiceUpdate(healthData: HealthResponse): ServiceUpdate {
    return {
      service: "cache",
      status: healthData.cache.status,
      timestamp: healthData.timestamp,
      data: healthData.cache,
    };
  }

  /**
   * Compare two health responses and detect changes
   * Simplified: Backend SSE now handles intelligent change detection with thresholds.
   * Frontend only checks for status changes (critical events).
   * Returns array of services that have changed significantly
   */
  detectServiceChanges(
    current: HealthResponse,
    previous: HealthResponse,
  ): ServiceUpdate[] {
    const changes: ServiceUpdate[] = [];

    // Check backend status change
    if (current.status !== previous.status) {
      changes.push(this.createBackendServiceUpdate(current));
    }

    // Check database status change
    if (current.database.status !== previous.database.status) {
      changes.push(this.createDatabaseServiceUpdate(current));
    }

    // Check cache status change
    if (current.cache.status !== previous.cache.status) {
      changes.push(this.createCacheServiceUpdate(current));
    }

    return changes;
  }
}

/**
 * Custom error class for health service operations
 */
export class HealthServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "HealthServiceError";
  }
}
