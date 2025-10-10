/**
 * Job Dashboard Manager - External Script (Astro MCP Best Practice)
 * =============================================================================
 * Single Responsibility: Manage job dashboard component functionality
 * Following SOLID principles with proper event-driven architecture
 * =============================================================================
 */

import * as jobUtils from "/src/utils/dashboard/jobUtils.ts";
import { createContextLogger } from "../utils/logger.js";
import type { IJobData, IBackendJob } from "../types/job.ts";

interface SSEEventData {
  url?: string;
  domain?: string | null;
  title?: string;
  progress_percent?: number | null;
  created_at?: string;
  updated_at?: string | null;
  error_message?: string | null;
  processing_time_ms?: string | null;
  word_count?: number | null;
  image_count?: number | null;
}

interface SSEJobEvent {
  job_id: string;
  event_type: string;
  status: string;
  timestamp: string;
  data: SSEEventData;
}

class JobDashboard extends HTMLElement {
  private readonly logger = createContextLogger("JobDashboard");
  private jobs: IJobData[] = [];
  private readonly STORAGE_KEY = "recent_jobs_cache";
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
  }

  connectedCallback() {
    // Configuration now handled via SSE events from MainLayout (DRY principle)

    // Try to load cached jobs first for instant display
    this.loadCachedJobs();

    // Initialize display
    this.showLoading();

    // Check authentication before loading jobs
    this.checkAuthAndLoadJobs();

    // Setup SSE event listeners (DRY: reuses MainLayout SSE service)
    this.setupSSEListeners();

    // Setup retry button
    const retryBtn = this.querySelector("#retry-load-jobs");
    retryBtn?.addEventListener("click", () => {
      this.checkAuthAndLoadJobs();
    });

    // Listen for authentication state changes
    window.addEventListener("user-logged-in", () => {
      this.checkAuthAndLoadJobs();
    });

    window.addEventListener("user-logged-out", () => {
      this.showEmptyState();
      this.hideLoading();
    });
  }

  disconnectedCallback() {
    // Cleanup SSE listeners
    window.removeEventListener(
      "jobSSEUpdate",
      this.handleJobSSEUpdate.bind(this) as EventListener,
    );
    window.removeEventListener(
      "jobsDataRefresh",
      this.handleJobsDataRefresh.bind(this) as EventListener,
    );
  }

  // ===================================================================
  // SSE Event Handling (DRY: follows same pattern as MainLayout)
  // ===================================================================

  setupSSEListeners() {
    // Listen for initial job data from MainLayout SSE service (SINGLE SOURCE OF TRUTH)
    window.addEventListener(
      "jobsInitialData",
      this.handleInitialData.bind(this) as EventListener,
    );

    // Listen for real-time job updates from MainLayout SSE service
    window.addEventListener(
      "jobSSEUpdate",
      this.handleJobSSEUpdate.bind(this) as EventListener,
    );
    window.addEventListener(
      "jobsDataRefresh",
      this.handleJobsDataRefresh.bind(this) as EventListener,
    );
  }

  handleInitialData = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { jobs } = customEvent.detail;

    this.logger.info("JobDashboard: Received initial job data from SSE", {
      jobCount: jobs?.length || 0,
    });

    if (jobs && Array.isArray(jobs)) {
      // Convert backend jobs to frontend format
      this.jobs = jobs.map(jobUtils.convertBackendJob);
      this.saveCachedJobs();
      this.renderJobs();
      this.hideLoading();
    }
  };

  handleJobSSEUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { jobUpdate } = customEvent.detail;

    this.logger.info("JobDashboard: Processing SSE job update", {
      jobUpdate,
      eventType: jobUpdate.event_type,
      status: jobUpdate.status,
      hasTitle: !!jobUpdate.data?.title,
      title: jobUpdate.data?.title,
      rawEvent: JSON.stringify(jobUpdate, null, 2),
    });

    if (jobUpdate) {
      // Transform SSE event data to IBackendJob format for convertBackendJob()
      // SSE events have structure: { job_id, event_type, status, timestamp, data: { url, domain, ... } }
      // But convertBackendJob() expects: { id, source_url, status, title, created_at, ... }
      const transformedJob = this.transformSSEEventToBackendJob(jobUpdate);

      // Update existing job or add new job
      const jobIndex = this.jobs.findIndex(
        (job) => job.id === transformedJob.id,
      );
      const convertedJob = jobUtils.convertBackendJob(transformedJob);

      if (jobIndex >= 0) {
        // MERGE with existing job data to preserve fields not in SSE update
        // CRITICAL: Preserve source_url if not provided in update to prevent "undefined" bug
        // CRITICAL: Use title from SSE event if available (not from URL extraction fallback)
        const sseHasTitle =
          jobUpdate.data?.title && jobUpdate.data.title.trim().length > 0;

        // TypeScript safety: Ensure existing job exists before accessing properties
        const existingJob = this.jobs[jobIndex];
        if (existingJob) {
          this.jobs[jobIndex] = {
            ...existingJob,
            ...convertedJob,
            // Explicitly preserve source_url if the update doesn't include it
            source_url: convertedJob.source_url || existingJob.source_url,
            // CRITICAL: Update title ONLY if SSE event includes it (completion event has scraped title)
            title: sseHasTitle ? jobUpdate.data.title : existingJob.title,
          };
        }
      } else {
        this.jobs.unshift(convertedJob);
      }

      // Save updated jobs to cache
      this.saveCachedJobs();

      // Re-render jobs
      this.renderJobs();
    }
  };

  /**
   * Transform SSE event data structure to IBackendJob format
   * SSE events: { job_id, event_type, status, timestamp, data: { url, domain, title?, progress_percent?, ... } }
   * IBackendJob: { id, source_url, status, title, created_at, ... }
   * CRITICAL: Always provide source_url to prevent "undefined" bugs in UI
   */
  private transformSSEEventToBackendJob(sseEvent: SSEJobEvent): IBackendJob {
    return {
      id: sseEvent.job_id,
      // CRITICAL: SSE events MUST include url in data, but fallback to prevent undefined
      source_url: sseEvent.data?.url || "URL not available",
      domain: sseEvent.data?.domain ?? null,
      status: sseEvent.status,
      title: sseEvent.data?.title || "Loading Title…", // Placeholder title for new jobs
      created_at: sseEvent.data?.created_at || sseEvent.timestamp,
      started_at: sseEvent.data?.updated_at || null,
      completed_at: sseEvent.status === "completed" ? sseEvent.timestamp : null,
      error_message: sseEvent.data?.error_message || null,
      processing_time_ms: sseEvent.data?.processing_time_ms
        ? parseInt(sseEvent.data.processing_time_ms)
        : null,
      // TypeScript strict mode: progress must be number (0 if null/undefined)
      progress: sseEvent.data?.progress_percent ?? 0,
      word_count: sseEvent.data?.word_count || null,
      image_count: sseEvent.data?.image_count || null,
      // Required fields from IBackendJob interface
      retry_count: 0,
      max_retries: 3,
      timeout_seconds: 300,
    };
  }

  handleJobsDataRefresh = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { source } = customEvent.detail;
    if (source === "sse") {
      this.logger.info("JobDashboard: SSE triggered data refresh");
      // Could trigger full reload if needed
    }
  };

  // ===================================================================
  // Authentication and Job Loading (SOLID: Single Responsibility)
  // ===================================================================

  async checkAuthAndLoadJobs() {
    try {
      // OPTION 1: Check client-side storage first to avoid 401 errors on static pages
      const hasToken =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token") ||
        document.cookie.includes("auth_token");

      if (!hasToken) {
        // User is not authenticated, show empty state
        this.logger.debug(
          "User not authenticated (no tokens), skipping job loading",
        );
        this.showEmptyState();
        this.hideLoading();
        return;
      }

      // Check if user is authenticated before loading jobs
      const authResponse = await fetch("/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (authResponse.ok) {
        // User is authenticated - SSE will provide initial data via jobsInitialData event
        // No need for separate REST API call (DRY: single source of truth)
        this.logger.info("User authenticated - waiting for SSE initial data");
      } else {
        // Clean up invalid tokens and show empty state
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_token");
        this.logger.debug("User not authenticated, skipping job loading");
        this.showEmptyState();
        this.hideLoading();
      }
    } catch (error) {
      this.logger.debug(
        "Authentication check failed, skipping job loading",
        error,
      );
      this.showEmptyState();
      this.hideLoading();
    }
  }

  // ===================================================================
  // Cache Management (Persistence across navigation)
  // ===================================================================

  private loadCachedJobs() {
    try {
      const cachedData = sessionStorage.getItem(this.STORAGE_KEY);
      if (!cachedData) return;

      const { jobs, timestamp } = JSON.parse(cachedData);
      const age = Date.now() - timestamp;

      // Only use cache if it's fresh (within cache duration)
      if (age < this.CACHE_DURATION_MS && jobs && jobs.length > 0) {
        this.jobs = jobs;
        this.renderJobs();
        this.hideLoading();
        this.logger.debug("Loaded jobs from cache", {
          count: jobs.length,
          ageMs: age,
        });
      }
    } catch (error) {
      this.logger.debug("Failed to load cached jobs", error);
    }
  }

  private saveCachedJobs() {
    try {
      const cacheData = {
        jobs: this.jobs,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
      this.logger.debug("Saved jobs to cache", { count: this.jobs.length });
    } catch (error) {
      this.logger.debug("Failed to save jobs to cache", error);
    }
  }

  renderJobs() {
    const jobsList = this.querySelector("#jobs-list");
    const emptyState = this.querySelector("#jobs-empty");

    if (!jobsList || !emptyState) return;

    if (this.jobs.length === 0) {
      this.showEmptyState();
      return;
    }

    // Generate job HTML
    jobsList.innerHTML = this.jobs
      .map((job) => this.renderJobItem(job))
      .join("");

    // Show jobs list, hide empty state and loading
    jobsList.classList.remove("hidden");
    emptyState.classList.add("hidden");
    this.hideLoading(); // CRITICAL: Hide loading spinner when jobs are rendered
  }

  renderJobItem(job: IJobData) {
    const statusColor = this.getStatusColor(job.status);
    const timeAgo = job.createdAt
      ? jobUtils.formatRelativeTime(job.createdAt)
      : "Unknown";

    return `
      <div class="job-item p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-white truncate">${job.title}</h3>
            <p class="text-sm text-white/60 truncate mt-1">${job.source_url}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-white/50">
              <span>${timeAgo}</span>
              ${job.wordCount ? `<span>${job.wordCount} words</span>` : ""}
              ${job.imageCount ? `<span>${job.imageCount} images</span>` : ""}
            </div>
          </div>
          <div class="flex items-center gap-2 ml-4">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">
              ${job.status}
            </span>
            ${job.status === "running" ? `<div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>` : ""}
          </div>
        </div>
        ${
          job.status === "running" && job.progress
            ? `
          <div class="mt-3">
            <div class="flex items-center justify-between text-xs text-white/70 mb-1">
              <span>Progress: ${job.progress}%</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-1.5">
              <div class="bg-blue-400 h-1.5 rounded-full transition-all duration-1000" style="width: ${job.progress}%"></div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  // ===================================================================
  // UI State Management (SOLID: Single Responsibility)
  // ===================================================================

  showLoading() {
    const loading = this.querySelector("#jobs-loading");
    const jobsList = this.querySelector("#jobs-list");
    const emptyState = this.querySelector("#jobs-empty");

    loading?.classList.remove("hidden");
    jobsList?.classList.add("hidden");
    emptyState?.classList.add("hidden");
  }

  hideLoading() {
    const loading = this.querySelector("#jobs-loading");
    loading?.classList.add("hidden");
  }

  showEmptyState() {
    const jobsList = this.querySelector("#jobs-list");
    const emptyState = this.querySelector("#jobs-empty");

    jobsList?.classList.add("hidden");
    emptyState?.classList.remove("hidden");
  }

  showError() {
    const errorEl = this.querySelector("#jobs-error");
    errorEl?.classList.remove("hidden");
  }

  hideError() {
    const errorEl = this.querySelector("#jobs-error");
    errorEl?.classList.add("hidden");
  }

  getStatusColor(status: string) {
    const colors = {
      pending: "bg-gray-500/20 text-gray-300",
      running: "bg-blue-500/20 text-blue-300",
      completed: "bg-green-500/20 text-green-300",
      failed: "bg-red-500/20 text-red-300",
      cancelled: "bg-orange-500/20 text-orange-300",
    };
    return (
      colors[status as keyof typeof colors] || "bg-gray-500/20 text-gray-300"
    );
  }

  // Public method for other components to trigger refresh
  // SSE provides automatic updates, so manual refresh is rarely needed
  refresh(showLoading = true) {
    if (showLoading) {
      this.showLoading();
    }
    // SSE will automatically send updated data via jobsInitialData or jobSSEUpdate events
    this.logger.info(
      "Manual refresh requested - SSE will provide updated data",
    );
  }
}

// Define the custom element
customElements.define("job-dashboard", JobDashboard);
