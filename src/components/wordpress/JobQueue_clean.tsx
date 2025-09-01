/**
 * JobQueue Component
 * Real-time job monitoring dashboard with Liquid Glass material
 * Implements Apple's clarity and depth principles with live updates
 */

import React, { useState, useCallback, useMemo } from 'react';
import { LiquidCard, LiquidButton } from '../liquid-glass';

// Job status types
type JobStatus = 'pending' | 'validating' | 'scraping' | 'completed' | 'error' | 'cancelled';

// Job interface
interface Job {
  id: string;
  url: string;
  status: JobStatus;
  progress: number;
  result?: {
    convertedHtml: string;
    images: string[];
    metadata: {
      title?: string;
      type?: 'post' | 'page' | 'product';
      wordCount?: number;
      estimatedSize?: string;
    };
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
}

export interface JobQueueProps {
  jobs: Job[];
  onJobCancel?: (jobId: string) => void;
  onJobRetry?: (jobId: string) => void;
  onJobDelete?: (jobId: string) => void;
  onJobDownload?: (jobId: string) => void;
  maxVisibleJobs?: number;
  className?: string;
}

/**
 * JobQueue - Premium dashboard for monitoring conversion jobs
 */
export const JobQueue: React.FC<JobQueueProps> = ({
  jobs = [],
  onJobCancel,
  onJobRetry,
  onJobDelete,
  onJobDownload,
  maxVisibleJobs = 10,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | JobStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'progress'>('newest');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  
  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = jobs.filter(job => job.status === filter);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'progress':
          return b.progress - a.progress;
        case 'newest':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
    
    return sorted.slice(0, maxVisibleJobs);
  }, [jobs, filter, sortBy, maxVisibleJobs]);
  
  // Get status statistics
  const statusStats = useMemo(() => {
    const stats = {
      total: jobs.length,
      pending: 0,
      processing: 0,
      completed: 0,
      error: 0,
    };
    
    jobs.forEach(job => {
      switch (job.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'validating':
        case 'scraping':
          stats.processing++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'error':
          stats.error++;
          break;
      }
    });
    
    return stats;
  }, [jobs]);
  
  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <LiquidCard className="text-center">
          <div className="text-2xl font-bold text-white">{statusStats.total}</div>
          <div className="text-sm text-white/70">Total Jobs</div>
        </LiquidCard>
        
        <LiquidCard className="text-center">
          <div className="text-2xl font-bold text-gray-400">{statusStats.pending}</div>
          <div className="text-sm text-white/70">Pending</div>
        </LiquidCard>
        
        <LiquidCard className="text-center">
          <div className="text-2xl font-bold text-blue-400">{statusStats.processing}</div>
          <div className="text-sm text-white/70">Processing</div>
        </LiquidCard>
        
        <LiquidCard className="text-center">
          <div className="text-2xl font-bold text-green-400">{statusStats.completed}</div>
          <div className="text-sm text-white/70">Completed</div>
        </LiquidCard>
        
        <LiquidCard className="text-center">
          <div className="text-2xl font-bold text-red-400">{statusStats.error}</div>
          <div className="text-sm text-white/70">Failed</div>
        </LiquidCard>
      </div>
      
      {/* Job List Placeholder */}
      <LiquidCard className="text-center py-12">
        <div className="text-white/60">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium mb-2">Job Queue Ready</p>
          <p className="text-sm">Submit WordPress URLs to see jobs appear here</p>
        </div>
      </LiquidCard>
    </div>
  );
};

export default JobQueue;