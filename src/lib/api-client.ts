/**
 * API Client for CSFrace Scraper Backend
 * Provides typed interfaces for all backend endpoints
 */

// Types matching backend models
export interface Job {
  id: number;
  url: string;
  domain: string;
  slug?: string;
  status: JobStatus;
  priority: JobPriority;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  next_retry_at?: string;
  retry_count: number;
  max_retries: number;
  timeout_seconds: number;
  output_directory: string;
  custom_slug?: string;
  skip_existing: boolean;
  error_message?: string;
  error_type?: string;
  success: boolean;
  start_time?: number;
  end_time?: number;
  duration_seconds?: number;
  content_size_bytes?: number;
  images_downloaded: number;
  archive_path?: string;
  archive_size_bytes?: number;
  batch_id?: number;
  converter_config?: Record<string, any>;
  processing_options?: Record<string, any>;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled' | 'partial';
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface JobCreate {
  url: string;
  slug?: string;
  custom_slug?: string;
  priority?: JobPriority;
  output_directory?: string;
  max_retries?: number;
  timeout_seconds?: number;
  skip_existing?: boolean;
  converter_config?: Record<string, any>;
  processing_options?: Record<string, any>;
}

export interface JobUpdate {
  priority?: JobPriority;
  max_retries?: number;
  timeout_seconds?: number;
  skip_existing?: boolean;
  converter_config?: Record<string, any>;
  processing_options?: Record<string, any>;
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
  summary_data?: Record<string, any>;
  batch_config?: Record<string, any>;
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
  batch_config?: Record<string, any>;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
  database: Record<string, any>;
  cache: Record<string, any>;
  monitoring: Record<string, any>;
}

export interface MetricsResponse {
  timestamp: string;
  system_metrics: Record<string, any>;
  application_metrics: Record<string, any>;
  database_metrics: Record<string, any>;
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
  extra_metadata?: Record<string, any>;
  conversion_stats?: Record<string, any>;
}

export interface JobLog {
  id: number;
  job_id: number;
  level: string; // INFO, WARN, ERROR, DEBUG
  message: string;
  timestamp: string;
  component?: string; // html_processor, image_downloader, etc.
  operation?: string; // fetch, process, save, etc.
  context_data?: Record<string, any>;
  exception_type?: string;
  exception_traceback?: string;
}

export interface APIError {
  detail: string;
  error_code?: string;
  timestamp: string;
  validation_errors?: Record<string, string[]>;
}

class APIClient {
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL?: string, apiKey?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData: APIError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            detail: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: new Date().toISOString(),
          };
        }
        
        // Create enhanced error with validation details
        const errorMessage = errorData.detail || 'Request failed';
        const error = new Error(errorMessage);
        
        // Attach additional error information
        (error as any).errorCode = errorData.error_code;
        (error as any).timestamp = errorData.timestamp;
        (error as any).validationErrors = errorData.validation_errors;
        (error as any).statusCode = response.status;
        
        throw error;
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  // Jobs API
  async getJobs(params?: {
    page?: number;
    page_size?: number;
    status_filter?: JobStatus;
    domain?: string;
  }): Promise<JobListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.status_filter) searchParams.append('status_filter', params.status_filter);
    if (params?.domain) searchParams.append('domain', params.domain);

    const query = searchParams.toString();
    const endpoint = `/jobs${query ? `?${query}` : ''}`;
    
    return this.request<JobListResponse>(endpoint);
  }

  async getJob(id: number): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async createJob(jobData: JobCreate): Promise<Job> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id: number, jobData: JobUpdate): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id: number): Promise<void> {
    return this.request<void>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async startJob(id: number): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/start`, {
      method: 'POST',
    });
  }

  async cancelJob(id: number): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/cancel`, {
      method: 'POST',
    });
  }

  async retryJob(id: number): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/retry`, {
      method: 'POST',
    });
  }

  // Batches API
  async getBatches(params?: {
    page?: number;
    page_size?: number;
  }): Promise<BatchListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

    const query = searchParams.toString();
    const endpoint = `/batches${query ? `?${query}` : ''}`;
    
    return this.request<BatchListResponse>(endpoint);
  }

  async getBatch(id: number): Promise<BatchWithJobs> {
    return this.request<BatchWithJobs>(`/batches/${id}`);
  }

  async createBatch(batchData: BatchCreate): Promise<Batch> {
    return this.request<Batch>('/batches', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  }

  // Health check and monitoring
  async getHealth(): Promise<HealthCheck> {
    return this.request<HealthCheck>('/health');
  }

  async getMetrics(): Promise<MetricsResponse> {
    return this.request<MetricsResponse>('/health/metrics');
  }

  async getLiveness(): Promise<{status: string}> {
    return this.request<{status: string}>('/health/live');
  }

  async getReadiness(): Promise<{status: string}> {
    return this.request<{status: string}>('/health/ready');
  }

  async getPrometheusMetrics(): Promise<string> {
    const url = `${this.baseURL}/health/prometheus`;
    const headers: HeadersInit = {};
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.text();
  }

  // Content results (if backend implements these endpoints)
  async getJobResults(jobId: number): Promise<ContentResult[]> {
    return this.request<ContentResult[]>(`/jobs/${jobId}/results`);
  }

  async getJobResult(jobId: number, resultId: number): Promise<ContentResult> {
    return this.request<ContentResult>(`/jobs/${jobId}/results/${resultId}`);
  }

  // Job logs (if backend implements these endpoints)
  async getJobLogs(
    jobId: number,
    params?: {
      level?: string;
      component?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<JobLog[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.level) searchParams.append('level', params.level);
    if (params?.component) searchParams.append('component', params.component);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    const endpoint = `/jobs/${jobId}/logs${query ? `?${query}` : ''}`;
    
    return this.request<JobLog[]>(endpoint);
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
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  running: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
  partial: 'Partial',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  pending: '#f59e0b', // amber-500
  running: '#3b82f6', // blue-500
  completed: '#10b981', // emerald-500
  failed: '#ef4444', // red-500
  skipped: '#6b7280', // gray-500
  cancelled: '#9ca3af', // gray-400
  partial: '#f97316', // orange-500
};

export const JOB_PRIORITY_LABELS: Record<JobPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const JOB_PRIORITY_COLORS: Record<JobPriority, string> = {
  low: '#6b7280', // gray-500
  normal: '#3b82f6', // blue-500
  high: '#f59e0b', // amber-500
  urgent: '#ef4444', // red-500
};

// Helper functions
export function getJobProgress(job: Job): number {
  switch (job.status) {
    case 'completed':
      return 100;
    case 'running':
      // Estimate progress based on duration if available
      if (job.started_at && job.timeout_seconds) {
        const startTime = new Date(job.started_at).getTime();
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        return Math.min(90, (elapsed / job.timeout_seconds) * 100);
      }
      return 50; // Default for running jobs
    case 'failed':
    case 'cancelled':
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
  
  return 'N/A';
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return 'N/A';
  
  const units = ['B', 'KB', 'MB', 'GB'];
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
export function isAPIError(error: any): error is Error & {
  errorCode?: string;
  timestamp?: string;
  validationErrors?: Record<string, string[]>;
  statusCode?: number;
} {
  return error instanceof Error && 'statusCode' in error;
}

export function getValidationErrorMessage(error: any): string | null {
  if (isAPIError(error) && error.validationErrors) {
    const messages: string[] = [];
    for (const [field, errors] of Object.entries(error.validationErrors)) {
      messages.push(`${field}: ${errors.join(', ')}`);
    }
    return messages.join('; ');
  }
  return null;
}

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
  
  return parts.join(', ') || 'No content statistics';
}

// Job logs utilities
export const JOB_LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export const JOB_LOG_LEVEL_COLORS: Record<string, string> = {
  DEBUG: '#6b7280', // gray-500
  INFO: '#3b82f6',  // blue-500
  WARN: '#f59e0b',  // amber-500
  ERROR: '#ef4444', // red-500
};

export function formatLogLevel(level: string): string {
  return JOB_LOG_LEVELS[level.toUpperCase() as keyof typeof JOB_LOG_LEVELS] || level;
}

// Health check utilities
export function getHealthStatus(health: HealthCheck): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
} {
  const issues: string[] = [];
  
  if (health.database?.status !== 'healthy') {
    issues.push('Database connectivity issues');
  }
  
  if (health.cache?.status === 'error') {
    issues.push('Cache service unavailable');
  }
  
  if (health.monitoring?.status !== 'healthy') {
    issues.push('Monitoring service issues');
  }
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (health.status === 'unhealthy') {
    status = 'unhealthy';
  } else if (health.status === 'degraded' || issues.length > 0) {
    status = 'degraded';
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
  return job.status === 'failed' && job.retry_count < job.max_retries;
}

export function getJobNextRetryTime(job: Job): Date | null {
  if (!job.next_retry_at) {
    return null;
  }
  
  return new Date(job.next_retry_at);
}