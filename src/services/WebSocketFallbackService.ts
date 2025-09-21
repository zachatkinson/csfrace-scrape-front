/**
 * WebSocket Fallback Service - SOLID Open/Closed Principle
 * Provides WebSocket fallback for critical real-time alerts
 * Following DRY principles and extending SSE architecture
 */

// Removed problematic astro:env/server import - use runtime environment
const SERVER_API_BASE_URL = "http://localhost";
import type { HealthResponse } from "./HealthService";
import { createContextLogger } from "../utils/logger";

const logger = createContextLogger("WebSocketFallbackService");

export type CriticalAlertType =
  | "system_down"
  | "database_failed"
  | "cache_failed"
  | "severe_degradation";

export interface CriticalAlert {
  type: CriticalAlertType;
  severity: "critical" | "high";
  message: string;
  timestamp: string;
  healthData?: Partial<HealthResponse>;
  actionRequired: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

/**
 * WebSocket service for critical alerts
 * Implements fallback pattern for when SSE is insufficient
 * - Single Responsibility: Only handles critical real-time alerts
 * - Open/Closed: Extendable for new alert types
 * - Interface Segregation: Focused on critical scenarios
 */
export class WebSocketFallbackService {
  private websocket: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private eventListeners: Map<string, Set<(...args: unknown[]) => void>> =
    new Map();
  private isEnabled: boolean = false;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: this.buildWebSocketUrl(),
      reconnectDelay: 5000, // 5 seconds
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Enable WebSocket fallback for critical scenarios
   * Only activates when system health is degraded
   */
  enableForCriticalScenarios(healthData: HealthResponse): boolean {
    const shouldEnable = this.shouldEnableWebSocket(healthData);

    if (shouldEnable && !this.isEnabled) {
      logger.info("WebSocket fallback enabled for critical scenarios");
      this.connect();
      this.isEnabled = true;
      return true;
    } else if (!shouldEnable && this.isEnabled) {
      logger.info("WebSocket fallback disabled - system stable");
      this.disconnect();
      this.isEnabled = false;
      return false;
    }

    return this.isEnabled;
  }

  /**
   * Add event listener for critical alerts
   */
  addEventListener(
    event: "critical-alert" | "connection-status",
    callback: (...args: unknown[]) => void,
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    event: string,
    callback: (...args: unknown[]) => void,
  ): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status and metrics
   */
  getStatus(): {
    connected: boolean;
    enabled: boolean;
    reconnectAttempts: number;
    maxAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      enabled: this.isEnabled,
      reconnectAttempts: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.disconnect();
    this.eventListeners.clear();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Private method to build WebSocket URL from HTTP API URL
   */
  private buildWebSocketUrl(): string {
    const url = new URL(SERVER_API_BASE_URL);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}/ws/critical-alerts`;
  }

  /**
   * Determine if WebSocket should be enabled based on health data
   */
  private shouldEnableWebSocket(healthData: HealthResponse): boolean {
    const criticalConditions = [
      // System-level failures
      healthData.status === "unhealthy" || healthData.status === "error",

      // Database critical issues
      healthData.database.status === "unhealthy" ||
        healthData.database.status === "error" ||
        !healthData.database.connected ||
        healthData.database.response_time_ms > 1000, // 1 second threshold

      // Cache critical issues
      healthData.cache.status === "unhealthy" ||
        healthData.cache.status === "error" ||
        !healthData.cache.connected ||
        healthData.cache.response_time_ms > 500, // 500ms threshold

      // Performance degradation
      healthData.database.active_connections > 100, // High load
      healthData.cache.connected_clients < 1, // Cache connectivity issues
    ];

    return criticalConditions.some((condition) => condition);
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    try {
      logger.info("Connecting to WebSocket", { url: this.config.url });
      this.websocket = new WebSocket(this.config.url);

      this.websocket.onopen = () => {
        logger.info("WebSocket connected for critical alerts");
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emitEvent("connection-status", { connected: true });
      };

      this.websocket.onmessage = (event) => {
        try {
          const alert: CriticalAlert = JSON.parse(event.data);
          logger.warn("Critical alert received", { alert });
          this.emitEvent("critical-alert", alert);
        } catch (error) {
          logger.error("Failed to parse WebSocket message", { error });
        }
      };

      this.websocket.onclose = (event) => {
        logger.info("WebSocket closed", {
          code: event.code,
          reason: event.reason,
        });
        this.stopHeartbeat();
        this.emitEvent("connection-status", { connected: false });

        if (this.isEnabled) {
          this.scheduleReconnect();
        }
      };

      this.websocket.onerror = (error) => {
        logger.error("WebSocket error", { error });
      };
    } catch (error) {
      logger.error("Failed to create WebSocket connection", { error });
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  private disconnect(): void {
    this.stopHeartbeat();

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error("Max WebSocket reconnection attempts reached");
      this.isEnabled = false;
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.config.reconnectDelay *
      Math.pow(2, Math.min(this.reconnectAttempts, 5)); // Exponential backoff

    logger.info("Scheduling WebSocket reconnect", {
      delay,
      attempt: this.reconnectAttempts,
    });

    this.reconnectTimer = window.setTimeout(() => {
      if (this.isEnabled) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(
          JSON.stringify({ type: "ping", timestamp: new Date().toISOString() }),
        );
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Emit event to registered listeners
   */
  private emitEvent(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          logger.error("Error in WebSocket event listener", { event, error });
        }
      });
    }
  }
}

/**
 * Singleton instance for application-wide WebSocket fallback
 * Following DRY principles
 */
export const webSocketFallbackService = new WebSocketFallbackService();
