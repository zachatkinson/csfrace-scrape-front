/**
 * FilterPanel Integration Example
 * Demonstrates how external components interact with the new FilterPanel
 * Following SOLID principles and proper event-driven architecture
 */

import type { IJobData } from './types/filter.types';

// =============================================================================
// EXAMPLE: HOW EXTERNAL COMPONENTS INTEGRATE WITH FILTERPANEL
// =============================================================================

/**
 * Example JobsList component integration
 */
class JobsListIntegration {
  private jobs: IJobData[] = [];
  private filteredJobs: IJobData[] = [];

  constructor() {
    this.attachFilterPanelListeners();
  }

  /**
   * Listen to FilterPanel state changes
   */
  private attachFilterPanelListeners(): void {
    // Listen for filter/sort/search changes
    window.addEventListener('filterPanel:stateUpdate', (event) => {
      const customEvent = event as CustomEvent;
      const { filter, sort, search } = customEvent.detail;
      
      this.applyFilters(filter, sort, search);
    });

    // Listen for select all requests
    window.addEventListener('filterPanel:requestSelectAll', () => {
      const allJobIds = this.filteredJobs.map(job => job.id);
      this.updateFilterPanelSelection(allJobIds);
    });

    // Listen for delete requests
    window.addEventListener('filterPanel:requestDelete', (event) => {
      const customEvent = event as CustomEvent;
      const { selectedJobIds } = customEvent.detail;
      this.deleteJobs(selectedJobIds);
    });
  }

  /**
   * Update FilterPanel with new jobs data
   */
  updateJobsData(jobs: IJobData[]): void {
    this.jobs = jobs;
    
    // Notify FilterPanel about new data
    if ((window as any).filterPanelCoordinator) {
      (window as any).filterPanelCoordinator.updateJobsData(jobs);
    }
  }

  /**
   * Apply filters from FilterPanel
   */
  private applyFilters(filter: string, sort: string, search: string): void {
    let filtered = [...this.jobs];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(job => job.status === filter);
    }

    // Apply search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(query) ||
        job.source_url?.toLowerCase().includes(query) ||
        job.id.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'status':
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case 'progress': {
        // Custom sorting logic
        const statusPriority: Record<string, number> = {
          'failed': 0, 'processing': 1, 'queued': 2, 'completed': 3
        };
        filtered.sort((a, b) =>
          (statusPriority[a.status] || 999) - (statusPriority[b.status] || 999)
        );
        break;
      }
    }

    this.filteredJobs = filtered;
    this.renderJobs();
  }

  /**
   * Update FilterPanel selection state
   */
  private updateFilterPanelSelection(jobIds: string[]): void {
    if ((window as any).filterPanelCoordinator) {
      (window as any).filterPanelCoordinator.updateJobSelection(jobIds);
    }
  }

  /**
   * Handle job deletion
   */
  private async deleteJobs(jobIds: readonly string[]): Promise<void> {
    try {
      // Simulate API call to delete jobs
      console.log('Deleting jobs:', jobIds);
      
      // Remove from local state
      this.jobs = this.jobs.filter(job => !jobIds.includes(job.id));
      
      // Update FilterPanel with new data
      this.updateJobsData(this.jobs);
      
      // Clear selection
      this.updateFilterPanelSelection([]);
      
      console.log(`Successfully deleted ${jobIds.length} jobs`);
      
    } catch (error) {
      console.error('Failed to delete jobs:', error);
      // Could emit error event for FilterPanel to display
    }
  }

  /**
   * Render jobs (placeholder for actual rendering logic)
   */
  private renderJobs(): void {
    console.log(`Rendering ${this.filteredJobs.length} filtered jobs`);
    // Actual DOM rendering would happen here
  }
}

// =============================================================================
// EXAMPLE: EXTERNAL API INTEGRATION
// =============================================================================

/**
 * Example API service that feeds data to FilterPanel
 */
class JobsApiService {
  private apiUrl: string = '/jobs';

  /**
   * Fetch jobs from API and update FilterPanel
   */
  async fetchAndUpdateJobs(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl);
      const data = await response.json();
      
      // Validate and normalize job data
      const jobs: IJobData[] = data.jobs?.map((job: any) => ({
        id: job.id,
        status: job.status,
        title: job.title,
        url: job.source_url,
        createdAt: new Date(job.created_at),
        updatedAt: new Date(job.updated_at)
      })) || [];

      // Update FilterPanel via coordinator
      if ((window as any).filterPanelCoordinator) {
        (window as any).filterPanelCoordinator.updateJobsData(jobs);
      }

      console.log(`Fetched ${jobs.length} jobs from API`);

    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      
      // Update FilterPanel with empty data
      if ((window as any).filterPanelCoordinator) {
        (window as any).filterPanelCoordinator.updateJobsData([]);
      }
    }
  }

  /**
   * Poll for job updates
   */
  startPolling(intervalMs: number = 30000): void {
    this.fetchAndUpdateJobs(); // Initial fetch
    
    setInterval(() => {
      this.fetchAndUpdateJobs();
    }, intervalMs);

    console.log(`Started polling for job updates every ${intervalMs}ms`);
  }
}

// =============================================================================
// EXAMPLE: DASHBOARD PAGE INTEGRATION
// =============================================================================

/**
 * Example Dashboard page that uses FilterPanel
 */
class DashboardPageIntegration {
  private apiService: JobsApiService;

  constructor() {
    new JobsListIntegration(); // Initialize without storing reference
    this.apiService = new JobsApiService();
    this.init();
  }

  private async init(): Promise<void> {
    // Wait for FilterPanel to be ready
    await this.waitForFilterPanel();
    
    // Start fetching data
    this.apiService.startPolling();
    
    // Set up additional dashboard features
    this.setupKeyboardShortcuts();
    this.setupAutoRefresh();
    
    console.log('Dashboard initialized with FilterPanel integration');
  }

  /**
   * Wait for FilterPanel coordinator to be available
   */
  private waitForFilterPanel(): Promise<void> {
    return new Promise((resolve) => {
      const checkForCoordinator = () => {
        if ((window as any).filterPanelCoordinator) {
          resolve();
        } else {
          setTimeout(checkForCoordinator, 100);
        }
      };
      
      checkForCoordinator();
    });
  }

  /**
   * Setup keyboard shortcuts for FilterPanel
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            // Ctrl/Cmd + A: Select all
            event.preventDefault();
            document.getElementById('select-all-btn')?.click();
            break;
            
          case 'f':
            // Ctrl/Cmd + F: Focus search
            event.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
            
          case 'Escape':
            // Escape: Reset filters
            event.preventDefault();
            if ((window as any).filterPanelCoordinator) {
              (window as any).filterPanelCoordinator.reset();
            }
            break;
        }
      }
    });
  }

  /**
   * Setup auto-refresh functionality
   */
  private setupAutoRefresh(): void {
    // Pause auto-refresh when user is actively filtering
    let userActivityTimeout: ReturnType<typeof setTimeout>;
    
    window.addEventListener('filterPanel:stateUpdate', () => {
      clearTimeout(userActivityTimeout);
      userActivityTimeout = setTimeout(() => {
        this.apiService.fetchAndUpdateJobs();
      }, 5000); // Refresh 5 seconds after user stops filtering
    });
  }

  /**
   * Get current filter criteria for external use
   */
  getCurrentFilterCriteria(): object {
    if ((window as any).filterPanelCoordinator) {
      return (window as any).filterPanelCoordinator.getFilterCriteria();
    }
    return { filter: 'all', sort: 'newest', search: '' };
  }
}

// =============================================================================
// EXPORT FOR EXTERNAL USE
// =============================================================================

export {
  JobsListIntegration,
  JobsApiService,
  DashboardPageIntegration
};

// =============================================================================
// AUTO-INITIALIZATION FOR DASHBOARD PAGE
// =============================================================================

// Auto-initialize if we're on the dashboard page
if (typeof window !== 'undefined' && document.location.pathname.includes('/dashboard')) {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard integration
    const dashboard = new DashboardPageIntegration();
    
    // Expose for debugging
    (window as any).dashboardIntegration = dashboard;
    
    console.log('🎯 Dashboard integration initialized successfully');
  });
}