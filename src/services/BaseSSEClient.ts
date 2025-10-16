/**
 * Base SSE Client - SOLID principles with DRY abstraction
 *
 * Abstract base class providing unified SSE connection architecture for frontend.
 * Eliminates 400+ lines of code duplication across SSE services.
 *
 * Following SOLID Principles:
 * - Single Responsibility: Manages SSE lifecycle only
 * - Open/Closed: Extend for new event types, closed for modification
 * - Liskov Substitution: All subclasses work interchangeably
 * - Interface Segregation: Focused interface for SSE operations
 * - Dependency Inversion: Depends on abstractions (fetchEventSource, Logger)
 *
 * REFACTORED: Now uses @microsoft/fetch-event-source for proper cookie support
 * This solves the native EventSource limitation with HTTP-only cookies.
 *
 * Mirrors backend BaseSSEService architecture for consistency.
 */

import { fetchEventSource } from "@microsoft/fetch-event-source";
import { createContextLogger } from "../utils/logger";
import type { ILogger } from "../utils/logger";
import { getApiBaseUrl } from "../constants/api";

/**
 * Base SSE event structure matching backend format
 */
export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Connection status information
 */
export interface ConnectionStatus {
  isConnected: boolean;
  retryCount: number;
  lastError?: string;
}

/**
 * SSE event handler function signature
 */
export type SSEEventHandler<T = SSEEvent> = (event: T) => void | Promise<void>;

/**
 * Internal event handler registry
 */
interface EventHandlerEntry {
  handler: SSEEventHandler<unknown>;
  parseJson: boolean;
}

/**
 * Abstract base class for all frontend SSE clients
 *
 * Subclasses must implement:
 * - getEndpoint(): Return SSE endpoint path
 * - registerEventHandlers(): Set up event listeners
 * - handleConnectionEvent(): Process connection event
 * - handleInitialData(): Process initial data event
 */
export abstract class BaseSSEClient {
  protected isConnected: boolean = false;
  protected retryCount: number = 0;
  protected logger: ILogger;
  protected abortController: AbortController | null = null;

  // Event handler registry for fetch-event-source
  private eventHandlers: Map<string, EventHandlerEntry> = new Map();

  // Configuration constants (can be overridden)
  protected readonly maxRetries: number = 5;
  protected readonly retryDelay: number = 5000; // 5 seconds
  protected readonly backoffFactor: number = 2;

  constructor(
    protected readonly serviceName: string,
    protected readonly withCredentials: boolean = false,
  ) {
    this.logger = createContextLogger(serviceName);
  }

  // ========================================================================
  // ABSTRACT METHODS - Subclasses MUST implement these
  // ========================================================================

  /**
   * Return SSE endpoint path (e.g., "/performance/stream", "/jobs/stream")
   */
  protected abstract getEndpoint(): string;

  /**
   * Register event handlers specific to this SSE endpoint.
   * Called after connection is established.
   */
  protected abstract registerEventHandlers(): void;

  /**
   * Handle connection event from backend.
   * Default implementation logs the event.
   */
  protected abstract handleConnectionEvent(
    event: MessageEvent,
  ): void | Promise<void>;

  /**
   * Handle initial data event from backend.
   * Default implementation should be overridden by subclasses.
   */
  protected abstract handleInitialData(
    event: MessageEvent,
  ): void | Promise<void>;

  // ========================================================================
  // OPTIONAL HOOKS - Subclasses CAN override these
  // ========================================================================

  /**
   * Get base URL for SSE connection.
   * Override if using different URL strategy (e.g., window.location.origin).
   */
  protected getBaseUrl(): string {
    return getApiBaseUrl();
  }

  /**
   * Build complete SSE URL with base URL + endpoint.
   */
  protected buildUrl(): string {
    const baseUrl = this.getBaseUrl();
    const endpoint = this.getEndpoint();
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Hook called before connection attempt.
   * Return false to abort connection.
   */
  protected beforeConnect(): boolean {
    return true;
  }

  /**
   * Hook called after successful connection.
   */
  protected afterConnect(): void {
    // Optional override point
  }

  /**
   * Hook called when connection is closed.
   */
  protected onDisconnect(): void {
    // Optional override point
  }

  /**
   * Determine if error should trigger retry.
   */
  protected shouldRetry(error: unknown): boolean {
    // Don't retry on 401/403 (authentication errors)
    const errorWithStatus = error as { status?: number };
    if (errorWithStatus?.status === 401 || errorWithStatus?.status === 403) {
      return false;
    }
    return this.retryCount < this.maxRetries;
  }

  // ========================================================================
  // CORE SSE LIFECYCLE - Do not override these methods
  // ========================================================================

  /**
   * Connect to SSE endpoint with retry logic using fetch-event-source.
   */
  async connect(): Promise<void> {
    this.logger.info(`${this.serviceName} connect() called`);

    // Skip if already connected
    if (this.abortController && this.isConnected) {
      this.logger.warn(`${this.serviceName} already connected, skipping`);
      return;
    }

    // Allow subclass to abort connection
    if (!this.beforeConnect()) {
      this.logger.info(
        `${this.serviceName} connection aborted by beforeConnect()`,
      );
      return;
    }

    try {
      const sseUrl = this.buildUrl();
      this.logger.info(`${this.serviceName} connecting to:`, { sseUrl });

      // Clear event handlers before registering new ones
      this.eventHandlers.clear();

      // Register subclass-specific handlers
      this.registerEventHandlers();

      // Register connection and initial-data handlers (common to all SSE)
      this.on(
        "connection",
        (event: MessageEvent) => this.handleConnectionEvent(event),
        false,
      );
      this.on(
        "initial-data",
        (event: MessageEvent) => this.handleInitialData(event),
        false,
      );

      // Create abort controller for this connection
      this.abortController = new AbortController();

      // Connect using fetch-event-source (properly sends cookies!)
      await fetchEventSource(sseUrl, {
        signal: this.abortController.signal,
        credentials: this.withCredentials ? "include" : "same-origin",

        onopen: async (response) => {
          if (response.ok) {
            this.isConnected = true;
            this.retryCount = 0;
            this.logger.info(
              `${this.serviceName} connection opened successfully`,
            );
            this.afterConnect();
          } else if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            // Client error (except 429) - don't retry
            this.logger.error(`${this.serviceName} connection failed:`, {
              status: response.status,
              statusText: response.statusText,
            });
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        },

        onmessage: (event) => {
          // Route message to appropriate handler based on event type
          const handler = this.eventHandlers.get(event.event || "message");
          if (handler) {
            try {
              this.logger.debug(
                `${this.serviceName} ${event.event} event received:`,
                {
                  data: event.data,
                },
              );

              if (handler.parseJson) {
                const parsedData = JSON.parse(event.data);
                handler.handler(parsedData);
              } else {
                // Create MessageEvent-like object for backward compatibility
                const messageEvent = {
                  data: event.data,
                  type: event.event,
                  lastEventId: event.id,
                } as MessageEvent;
                handler.handler(messageEvent);
              }
            } catch (error) {
              this.logger.error(
                `${this.serviceName} error processing ${event.event} event:`,
                {
                  error,
                },
              );
            }
          }
        },

        onerror: (error) => {
          this.isConnected = false;
          this.logger.error(`${this.serviceName} connection error:`, { error });

          // Check if we should retry
          if (this.shouldRetry(error)) {
            this._handleRetry();
            // Return retry interval (in ms)
            const baseDelay =
              this.retryDelay * Math.pow(this.backoffFactor, this.retryCount);
            const jitter = baseDelay * 0.2 * (Math.random() - 0.5);
            return Math.round(baseDelay + jitter);
          } else {
            // Don't retry - throw to stop the connection
            throw error;
          }
        },

        onclose: () => {
          this.isConnected = false;
          this.logger.info(`${this.serviceName} connection closed by server`);
          this.onDisconnect();
        },
      });
    } catch (error) {
      this.logger.error(
        `${this.serviceName} failed to create SSE connection:`,
        { error },
      );
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from SSE endpoint.
   */
  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isConnected = false;
    this.logger.info(`${this.serviceName} connection closed`);

    // Notify subclass
    this.onDisconnect();
  }

  /**
   * Get current connection status.
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.isConnected,
      retryCount: this.retryCount,
    };
  }

  /**
   * Register a custom event handler.
   * Helper method for subclasses to use in registerEventHandlers().
   */
  protected on<T = SSEEvent>(
    eventName: string,
    handler: SSEEventHandler<T>,
    parseJson: boolean = true,
  ): void {
    // Store handler in registry for fetchEventSource onmessage routing
    this.eventHandlers.set(eventName, {
      handler: handler as SSEEventHandler<unknown>,
      parseJson,
    });
  }

  // ========================================================================
  // PRIVATE IMPLEMENTATION - Do not override
  // ========================================================================

  /**
   * Handle retry with exponential backoff and jitter.
   */
  private _handleRetry(): void {
    this.retryCount++;

    this.logger.info(`${this.serviceName} will retry connection:`, {
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
    });
  }
}
