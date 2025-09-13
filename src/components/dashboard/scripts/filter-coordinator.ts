/**
 * Filter Coordinator - Central Communication Hub
 * Following SOLID principles and Astro Islands Architecture
 * Implements Observer pattern for component communication
 */

import type { 
  IFilterUpdateEvent, 
  IBatchActionEvent, 
  IJobsDataUpdateEvent,
  IFilterState 
} from '../types/filter.types';
import { ValidationUtils, EventUtils } from '../utils/filter.utils';
import { domUtils, waitForDOM } from '../utils/dom.utils';

// =============================================================================
// FILTER COORDINATOR CLASS (Single Responsibility Principle)
// =============================================================================

class FilterCoordinator {
  private currentState: IFilterState;
  private isInitialized: boolean = false;

  constructor() {
    this.currentState = this.getDefaultState();
    this.init();
  }

  // =========================================================================
  // INITIALIZATION (Open/Closed Principle)
  // =========================================================================

  private async init(): Promise<void> {
    await waitForDOM();
    
    this.loadInitialState();
    this.attachEventListeners();
    this.isInitialized = true;
    
    console.log('🎯 FilterCoordinator: Initialized as central communication hub');
  }

  private loadInitialState(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    // Load state from component data attributes
    const stateFromDOM = {
      currentFilter: domUtils.getDataAttribute(panel, 'current-filter') || 'all',
      currentSort: domUtils.getDataAttribute(panel, 'current-sort') || 'newest',
      searchQuery: domUtils.getDataAttribute(panel, 'search-query') || '',
      selectedJobs: new Set<string>(),
      totalJobs: parseInt(domUtils.getDataAttribute(panel, 'total-jobs') || '0', 10)
    };

    this.currentState = ValidationUtils.validateFilterState(stateFromDOM);
  }

  private getDefaultState(): IFilterState {
    return {
      currentFilter: 'all',
      currentSort: 'newest',
      searchQuery: '',
      selectedJobs: new Set<string>(),
      totalJobs: 0
    };
  }

  // =========================================================================
  // EVENT COORDINATION (Observer Pattern)
  // =========================================================================

  private attachEventListeners(): void {
    // Listen for filter updates from any manager
    window.addEventListener('filter:update', (event) => {
      this.handleFilterUpdate(event as CustomEvent<IFilterUpdateEvent>);
    });

    // Listen for batch action events
    window.addEventListener('batch:action', (event) => {
      this.handleBatchAction(event as CustomEvent<IBatchActionEvent>);
    });

    // Listen for jobs data updates from external sources
    window.addEventListener('jobs:dataUpdate', (event) => {
      this.handleJobsDataUpdate(event as CustomEvent<IJobsDataUpdateEvent>);
    });

    // Listen for individual job selection changes
    window.addEventListener('job:selectionToggle', (event) => {
      this.handleJobSelectionToggle(event as CustomEvent);
    });

    // Expose coordinator methods to external systems
    this.exposePublicInterface();
  }

  private handleFilterUpdate(event: CustomEvent<IFilterUpdateEvent>): void {
    const { filter, sort, search } = event.detail;

    // Update internal state
    this.currentState = ValidationUtils.validateFilterState({
      ...this.currentState,
      currentFilter: filter,
      currentSort: sort,
      searchQuery: search
    });

    // Persist state to DOM
    this.persistStateToDom();

    // Emit consolidated update for external listeners
    this.emitConsolidatedUpdate();

    console.log('🎯 FilterCoordinator: Filter state updated', this.currentState);
  }

  private handleBatchAction(event: CustomEvent<IBatchActionEvent>): void {
    const { action, selectedIds } = event.detail;

    switch (action) {
      case 'select-all':
        // This should be handled by the jobs list component
        this.requestSelectAll();
        break;

      case 'select-none':
        this.updateSelectedJobs([]);
        break;

      case 'delete-selected':
        this.requestDeleteSelected(selectedIds);
        break;
    }

    console.log('🎯 FilterCoordinator: Batch action processed', { action, count: selectedIds.length });
  }

  private handleJobsDataUpdate(event: CustomEvent<IJobsDataUpdateEvent>): void {
    const { jobs, availableStatuses } = event.detail;

    // Update total jobs count
    this.currentState.totalJobs = jobs.length;

    // Notify filter manager about available statuses
    window.dispatchEvent(new CustomEvent('filterManager:updateStatuses', {
      detail: { availableStatuses }
    }));

    // Update batch action manager about total count
    window.dispatchEvent(new CustomEvent('batchManager:updateTotal', {
      detail: { totalJobs: jobs.length }
    }));

    this.persistStateToDom();

    console.log('🎯 FilterCoordinator: Jobs data updated', { 
      totalJobs: jobs.length, 
      availableStatuses 
    });
  }

  private handleJobSelectionToggle(event: CustomEvent): void {
    const { jobId, selected } = event.detail;

    if (selected) {
      this.currentState.selectedJobs.add(jobId);
    } else {
      this.currentState.selectedJobs.delete(jobId);
    }

    // Update batch action manager
    window.dispatchEvent(new CustomEvent('batchManager:updateSelection', {
      detail: { selectedJobIds: Array.from(this.currentState.selectedJobs) }
    }));

    this.persistStateToDom();
  }

  // =========================================================================
  // STATE MANAGEMENT (Dependency Inversion Principle)
  // =========================================================================

  private updateSelectedJobs(jobIds: readonly string[]): void {
    this.currentState.selectedJobs = new Set(jobIds);
    
    // Notify batch action manager
    window.dispatchEvent(new CustomEvent('batchManager:updateSelection', {
      detail: { selectedJobIds: jobIds }
    }));

    this.persistStateToDom();
  }

  private persistStateToDom(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    // Update all data attributes
    domUtils.setDataAttribute(panel, 'current-filter', this.currentState.currentFilter);
    domUtils.setDataAttribute(panel, 'current-sort', this.currentState.currentSort);
    domUtils.setDataAttribute(panel, 'search-query', this.currentState.searchQuery);
    domUtils.setDataAttribute(panel, 'total-jobs', this.currentState.totalJobs.toString());
    domUtils.setDataAttribute(panel, 'selected-jobs', this.currentState.selectedJobs.size.toString());
  }

  private emitConsolidatedUpdate(): void {
    // Emit a consolidated state update for external listeners (like job list components)
    const event = new CustomEvent('filterPanel:stateUpdate', {
      detail: {
        filter: this.currentState.currentFilter,
        sort: this.currentState.currentSort,
        search: this.currentState.searchQuery,
        selectedJobs: Array.from(this.currentState.selectedJobs),
        totalJobs: this.currentState.totalJobs,
        timestamp: Date.now()
      }
    });

    EventUtils.dispatchEvent(event);
  }

  // =========================================================================
  // EXTERNAL COMMUNICATION METHODS
  // =========================================================================

  private requestSelectAll(): void {
    // Request external system to provide all job IDs for selection
    const event = new CustomEvent('filterPanel:requestSelectAll', {
      detail: {
        currentFilter: this.currentState.currentFilter,
        currentSort: this.currentState.currentSort,
        searchQuery: this.currentState.searchQuery,
        timestamp: Date.now()
      }
    });

    EventUtils.dispatchEvent(event);
  }

  private requestDeleteSelected(selectedIds: readonly string[]): void {
    // Request external system to delete selected jobs
    const event = new CustomEvent('filterPanel:requestDelete', {
      detail: {
        selectedJobIds: selectedIds,
        timestamp: Date.now()
      }
    });

    EventUtils.dispatchEvent(event);
  }

  // =========================================================================
  // PUBLIC INTERFACE FOR EXTERNAL ACCESS
  // =========================================================================

  private exposePublicInterface(): void {
    if (typeof window === 'undefined') return;

    // Expose methods for external components to interact with filter panel
    (window as any).filterPanelCoordinator = {
      // Get current state
      getCurrentState: () => ({ ...this.currentState }),

      // Update jobs data from external source
      updateJobsData: (jobs: any[]) => {
        const validatedJobs = ValidationUtils.validateJobsData(jobs);
        const event = EventUtils.createJobsDataUpdateEvent(validatedJobs);
        EventUtils.dispatchEvent(event);
      },

      // Update job selection from external source
      updateJobSelection: (jobIds: string[]) => {
        this.updateSelectedJobs(jobIds);
      },

      // Toggle individual job selection
      toggleJobSelection: (jobId: string, selected: boolean) => {
        const event = new CustomEvent('job:selectionToggle', {
          detail: { jobId, selected }
        });
        EventUtils.dispatchEvent(event);
      },

      // Reset filter panel to default state
      reset: () => {
        this.currentState = this.getDefaultState();
        this.persistStateToDom();
        this.emitConsolidatedUpdate();
      },

      // Get filter state for external use
      getFilterCriteria: () => ({
        filter: this.currentState.currentFilter,
        sort: this.currentState.currentSort,
        search: this.currentState.searchQuery
      })
    };
  }

  // =========================================================================
  // DEBUGGING AND DEVELOPMENT UTILITIES
  // =========================================================================

  public getDebugInfo(): object {
    return {
      isInitialized: this.isInitialized,
      currentState: { ...this.currentState },
      selectedJobsArray: Array.from(this.currentState.selectedJobs),
      eventListeners: [
        'filter:update',
        'batch:action', 
        'jobs:dataUpdate',
        'job:selectionToggle'
      ]
    };
  }
}

// =============================================================================
// COORDINATOR UTILITIES (DRY Principle)
// =============================================================================

class CoordinatorUtils {
  
  /**
   * Validate event structure
   */
  static isValidFilterEvent(event: any): boolean {
    return event && 
           event.detail && 
           typeof event.detail.timestamp === 'number';
  }

  /**
   * Create error event for failed operations
   */
  static createErrorEvent(source: string, error: string): CustomEvent {
    return new CustomEvent('filterPanel:error', {
      detail: {
        source,
        error,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Throttle coordinator updates to prevent excessive events
   */
  static createThrottledUpdate(coordinator: FilterCoordinator, delay: number = 100): () => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Trigger coordinator update
        coordinator.getDebugInfo(); // This ensures coordinator is still alive
      }, delay);
    };
  }
}

// =============================================================================
// INITIALIZATION (Following Astro Islands Pattern)
// =============================================================================

// Initialize coordinator when script loads (Astro Islands architecture)
const filterCoordinator = new FilterCoordinator();

// Expose coordinator globally for debugging and external access
if (typeof window !== 'undefined') {
  (window as any).filterCoordinator = filterCoordinator;
  (window as any).CoordinatorUtils = CoordinatorUtils;
}