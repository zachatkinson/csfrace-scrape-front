/**
 * Shared Job Types - Following DRY Principle
 * Single source of truth for job-related type definitions
 * Used across JobManager, JobDashboard, and other components
 */

export interface WordPressContent {
  title: string;
  content: string;
  excerpt?: string | undefined;
  featuredImage?: string | undefined;
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  publishedAt?: string | undefined;
  author?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface ShopifyContent {
  handle: string;
  title: string;
  bodyHtml: string;
  excerpt?: string | undefined;
  image?: {
    src: string;
    alt?: string | undefined;
  } | undefined;
  tags: string[];
  publishedAt?: string | undefined;
  seo?: {
    title?: string | undefined;
    description?: string | undefined;
  } | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface ConversionJob {
  id: string;
  url: string;
  status: 'pending' | 'validating' | 'scraping' | 'running' | 'completed' | 'error' | 'failed' | 'cancelled';
  progress: number;
  wordpressContent?: WordPressContent | undefined;
  shopifyContent?: ShopifyContent | undefined;
  convertedHtml?: string | undefined;
  extractedImages?: string[] | undefined;
  error?: string | undefined;
  error_message?: string | undefined;
  error_type?: string | undefined;
  metadata?: {
    title?: string | undefined;
    type?: string | undefined;
    wordCount?: number | undefined;
    imageCount?: number | undefined;
    estimatedSize?: string | undefined;
    processingTime?: number | undefined;
  } | undefined;
  createdAt?: Date | undefined;
  startedAt?: Date | undefined;
  completedAt?: Date | undefined;
}

export type JobStatus = ConversionJob['status'];

// =============================================================================
// DASHBOARD-SPECIFIC JOB TYPES - DRY/SOLID Extension
// =============================================================================
// Additional types for dashboard functionality following DRY principles
// Extends existing job types without duplication
// =============================================================================

/**
 * Enhanced job data interface for dashboard display
 */
export interface IJobData extends ConversionJob {
  id: number; // Override string with number for API compatibility
  title: string;
  domain?: string | undefined;
  duration?: string | undefined;
  retryCount: number;
  maxRetries: number;
  priority: JobPriority;
  contentSize?: number | undefined;
  imagesDownloaded?: number | undefined;
  batchId?: string | undefined;
  wordCount: number;
  imageCount: number;
  fileSize?: string | undefined;
}

/**
 * Job priority levels
 */
export type JobPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

/**
 * Extended job status for dashboard (includes original statuses)
 */
export type DashboardJobStatus = JobStatus | 'queued' | 'processing' | 'skipped' | 'partial';

/**
 * Filter options for job dashboard
 */
export type JobFilter = 
  | 'all'
  | DashboardJobStatus;

/**
 * Sort options for job dashboard
 */
export type JobSort = 
  | 'newest'
  | 'oldest'
  | 'status'
  | 'progress';

/**
 * Backend API job response (before conversion to IJobData)
 */
export interface IBackendJob {
  id: number;
  url: string;
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
}

/**
 * Job action types for dashboard interactions
 */
export type JobAction = 
  | 'view-details'
  | 'download'
  | 'retry'
  | 'cancel'
  | 'delete';

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
  sort_order?: 'asc' | 'desc' | undefined;
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
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
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