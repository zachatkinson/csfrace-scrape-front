/**
 * Job Data Management Hook
 * SOLID: Single Responsibility - Handles only job data fetching and state
 * DRY: Consolidates job data patterns from DashboardManager
 */

import { useState, useCallback, useEffect } from 'react';
import type { IJobData, IJobStats } from '../../../types/job.ts';
import * as apiClient from '../../../utils/dashboard/apiClient.ts';
import * as jobUtils from '../../../utils/dashboard/jobUtils.ts';
import { logError } from '../../../utils/api-utils.ts';
import { createContextLogger } from '../../../utils/logger';

const logger = createContextLogger('useJobData');

export interface JobDataState {
  jobs: IJobData[];
  isLoading: boolean;
  stats: IJobStats;
  lastUpdated: Date | null;
}

export interface UseJobDataOptions {
  pageSize?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useJobData(options: UseJobDataOptions = {}) {
  const { pageSize = 10 } = options;

  const [state, setState] = useState<JobDataState>({
    jobs: [],
    isLoading: false,
    stats: { total: 0, active: 0, completed: 0, failed: 0, queued: 0 },
    lastUpdated: null
  });

  const loadJobs = useCallback(async (params?: {
    page?: number;
    statusFilter?: string;
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await apiClient.getJobs({
        page: params?.page || 1,
        page_size: pageSize,
        status_filter: params?.statusFilter
      });

      const convertedJobs = response.jobs.map(jobUtils.convertBackendJob);
      const stats = jobUtils.calculateJobStats(convertedJobs);

      setState(prev => ({
        ...prev,
        jobs: convertedJobs,
        stats,
        isLoading: false,
        lastUpdated: new Date()
      }));

      return convertedJobs;

    } catch (error) {
      logger.error('Failed to load jobs', { error });
      logError(error, 'Job Data Loading');
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [pageSize]);

  const refreshJobs = useCallback(() => {
    return loadJobs();
  }, [loadJobs]);

  // SSE Event Handling - Listen for real-time job updates (SOLID/DRY)
  useEffect(() => {
    const handleJobSSEUpdate = (event: CustomEvent) => {
      const { jobUpdate } = event.detail;
      logger.debug('Processing SSE job update', { jobUpdate });

      if (jobUpdate) {
        setState(prev => {
          const updatedJobs = [...prev.jobs];
          const jobIndex = updatedJobs.findIndex(job => job.id === jobUpdate.id);

          if (jobIndex >= 0) {
            // Update existing job
            updatedJobs[jobIndex] = jobUtils.convertBackendJob(jobUpdate);
          } else {
            // Add new job
            updatedJobs.unshift(jobUtils.convertBackendJob(jobUpdate));
          }

          const newStats = jobUtils.calculateJobStats(updatedJobs);

          return {
            ...prev,
            jobs: updatedJobs,
            stats: newStats,
            lastUpdated: new Date()
          };
        });
      }
    };

    const handleJobsDataRefresh = (event: CustomEvent) => {
      const { source } = event.detail;
      if (source === 'sse') {
        logger.info('SSE triggered data refresh');
        // Optionally trigger a full refresh for major changes
        // refreshJobs();
      }
    };

    // Listen for SSE events
    window.addEventListener('jobSSEUpdate', handleJobSSEUpdate as EventListener);
    window.addEventListener('jobsDataRefresh', handleJobsDataRefresh as EventListener);

    return () => {
      window.removeEventListener('jobSSEUpdate', handleJobSSEUpdate as EventListener);
      window.removeEventListener('jobsDataRefresh', handleJobsDataRefresh as EventListener);
    };
  }, []); // Empty dependency array - event handlers are stable

  return {
    ...state,
    loadJobs,
    refreshJobs
  };
}