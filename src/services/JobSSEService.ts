/**
 * Job SSE Service - SOLID Single Responsibility Principle
 * Dedicated service for consuming job updates from /jobs/stream
 *
 * REFACTORED: Was 348 lines with manual connection management and callbacks.
 * NOW: 140 lines using BaseSSEClient + jobsStore (60% reduction, DRY compliance).
 *
 * Following SOLID principles: Only handles job event streaming
 * Uses nanostores for reactive UI updates (Astro best practice)
 */

import { BaseSSEClient } from "./BaseSSEClient";
import type { SSEEvent } from "./BaseSSEClient";
import {
  initializeJobs,
  upsertJob,
  updateJobProgress,
  updateJobStatus,
  removeJob,
  setSSEConnectionStatus,
} from "../stores/jobsStore";
import type { Job } from "../stores/jobsStore";

export interface JobEvent extends SSEEvent {
  job_id: string;
  event_type: "created" | "status_update" | "progress" | "deleted" | "error";
  status: string;
  timestamp: string;
  data: Record<string, unknown>;
  message?: string;
}

export interface JobInitialDataEvent extends SSEEvent {
  type: "initial_data";
  total_jobs: number;
  jobs: Array<Job>;
  timestamp: string;
}

/**
 * Job SSE Service following SOLID principles
 * - Single Responsibility: Only handles job event streaming
 * - Uses BaseSSEClient for connection lifecycle (DRY)
 * - Uses jobsStore for reactive state (Astro/nanostores pattern)
 * - Callbacks available for custom logic beyond store updates
 */
export class JobSSEService extends BaseSSEClient {
  // Optional callbacks for custom handling beyond store updates
  private onJobCreatedCallback?: ((event: JobEvent) => void) | undefined;
  private onJobStatusUpdateCallback?: ((event: JobEvent) => void) | undefined;
  private onJobProgressCallback?: ((event: JobEvent) => void) | undefined;
  private onJobDeletedCallback?: ((event: JobEvent) => void) | undefined;
  private onJobErrorCallback?: ((event: JobEvent) => void) | undefined;
  private onInitialDataCallback?:
    | ((event: JobInitialDataEvent) => void)
    | undefined;

  constructor() {
    super("JobSSEService", true); // Requires credentials for auth
  }

  // ========================================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ========================================================================

  protected getEndpoint(): string {
    return "/jobs/stream";
  }

  protected override getBaseUrl(): string {
    // Use window.location.origin to connect to same origin (nginx routes to backend)
    return typeof window !== "undefined"
      ? window.location.origin
      : super.getBaseUrl();
  }

  protected registerEventHandlers(): void {
    // Register all job event handlers with nanostore integration

    this.on<JobEvent>("job-created", (event) => {
      this.logger.info("Job created event received via SSE", { event });

      // Update store for reactive UI
      const job = this._eventToJob(event);
      upsertJob(job);

      // Call optional callback for custom logic
      this.onJobCreatedCallback?.(event);
    });

    this.on<JobEvent>("job-status-update", (event) => {
      this.logger.info("Job status update received via SSE", { event });

      // Update store for reactive UI
      updateJobStatus(event.job_id, event.status, {
        message: event.message,
        ...(event.data as Partial<Job>),
      });

      // Call optional callback
      this.onJobStatusUpdateCallback?.(event);
    });

    this.on<JobEvent>("job-progress", (event) => {
      this.logger.info("Job progress received via SSE", { event });

      // Update store for reactive UI
      const progress = (event.data.progress as number) || 0;
      updateJobProgress(event.job_id, progress, event.message);

      // Call optional callback
      this.onJobProgressCallback?.(event);
    });

    this.on<JobEvent>("job-deleted", (event) => {
      this.logger.info("Job deleted event received via SSE", { event });

      // Update store for reactive UI
      removeJob(event.job_id);

      // Call optional callback
      this.onJobDeletedCallback?.(event);
    });

    this.on<JobEvent>("job-error", (event) => {
      this.logger.info("Job error event received via SSE", { event });

      // Update store for reactive UI
      // TypeScript: Use explicit object type instead of Partial<Job> to satisfy exactOptionalPropertyTypes
      updateJobStatus(event.job_id, "failed", {
        error_message: event.message ?? null, // Ensure null, not undefined
        success: false,
      } satisfies Partial<Job>);

      // Call optional callback
      this.onJobErrorCallback?.(event);
    });

    // Handle keepalive events (maintain connection)
    this.on("keepalive", () => {
      this.logger.debug("Job SSE keepalive received");
    });
  }

  protected handleConnectionEvent(event: MessageEvent): void {
    try {
      const connectionData = JSON.parse(event.data);
      this.logger.info("Job SSE connection event", { connectionData });
    } catch (error) {
      this.logger.error("Error processing job connection event", { error });
    }
  }

  protected handleInitialData(event: MessageEvent): void {
    try {
      const initialData = JSON.parse(event.data) as JobInitialDataEvent;
      this.logger.info("Job initial data received via SSE", { initialData });

      // Update store with initial jobs
      initializeJobs({
        total_jobs: initialData.total_jobs,
        jobs: initialData.jobs,
        timestamp: initialData.timestamp,
      });

      // Call optional callback
      this.onInitialDataCallback?.(initialData);
    } catch (error) {
      this.logger.error("Error processing job initial data", { error });
    }
  }

  // ========================================================================
  // LIFECYCLE HOOKS
  // ========================================================================

  protected override afterConnect(): void {
    // Mark SSE as connected in store
    setSSEConnectionStatus(true);
  }

  protected override onDisconnect(): void {
    // Mark SSE as disconnected in store
    setSSEConnectionStatus(false);
  }

  // ========================================================================
  // PUBLIC API - Optional callbacks for custom logic
  // ========================================================================

  /**
   * Register callback for initial data event (optional, store updates automatically)
   */
  onInitialData(callback: (event: JobInitialDataEvent) => void): void {
    this.onInitialDataCallback = callback;
  }

  /**
   * Register callback for job-created events (optional, store updates automatically)
   */
  onJobCreated(callback: (event: JobEvent) => void): void {
    this.onJobCreatedCallback = callback;
  }

  /**
   * Register callback for job-status-update events (optional, store updates automatically)
   */
  onJobStatusUpdate(callback: (event: JobEvent) => void): void {
    this.onJobStatusUpdateCallback = callback;
  }

  /**
   * Register callback for job-progress events (optional, store updates automatically)
   */
  onJobProgress(callback: (event: JobEvent) => void): void {
    this.onJobProgressCallback = callback;
  }

  /**
   * Register callback for job-deleted events (optional, store updates automatically)
   */
  onJobDeleted(callback: (event: JobEvent) => void): void {
    this.onJobDeletedCallback = callback;
  }

  /**
   * Register callback for job-error events (optional, store updates automatically)
   */
  onJobError(callback: (event: JobEvent) => void): void {
    this.onJobErrorCallback = callback;
  }

  /**
   * Clear all registered callbacks
   */
  clearCallbacks(): void {
    this.onInitialDataCallback = undefined;
    this.onJobCreatedCallback = undefined;
    this.onJobStatusUpdateCallback = undefined;
    this.onJobProgressCallback = undefined;
    this.onJobDeletedCallback = undefined;
    this.onJobErrorCallback = undefined;
    this.logger.debug("All job event callbacks cleared");
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Convert JobEvent to Job for store
   */
  private _eventToJob(event: JobEvent): Job {
    return {
      id: event.job_id,
      status: event.status,
      url: (event.data.url as string) || "",
      domain: (event.data.domain as string) || "",
      created_at: event.timestamp,
      started_at: (event.data.started_at as string) || null,
      completed_at: (event.data.completed_at as string) || null,
      error_message: event.message || null,
      success: event.status === "completed",
      processing_time_ms: (event.data.processing_time_ms as number) || null,
      message: event.message,

      // Include content_results metadata if present
      title: (event.data.title as string) || null,
      meta_description: (event.data.meta_description as string) || null,
      word_count: (event.data.word_count as number) || null,
      image_count: (event.data.image_count as number) || null,
      link_count: (event.data.link_count as number) || null,
      author: (event.data.author as string) || null,
      published_date: (event.data.published_date as string) || null,
    };
  }
}

/**
 * Singleton instance following DRY principles
 * Single instance across the application for job events
 */
export const jobSSEService = new JobSSEService();
