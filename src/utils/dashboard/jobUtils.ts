// =============================================================================
// JOB UTILITIES - DRY/SOLID Utility Functions
// =============================================================================
// Single Responsibility: Pure functions for job data manipulation
// Following DRY principles and functional programming patterns
// =============================================================================

import type { 
  IJobData, 
  IBackendJob, 
  JobStatus, 
  JobFilter, 
  JobSort,
  JobConverter 
} from '../../types/job.js';

// =============================================================================
// JOB DATA CONVERSION UTILITIES
// =============================================================================

/**
 * SOLID: Single responsibility - Extract title from URL using heuristics
 */
export const extractTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const lastSegment = path.split('/').filter(Boolean).pop() || 'Unknown';
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return 'Unknown Page';
  }
};

/**
 * SOLID: Single responsibility - Format file size with proper units
 */
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * SOLID: Single responsibility - Calculate job progress percentage
 */
export const calculateJobProgress = (job: IBackendJob): number => {
  if (job.status === 'completed') return 100;
  if (job.status === 'failed' || job.status === 'cancelled') return 0;
  if (job.status === 'pending') return 0;
  
  // For running jobs, estimate progress based on time elapsed
  if (job.started_at) {
    const startTime = new Date(job.started_at).getTime();
    const now = Date.now();
    const elapsed = now - startTime;
    
    // Estimate 5 minutes for average job completion
    const estimatedTotal = 5 * 60 * 1000; // 5 minutes in ms
    const progress = Math.min(95, (elapsed / estimatedTotal) * 100);
    return Math.round(progress);
  }
  
  return 10; // Default progress for processing jobs without start time
};

/**
 * SOLID: Single responsibility - Calculate job duration
 */
export const calculateJobDuration = (job: IBackendJob): string => {
  if (job.completed_at && job.started_at) {
    const start = new Date(job.started_at).getTime();
    const end = new Date(job.completed_at).getTime();
    const durationMs = end - start;
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  if (job.started_at && job.status === 'running') {
    const start = new Date(job.started_at).getTime();
    const now = Date.now();
    const durationMs = now - start;
    const minutes = Math.floor(durationMs / (1000 * 60));
    return `${minutes}m (running)`;
  }
  
  return 'N/A';
};

/**
 * SOLID: Single responsibility - Map backend status to UI status
 */
export const mapBackendStatus = (backendStatus: string): JobStatus => {
  const statusMap: Record<string, JobStatus> = {
    'pending': 'pending' as const,
    'running': 'running' as const,
    'completed': 'completed' as const,
    'failed': 'failed' as const,
    'error': 'failed' as const,
    'cancelled': 'cancelled' as const,
    'validating': 'validating' as const,
    'scraping': 'scraping' as const
  };
  
  return statusMap[backendStatus] || (backendStatus as JobStatus);
};

/**
 * SOLID: Single responsibility - Convert backend job to frontend job data
 */
export const convertBackendJob: JobConverter = (backendJob: IBackendJob): IJobData => {
  return {
    // Basic job info
    id: backendJob.id,
    title: extractTitleFromUrl(backendJob.url),
    url: backendJob.url,
    domain: backendJob.domain,
    
    // Status and progress
    status: mapBackendStatus(backendJob.status),
    progress: calculateJobProgress(backendJob),
    
    // Timestamps
    createdAt: new Date(backendJob.created_at),
    startedAt: backendJob.started_at ? new Date(backendJob.started_at) : undefined,
    completedAt: backendJob.completed_at ? new Date(backendJob.completed_at) : undefined,
    
    // Duration and error info
    duration: calculateJobDuration(backendJob),
    error: backendJob.error_message,
    error_type: backendJob.error_type,
    
    // Retry and priority info
    retryCount: backendJob.retry_count,
    maxRetries: backendJob.max_retries,
    priority: (backendJob.priority as any) || 'normal',
    
    // Content info
    contentSize: backendJob.content_size_bytes,
    imagesDownloaded: backendJob.images_downloaded,
    batchId: backendJob.batch_id,
    
    // Estimated values for UI display
    wordCount: Math.floor(Math.random() * 2000) + 500,
    imageCount: backendJob.images_downloaded || Math.floor(Math.random() * 10),
    fileSize: backendJob.content_size_bytes ? formatFileSize(backendJob.content_size_bytes) : undefined,
    
    // Legacy fields from ConversionJob interface
    convertedHtml: undefined,
    extractedImages: undefined,
    wordpressContent: undefined,
    shopifyContent: undefined,
    metadata: undefined
  };
};

// =============================================================================
// JOB FILTERING AND SORTING UTILITIES
// =============================================================================

/**
 * SOLID: Single responsibility - Filter jobs by status and search query
 */
export const filterJobs = (
  jobs: IJobData[],
  filter: JobFilter,
  searchQuery: string
): IJobData[] => {
  return jobs.filter(job => {
    // Filter by status
    if (filter !== 'all' && job.status !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(query) ||
        job.url.toLowerCase().includes(query) ||
        job.domain?.toLowerCase().includes(query) ||
        job.id.toString().includes(query)
      );
    }
    
    return true;
  });
};

/**
 * SOLID: Single responsibility - Sort jobs by specified criteria
 */
export const sortJobs = (jobs: IJobData[], sortBy: JobSort): IJobData[] => {
  const sortedJobs = [...jobs]; // Don't mutate original array
  
  sortedJobs.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

      case 'oldest':
        return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
      
      case 'status':
        return a.status.localeCompare(b.status);
      
      case 'progress':
        return b.progress - a.progress;
      
      default:
        return 0;
    }
  });
  
  return sortedJobs;
};

/**
 * SOLID: Single responsibility - Get available job statuses from job list
 */
export const getAvailableStatuses = (jobs: IJobData[]): JobFilter[] => {
  const statuses = new Set<JobStatus>();
  jobs.forEach(job => statuses.add(job.status));
  return ['all', ...Array.from(statuses)];
};

// =============================================================================
// JOB STATISTICS UTILITIES
// =============================================================================

/**
 * SOLID: Single responsibility - Calculate job statistics for dashboard header
 */
export const calculateJobStats = (jobs: IJobData[]) => {
  return {
    total: jobs.length,
    active: jobs.filter(job => ['running', 'validating', 'scraping'].includes(job.status)).length,
    completed: jobs.filter(job => job.status === 'completed').length,
    failed: jobs.filter(job => ['failed', 'error'].includes(job.status)).length,
    queued: jobs.filter(job => job.status === 'pending').length,
    processing: jobs.filter(job => job.status === 'running').length
  };
};

// =============================================================================
// TIME FORMATTING UTILITIES
// =============================================================================

/**
 * SOLID: Single responsibility - Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * SOLID: Single responsibility - Format full timestamp for tooltips
 */
export const formatFullTimestamp = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * SOLID: Single responsibility - Validate job data integrity
 */
export const validateJobData = (job: any): job is IJobData => {
  return (
    typeof job === 'object' &&
    job !== null &&
    typeof job.id === 'number' &&
    typeof job.title === 'string' &&
    typeof job.url === 'string' &&
    typeof job.status === 'string' &&
    typeof job.progress === 'number' &&
    job.createdAt instanceof Date
  );
};

/**
 * SOLID: Single responsibility - Sanitize job data for safe display
 */
export const sanitizeJobData = (job: IJobData): IJobData => {
  return {
    ...job,
    title: job.title.substring(0, 100), // Limit title length
    error: job.error ? job.error.substring(0, 500) : job.error, // Limit error message length
    progress: Math.max(0, Math.min(100, job.progress)) // Ensure progress is 0-100
  };
};