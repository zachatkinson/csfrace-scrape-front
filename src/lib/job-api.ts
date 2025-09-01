/**
 * Job API utilities for fetching and managing conversion jobs
 */

export interface Job {
  id: number;
  title: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  error_message?: string;
  error_type?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  retry_count?: number;
  max_retries?: number;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

class JobAPI {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    // Use environment variables or fallback to defaults
    this.baseUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api';
    this.apiKey = import.meta.env.PUBLIC_API_KEY;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get recent jobs with optional filtering
   */
  async getRecentJobs(limit: number = 10): Promise<Job[]> {
    try {
      const response = await this.request<JobListResponse>(
        `/jobs?page=1&page_size=${limit}&sort=created_at:desc`
      );
      return response.jobs;
    } catch (error) {
      console.error('Failed to fetch recent jobs:', error);
      // Return empty array on error to prevent UI breaking
      return [];
    }
  }

  /**
   * Get a specific job by ID
   */
  async getJob(jobId: number): Promise<Job | null> {
    try {
      return await this.request<Job>(`/jobs/${jobId}`);
    } catch (error) {
      console.error(`Failed to fetch job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: number): Promise<Job | null> {
    try {
      return await this.request<Job>(`/jobs/${jobId}/retry`, {
        method: 'POST',
      });
    } catch (error) {
      console.error(`Failed to retry job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Cancel a running or pending job
   */
  async cancelJob(jobId: number): Promise<Job | null> {
    try {
      return await this.request<Job>(`/jobs/${jobId}/cancel`, {
        method: 'POST',
      });
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Create a new conversion job
   */
  async createJob(url: string, options: Record<string, any> = {}): Promise<Job | null> {
    try {
      return await this.request<Job>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          url,
          options,
        }),
      });
    } catch (error) {
      console.error('Failed to create job:', error);
      return null;
    }
  }

  /**
   * Create a batch of jobs
   */
  async createBatch(urls: string[], options: Record<string, any> = {}): Promise<{ batch_id: string; jobs: Job[] } | null> {
    try {
      return await this.request<{ batch_id: string; jobs: Job[] }>('/batches', {
        method: 'POST',
        body: JSON.stringify({
          urls,
          options,
        }),
      });
    } catch (error) {
      console.error('Failed to create batch:', error);
      return null;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; version: string } | null> {
    try {
      return await this.request<{ status: string; version: string }>('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const jobAPI = new JobAPI();

/**
 * Format job title from URL if no title is provided
 */
export function formatJobTitle(job: Job): string {
  if (job.title && job.title.trim() !== '') {
    return job.title;
  }
  
  try {
    const url = new URL(job.url);
    const pathname = url.pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length === 0) {
      return url.hostname;
    }
    
    // Get the last segment and format it nicely
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    return job.url;
  }
}

/**
 * Format relative time from date string
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return 'Unknown';
  }
}

/**
 * Get progress message based on job status and progress
 */
export function getProgressMessage(job: Job): string {
  switch (job.status) {
    case 'pending':
      return 'Waiting to start...';
    case 'running':
      if (job.progress !== undefined) {
        if (job.progress < 25) {
          return 'Fetching content...';
        } else if (job.progress < 50) {
          return 'Processing images...';
        } else if (job.progress < 75) {
          return 'Converting content...';
        } else {
          return 'Finalizing conversion...';
        }
      }
      return 'Processing...';
    case 'completed':
      return 'Ready for download';
    case 'failed':
      return job.error_message || 'Conversion failed';
    case 'cancelled':
      return 'Conversion cancelled';
    default:
      return 'Unknown status';
  }
}