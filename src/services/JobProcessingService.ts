/**
 * Job Processing Service
 * Single Responsibility: Handle job submission, batch processing, and status tracking
 * SOLID: Dependency Inversion - Now uses injected IApiService instead of concrete 'api'
 * SOLID: Open/Closed - Uses Strategy Pattern for job status handling
 * Extracted from UrlScraper to follow SOLID principles
 */

import { TIMING_CONSTANTS } from '../constants/timing.ts';
import type { IApiService } from '../interfaces/services.ts';
import type { ConversionJob, JobStatus } from '../types';
import { JobStatusManager } from '../strategies/JobStatusStrategy.tsx';

export interface JobProcessingOptions {
  preserveFormatting?: boolean;
  convertImages?: boolean;
  optimizeImages?: boolean;
  downloadImages?: boolean;
  generateSeoTitle?: boolean;
  generateSeoDescription?: boolean;
  removeWordPressSpecific?: boolean;
  addShopifySpecific?: boolean;
}

export interface ScrapingJobUI extends Omit<ConversionJob, 'id' | 'status'> {
  id: string;
  status: JobStatus | 'validating';
  progress: number;
  error?: string;
  createdAt: Date;
}

export interface JobProcessingEvents {
  onJobSubmitted: (job: ScrapingJobUI) => void;
  onJobUpdated: (job: ScrapingJobUI) => void;
  onJobCompleted: (job: ScrapingJobUI) => void;
  onJobError: (job: ScrapingJobUI, error: string) => void;
  onBatchSubmitted: (jobs: ScrapingJobUI[]) => void;
  onBatchProgress: (completedJobs: number, totalJobs: number) => void;
}

/**
 * Job Processing Service - Handles job lifecycle management
 * SOLID: Dependency Inversion - Depends on IApiService abstraction, not concrete implementation
 */
export class JobProcessingService {
  private activeJobs = new Map<string, ScrapingJobUI>();
  private pollingIntervals = new Map<string, number>();
  private events: Partial<JobProcessingEvents> = {};

  // Default processing options
  private defaultOptions: JobProcessingOptions = {
    preserveFormatting: true,
    convertImages: true,
    optimizeImages: true,
    downloadImages: true,
    generateSeoTitle: true,
    generateSeoDescription: true,
    removeWordPressSpecific: true,
    addShopifySpecific: true,
  };

  constructor(
    private apiService: IApiService,
    events: Partial<JobProcessingEvents> = {}
  ) {
    this.events = events;
  }

  /**
   * Submit a single URL for processing
   */
  async submitJob(
    url: string, 
    options: JobProcessingOptions = {}
  ): Promise<ScrapingJobUI | null> {
    try {
      const jobOptions = { ...this.defaultOptions, ...options };
      
      // SOLID: Dependency Inversion - Use injected service, not concrete 'api'
      const response = await this.apiService.submitJob(url, jobOptions);
      
      if (response.success && response.data) {
        const job = this.createJobUI(response.data);
        this.activeJobs.set(job.id, job);
        
        // Start polling for status updates
        this.startPolling(job.id);
        
        this.events.onJobSubmitted?.(job);
        return job;
      } else {
        console.error('Job creation failed:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating job:', error);
      return null;
    }
  }

  /**
   * Submit batch URLs for processing
   */
  async submitBatch(
    urls: string[],
    options: JobProcessingOptions = {},
    batchName?: string
  ): Promise<ScrapingJobUI[] | null> {
    try {
      const jobOptions = { ...this.defaultOptions, ...options };
      const finalBatchName = batchName || `Batch - ${new Date().toLocaleDateString()}`;
      
      // SOLID: Dependency Inversion - Use injected service
      const response = await this.apiService.submitBatch(urls, jobOptions, finalBatchName);
      
      if (response.success && response.data) {
        // Get the batch with jobs
        // SOLID: Dependency Inversion - Use injected service
        const batchResponse = await this.apiService.getBatch(response.data.id.toString());
        
        if (batchResponse.success && batchResponse.data && 'jobs' in batchResponse.data) {
          const jobs = batchResponse.data.jobs.map(jobData => this.createJobUI(jobData));
          
          // Track all jobs and start polling
          jobs.forEach(job => {
            this.activeJobs.set(job.id, job);
            this.startPolling(job.id);
          });
          
          this.events.onBatchSubmitted?.(jobs);
          return jobs;
        }
      }
      
      console.error('Batch creation failed:', response.error);
      return null;
    } catch (error) {
      console.error('Error creating batch:', error);
      return null;
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): ScrapingJobUI | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * Get all active jobs
   */
  getAllJobs(): ScrapingJobUI[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      // SOLID: Dependency Inversion - Use injected service
      const response = await this.apiService.cancelJob(jobId);
      if (response.success) {
        this.stopPolling(jobId);
        this.activeJobs.delete(jobId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cancelling job:', error);
      return false;
    }
  }

  /**
   * Remove job from tracking (completed/cancelled jobs)
   */
  removeJob(jobId: string): void {
    this.stopPolling(jobId);
    this.activeJobs.delete(jobId);
  }

  /**
   * Clear all completed jobs
   */
  clearCompletedJobs(): void {
    const completedJobs = Array.from(this.activeJobs.entries())
      .filter(([, job]) => job.status === 'completed' || job.status === 'error')
      .map(([id]) => id);
    
    completedJobs.forEach(jobId => {
      this.removeJob(jobId);
    });
  }

  /**
   * Get job statistics
   */
  getJobStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    errors: number;
  } {
    const jobs = this.getAllJobs();
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'scraping').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      errors: jobs.filter(j => j.status === 'error').length,
    };
  }

  /**
   * Create UI representation of job
   */
  private createJobUI(jobData: ConversionJob): ScrapingJobUI {
    return {
      ...jobData,
      id: jobData.id.toString(),
      status: jobData.status,
      progress: this.calculateProgress(jobData.status),
      createdAt: new Date(),
    };
  }

  /**
   * Calculate progress based on job status using Strategy Pattern
   */
  private calculateProgress(status: JobStatus | 'validating'): number {
    // Handle special 'validating' status that's not in the main JobStatus enum
    if (status === 'validating') {
      return 10; // Special case for validation phase
    }
    
    return JobStatusManager.getDefaultProgress(status as JobStatus);
  }

  /**
   * Start polling for job status updates
   */
  private startPolling(jobId: string): void {
    // Clear any existing polling for this job
    this.stopPolling(jobId);
    
    const pollInterval = window.setInterval(async () => {
      await this.pollJobStatus(jobId);
    }, TIMING_CONSTANTS.JOB_POLLING.STATUS_UPDATE_INTERVAL);
    
    this.pollingIntervals.set(jobId, pollInterval);
    
    // Auto-stop polling after maximum duration
    setTimeout(() => {
      this.stopPolling(jobId);
    }, TIMING_CONSTANTS.JOB_POLLING.MAX_POLLING_DURATION);
  }

  /**
   * Stop polling for a specific job
   */
  private stopPolling(jobId: string): void {
    const interval = this.pollingIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(jobId);
    }
  }

  /**
   * Poll job status from API
   */
  private async pollJobStatus(jobId: string): Promise<void> {
    try {
      // SOLID: Dependency Inversion - Use injected service
      const response = await this.apiService.getJob(jobId);
      if (response.success && response.data) {
        const updatedJob = this.createJobUI(response.data);
        
        // Update job in our tracking
        this.activeJobs.set(jobId, updatedJob);
        
        // Stop polling for terminal states
        if (this.isTerminalStatus(updatedJob.status)) {
          this.stopPolling(jobId);
          
          if (updatedJob.status === 'completed') {
            this.events.onJobCompleted?.(updatedJob);
          } else if (updatedJob.status === 'error') {
            this.events.onJobError?.(updatedJob, updatedJob.error || 'Job failed');
          }
        }
        
        this.events.onJobUpdated?.(updatedJob);
        
        // Update batch progress if needed
        this.updateBatchProgress();
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      // Continue polling - don't stop on polling errors
    }
  }

  /**
   * Check if status is terminal (no more updates expected)
   */
  private isTerminalStatus(status: JobStatus | 'validating'): boolean {
    return status === 'completed' || status === 'error' || status === 'cancelled';
  }

  /**
   * Update batch progress tracking
   */
  private updateBatchProgress(): void {
    const stats = this.getJobStats();
    const completedJobs = stats.completed + stats.errors;
    
    if (stats.total > 1 && completedJobs > 0) {
      this.events.onBatchProgress?.(completedJobs, stats.total);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Stop all polling
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
    
    // Clear active jobs
    this.activeJobs.clear();
  }
}

export default JobProcessingService;