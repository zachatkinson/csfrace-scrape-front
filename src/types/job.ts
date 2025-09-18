/**
 * Shared Job Types - Following DRY Principle
 * Single source of truth for job-related type definitions
 * Used across JobManager, JobDashboard, and other components
 */

export interface WordPressContent {
  id?: string | undefined;
  title: string;
  content: string;
  excerpt?: string | undefined;
  slug?: string | undefined;
  type?: string | undefined;
  status?: "publish" | "draft" | "private" | undefined;
  author?:
    | {
        id?: string | undefined;
        name?: string | undefined;
        email?: string | undefined;
      }
    | string
    | undefined;
  publishedAt?: string | undefined;
  modifiedAt?: string | undefined;
  featuredImage?:
    | {
        url: string;
        alt?: string | undefined;
        caption?: string | undefined;
      }
    | string
    | undefined;
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  metadata?:
    | Record<string, string | number | boolean | null | unknown>
    | undefined;
}

export interface ShopifyContent {
  handle: string;
  title: string;
  bodyHtml: string;
  excerpt?: string | undefined;
  vendor?: string | undefined;
  productType?: string | undefined;
  tags: string[];
  images?:
    | {
        src: string;
        alt?: string | undefined;
        position: number;
      }[]
    | undefined;
  image?:
    | {
        src: string;
        alt?: string | undefined;
      }
    | undefined;
  variants?:
    | {
        title: string;
        price: string;
        sku?: string | undefined;
        inventoryQuantity?: number | undefined;
      }[]
    | undefined;
  seo?:
    | {
        title?: string | undefined;
        description?: string | undefined;
      }
    | undefined;
  publishedAt?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export type JobStatus =
  | "pending"
  | "validating"
  | "scraping"
  | "running"
  | "completed"
  | "error"
  | "failed"
  | "cancelled";

// =============================================================================
// SEGREGATED JOB INTERFACES - Following Interface Segregation Principle
// =============================================================================

/**
 * Core Job Identity
 * SOLID: ISP - Only essential job identification
 * Note: API uses number IDs, UI may use string IDs - handled by variants
 */
export interface JobIdentity {
  id: number | string; // Flexible to support both API and UI needs
  source_url: string;
  status: JobStatus;
}

/**
 * Job Progress Information
 * SOLID: ISP - Only progress-related data
 */
export interface JobProgress {
  progress: number;
  createdAt?: Date | undefined;
  startedAt?: Date | undefined;
  completedAt?: Date | undefined;
}

/**
 * Job Error Information
 * SOLID: ISP - Only error-related data
 */
export interface JobErrorInfo {
  error?: string | undefined;
  error_message?: string | undefined;
  error_type?: string | undefined;
}

/**
 * Job Content Metrics
 * SOLID: ISP - Only content measurement data
 */
export interface JobContentMetrics {
  wordCount: number;
  imageCount: number;
  contentSize?: number | undefined;
  fileSize?: string | undefined;
  imagesDownloaded?: number | undefined;
}

/**
 * Job Processing Configuration
 * SOLID: ISP - Only processing configuration
 */
export interface JobProcessingConfig {
  retryCount: number;
  maxRetries: number;
  priority: JobPriority;
  batchId?: string | undefined;
}

/**
 * Job Content Data
 * SOLID: ISP - Only content-related data
 */
export interface JobContent {
  wordpressContent?: WordPressContent | undefined;
  shopifyContent?: ShopifyContent | undefined;
  convertedHtml?: string | undefined;
  extractedImages?: string[] | undefined;
}

/**
 * Job Metadata Information
 * SOLID: ISP - Only metadata
 */
export interface JobMetadata {
  domain?: string | undefined;
  duration?: string | undefined;
  metadata?:
    | {
        title?: string | undefined;
        type?: string | undefined;
        wordCount?: number | undefined;
        imageCount?: number | undefined;
        estimatedSize?: string | undefined;
        processingTime?: number | undefined;
      }
    | undefined;
}

/**
 * Complete Conversion Job
 * SOLID: ISP - Composed from segregated interfaces
 */
export interface ConversionJob
  extends JobIdentity,
    JobProgress,
    JobErrorInfo,
    JobContent,
    JobMetadata {}

/**
 * Dashboard Job Data
 * SOLID: ISP - Composed only from needed interfaces for dashboard display
 */
export interface IJobData
  extends JobIdentity,
    JobProgress,
    JobErrorInfo,
    JobContentMetrics,
    JobProcessingConfig,
    JobMetadata {
  // Override for API compatibility
  id: number;
  title: string;
}

/**
 * Job priority levels
 */
export type JobPriority = "low" | "normal" | "high" | "urgent";

/**
 * Extended job status for dashboard (includes original statuses)
 */
export type DashboardJobStatus =
  | JobStatus
  | "queued"
  | "processing"
  | "skipped"
  | "partial";

/**
 * Filter options for job dashboard
 */
export type JobFilter = "all" | DashboardJobStatus;

/**
 * Sort options for job dashboard
 */
export type JobSort = "newest" | "oldest" | "status" | "progress";

/**
 * Backend API job response (before conversion to IJobData)
 */
export interface IBackendJob {
  id: number;
  source_url: string;
  domain: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  error_type?: string;
  success: boolean;
  retry_count: number;
  max_retries: number;
  priority: string;
  content_size_bytes?: number;
  images_downloaded?: number;
  batch_id?: string;
  next_retry_at?: string;
  duration_seconds?: number;
  timeout_seconds?: number;
}

/**
 * Job action types for dashboard interactions
 */
export type JobAction =
  | "view-details"
  | "download"
  | "retry"
  | "cancel"
  | "delete";

/**
 * Job filter configuration
 */
export interface IJobFilterConfig {
  label: string;
  icon: string;
  color: string;
}

/**
 * Job API response structure
 */
export interface IJobsResponse {
  jobs: IBackendJob[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Job API query parameters
 */
export interface IJobQueryParams {
  page?: number | undefined;
  page_size?: number | undefined;
  status_filter?: string | undefined;
  search?: string | undefined;
  sort_by?: string | undefined;
  sort_order?: "asc" | "desc" | undefined;
}

/**
 * UNIFIED JOB INTERFACES - SINGLE SOURCE OF TRUTH
 * Consolidating duplicate definitions from job-api.ts and api-client.ts
 * Following Interface Segregation Principle (ISP)
 */

/**
 * Backend Job Processing Configuration
 * SOLID: ISP - Only processing-specific configuration
 */
export interface JobBackendConfig {
  domain: string;
  slug?: string | undefined;
  custom_slug?: string | undefined;
  timeout_seconds: number;
  output_directory: string;
  skip_existing: boolean;
  next_retry_at?: string | undefined;
  start_time?: number | undefined;
  end_time?: number | undefined;
  duration_seconds?: number | undefined;
  archive_path?: string | undefined;
  archive_size_bytes?: number | undefined;
}

/**
 * Job Converter Configuration
 * SOLID: ISP - Only conversion-specific settings
 */
export interface JobConverterConfig {
  format?: "html" | "markdown" | "json" | undefined;
  includeImages?: boolean | undefined;
  imageQuality?: "low" | "medium" | "high" | undefined;
  customCSS?: string | undefined;
  preserveStyles?: boolean | undefined;
  stripScripts?: boolean | undefined;
  stripForms?: boolean | undefined;
}

/**
 * Job Processing Options
 * SOLID: ISP - Only processing options
 */
export interface JobProcessingOptions {
  timeout?: number | undefined;
  maxRetries?: number | undefined;
  skipExisting?: boolean | undefined;
  outputDirectory?: string | undefined;
  compression?: boolean | undefined;
  removeMetadata?: boolean | undefined;
  customHeaders?: Record<string, string> | undefined;
}

/**
 * Complete Backend Job (from api-client.ts)
 * SOLID: Composed from segregated interfaces
 */
export interface BackendJob
  extends JobIdentity,
    JobProgress,
    JobErrorInfo,
    JobProcessingConfig,
    JobBackendConfig {
  // Backend-specific fields
  success: boolean;
  content_size_bytes?: number | undefined;
  images_downloaded: number;
  batch_id?: number | undefined;
  converter_config?: JobConverterConfig | undefined;
  processing_options?: JobProcessingOptions | undefined;
}

/**
 * Simple API Job (from job-api.ts)
 * SOLID: Minimal interface for simple operations
 */
export interface SimpleJob extends JobIdentity, JobProgress, JobErrorInfo {
  // Simple API specific fields
  title: string;
}

/**
 * Job Creation Request
 * SOLID: ISP - Only creation-specific fields
 */
export interface JobCreateRequest {
  url: string;
  slug?: string | undefined;
  custom_slug?: string | undefined;
  priority?: JobPriority | undefined;
  output_directory?: string | undefined;
  max_retries?: number | undefined;
  timeout_seconds?: number | undefined;
  skip_existing?: boolean | undefined;
  converter_config?: JobConverterConfig | undefined;
  processing_options?: JobProcessingOptions | undefined;
}

/**
 * Job List Response for Simple API
 * SOLID: ISP - Response-specific structure
 */
export interface SimpleJobListResponse {
  jobs: SimpleJob[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Job List Response for Backend API
 * SOLID: ISP - Response-specific structure
 */
export interface BackendJobListResponse {
  jobs: BackendJob[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Job statistics for dashboard header
 */
export interface IJobStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  queued: number;
}

/**
 * Job selection state for batch operations
 */
export interface IJobSelection {
  selectedJobs: Set<number>;
  totalJobs: number;
  filteredJobs: number;
}

/**
 * Dashboard state interface
 */
export interface IDashboardState {
  jobs: IJobData[];
  filteredJobs: IJobData[];
  selectedJobs: Set<number>;
  currentFilter: JobFilter;
  currentSort: JobSort;
  searchQuery: string;
  currentPage: number;
  jobsPerPage: number;
  isLoading: boolean;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  stats: IJobStats;
}

/**
 * Job conversion utility function type
 */
export type JobConverter = (backendJob: IBackendJob) => IJobData;

/**
 * Job error details for enhanced error handling
 */
export interface IJobError {
  code: string;
  message: string;
  type?: string;
  url?: string;
  timestamp: Date;
  retryable: boolean;
  jobId?: number;
}

/**
 * Job modal data for detailed view
 */
export interface IJobModal {
  isOpen: boolean;
  job?: IJobData;
  loading: boolean;
  error?: string;
}
