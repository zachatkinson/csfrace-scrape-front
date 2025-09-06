/**
 * JobQueue Component
 * Real-time job monitoring dashboard with Liquid Glass material
 * SOLID: Open/Closed Principle - Uses Strategy Pattern for job statuses
 * Implements Apple's clarity and depth principles with live updates
 */

import React, { useState, useCallback, useMemo } from 'react';
import { LiquidCard, LiquidButton } from '../liquid-glass';
import { JobStatusManager } from '../../strategies/JobStatusStrategy.tsx';
import type { JobStatus } from '../../strategies/JobStatusStrategy.tsx';

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
  
  // Get status statistics using Strategy Pattern
  const statusStats = useMemo(() => {
    const stats = {
      total: jobs.length,
      pending: 0,
      processing: 0,
      completed: 0,
      error: 0,
    };
    
    jobs.forEach(job => {
      const statusInfo = JobStatusManager.getStats(job.status);
      stats[statusInfo.category]++;
    });
    
    return stats;
  }, [jobs]);
  
  // Get status display properties using Strategy Pattern
  const getStatusDisplay = (status: JobStatus) => {
    return JobStatusManager.getDisplay(status);
  };
  
  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };
  
  // Handle job selection
  const toggleJobSelection = useCallback((jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);
  
  // Bulk operations
  const handleBulkCancel = useCallback(() => {
    selectedJobs.forEach(jobId => {
      if (onJobCancel) onJobCancel(jobId);
    });
    setSelectedJobs(new Set());
  }, [selectedJobs, onJobCancel]);
  
  const handleBulkDelete = useCallback(() => {
    selectedJobs.forEach(jobId => {
      if (onJobDelete) onJobDelete(jobId);
    });
    setSelectedJobs(new Set());
  }, [selectedJobs, onJobDelete]);
  
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
      
      {/* Controls */}
      <LiquidCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | JobStatus)}
                className="liquid-glass px-3 py-1 rounded-glass text-sm text-white bg-transparent border border-white/20 focus:border-blue-500/50"
              >
                <option value="all">All Jobs</option>
                <option value="pending">Pending</option>
                <option value="validating">Validating</option>
                <option value="scraping">Converting</option>
                <option value="completed">Completed</option>
                <option value="error">Failed</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'progress')}
                className="liquid-glass px-3 py-1 rounded-glass text-sm text-white bg-transparent border border-white/20 focus:border-blue-500/50"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="progress">By Progress</option>
              </select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedJobs.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">
                {selectedJobs.size} selected
              </span>
              
              <LiquidButton
                variant="destructive"
                size="sm"
                onClick={handleBulkCancel}
              >
                Cancel
              </LiquidButton>
              
              <LiquidButton
                variant="secondary"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete
              </LiquidButton>
            </div>
          )}
        </div>
      </LiquidCard>
      
      {/* Job List */}
      <div className="space-y-3">
        {filteredAndSortedJobs.length === 0 ? (
          <LiquidCard className="text-center py-12">
            <div className="text-white/60">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium mb-2">No jobs found</p>
              <p className="text-sm">Start by submitting a WordPress URL for conversion</p>
            </div>
          </LiquidCard>
        ) : (
          filteredAndSortedJobs.map((job) => {
            const statusDisplay = getStatusDisplay(job.status);
            const duration = job.completedAt 
              ? job.completedAt.getTime() - job.createdAt.getTime()
              : Date.now() - job.createdAt.getTime();
            
            return (
              <LiquidCard
                key={job.id}
                className="hover:shadow-glass-hover transition-all duration-glass cursor-pointer"
                onClick={() => toggleJobSelection(job.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-glass ${
                      selectedJobs.has(job.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-white/30 hover:border-white/50'
                    }`}>
                      {selectedJobs.has(job.id) && (
                        <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Job Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* URL and Title */}
                        <div className="mb-2">
                          <h3 className="font-medium text-white truncate">
                            {job.result?.metadata?.title || 'WordPress Content'}
                          </h3>
                          <p className="text-sm text-white/60 truncate">{job.url}</p>
                        </div>
                        
                        {/* Progress Bar - Strategy Pattern determines visibility */}
                        {JobStatusManager.shouldShowProgress(job.status) && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                              <span>Progress: {job.progress}%</span>
                              {job.estimatedTimeRemaining && (
                                <span>~{formatDuration(job.estimatedTimeRemaining)} remaining</span>
                              )}
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>{formatDuration(duration)}</span>
                          {job.result?.metadata?.wordCount && (
                            <span>{job.result.metadata.wordCount} words</span>
                          )}
                          {job.result?.images?.length && (
                            <span>{job.result.images.length} images</span>
                          )}
                        </div>
                        
                        {/* Error Message */}
                        {job.error && (
                          <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                            {job.error}
                          </div>
                        )}
                      </div>
                      
                      {/* Status and Actions */}
                      <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          statusDisplay.bgColor
                        } ${statusDisplay.color}`}>
                          {statusDisplay.icon}
                          {statusDisplay.label}
                        </div>
                        
                        {/* Action Buttons - Strategy Pattern determines available actions */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const behavior = JobStatusManager.getBehavior(job.status);
                            const actions = [];
                            
                            // Download button
                            if (behavior.canDownload && onJobDownload) {
                              actions.push(
                                <button
                                  key="download"
                                  onClick={() => onJobDownload(job.id)}
                                  className="p-2 text-white/60 hover:text-white transition-colors"
                                  title="Download Result"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              );
                            }
                            
                            // Retry button
                            if (behavior.canRetry && onJobRetry) {
                              actions.push(
                                <button
                                  key="retry"
                                  onClick={() => onJobRetry(job.id)}
                                  className="p-2 text-white/60 hover:text-white transition-colors"
                                  title="Retry Job"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              );
                            }
                            
                            // Cancel button
                            if (behavior.canCancel && onJobCancel) {
                              actions.push(
                                <button
                                  key="cancel"
                                  onClick={() => onJobCancel(job.id)}
                                  className="p-2 text-white/60 hover:text-red-400 transition-colors"
                                  title="Cancel Job"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              );
                            }
                            
                            // Delete button
                            if (behavior.canDelete && onJobDelete) {
                              actions.push(
                                <button
                                  key="delete"
                                  onClick={() => onJobDelete(job.id)}
                                  className="p-2 text-white/60 hover:text-red-400 transition-colors"
                                  title="Delete Job"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              );
                            }
                            
                            return actions;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </LiquidCard>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JobQueue;