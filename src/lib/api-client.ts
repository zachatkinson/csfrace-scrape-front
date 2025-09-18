/**
 * API Client for CSFrace Scraper Backend
 * Provides typed interfaces for all backend endpoints
 */

import { getApiBaseUrl } from "../constants/api";
import type {
  JobStatus,
  DashboardJobStatus,
  IBackendJob as Job,
  JobPriority,
  JobCreateRequest as JobCreate,
  IJobsResponse as JobListResponse,
  JobProcessingOptions as ProcessingOptions,
  JobConverterConfig as ConverterConfig,
} from "../types/job";
import {
  EnhancedApiClient,
  type EnhancedApiClientConfig,
} from "../utils/api-utils.ts";

// Re-export configuration types from centralized location
export type {
  JobConverterConfig as ConverterConfig,
  JobProcessingOptions as ProcessingOptions,
} from "../types/job";

export interface BatchConfig {
  maxConcurrent?: number;
  continueOnError?: boolean;
  outputBaseDirectory?: string;
  createArchives?: boolean;
  cleanupAfterArchive?: boolean;
  defaultTimeout?: number;
  retryFailedJobs?: boolean;
}

export interface SummaryData {
  totalJobs?: number;
  completedJobs?: number;
  failedJobs?: number;
  averageProcessingTime?: number;
  totalDataProcessed?: number;
  errorsEncountered?: string[];
  performanceMetrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    networkBandwidth?: number;
  };
}

export interface DatabaseHealth {
  status: "healthy" | "degraded" | "unhealthy";
  connectionCount?: number;
  queryLatency?: number;
  freeSpace?: number;
  version?: string;
}

export interface CacheHealth {
  status: "healthy" | "degraded" | "unhealthy";
  hitRate?: number;
  size?: number;
  memoryUsage?: number;
  connectionCount?: number;
}

export interface MonitoringHealth {
  status: "healthy" | "degraded" | "unhealthy";
  alertsActive?: number;
  lastCheck?: string;
  uptime?: number;
}

export interface SystemMetrics {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: {
    in: number;
    out: number;
  };
  loadAverage?: number[];
}

export interface ApplicationMetrics {
  requestsPerSecond?: number;
  averageResponseTime?: number;
  errorRate?: number;
  activeConnections?: number;
  jobsQueued?: number;
  jobsProcessing?: number;
}

export interface DatabaseMetrics {
  connections?: number;
  queryTime?: number;
  transactions?: number;
  locks?: number;
  cacheHitRatio?: number;
}

export interface ExtraMetadata {
  originalUrl?: string;
  contentType?: string;
  lastModified?: string;
  etag?: string;
  encoding?: string;
  language?: string;
  author?: string;
  keywords?: string[];
  customFields?: Record<string, string | number | boolean>;
}

export interface ConversionStats {
  htmlElements?: number;
  cssRules?: number;
  imagesFound?: number;
  linksExtracted?: number;
  charactersProcessed?: number;
  processingSteps?: string[];
  optimizationApplied?: string[];
  warnings?: string[];
}

export interface ContextData {
  url?: string;
  step?: string;
  duration?: number;
  retryCount?: number;
  errorCode?: string;
  userAgent?: string;
  ipAddress?: string;
  additionalInfo?: Record<string, string | number | boolean>;
}

// Re-export enhanced error class for backwards compatibility
export { EnhancedApiError as ApiError } from "../utils/api-utils.ts";

// Re-export unified types from centralized location
export type {
  BackendJob as Job,
  JobPriority,
  BackendJobListResponse as JobListResponse,
  JobCreateRequest as JobCreate,
} from "../types/job";

export interface JobUpdate {
  priority?: JobPriority | undefined;
  max_retries?: number | undefined;
  timeout_seconds?: number | undefined;
  skip_existing?: boolean | undefined;
  converter_config?: ConverterConfig | undefined;
  processing_options?: ProcessingOptions | undefined;
}

export interface Batch {
  id: number;
  name: string;
  description?: string;
  status: JobStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  max_concurrent: number;
  continue_on_error: boolean;
  output_base_directory: string;
  create_archives: boolean;
  cleanup_after_archive: boolean;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  skipped_jobs: number;
  success_rate: number;
  summary_data?: SummaryData;
  batch_config?: BatchConfig;
}

export interface BatchWithJobs extends Batch {
  jobs: Job[];
}

export interface BatchListResponse {
  batches: Batch[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BatchCreate {
  name: string;
  description?: string;
  urls: string[];
  max_concurrent?: number;
  continue_on_error?: boolean;
  output_base_directory?: string;
  create_archives?: boolean;
  cleanup_after_archive?: boolean;
  batch_config?: BatchConfig;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
  database: DatabaseHealth;
  cache: CacheHealth;
  monitoring: MonitoringHealth;
}

export interface MetricsResponse {
  timestamp: string;
  system_metrics: SystemMetrics;
  application_metrics: ApplicationMetrics;
  database_metrics: DatabaseMetrics;
}

export interface ContentResult {
  id: number;
  job_id: number;
  title?: string;
  meta_description?: string;
  published_date?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
  word_count?: number;
  image_count?: number;
  link_count?: number;
  processing_time_seconds?: number;
  created_at: string;
  updated_at: string;
  extra_metadata?: ExtraMetadata;
  conversion_stats?: ConversionStats;
}

export interface JobLog {
  id: number;
  job_id: number;
  level: string; // INFO, WARN, ERROR, DEBUG
  message: string;
  timestamp: string;
  component?: string; // html_processor, image_downloader, etc.
  operation?: string; // fetch, process, save, etc.
  context_data?: ContextData;
  exception_type?: string;
  exception_traceback?: string;
}

export interface APIError {
  detail: string;
  error_code?: string;
  timestamp: string;
  validation_errors?: Record<string, string[]>;
}

/**
 * Enhanced API Client using DRY/SOLID principles
 * SOLID: Single Responsibility - HTTP client operations with sophisticated error handling
 * DRY: Eliminates duplicate error handling patterns using shared utilities
 */
class APIClient extends EnhancedApiClient {
  private apiKey?: string;
  private baseURL: string;

  constructor(baseURL?: string, apiKey?: string) {
    const config: EnhancedApiClientConfig = {
      baseURL: baseURL ?? getApiBaseUrl(),
      apiKey: apiKey || undefined,
      useStructuredErrors: true, // Enable sophisticated error handling
      retryConfig: {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
    };
    super(config);

    this.baseURL = config.baseURL;
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }
  }

  // All sophisticated error handling now inherited from EnhancedApiClient
  // No need for duplicate request method - DRY principle applied!

  // Jobs API
  async getJobs(params?: {
    page?: number;
    page_size?: number;
    status_filter?: JobStatus;
    domain?: string;
  }): Promise<JobListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.page_size)
      searchParams.append("page_size", params.page_size.toString());
    if (params?.status_filter)
      searchParams.append("status_filter", params.status_filter);
    if (params?.domain) searchParams.append("domain", params.domain);

    const query = searchParams.toString();
    const endpoint = `/jobs${query ? `?${query}` : ""}`;

    return this.get<JobListResponse>(endpoint);
  }

  async getJob(id: number): Promise<Job> {
    return this.get<Job>(`/jobs/${id}`);
  }

  async createJob(jobData: JobCreate): Promise<Job> {
    return this.post<Job>("/jobs", jobData);
  }

  async updateJob(id: number, jobData: JobUpdate): Promise<Job> {
    return this.put<Job>(`/jobs/${id}`, jobData);
  }

  async deleteJob(id: number): Promise<void> {
    return this.delete<void>(`/jobs/${id}`);
  }

  async startJob(id: number): Promise<Job> {
    return this.post<Job>(`/jobs/${id}/start`);
  }

  async cancelJob(id: number): Promise<Job> {
    return this.post<Job>(`/jobs/${id}/cancel`);
  }

  async retryJob(id: number): Promise<Job> {
    return this.post<Job>(`/jobs/${id}/retry`);
  }

  // Batches API
  async getBatches(params?: {
    page?: number;
    page_size?: number;
  }): Promise<BatchListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.page_size)
      searchParams.append("page_size", params.page_size.toString());

    const query = searchParams.toString();
    const endpoint = `/batches${query ? `?${query}` : ""}`;

    return this.get<BatchListResponse>(endpoint);
  }

  async getBatch(id: number): Promise<BatchWithJobs> {
    return this.get<BatchWithJobs>(`/batches/${id}`);
  }

  async createBatch(batchData: BatchCreate): Promise<Batch> {
    return this.post<Batch>("/batches", batchData);
  }

  // Health check and monitoring
  async getHealth(): Promise<HealthCheck> {
    return this.get<HealthCheck>("/health");
  }

  async getMetrics(): Promise<MetricsResponse> {
    return this.get<MetricsResponse>("/health/metrics");
  }

  async getLiveness(): Promise<{ status: string }> {
    return this.get<{ status: string }>("/health/live");
  }

  async getReadiness(): Promise<{ status: string }> {
    return this.get<{ status: string }>("/health/ready");
  }

  async getPrometheusMetrics(): Promise<string> {
    const url = `${this.baseURL}/health/prometheus`;
    const headers: HeadersInit = {};

    if (this.apiKey) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
  }

  // Content results (if backend implements these endpoints)
  async getJobResults(jobId: number): Promise<ContentResult[]> {
    return this.get<ContentResult[]>(`/jobs/${jobId}/results`);
  }

  async getJobResult(jobId: number, resultId: number): Promise<ContentResult> {
    return this.get<ContentResult>(`/jobs/${jobId}/results/${resultId}`);
  }

  // Job logs (if backend implements these endpoints)
  async getJobLogs(
    jobId: number,
    params?: {
      level?: string;
      component?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<JobLog[]> {
    const searchParams = new URLSearchParams();

    if (params?.level) searchParams.append("level", params.level);
    if (params?.component) searchParams.append("component", params.component);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    const endpoint = `/jobs/${jobId}/logs${query ? `?${query}` : ""}`;

    return this.get<JobLog[]>(endpoint);
  }

  // Utility methods
  setAPIKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  setBaseURL(baseURL: string) {
    this.baseURL = baseURL;
  }
}

// Singleton instance
export const apiClient = new APIClient();

// Job status utilities
export const JOB_STATUS_LABELS: Record<DashboardJobStatus, string> = {
  pending: "Pending",
  validating: "Validating",
  scraping: "Scraping",
  running: "Processing",
  completed: "Completed",
  error: "Error",
  failed: "Failed",
  cancelled: "Cancelled",
  queued: "Queued",
  processing: "Processing",
  skipped: "Skipped",
  partial: "Partial",
};

export const JOB_STATUS_COLORS: Record<DashboardJobStatus, string> = {
  pending: "#f59e0b", // amber-500
  validating: "#8b5cf6", // violet-500
  scraping: "#06b6d4", // cyan-500
  running: "#3b82f6", // blue-500
  completed: "#10b981", // emerald-500
  error: "#dc2626", // red-600
  failed: "#ef4444", // red-500
  cancelled: "#9ca3af", // gray-400
  queued: "#6366f1", // indigo-500
  processing: "#3b82f6", // blue-500
  skipped: "#6b7280", // gray-500
  partial: "#f97316", // orange-500
};

export const JOB_PRIORITY_LABELS: Record<JobPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const JOB_PRIORITY_COLORS: Record<JobPriority, string> = {
  low: "#6b7280", // gray-500
  normal: "#3b82f6", // blue-500
  high: "#f59e0b", // amber-500
  urgent: "#ef4444", // red-500
};

// Helper functions
export function getJobProgress(job: Job): number {
  switch (job.status) {
    case "completed":
      return 100;
    case "running":
      // Estimate progress based on duration if available
      if (job.started_at && job.timeout_seconds) {
        const startTime = new Date(job.started_at).getTime();
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        return Math.min(90, (elapsed / job.timeout_seconds) * 100);
      }
      return 50; // Default for running jobs
    case "failed":
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

export function getJobDuration(job: Job): string {
  if (job.duration_seconds) {
    const seconds = Math.round(job.duration_seconds);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  if (job.started_at && job.completed_at) {
    const start = new Date(job.started_at).getTime();
    const end = new Date(job.completed_at).getTime();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return "N/A";
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "N/A";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

// Enhanced error handling utilities
// Re-export enhanced error utilities for backwards compatibility
// SOLID: Dependency Inversion - Depend on abstractions from shared utilities
// DRY: Eliminate duplicate error handling functions
export {
  isEnhancedApiError as isAPIError,
  getValidationErrorMessage,
  getFormValidationErrors,
  hasValidationErrors,
  isRetryableError,
} from "../utils/api-utils.ts";

// Content result utilities
export function getContentSummary(result: ContentResult): string {
  const parts: string[] = [];

  if (result.word_count) {
    parts.push(`${result.word_count} words`);
  }

  if (result.image_count) {
    parts.push(`${result.image_count} images`);
  }

  if (result.link_count) {
    parts.push(`${result.link_count} links`);
  }

  return parts.join(", ") || "No content statistics";
}

// Job logs utilities
export const JOB_LOG_LEVELS = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

export const JOB_LOG_LEVEL_COLORS: Record<string, string> = {
  DEBUG: "#6b7280", // gray-500
  INFO: "#3b82f6", // blue-500
  WARN: "#f59e0b", // amber-500
  ERROR: "#ef4444", // red-500
};

export function formatLogLevel(level: string): string {
  return (
    JOB_LOG_LEVELS[level.toUpperCase() as keyof typeof JOB_LOG_LEVELS] || level
  );
}

// Health check utilities
export function getHealthStatus(health: HealthCheck): {
  status: "healthy" | "degraded" | "unhealthy";
  issues: string[];
} {
  const issues: string[] = [];

  if (health.database?.status !== "healthy") {
    issues.push("Database connectivity issues");
  }

  if (
    health.cache?.status === "unhealthy" ||
    health.cache?.status === "degraded"
  ) {
    issues.push("Cache service issues");
  }

  if (health.monitoring?.status !== "healthy") {
    issues.push("Monitoring service issues");
  }

  let status: "healthy" | "degraded" | "unhealthy" = "healthy";

  if (health.status === "unhealthy") {
    status = "unhealthy";
  } else if (health.status === "degraded" || issues.length > 0) {
    status = "degraded";
  }

  return { status, issues };
}

// Advanced job utilities
export function getJobEfficiency(job: Job): number {
  if (!job.duration_seconds || !job.content_size_bytes) {
    return 0;
  }

  // Calculate bytes per second (efficiency metric)
  return job.content_size_bytes / job.duration_seconds;
}

export function isJobRetryable(job: Job): boolean {
  return job.status === "failed" && job.retry_count < job.max_retries;
}

export function getJobNextRetryTime(job: Job): Date | null {
  if (!job.next_retry_at) {
    return null;
  }

  return new Date(job.next_retry_at);
}
