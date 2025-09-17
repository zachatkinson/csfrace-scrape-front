/**
 * Filter Coordinator - Central Communication Hub
 * Following SOLID principles and Astro Islands Architecture
 * Implements Observer pattern for component communication
 */

import { ValidationUtils, EventUtils } from '../utils/filter.utils.js';
import { domUtils, waitForDOM } from '../utils/dom.utils.js';

// =============================================================================
// FILTER COORDINATOR CLASS (Single Responsibility Principle)
// =============================================================================

class FilterCoordinator {
  constructor() {
    this.currentState = this.getDefaultState();
    this.isInitialized = false;
    this.init();
  }

  // =========================================================================
  // INITIALIZATION (Open/Closed Principle)
  // =========================================================================

  async init() {
    if (this.isInitialized) return;

    try {
      await waitForDOM();
      this.setupEventListeners();
      this.broadcastInitialState();
      this.isInitialized = true;
      console.log('🎯 FilterCoordinator: Initialized successfully');
    } catch (error) {
      console.error('❌ FilterCoordinator: Initialization failed:', error);
    }
  }

  // =========================================================================
  // STATE MANAGEMENT (Single Responsibility)
  // =========================================================================

  getDefaultState() {
    return {
      filter: 'all',
      sort: 'newest',
      search: '',
      totalJobs: 0,
      selectedJobs: 0,
      isLoading: false,
      lastUpdate: Date.now()
    };
  }

  updateState(updates) {
    const previousState = { ...this.currentState };
    this.currentState = {
      ...this.currentState,
      ...updates,
      lastUpdate: Date.now()
    };

    // Broadcast state change
    this.broadcastStateChange(previousState, this.currentState);
    console.log('🔄 FilterCoordinator: State updated:', updates);
  }

  // =========================================================================
  // EVENT MANAGEMENT (Observer Pattern)
  // =========================================================================

  setupEventListeners() {
    // Listen for filter updates
    document.addEventListener('filter-update', (event) => {
      this.handleFilterUpdate(event);
    });

    // Listen for search updates
    document.addEventListener('search-update', (event) => {
      this.handleSearchUpdate(event);
    });

    // Listen for sort updates
    document.addEventListener('sort-update', (event) => {
      this.handleSortUpdate(event);
    });

    // Listen for batch action events
    document.addEventListener('batch-action', (event) => {
      this.handleBatchAction(event);
    });

    // Listen for jobs data updates
    document.addEventListener('jobs-data-update', (event) => {
      this.handleJobsDataUpdate(event);
    });
  }

  // =========================================================================
  // EVENT HANDLERS (Single Responsibility)
  // =========================================================================

  handleFilterUpdate(event) {
    const { filter } = event.detail;
    if (ValidationUtils.isValidFilter(filter)) {
      this.updateState({ filter });
    }
  }

  handleSearchUpdate(event) {
    const { query } = event.detail;
    this.updateState({ search: query || '' });
  }

  handleSortUpdate(event) {
    const { sort } = event.detail;
    if (ValidationUtils.isValidSort(sort)) {
      this.updateState({ sort });
    }
  }

  handleBatchAction(event) {
    const { action, jobIds } = event.detail;

    // Update loading state during batch operations
    this.updateState({ isLoading: true });

    // Process batch action
    setTimeout(() => {
      this.updateState({ isLoading: false });
      console.log(`🎯 FilterCoordinator: Batch action ${action} completed for ${jobIds?.length || 0} jobs`);
    }, 1000);
  }

  handleJobsDataUpdate(event) {
    const { totalJobs, selectedJobs } = event.detail;
    this.updateState({
      totalJobs: totalJobs || 0,
      selectedJobs: selectedJobs || 0
    });
  }

  // =========================================================================
  // BROADCAST METHODS (Observer Pattern)
  // =========================================================================

  broadcastInitialState() {
    this.broadcastStateChange({}, this.currentState);
  }

  broadcastStateChange(previousState, newState) {
    const event = new CustomEvent('coordinator-state-change', {
      detail: {
        previous: previousState,
        current: newState,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);
  }

  // =========================================================================
  // PUBLIC API (Interface Segregation)
  // =========================================================================

  getCurrentState() {
    return { ...this.currentState };
  }

  forceRefresh() {
    this.updateState({ lastUpdate: Date.now() });
  }
}

// =============================================================================
// SINGLETON INITIALIZATION (DRY Principle)
// =============================================================================

// Create global singleton instance
if (!window.__filterCoordinator) {
  window.__filterCoordinator = new FilterCoordinator();
  console.log('🚀 FilterCoordinator: Singleton created');
}

export default window.__filterCoordinator;