/**
 * Dashboard Manager - Following SOLID SRP
 * SOLID: Single Responsibility - Only coordinates between focused hooks
 * DRY: Uses focused hooks to eliminate duplication
 * Following CLAUDE.md NO LOCAL SERVICES RULE
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { IJobData, JobFilter, JobSort } from "../../types/job.ts";
import * as jobUtils from "../../utils/dashboard/jobUtils.ts";
import { createContextLogger } from "../../utils/logger";

// Focused hooks following SRP
import { useJobData } from "./hooks/useJobData.ts";
import { useJobActions } from "./hooks/useJobActions.ts";
import { useConnectionStatus } from "./hooks/useConnectionStatus.ts";
import { useJobSelection } from "./hooks/useJobSelection.ts";
import { useAutoRefresh } from "./hooks/useAutoRefresh.ts";

const logger = createContextLogger("DashboardManager");

interface DashboardManagerProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({
  autoRefresh = true,
  refreshInterval = 10000,
}) => {
  // =============================================================================
  // UI STATE - Single Responsibility: UI filtering/sorting state only
  // =============================================================================
  const [currentFilter, setCurrentFilter] = useState<JobFilter>("all");
  const [currentSort, setCurrentSort] = useState<JobSort>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredJobs, setFilteredJobs] = useState<IJobData[]>([]);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // =============================================================================
  // FOCUSED HOOKS - Single Responsibility per hook
  // =============================================================================

  // Job data management - memoize options to prevent infinite re-renders
  const jobDataOptions = useMemo(
    () => ({
      pageSize: 10,
      autoRefresh,
      refreshInterval,
    }),
    [autoRefresh, refreshInterval],
  );

  const jobData = useJobData(jobDataOptions);

  // Connection status monitoring - memoize callback to prevent re-renders
  const onStatusChange = useCallback((status: string) => {
    logger.info("Connection status changed", { status });
  }, []);

  const connectionStatusOptions = useMemo(
    () => ({
      onStatusChange,
    }),
    [onStatusChange],
  );

  const connectionStatus = useConnectionStatus(connectionStatusOptions);

  // Job selection management
  const jobSelection = useJobSelection();

  // Job actions (retry, cancel, delete, download) - memoize callbacks to prevent re-renders
  const onJobUpdated = useCallback(() => {
    jobData.refreshJobs();
  }, [jobData]);

  const onJobError = useCallback(
    (message: string) => {
      setNotification({ type: "error", message });
      connectionStatus.markDisconnected();
    },
    [connectionStatus],
  );

  const onJobSuccess = useCallback(
    (message: string) => {
      setNotification({ type: "success", message });
      connectionStatus.markConnected();
    },
    [connectionStatus],
  );

  const jobActionsOptions = useMemo(
    () => ({
      onJobUpdated,
      onError: onJobError,
      onSuccess: onJobSuccess,
    }),
    [onJobUpdated, onJobError, onJobSuccess],
  );

  const jobActions = useJobActions(jobActionsOptions);

  // Auto-refresh coordination - memoize callback and options
  const refreshCallback = useCallback(() => {
    jobData.refreshJobs();
  }, [jobData]);

  const autoRefreshOptions = useMemo(
    () => ({
      enabled: false, // ✅ DISABLED: SSE handles real-time updates now (DRY/SOLID)
      interval: refreshInterval,
      connectionStatus: connectionStatus.status,
      isLoading: jobData.isLoading,
    }),
    [refreshInterval, connectionStatus.status, jobData.isLoading],
  );

  useAutoRefresh(refreshCallback, autoRefreshOptions);

  // =============================================================================
  // UI EVENT HANDLERS - Single Responsibility: UI state updates only
  // =============================================================================

  const handleFilterChange = useCallback(
    (newFilter: JobFilter) => {
      setCurrentFilter(newFilter);
      setCurrentPage(1);
      // Load jobs with new filter
      const params: { page: number; statusFilter?: string } = { page: 1 };
      if (newFilter !== "all") {
        params.statusFilter = newFilter as string;
      }
      jobData.loadJobs(params);
    },
    [jobData],
  );

  // Sort and search handlers - properly implemented following DRY/SOLID
  const handleSortChange = useCallback((newSort: JobSort) => {
    setCurrentSort(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      const params: { page: number; statusFilter?: string } = { page };
      if (currentFilter !== "all") {
        params.statusFilter = currentFilter as string;
      }
      jobData.loadJobs(params);
    },
    [jobData, currentFilter],
  );

  // =============================================================================
  // JOB ACTION HANDLERS - Single Responsibility: Delegate to job actions hook
  // =============================================================================

  const handleJobAction = useCallback(
    async (action: string, jobId: string) => {
      switch (action) {
        case "retry":
          await jobActions.retryJob(jobId);
          break;
        case "cancel":
          await jobActions.cancelJob(jobId);
          break;
        case "delete":
          await jobActions.deleteJob(jobId);
          break;
        case "download":
          await jobActions.downloadJob(jobId, jobData.jobs);
          break;
        default:
          logger.warn("Unknown job action", { action });
      }
    },
    [jobActions, jobData.jobs],
  );

  // =============================================================================
  // EFFECTS - Single Responsibility: Coordinate state updates
  // =============================================================================

  // Initialize with initial jobs - use a ref to track if we've loaded
  const hasLoadedRef = React.useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // Load fresh data on first mount
      jobData.loadJobs();
    }
  }, [jobData]);

  // Refresh jobs when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        logger.info("Page visible: refreshing jobs");
        jobData.refreshJobs();
      }
    };

    const handleFocus = () => {
      logger.info("Window focused: refreshing jobs");
      jobData.refreshJobs();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [jobData]);

  // Update filtered jobs when data or filters change
  useEffect(() => {
    const filtered = jobUtils.filterJobs(
      jobData.jobs,
      currentFilter,
      searchQuery,
    );
    const sorted = jobUtils.sortJobs(filtered, currentSort);
    setFilteredJobs(sorted);
  }, [jobData.jobs, currentFilter, searchQuery, currentSort]);

  // Listen for external filter updates
  useEffect(() => {
    const handleFilterUpdate = (event: CustomEvent) => {
      const { filter } = event.detail;
      handleFilterChange(filter);
    };

    window.addEventListener(
      "filterUpdate",
      handleFilterUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        "filterUpdate",
        handleFilterUpdate as EventListener,
      );
  }, [handleFilterChange]);

  // Emit jobs data updates for other components
  useEffect(() => {
    const event = new CustomEvent("jobsDataUpdate", {
      detail: { jobs: jobData.jobs },
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
    <div className="space-y-6">
      {/* Notification Display */}
      {notification && (
        <div
          className={`glass-card p-4 flex items-center justify-between ${
            notification.type === "error"
              ? "border-l-4 border-red-500"
              : "border-l-4 border-green-500"
          }`}
        >
          <span className="text-white">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-white/60 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Selection Controls */}
      {jobSelection.hasSelection && (
        <div className="glass-card p-4 flex items-center justify-between">
          <span className="text-white">
            {jobSelection.selectedCount} job
            {jobSelection.selectedCount !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={jobSelection.clearSelection}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Sort and Search Controls */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="job-search" className="sr-only">
            Search jobs
          </label>
          <input
            id="job-search"
            type="text"
            placeholder="Search jobs by title or URL..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="md:w-48">
          <label htmlFor="job-sort" className="sr-only">
            Sort jobs
          </label>
          <select
            id="job-sort"
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value as JobSort)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
              paddingRight: "2.5rem",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="status">Status</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Job List */}
      <div className="glass-card p-6">
        {jobData.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 mx-auto mb-4"></div>
            <p className="text-white/60">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No jobs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex flex-col md:flex-row items-stretch"
              >
                <div className="flex items-start gap-4 flex-1 p-4">
                  <input
                    type="checkbox"
                    checked={jobSelection.isSelected(job.id)}
                    onChange={(e) =>
                      jobSelection.toggleJobSelection(job.id, e.target.checked)
                    }
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400 focus:ring-offset-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium mb-1 truncate">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span
                        className={`px-2 py-1 rounded ${
                          job.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : job.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : job.status === "running"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {job.status}
                      </span>
                      <span>{jobUtils.getJobStatusMessage(job)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-stretch border-t md:border-t-0 md:border-l border-white/10">
                  {job.status === "failed" && (
                    <button
                      onClick={() => handleJobAction("retry", job.id)}
                      className="flex-1 min-w-0 md:min-w-[120px] flex flex-col items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-0 hover:bg-yellow-500/20 active:bg-yellow-500 text-white/60 hover:text-yellow-400 active:text-white transition-colors border-r border-white/10"
                    >
                      <svg
                        className="w-6 h-6 fill-current"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                      </svg>
                      <span className="text-xs font-medium">Retry</span>
                    </button>
                  )}
                  {(job.status === "pending" || job.status === "running") && (
                    <button
                      onClick={() => handleJobAction("cancel", job.id)}
                      className="flex-1 min-w-0 md:min-w-[120px] flex flex-col items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-0 hover:bg-red-500/20 active:bg-red-500 text-white/60 hover:text-red-400 active:text-white transition-colors border-r border-white/10"
                    >
                      <svg
                        className="w-6 h-6 fill-current"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                      <span className="text-xs font-medium">Cancel</span>
                    </button>
                  )}
                  {job.status === "completed" && (
                    <button
                      onClick={() => handleJobAction("download", job.id)}
                      className="flex-1 min-w-0 md:min-w-[120px] flex flex-col items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-0 hover:bg-green-500/20 active:bg-green-500 text-white/60 hover:text-green-400 active:text-white transition-colors border-r border-white/10"
                    >
                      <svg
                        className="w-6 h-6 fill-current"
                        viewBox="0 0 550.801 550.801"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M475.095,131.992c-0.032-2.526-0.833-5.021-2.568-6.993L366.324,3.694c-0.021-0.034-0.053-0.045-0.084-0.076
                            c-0.633-0.707-1.36-1.29-2.141-1.804c-0.232-0.15-0.465-0.285-0.707-0.422c-0.686-0.366-1.393-0.67-2.131-0.892
                            c-0.2-0.058-0.379-0.14-0.58-0.192C359.87,0.114,359.047,0,358.203,0H97.2C85.292,0,75.6,9.693,75.6,21.601v507.6
                            c0,11.913,9.692,21.601,21.6,21.601H453.6c11.918,0,21.601-9.688,21.601-21.601V133.202
                            C475.2,132.796,475.137,132.398,475.095,131.992z M243.599,523.494H141.75v-15.936l62.398-89.797v-0.785h-56.565v-24.484h95.051
                            v17.106l-61.038,88.636v0.771h62.002V523.494z M292.021,523.494h-29.744V392.492h29.744V523.494z M399.705,463.44
                            c-10.104,9.524-25.069,13.796-42.566,13.796c-3.893,0-7.383-0.19-10.104-0.58v46.849h-29.352V394.242
                            c9.134-1.561,21.958-2.721,40.036-2.721c18.277,0,31.292,3.491,40.046,10.494c8.354,6.607,13.996,17.486,13.996,30.322
                            C411.761,445.163,407.479,456.053,399.705,463.44z M97.2,366.752V21.601h129.167v-3.396h32.756v3.396h88.28v110.515
                            c0,5.961,4.831,10.8,10.8,10.8H453.6l0.011,223.836H97.2z"
                        />
                        <path
                          d="M359.279,413.87c-6.033,0-10.114,0.586-12.245,1.171v38.676c2.521,0.585,5.632,0.785,9.914,0.785
                            c15.736,0,25.46-7.979,25.46-21.378C382.408,421.063,374.045,413.87,359.279,413.87z"
                        />
                        <rect
                          x="259.124"
                          y="39.918"
                          width="32.756"
                          height="13.516"
                        />
                        <rect
                          x="226.368"
                          y="21.601"
                          width="32.756"
                          height="10.125"
                        />
                        <rect
                          x="226.368"
                          y="60.146"
                          width="32.756"
                          height="13.516"
                        />
                        <rect
                          x="259.124"
                          y="82.274"
                          width="32.756"
                          height="13.518"
                        />
                        <rect
                          x="259.124"
                          y="124.983"
                          width="32.756"
                          height="13.516"
                        />
                        <rect
                          x="226.368"
                          y="103.275"
                          width="32.756"
                          height="13.516"
                        />
                        <path
                          d="M259.124,149.537c-23.193,0-34.225,18.792-34.225,41.99l-7.765,70.348c0,23.198,18.792,42.003,41.984,42.003
                            c23.19,0,41.974-18.805,41.974-42.003l-7.741-70.348C293.361,168.334,282.318,149.537,259.124,149.537z M273.04,285.431h-27.799
                            v-58.728h27.799V285.431z"
                        />
                      </svg>
                      <span className="text-xs font-medium whitespace-nowrap">
                        Download .ZIP
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => handleJobAction("delete", job.id)}
                    className="flex-1 min-w-0 md:min-w-[120px] flex flex-col items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-0 hover:bg-red-500/20 active:bg-red-500 text-white/60 hover:text-red-400 active:text-white transition-colors"
                  >
                    <svg
                      className="w-6 h-6 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                    <span className="text-xs font-medium">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="glass-card p-4 flex items-center justify-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-white">Page {currentPage}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={filteredJobs.length < 10}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Job Statistics */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Job Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {jobData.stats.total}
            </div>
            <div className="text-white/60 text-sm">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {jobData.stats.active}
            </div>
            <div className="text-white/60 text-sm">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {jobData.stats.completed}
            </div>
            <div className="text-white/60 text-sm">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {jobData.stats.failed}
            </div>
            <div className="text-white/60 text-sm">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {jobData.stats.queued}
            </div>
            <div className="text-white/60 text-sm">Queued</div>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      {jobData.lastUpdated && (
        <div className="text-center text-white/40 text-sm">
          Last updated: {jobData.lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default DashboardManager;
