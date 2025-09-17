/**
 * Job Dashboard Manager - External Script (Astro MCP Best Practice)
 * =============================================================================
 * Single Responsibility: Manage job dashboard component functionality
 * Following SOLID principles with proper event-driven architecture
 * =============================================================================
 */

import { getApiBaseUrl } from '/src/constants/api.ts';
import * as jobUtils from '/src/utils/dashboard/jobUtils.ts';

class JobDashboard extends HTMLElement {
  private apiBaseUrl: string = '';
  private jobs: any[] = [];

  constructor() {
    super();
  }

  connectedCallback() {
    // Read configuration from data attributes (Astro best practice)
    this.apiBaseUrl = this.dataset.apiUrl || getApiBaseUrl();

    // Initialize display
    this.showLoading();
    this.loadInitialJobs();

    // Setup SSE event listeners (DRY: reuses MainLayout SSE service)
    this.setupSSEListeners();

    // Setup retry button
    const retryBtn = this.querySelector('#retry-load-jobs');
    retryBtn?.addEventListener('click', () => {
      this.loadInitialJobs();
    });
  }

  disconnectedCallback() {
    // Cleanup SSE listeners
    window.removeEventListener('jobSSEUpdate', this.handleJobSSEUpdate.bind(this) as EventListener);
    window.removeEventListener('jobsDataRefresh', this.handleJobsDataRefresh.bind(this) as EventListener);
  }

  // ===================================================================
  // SSE Event Handling (DRY: follows same pattern as MainLayout)
  // ===================================================================

  setupSSEListeners() {
    // Listen for real-time job updates from MainLayout SSE service
    window.addEventListener('jobSSEUpdate', this.handleJobSSEUpdate.bind(this) as EventListener);
    window.addEventListener('jobsDataRefresh', this.handleJobsDataRefresh.bind(this) as EventListener);
  }

  handleJobSSEUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { jobUpdate } = customEvent.detail;
    console.log('🎯 JobDashboard: Processing SSE job update:', jobUpdate);

    if (jobUpdate) {
      // Update existing job or add new job
      const jobIndex = this.jobs.findIndex(job => job.id === jobUpdate.id);
      const convertedJob = jobUtils.convertBackendJob(jobUpdate);

      if (jobIndex >= 0) {
        this.jobs[jobIndex] = convertedJob;
      } else {
        this.jobs.unshift(convertedJob);
      }

      // Re-render jobs
      this.renderJobs();
    }
  };

  handleJobsDataRefresh = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { source } = customEvent.detail;
    if (source === 'sse') {
      console.log('🔄 JobDashboard: SSE triggered data refresh');
      // Could trigger full reload if needed
    }
  };

  // ===================================================================
  // Job Loading and Rendering (SOLID: Single Responsibility)
  // ===================================================================

  async loadInitialJobs() {
    try {
      this.showLoading();
      this.hideError();

      const response = await fetch(`${this.apiBaseUrl}/jobs/?page=1&page_size=10`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.jobs = data.jobs.map(jobUtils.convertBackendJob);

      this.renderJobs();
      this.hideLoading();

    } catch (error) {
      console.error('Failed to load jobs:', error);
      this.showError();
      this.hideLoading();
    }
  }

  renderJobs() {
    const jobsList = this.querySelector('#jobs-list');
    const emptyState = this.querySelector('#jobs-empty');

    if (!jobsList || !emptyState) return;

    if (this.jobs.length === 0) {
      this.showEmptyState();
      return;
    }

    // Generate job HTML
    jobsList.innerHTML = this.jobs.map(job => this.renderJobItem(job)).join('');

    // Show jobs list, hide empty state
    jobsList.classList.remove('hidden');
    emptyState.classList.add('hidden');
  }

  renderJobItem(job: any) {
    const statusColor = this.getStatusColor(job.status);
    const timeAgo = jobUtils.formatRelativeTime(job.createdAt);

    return `
      <div class="job-item p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-white truncate">${job.title}</h3>
            <p class="text-sm text-white/60 truncate mt-1">${job.source_url}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-white/50">
              <span>${timeAgo}</span>
              ${job.wordCount ? `<span>${job.wordCount} words</span>` : ''}
              ${job.imageCount ? `<span>${job.imageCount} images</span>` : ''}
            </div>
          </div>
          <div class="flex items-center gap-2 ml-4">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">
              ${job.status}
            </span>
            ${job.status === 'running' ? `<div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>` : ''}
          </div>
        </div>
        ${job.status === 'running' && job.progress ? `
          <div class="mt-3">
            <div class="flex items-center justify-between text-xs text-white/70 mb-1">
              <span>Progress: ${job.progress}%</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-1.5">
              <div class="bg-blue-400 h-1.5 rounded-full transition-all duration-1000" style="width: ${job.progress}%"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ===================================================================
  // UI State Management (SOLID: Single Responsibility)
  // ===================================================================

  showLoading() {
    const loading = this.querySelector('#jobs-loading');
    const jobsList = this.querySelector('#jobs-list');
    const emptyState = this.querySelector('#jobs-empty');

    loading?.classList.remove('hidden');
    jobsList?.classList.add('hidden');
    emptyState?.classList.add('hidden');
  }

  hideLoading() {
    const loading = this.querySelector('#jobs-loading');
    loading?.classList.add('hidden');
  }

  showEmptyState() {
    const jobsList = this.querySelector('#jobs-list');
    const emptyState = this.querySelector('#jobs-empty');

    jobsList?.classList.add('hidden');
    emptyState?.classList.remove('hidden');
  }

  showError() {
    const errorEl = this.querySelector('#jobs-error');
    errorEl?.classList.remove('hidden');
  }

  hideError() {
    const errorEl = this.querySelector('#jobs-error');
    errorEl?.classList.add('hidden');
  }

  getStatusColor(status: string) {
    const colors = {
      'pending': 'bg-gray-500/20 text-gray-300',
      'running': 'bg-blue-500/20 text-blue-300',
      'completed': 'bg-green-500/20 text-green-300',
      'failed': 'bg-red-500/20 text-red-300',
      'cancelled': 'bg-orange-500/20 text-orange-300'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  }

  // Public method for other components to trigger refresh
  refresh(showLoading = true) {
    if (showLoading) {
      this.loadInitialJobs();
    }
  }
}

// Define the custom element
customElements.define('job-dashboard', JobDashboard);