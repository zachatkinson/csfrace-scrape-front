// =============================================================================
// DASHBOARD MANAGER - DRY/SOLID React Component
// =============================================================================
// Single Responsibility: Handle dashboard interactivity and real-time updates
// Following CLAUDE.md NO LOCAL SERVICES RULE - simple fetch() calls only
// Follows established patterns from health monitoring components
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import type {
  IJobData,
  IDashboardState,
  JobFilter
} from '../../types/job.js';

// Import utilities following CLAUDE.md NO LOCAL SERVICES RULE
import * as apiClient from '../../utils/dashboard/apiClient.js';
import * as jobUtils from '../../utils/dashboard/jobUtils.js';
import { formatErrorMessage, logError } from '../../utils/errorHandler.js';

interface DashboardManagerProps {
  initialJobs?: IJobData[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({
  initialJobs = [],
  autoRefresh = true,
  refreshInterval = 10000 // 10 seconds
}) => {
  // =============================================================================
  // STATE MANAGEMENT - Following React best practices
  // =============================================================================
  
  const [state, setState] = useState<IDashboardState>({
    jobs: initialJobs,
    filteredJobs: [],
    selectedJobs: new Set(),
    currentFilter: 'all',
    currentSort: 'newest',
    searchQuery: '',
    currentPage: 1,
    jobsPerPage: 10,
    isLoading: false,
    connectionStatus: 'connected',
    stats: { total: 0, active: 0, completed: 0, failed: 0, queued: 0 }
  });

  // =============================================================================
  // API CALLS - Following CLAUDE.md simple fetch() pattern
  // =============================================================================

  const loadJobs = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, connectionStatus: 'connected' }));
      
      // Simple fetch() call to Docker backend - no complex services
      const response = await apiClient.getJobs({
        page: state.currentPage,
        page_size: state.jobsPerPage,
        status_filter: state.currentFilter !== 'all' ? state.currentFilter : undefined
      });
      
      const convertedJobs = response.jobs.map(jobUtils.convertBackendJob);
      
      setState(prev => ({
        ...prev,
        jobs: convertedJobs,
        isLoading: false,
        stats: jobUtils.calculateJobStats(convertedJobs)
      }));

      // Update available filter statuses
      emitJobsDataUpdate(convertedJobs);
      
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setState(prev => ({ ...prev, isLoading: false, connectionStatus: 'disconnected' }));
      showError(error);
    }
  }, [state.currentPage, state.jobsPerPage, state.currentFilter]);

  // =============================================================================
  // JOB ACTIONS - Simple API calls following CLAUDE.md guidelines
  // =============================================================================

  const retryJob = useCallback(async (jobId: number) => {
    try {
      await apiClient.retryJob(jobId);
      await loadJobs(); // Refresh list
      alert('Job retry initiated successfully');
    } catch (error) {
      console.error('Retry failed:', error);
      logError(error, 'Job Retry');
      alert(formatErrorMessage(error, 'Retry failed'));
    }
  }, [loadJobs]);

  const cancelJob = useCallback(async (jobId: number) => {
    try {
      await apiClient.cancelJob(jobId);
      await loadJobs(); // Refresh list
      alert('Job cancelled successfully');
    } catch (error) {
      console.error('Cancel failed:', error);
      logError(error, 'Job Cancel');
      alert(formatErrorMessage(error, 'Cancel failed'));
    }
  }, [loadJobs]);

  const deleteJob = useCallback(async (jobId: number) => {
    if (confirm('Delete this job?')) {
      try {
        await apiClient.deleteJob(jobId);
        await loadJobs(); // Refresh list
      } catch (error) {
        console.error('Delete failed:', error);
        logError(error, 'Job Delete');
        alert(formatErrorMessage(error, 'Delete failed'));
      }
    }
  }, [loadJobs]);

  const downloadJob = useCallback(async (jobId: number) => {
    try {
      const job = state.jobs.find(j => j.id === jobId);
      if (!job || job.status !== 'completed') {
        alert('Job must be completed to download');
        return;
      }
      
      // Simple API call for download
      const content = await apiClient.downloadJobContent(jobId);
      
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-${jobId}-${job.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      logError(error, 'File Download');
      alert(formatErrorMessage(error, 'Download failed'));
    }
  }, [state.jobs]);

  // =============================================================================
  // EVENT HANDLERS - Following React patterns
  // =============================================================================

  const handleFilterChange = useCallback((newFilter: JobFilter) => {
    setState(prev => ({ ...prev, currentFilter: newFilter, currentPage: 1 }));
  }, []);


  const handleJobSelection = useCallback((jobId: number, selected: boolean) => {
    setState(prev => {
      const newSelectedJobs = new Set(prev.selectedJobs);
      if (selected) {
        newSelectedJobs.add(jobId);
      } else {
        newSelectedJobs.delete(jobId);
      }
      return { ...prev, selectedJobs: newSelectedJobs };
    });
  }, []);

  // =============================================================================
  // EFFECTS - React lifecycle management
  // =============================================================================

  // Initial load
  useEffect(() => {
    loadJobs();
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (state.connectionStatus === 'connected' && !state.isLoading) {
        loadJobs();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, state.connectionStatus, state.isLoading, loadJobs]);

  // Filter and sort jobs when data changes
  useEffect(() => {
    const filtered = jobUtils.filterJobs(state.jobs, state.currentFilter, state.searchQuery);
    const sorted = jobUtils.sortJobs(filtered, state.currentSort);
    
    setState(prev => ({ ...prev, filteredJobs: sorted }));
  }, [state.jobs, state.currentFilter, state.searchQuery, state.currentSort]);

  // Listen for filter updates from FilterPanel
  useEffect(() => {
    const handleFilterUpdate = (event: CustomEvent) => {
      const { filter } = event.detail;
      handleFilterChange(filter);
    };

    window.addEventListener('filterUpdate', handleFilterUpdate as EventListener);
    return () => window.removeEventListener('filterUpdate', handleFilterUpdate as EventListener);
  }, [handleFilterChange]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const emitJobsDataUpdate = useCallback((jobs: IJobData[]) => {
    const event = new CustomEvent('jobsDataUpdate', {
      detail: { jobs }
    });
    window.dispatchEvent(event);
  }, []);

  const showError = useCallback((error: any) => {
    const container = document.getElementById('jobs-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 bg-orange-500/10 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h3 class="text-orange-400 font-medium mb-2">Connection Issue</h3>
          <p class="text-white/60 text-sm mb-4">${typeof error === 'string' ? error : 'Failed to load jobs'}</p>
          <button onclick="window.dashboardManager?.loadJobs()" class="glass-button px-4 py-2 text-white/90 hover:text-white">
            Try Again
          </button>
        </div>
      `;
    }
  }, []);

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================


  const handleJobAction = useCallback(async (action: string, jobId: number) => {
    try {
      switch (action) {
        case 'view-details':
          // TODO: Implement modal display
          console.log('View details for job:', jobId);
          break;
        case 'download':
          await downloadJob(jobId);
          break;
        case 'retry':
          await retryJob(jobId);
          break;
        case 'cancel':
          await cancelJob(jobId);
          break;
        case 'delete':
          await deleteJob(jobId);
          break;
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  }, [downloadJob, retryJob, cancelJob, deleteJob]);

  // Status utilities
  const getStatusIcon = (status: string): string => {
    const config = {
      completed: { color: 'green-400', icon: '●' },
      processing: { color: 'blue-400', icon: '◐', animate: true },
      failed: { color: 'red-400', icon: '●' },
      cancelled: { color: 'yellow-400', icon: '●' },
      queued: { color: 'gray-400', icon: '○' }
    }[status] || { color: 'gray-400', icon: '○' };
    
    return `<div class="w-3 h-3 flex items-center justify-center text-${config.color} ${config.animate ? 'animate-pulse' : ''}">${config.icon}</div>`;
  };

  const getStatusColorClass = (status: string): string => {
    return {
      completed: 'text-green-400 border-green-400/30 bg-green-500/10',
      processing: 'text-blue-400 border-blue-400/30 bg-blue-500/10',
      failed: 'text-red-400 border-red-400/30 bg-red-500/10',
      cancelled: 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10',
      queued: 'text-gray-400 border-gray-400/30 bg-gray-500/10'
    }[status] || 'text-gray-400 border-gray-400/30 bg-gray-500/10';
  };

  // =============================================================================
  // RENDER - Update DOM with job cards
  // =============================================================================

  useEffect(() => {
    const container = document.getElementById('jobs-container');
    if (!container) return;

    if (state.isLoading) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="animate-spin rounded-full w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 mx-auto mb-4"></div>
          <h3 class="text-white font-medium mb-2">Loading jobs...</h3>
          <p class="text-white/60 text-sm">Please wait while we fetch your conversion jobs</p>
        </div>
      `;
      return;
    }

    if (state.filteredJobs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-white font-medium mb-2">No jobs found</h3>
          <p class="text-white/60 text-sm">Try adjusting your filters or search query</p>
        </div>
      `;
      return;
    }

    // Render job cards using React's virtual DOM
    // This is a hybrid approach - React manages state, DOM updates manually
    container.innerHTML = state.filteredJobs.map(job => {
      const isSelected = state.selectedJobs.has(job.id);
      return `
        <div class="job-card p-4 rounded-lg border-l-4 bg-white/5 hover:bg-white/10 transition-all duration-200 ${
          isSelected ? 'selected bg-blue-500/10 border-blue-400' : 'border-gray-400/30'
        }" data-job-id="${job.id}">
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4 flex-1">
              <input type="checkbox" class="job-checkbox mt-1" ${isSelected ? 'checked' : ''} data-job-id="${job.id}">
              <div class="flex items-center space-x-3 flex-1">
                <div class="status-icon">${getStatusIcon(job.status)}</div>
                <div class="flex-1">
                  <h3 class="text-white font-medium cursor-pointer hover:text-blue-400 transition-colors" data-job-id="${job.id}" data-action="view-details">
                    ${job.title}
                  </h3>
                  <p class="text-white/60 text-sm truncate max-w-md" title="${job.url}">${job.url}</p>
                  <div class="flex items-center space-x-4 mt-2 text-xs text-white/50">
                    <span title="${job.createdAt ? jobUtils.formatFullTimestamp(job.createdAt) : 'No date'}">${job.createdAt ? jobUtils.formatRelativeTime(job.createdAt) : 'No date'}</span>
                    <span>ID: ${job.id}</span>
                    ${job.domain ? `<span>${job.domain}</span>` : ''}
                    ${job.wordCount > 0 ? `<span>${job.wordCount.toLocaleString()} words</span>` : ''}
                    ${job.imageCount > 0 ? `<span>${job.imageCount} images</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              ${job.status === 'running' && job.progress > 0 ? `
                <div class="flex items-center space-x-2">
                  <div class="w-24 h-2 bg-white/20 rounded-full">
                    <div class="bg-blue-400 h-full rounded-full transition-all duration-1000" style="width: ${job.progress}%"></div>
                  </div>
                  <span class="text-white/70 text-xs">${job.progress}%</span>
                </div>
              ` : ''}
              <div class="status-badge px-3 py-1 rounded-full border ${getStatusColorClass(job.status)}">
                <span class="text-xs font-medium">${job.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
          ${job.error ? `
            <div class="mt-4 ml-7">
              <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p class="text-red-400 text-xs font-medium mb-1">⚠️ Error${job.error_type ? ` (${job.error_type})` : ''}</p>
                <p class="text-red-300/80 text-xs">${job.error}</p>
              </div>
            </div>
          ` : ''}
          <div class="flex items-center justify-between mt-4">
            <div class="flex items-center space-x-2">
              ${job.priority && job.priority !== 'normal' ? `<span class="text-white/50 text-xs bg-white/10 px-2 py-1 rounded-full">🔥 ${job.priority.toUpperCase()}</span>` : ''}
              ${job.batchId ? `<span class="text-white/50 text-xs bg-white/10 px-2 py-1 rounded-full">📦 Batch ${job.batchId}</span>` : ''}
            </div>
            <div class="flex items-center space-x-2 ml-auto">
              <button class="glass-button px-3 py-1 text-xs text-white/90 hover:text-white" data-action="view-details" data-job-id="${job.id}">👁️ View</button>
              ${job.status === 'completed' ? `<button class="glass-button px-3 py-1 text-xs text-white/90 hover:text-white" data-action="download" data-job-id="${job.id}">📥 Download</button>` : ''}
              ${job.status === 'running' ? `<button class="glass-button px-3 py-1 text-xs text-yellow-400/80 hover:text-yellow-400" data-action="cancel" data-job-id="${job.id}">⏹️ Cancel</button>` : ''}
              ${job.status === 'failed' && job.retryCount < job.maxRetries ? `<button class="glass-button px-3 py-1 text-xs text-blue-400/80 hover:text-blue-400" data-action="retry" data-job-id="${job.id}">🔄 Retry</button>` : ''}
              <button class="glass-button px-3 py-1 text-xs text-red-400/80 hover:text-red-400" data-action="delete" data-job-id="${job.id}">🗑️ Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Setup event listeners for the rendered job cards
    setupJobCardEventListeners();

  }, [state.filteredJobs, state.isLoading, state.selectedJobs]);

  const setupJobCardEventListeners = useCallback(() => {
    const container = document.getElementById('jobs-container');
    if (!container) return;

    // Job actions
    container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');
      const jobIdStr = target.closest('[data-job-id]')?.getAttribute('data-job-id');
      
      if (!action || !jobIdStr) return;
      
      const jobId = parseInt(jobIdStr);
      await handleJobAction(action, jobId);
    });

    // Job selection
    container.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('job-checkbox')) {
        const jobIdStr = target.getAttribute('data-job-id');
        if (jobIdStr) {
          const jobId = parseInt(jobIdStr);
          const checked = (target as HTMLInputElement).checked;
          handleJobSelection(jobId, checked);
        }
      }
    });
  }, [handleJobAction, handleJobSelection]);

  // Expose functions for external access
  useEffect(() => {
    (window as any).dashboardManager = {
      loadJobs,
      retryJob,
      cancelJob,
      deleteJob,
      downloadJob,
      state
    };
  }, [loadJobs, retryJob, cancelJob, deleteJob, downloadJob, state]);

  // This React component doesn't render anything directly
  // It manages state and updates the DOM manually for performance
  return null;
};

export default DashboardManager;