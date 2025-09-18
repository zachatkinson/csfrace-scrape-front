/**
 * Dashboard Manager - Following SOLID SRP
 * SOLID: Single Responsibility - Only coordinates between focused hooks
 * DRY: Uses focused hooks to eliminate duplication
 * Following CLAUDE.md NO LOCAL SERVICES RULE
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { IJobData, JobFilter, JobSort } from '../../types/job.ts';
import * as jobUtils from '../../utils/dashboard/jobUtils.ts';
import { createContextLogger } from '../../utils/logger';

// Focused hooks following SRP
import { useJobData } from './hooks/useJobData.ts';
import { useJobActions } from './hooks/useJobActions.ts';
import { useConnectionStatus } from './hooks/useConnectionStatus.ts';
import { useJobSelection } from './hooks/useJobSelection.ts';
import { useAutoRefresh } from './hooks/useAutoRefresh.ts';

const logger = createContextLogger('DashboardManager');

interface DashboardManagerProps {
  initialJobs?: IJobData[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({
  initialJobs = [],
  autoRefresh = true,
  refreshInterval = 10000
}) => {
  // =============================================================================
  // UI STATE - Single Responsibility: UI filtering/sorting state only
  // =============================================================================
  const [currentFilter, setCurrentFilter] = useState<JobFilter>('all');
  const [currentSort, setCurrentSort] = useState<JobSort>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredJobs, setFilteredJobs] = useState<IJobData[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // =============================================================================
  // FOCUSED HOOKS - Single Responsibility per hook
  // =============================================================================

  // Job data management - memoize options to prevent infinite re-renders
  const jobDataOptions = useMemo(() => ({
    pageSize: 10,
    autoRefresh,
    refreshInterval
  }), [autoRefresh, refreshInterval]);
  
  const jobData = useJobData(jobDataOptions);

  // Connection status monitoring - memoize callback to prevent re-renders
  const onStatusChange = useCallback((status: string) => {
    logger.info('Connection status changed', { status });
  }, []);
  
  const connectionStatusOptions = useMemo(() => ({
    onStatusChange
  }), [onStatusChange]);
  
  const connectionStatus = useConnectionStatus(connectionStatusOptions);

  // Job selection management
  const jobSelection = useJobSelection();

  // Job actions (retry, cancel, delete, download) - memoize callbacks to prevent re-renders
  const onJobUpdated = useCallback(() => {
    jobData.refreshJobs();
  }, [jobData]);

  const onJobError = useCallback((message: string) => {
    setNotification({ type: 'error', message });
    connectionStatus.markDisconnected();
  }, [connectionStatus]);

  const onJobSuccess = useCallback((message: string) => {
    setNotification({ type: 'success', message });
    connectionStatus.markConnected();
  }, [connectionStatus]);
  
  const jobActionsOptions = useMemo(() => ({
    onJobUpdated,
    onError: onJobError,
    onSuccess: onJobSuccess
  }), [onJobUpdated, onJobError, onJobSuccess]);
  
  const jobActions = useJobActions(jobActionsOptions);

  // Auto-refresh coordination - memoize callback and options
  const refreshCallback = useCallback(() => {
    jobData.refreshJobs();
  }, [jobData]);
  
  const autoRefreshOptions = useMemo(() => ({
    enabled: false, // ✅ DISABLED: SSE handles real-time updates now (DRY/SOLID)
    interval: refreshInterval,
    connectionStatus: connectionStatus.status,
    isLoading: jobData.isLoading
  }), [refreshInterval, connectionStatus.status, jobData.isLoading]);
  
  useAutoRefresh(refreshCallback, autoRefreshOptions);

  // =============================================================================
  // UI EVENT HANDLERS - Single Responsibility: UI state updates only
  // =============================================================================

  const handleFilterChange = useCallback((newFilter: JobFilter) => {
    setCurrentFilter(newFilter);
    setCurrentPage(1);
    // Load jobs with new filter
    const params: { page: number; statusFilter?: string } = { page: 1 };
    if (newFilter !== 'all') {
      params.statusFilter = newFilter as string;
    }
    jobData.loadJobs(params);
  }, [jobData]);

  const handleSortChange = useCallback((newSort: JobSort) => {
    setCurrentSort(newSort);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const params: { page: number; statusFilter?: string } = { page };
    if (currentFilter !== 'all') {
      params.statusFilter = currentFilter as string;
    }
    jobData.loadJobs(params);
  }, [jobData, currentFilter]);

  // =============================================================================
  // JOB ACTION HANDLERS - Single Responsibility: Delegate to job actions hook
  // =============================================================================

  const handleJobAction = useCallback(async (action: string, jobId: number) => {
    switch (action) {
      case 'retry':
        await jobActions.retryJob(jobId);
        break;
      case 'cancel':
        await jobActions.cancelJob(jobId);
        break;
      case 'delete':
        await jobActions.deleteJob(jobId);
        break;
      case 'download':
        await jobActions.downloadJob(jobId, jobData.jobs);
        break;
      default:
        logger.warn('Unknown job action', { action });
    }
  }, [jobActions, jobData.jobs]);

  // =============================================================================
  // EFFECTS - Single Responsibility: Coordinate state updates
  // =============================================================================

  // Initialize with initial jobs
  useEffect(() => {
    if (initialJobs.length > 0) {
      // Set initial data without loading
      // jobData will handle the actual loading
    }
    // Load fresh data
    jobData.loadJobs();

    // No cleanup needed
    return undefined;
  }, [jobData, initialJobs.length]); // ✅ Fix: Include all dependencies

  // Update filtered jobs when data or filters change
  useEffect(() => {
    const filtered = jobUtils.filterJobs(jobData.jobs, currentFilter, searchQuery);
    const sorted = jobUtils.sortJobs(filtered, currentSort);
    setFilteredJobs(sorted);
  }, [jobData.jobs, currentFilter, searchQuery, currentSort]);

  // Listen for external filter updates
  useEffect(() => {
    const handleFilterUpdate = (event: CustomEvent) => {
      const { filter } = event.detail;
      handleFilterChange(filter);
    };

    window.addEventListener('filterUpdate', handleFilterUpdate as EventListener);
    return () => window.removeEventListener('filterUpdate', handleFilterUpdate as EventListener);
  }, [handleFilterChange]);

  // Emit jobs data updates for other components
  useEffect(() => {
    const event = new CustomEvent('jobsDataUpdate', {
      detail: { jobs: jobData.jobs }
    });
    window.dispatchEvent(event);

    // No cleanup needed
    return undefined;
  }, [jobData.jobs]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
    // Return undefined when no notification
    return undefined;
  }, [notification]);

  // =============================================================================
  // RENDER - Single Responsibility: UI coordination only
  // =============================================================================

  return (
    <div className="dashboard-manager">
      {/* Notification Display */}
      {notification && (
        <div className={`notification ${notification.type === 'error' ? 'error' : 'success'}`}>
          {notification.message}
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className={`connection-status ${connectionStatus.status}`}>
        Status: {connectionStatus.status}
      </div>

      {/* Job Statistics */}
      <div className="job-stats">
        <div>Total: {jobData.stats.total}</div>
        <div>Active: {jobData.stats.active}</div>
        <div>Completed: {jobData.stats.completed}</div>
        <div>Failed: {jobData.stats.failed}</div>
        <div>Queued: {jobData.stats.queued}</div>
      </div>

      {/* Filter/Search Controls */}
      <div className="dashboard-controls">
        <select
          value={currentFilter}
          onChange={(e) => handleFilterChange(e.target.value as JobFilter)}
        >
          <option value="all">All Jobs</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value as JobSort)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="status">By Status</option>
          <option value="progress">By Progress</option>
        </select>

        <input
          type="text"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Selection Controls */}
      {jobSelection.hasSelection && (
        <div className="selection-controls">
          <span>{jobSelection.selectedCount} jobs selected</span>
          <button onClick={jobSelection.clearSelection}>Clear Selection</button>
        </div>
      )}

      {/* Job List */}
      <div className="job-list">
        {jobData.isLoading ? (
          <div className="loading">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">No jobs found</div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="job-item">
              <input
                type="checkbox"
                checked={jobSelection.isSelected(job.id)}
                onChange={(e) => jobSelection.toggleJobSelection(job.id, e.target.checked)}
              />
              <div className="job-details">
                <h3>{job.title}</h3>
                <p>Status: {job.status}</p>
                <p>Progress: {job.progress}%</p>
              </div>
              <div className="job-actions">
                {job.status === 'failed' && (
                  <button onClick={() => handleJobAction('retry', job.id)}>Retry</button>
                )}
                {(job.status === 'pending' || job.status === 'running') && (
                  <button onClick={() => handleJobAction('cancel', job.id)}>Cancel</button>
                )}
                {job.status === 'completed' && (
                  <button onClick={() => handleJobAction('download', job.id)}>Download</button>
                )}
                <button onClick={() => handleJobAction('delete', job.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={filteredJobs.length < 10}
          >
            Next
          </button>
        </div>
      )}

      {/* Last Updated Info */}
      {jobData.lastUpdated && (
        <div className="last-updated">
          Last updated: {jobData.lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default DashboardManager;