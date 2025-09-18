/**
 * Dashboard Coordinator - Perfect Astro Islands Implementation
 * =============================================================================
 * Central communication hub for all dashboard components
 * Following SOLID principles with Observer pattern for component coordination
 * NO anti-patterns: No define:vars, proper event-driven architecture
 * =============================================================================
 */

import { domUtils, waitForDOM } from '../utils/dom.utils';
import type { IDashboardState, IDashboardStats } from '../types/dashboard.types';
import { createContextLogger } from '../../../utils/logger';

const logger = createContextLogger('DashboardCoordinator');

// =============================================================================
// DASHBOARD COORDINATOR CLASS (Single Responsibility Principle)
// =============================================================================

export class DashboardCoordinator {
  private state: IDashboardState;
  private refreshInterval: number | null = null;
  private isInitialized = false;

  constructor() {
    this.state = {
      stats: {
        total: 0,
        active: 0,
        completed: 0,
        failed: 0,
        queued: 0,
        processing: 0
      },
      connectionStatus: 'connected',
      isLoading: false,
      lastUpdated: new Date()
    };
  }

  /**
   * Initialize dashboard coordinator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await waitForDOM();
    this.loadInitialData();
    this.setupEventListeners();
    this.startPeriodicUpdates();
    this.isInitialized = true;

    logger.info('Initialized as central communication hub');
  }

  /**
   * Load initial data from DOM attributes (avoiding define:vars)
   */
  private loadInitialData(): void {
    const dashboardElement = domUtils.querySelector('[data-component="dashboard"]');
    if (!dashboardElement) return;

    try {
      // Load configuration (available for future use)
      dashboardElement.getAttribute('data-config');
      const statsData = dashboardElement.getAttribute('data-initial-stats');

      if (statsData) {
        const initialStats = JSON.parse(statsData);
        this.updateStats(initialStats);
      }

      logger.debug('Initial data loaded from DOM attributes');
    } catch (error) {
      logger.warn('Failed to load initial data', { error });
    }
  }

  /**
   * Setup event listeners for component communication
   */
  private setupEventListeners(): void {
    // Listen for data updates from Server Islands
    window.addEventListener('dashboardDataLoaded', (event) => {
      this.handleDataUpdate((event as CustomEvent).detail);
    });

    // Listen for filter changes
    window.addEventListener('filter:update', (event) => {
      this.handleFilterUpdate((event as CustomEvent).detail);
    });

    // Listen for job actions
    window.addEventListener('job:action', (event) => {
      this.handleJobAction((event as CustomEvent).detail);
    });

    // Listen for connection status changes
    window.addEventListener('connection:statusChanged', (event) => {
      this.handleConnectionStatusChange((event as CustomEvent).detail);
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseUpdates();
      } else {
        this.resumeUpdates();
      }
    });

    logger.debug('Event listeners setup complete');
  }

  /**
   * Handle data updates from Server Islands
   */
  private handleDataUpdate(data: { jobs: any[], stats: IDashboardStats, timestamp: number }): void {
    logger.debug('Received data update', { data });

    this.updateStats(data.stats);
    this.state.lastUpdated = new Date(data.timestamp);

    // Emit processed data to other components
    this.emitStateUpdate();
  }

  /**
   * Handle filter updates
   */
  private handleFilterUpdate(filterData: any): void {
    logger.debug('Filter update received', { filterData });

    // Update loading state
    this.state.isLoading = true;
    this.emitStateUpdate();

    // Trigger job list refresh
    window.dispatchEvent(new CustomEvent('jobs:refresh', {
      detail: {
        filter: filterData.filter,
        sort: filterData.sort,
        search: filterData.search,
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Handle job actions (view, delete, etc.)
   */
  private handleJobAction(actionData: any): void {
    logger.debug('Job action received', { actionData });

    switch (actionData.action) {
      case 'view':
        this.showJobDetails(actionData.jobId);
        break;
      case 'delete':
        this.deleteJob(actionData.jobId);
        break;
      case 'retry':
        this.retryJob(actionData.jobId);
        break;
      default:
        logger.warn('Unknown job action', { action: actionData.action });
    }
  }

  /**
   * Handle connection status changes
   */
  private handleConnectionStatusChange(statusData: any): void {
    this.state.connectionStatus = statusData.status;
    this.state.lastUpdated = new Date(statusData.timestamp);

    logger.info('Connection status changed', { status: statusData.status });

    // Update UI elements
    this.updateConnectionIndicator();
    this.emitStateUpdate();
  }

  /**
   * Update stats in state
   */
  private updateStats(newStats: IDashboardStats): void {
    this.state.stats = { ...newStats };
    this.updateStatsDisplay();
  }

  /**
   * Update stats display in header
   */
  private updateStatsDisplay(): void {
    const totalElement = domUtils.querySelector('#total-jobs');
    const activeElement = domUtils.querySelector('#active-jobs');

    if (totalElement) {
      totalElement.textContent = `${this.state.stats.total} Jobs`;
    }

    if (activeElement) {
      activeElement.textContent = `${this.state.stats.active} Active`;
    }
  }

  /**
   * Update connection indicator
   */
  private updateConnectionIndicator(): void {
    const indicator = domUtils.querySelector('#connection-indicator');
    const text = domUtils.querySelector('#connection-text');

    if (indicator) {
      // Remove all status classes
      domUtils.removeClass(indicator, 'bg-green-400');
      domUtils.removeClass(indicator, 'bg-red-400');
      domUtils.removeClass(indicator, 'bg-yellow-400');

      // Add appropriate status class
      switch (this.state.connectionStatus) {
        case 'connected':
          domUtils.addClass(indicator, 'bg-green-400');
          break;
        case 'disconnected':
          domUtils.addClass(indicator, 'bg-red-400');
          break;
        case 'reconnecting':
          domUtils.addClass(indicator, 'bg-yellow-400');
          break;
      }
    }

    if (text) {
      const statusTexts = {
        connected: 'Connected',
        disconnected: 'Disconnected',
        reconnecting: 'Reconnecting...'
      };
      text.textContent = statusTexts[this.state.connectionStatus] || 'Unknown';
    }
  }

  /**
   * Show job details in modal
   */
  private showJobDetails(jobId: string): void {
    window.dispatchEvent(new CustomEvent('job:showDetails', {
      detail: { jobId }
    }));
  }

  /**
   * Delete job
   */
  private async deleteJob(jobId: string): Promise<void> {
    try {
      // This would call your API to delete the job
      logger.info('Deleting job', { jobId });

      // Emit job deleted event
      window.dispatchEvent(new CustomEvent('job:deleted', {
        detail: { jobId }
      }));

      // Refresh job list
      this.refreshData();
    } catch (error) {
      logger.error('Failed to delete job', { error });
    }
  }

  /**
   * Retry job
   */
  private async retryJob(jobId: string): Promise<void> {
    try {
      // This would call your API to retry the job
      logger.info('Retrying job', { jobId });

      // Emit job retry event
      window.dispatchEvent(new CustomEvent('job:retried', {
        detail: { jobId }
      }));

      // Refresh job list
      this.refreshData();
    } catch (error) {
      logger.error('Failed to retry job', { error });
    }
  }

  /**
   * Start periodic updates
   */
  private startPeriodicUpdates(): void {
    this.refreshInterval = window.setInterval(() => {
      if (!document.hidden) {
        this.refreshData();
      }
    }, 5000); // Refresh every 5 seconds

    logger.debug('Periodic updates started');
  }

  /**
   * Pause updates (when page is hidden)
   */
  private pauseUpdates(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Resume updates
   */
  private resumeUpdates(): void {
    if (!this.refreshInterval) {
      this.startPeriodicUpdates();
    }
  }

  /**
   * Refresh data from server
   */
  private async refreshData(): Promise<void> {
    try {
      // This would fetch fresh data from your API
      logger.debug('Refreshing data');

      // Emit refresh event for components to handle
      window.dispatchEvent(new CustomEvent('dashboard:refresh', {
        detail: { timestamp: Date.now() }
      }));

    } catch (error) {
      logger.error('Failed to refresh data', { error });
      this.handleConnectionStatusChange({ 
        status: 'disconnected', 
        timestamp: Date.now() 
      });
    }
  }

  /**
   * Emit state update to all components
   */
  private emitStateUpdate(): void {
    window.dispatchEvent(new CustomEvent('dashboard:stateUpdate', {
      detail: {
        state: this.state,
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Cleanup on page unload
   */
  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.isInitialized = false;
  }
}

// =============================================================================
// EXPORT FOR ASTRO ISLANDS PATTERN
// =============================================================================

// Export for potential external use
declare global {
  interface Window {
    dashboardCoordinator?: DashboardCoordinator;
  }
}