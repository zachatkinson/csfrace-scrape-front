/**
 * Centralized Jobs Data Store
 * Following Astro best practices with Nano Stores
 * Mirrors healthStore.ts architecture for consistency
 *
 * Features:
 * - Type-safe job data management
 * - Reactive updates from JobSSEService
 * - Single source of truth for all job data
 * - Framework-agnostic (works with Astro, React, vanilla JS)
 * - DRY compliance with computed stores
 */

import { atom, map, computed } from "nanostores";
import { createContextLogger } from "../utils/logger";

const logger = createContextLogger("JobsStore");

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Job {
  id: string;
  url: string;
  domain: string;
  status: string;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  success: boolean;
  processing_time_ms: number | null;
  progress?: number | undefined; // 0-100 percentage
  message?: string | undefined;

  // Embedded content_results metadata (from content_results table)
  title?: string | null | undefined;
  meta_description?: string | null | undefined;
  word_count?: number | null | undefined;
  image_count?: number | null | undefined;
  link_count?: number | null | undefined;
  author?: string | null | undefined;
  published_date?: string | null | undefined;
}

export interface JobsMetadata {
  total_jobs: number;
  timestamp: string;
  lastUpdate: Date | null;
  sseConnected: boolean;
}

export interface JobsState {
  jobs: Map<string, Job>; // Map by job ID for O(1) lookup
  metadata: JobsMetadata;
}

// =============================================================================
// NANO STORES - SINGLE SOURCE OF TRUTH
// =============================================================================

/**
 * Core jobs data store
 * Uses Map for efficient job lookup by ID
 */
export const $jobsData = map<JobsState>({
  jobs: new Map<string, Job>(),
  metadata: {
    total_jobs: 0,
    timestamp: new Date().toISOString(),
    lastUpdate: null,
    sseConnected: false,
  },
});

/**
 * SSE connection status
 * Tracks if JobSSEService is connected
 */
export const $jobsSSEConnected = atom<boolean>(false);

// =============================================================================
// COMPUTED STORES
// =============================================================================

/**
 * Computed: All jobs as array (for rendering)
 * Automatically recalculates when jobs data changes
 */
export const $jobsList = computed($jobsData, (state) => {
  return Array.from(state.jobs.values());
});

/**
 * Computed: Jobs grouped by status
 * Useful for status-based filtering in UI
 */
export const $jobsByStatus = computed($jobsData, (state) => {
  const jobs = Array.from(state.jobs.values());
  return {
    pending: jobs.filter((j) => j.status === "pending"),
    processing: jobs.filter((j) => j.status === "processing"),
    completed: jobs.filter((j) => j.status === "completed"),
    failed: jobs.filter((j) => j.status === "failed"),
    all: jobs,
  };
});

/**
 * Computed: Job metrics
 * Statistics about job statuses
 */
export const $jobMetrics = computed($jobsData, (state) => {
  const jobs = Array.from(state.jobs.values());
  return {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    successRate:
      jobs.length > 0
        ? (jobs.filter((j) => j.success).length / jobs.length) * 100
        : 0,
  };
});

// =============================================================================
// STORE ACTIONS - SINGLE RESPONSIBILITY FUNCTIONS
// =============================================================================

/**
 * Initialize jobs with initial data from SSE
 * Called when JobSSEService receives "initial-data" event
 */
export function initializeJobs(data: {
  total_jobs: number;
  jobs: Array<Job>;
  timestamp: string;
}): void {
  logger.info("Initializing jobs store with SSE data", {
    total_jobs: data.total_jobs,
    job_count: data.jobs.length,
  });

  const jobsMap = new Map<string, Job>();
  data.jobs.forEach((job) => {
    jobsMap.set(job.id, job);
  });

  $jobsData.set({
    jobs: jobsMap,
    metadata: {
      total_jobs: data.total_jobs,
      timestamp: data.timestamp,
      lastUpdate: new Date(),
      sseConnected: true,
    },
  });

  logger.debug("Jobs store initialized", {
    jobCount: jobsMap.size,
  });
}

/**
 * Add or update a single job
 * Called when JobSSEService receives job events
 */
export function upsertJob(job: Job): void {
  const currentState = $jobsData.get();
  const updatedJobs = new Map(currentState.jobs);

  // Update or add job
  updatedJobs.set(job.id, job);

  $jobsData.set({
    jobs: updatedJobs,
    metadata: {
      ...currentState.metadata,
      total_jobs: updatedJobs.size,
      lastUpdate: new Date(),
    },
  });

  logger.debug("Job upserted in store", {
    jobId: job.id,
    status: job.status,
  });
}

/**
 * Update job progress
 * Called when JobSSEService receives "job-progress" event
 */
export function updateJobProgress(
  jobId: string,
  progress: number,
  message?: string,
): void {
  const currentState = $jobsData.get();
  const job = currentState.jobs.get(jobId);

  if (!job) {
    logger.warn("Cannot update progress: Job not found", { jobId });
    return;
  }

  const updatedJobs = new Map(currentState.jobs);
  updatedJobs.set(jobId, {
    ...job,
    progress,
    message: message || job.message,
  });

  $jobsData.set({
    jobs: updatedJobs,
    metadata: {
      ...currentState.metadata,
      lastUpdate: new Date(),
    },
  });

  logger.debug("Job progress updated", { jobId, progress });
}

/**
 * Update job status
 * Called when JobSSEService receives "job-status-update" event
 */
export function updateJobStatus(
  jobId: string,
  status: string,
  additionalData?: Partial<Job>,
): void {
  const currentState = $jobsData.get();
  const job = currentState.jobs.get(jobId);

  if (!job) {
    logger.warn("Cannot update status: Job not found", { jobId });
    return;
  }

  const updatedJobs = new Map(currentState.jobs);
  updatedJobs.set(jobId, {
    ...job,
    status,
    ...additionalData,
  });

  $jobsData.set({
    jobs: updatedJobs,
    metadata: {
      ...currentState.metadata,
      lastUpdate: new Date(),
    },
  });

  logger.debug("Job status updated", { jobId, status });
}

/**
 * Remove a job (when deleted)
 * Called when JobSSEService receives "job-deleted" event
 */
export function removeJob(jobId: string): void {
  const currentState = $jobsData.get();
  const updatedJobs = new Map(currentState.jobs);

  if (!updatedJobs.has(jobId)) {
    logger.warn("Cannot delete: Job not found", { jobId });
    return;
  }

  updatedJobs.delete(jobId);

  $jobsData.set({
    jobs: updatedJobs,
    metadata: {
      ...currentState.metadata,
      total_jobs: updatedJobs.size,
      lastUpdate: new Date(),
    },
  });

  logger.info("Job removed from store", { jobId });
}

/**
 * Mark SSE connection status
 */
export function setSSEConnectionStatus(connected: boolean): void {
  $jobsSSEConnected.set(connected);

  const currentState = $jobsData.get();
  $jobsData.setKey("metadata", {
    ...currentState.metadata,
    sseConnected: connected,
  });

  logger.debug("SSE connection status updated", { connected });
}

/**
 * Reset jobs state (for testing or cleanup)
 */
export function resetJobsState(): void {
  $jobsData.set({
    jobs: new Map<string, Job>(),
    metadata: {
      total_jobs: 0,
      timestamp: new Date().toISOString(),
      lastUpdate: null,
      sseConnected: false,
    },
  });
  $jobsSSEConnected.set(false);

  logger.info("Jobs state reset");
}

// =============================================================================
// UTILITY FUNCTIONS FOR COMPONENTS
// =============================================================================

/**
 * Get job by ID
 * Useful for accessing specific job without subscribing to entire store
 */
export function getJobById(jobId: string): Job | undefined {
  const state = $jobsData.get();
  return state.jobs.get(jobId);
}

/**
 * Get all jobs as array
 * Useful for immediate access without subscribing
 */
export function getAllJobs(): Job[] {
  return $jobsList.get();
}

/**
 * Get job metrics snapshot
 */
export function getCurrentJobMetrics() {
  return $jobMetrics.get();
}

/**
 * Check if SSE is connected
 */
export function isJobsSSEConnected(): boolean {
  return $jobsSSEConnected.get();
}

// =============================================================================
// ASTRO BEST PRACTICES COMPLIANCE NOTES
// =============================================================================

/**
 * This implementation follows Astro/Nanostore best practices:
 *
 * ✅ Framework-agnostic: Works with Astro, React, vanilla JS
 * ✅ Type-safe: Full TypeScript support with strict typing
 * ✅ Single source of truth: All job data flows through these stores
 * ✅ Computed values: Automatic recalculation of derived state
 * ✅ Action-based updates: Clear separation of read/write operations
 * ✅ Efficient lookups: Uses Map for O(1) job access by ID
 * ✅ DRY compliance: No duplicate job state logic
 * ✅ SOLID principles: Single responsibility, open/closed design
 * ✅ SSE Integration: Designed for real-time updates from JobSSEService
 *
 * Benefits over callbacks-only approach:
 * - Reactive UI updates automatically with useStore()
 * - Multiple components can read same job data
 * - No prop drilling required
 * - Better debugging with dev tools
 * - Cleaner testing with predictable state
 * - No memory leaks or stale closures
 */
