/**
 * Filter Utilities - DRY principle implementation
 * Reusable filter logic following SOLID principles
 */

import type { 
  IFilterConfig, 
  IFilterState, 
  ISortOption,
  IJobData,
  IFilterUpdateEvent,
  IBatchActionEvent,
  IJobsDataUpdateEvent
} from '../types/filter.types';

import { FILTER_CONFIG, SORT_OPTIONS } from '../types/filter.types';

// =============================================================================
// FILTER UTILITIES (Single Responsibility Principle)
// =============================================================================

export class FilterUtils {

  /**
   * Check if a filter should be disabled
   */
  static isFilterDisabled(filterKey: string, availableStatuses: readonly string[]): boolean {
    if (filterKey === 'all') return false;
    return !availableStatuses.includes(filterKey);
  }

  /**
   * Get filter configuration
   */
  static getFilterConfig(filterKey: string): IFilterConfig | null {
    return FILTER_CONFIG[filterKey] || null;
  }

  /**
   * Get all available filter keys
   */
  static getAvailableFilterKeys(): readonly string[] {
    return Object.keys(FILTER_CONFIG);
  }

  /**
   * Validate filter key
   */
  static isValidFilterKey(filterKey: string): boolean {
    return filterKey in FILTER_CONFIG;
  }

  /**
   * Get default filter state
   */
  static getDefaultFilterState(): IFilterState {
    return {
      currentFilter: 'all',
      currentSort: 'newest',
      searchQuery: '',
      selectedJobs: new Set<string>(),
      totalJobs: 0
    };
  }

  /**
   * Update available statuses from jobs data
   */
  static extractAvailableStatuses(jobs: readonly IJobData[]): readonly string[] {
    const statusSet = new Set<string>(['all']);
    
    jobs.forEach(job => {
      if (job.status && this.isValidFilterKey(job.status)) {
        statusSet.add(job.status);
      }
    });

    return Array.from(statusSet);
  }

  /**
   * Filter jobs based on current state
   */
  static filterJobs(
    jobs: readonly IJobData[], 
    filterState: IFilterState
  ): readonly IJobData[] {
    let filteredJobs = [...jobs];

    // Apply status filter
    if (filterState.currentFilter !== 'all') {
      filteredJobs = filteredJobs.filter(job => 
        job.status === filterState.currentFilter
      );
    }

    // Apply search filter
    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.url.toLowerCase().includes(query) ||
        job.id.toLowerCase().includes(query)
      );
    }

    return filteredJobs;
  }

  /**
   * Sort jobs based on sort option
   */
  static sortJobs(
    jobs: readonly IJobData[], 
    sortOption: string
  ): readonly IJobData[] {
    const sortedJobs = [...jobs];

    switch (sortOption) {
      case 'newest':
        return sortedJobs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      
      case 'oldest':
        return sortedJobs.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      
      case 'status':
        return sortedJobs.sort((a, b) => a.status.localeCompare(b.status));
      
      case 'progress': {
        // Custom sorting by status priority
        const statusPriority: Record<string, number> = {
          'failed': 0,
          'processing': 1,
          'queued': 2,
          'completed': 3
        };
        return sortedJobs.sort((a, b) =>
          (statusPriority[a.status] || 999) - (statusPriority[b.status] || 999)
        );
      }
      
      default:
        return sortedJobs;
    }
  }
}

// =============================================================================
// SORT UTILITIES (Single Responsibility Principle)
// =============================================================================

export class SortUtils {

  /**
   * Get sort options
   */
  static getSortOptions(): readonly ISortOption[] {
    return SORT_OPTIONS;
  }

  /**
   * Validate sort option
   */
  static isValidSortOption(sortOption: string): boolean {
    return SORT_OPTIONS.some(option => option.value === sortOption);
  }

  /**
   * Get sort option by value
   */
  static getSortOption(value: string): ISortOption | null {
    return SORT_OPTIONS.find(option => option.value === value) || null;
  }
}

// =============================================================================
// EVENT UTILITIES (Single Responsibility Principle)
// =============================================================================

export class EventUtils {

  /**
   * Create filter update event
   */
  static createFilterUpdateEvent(
    filter: string,
    sort: string,
    search: string
  ): CustomEvent<IFilterUpdateEvent> {
    return new CustomEvent('filter:update', {
      detail: {
        filter,
        sort,
        search,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Create batch action event
   */
  static createBatchActionEvent(
    action: 'select-all' | 'select-none' | 'delete-selected',
    selectedIds: readonly string[]
  ): CustomEvent<IBatchActionEvent> {
    return new CustomEvent('batch:action', {
      detail: {
        action,
        selectedIds,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Create jobs data update event
   */
  static createJobsDataUpdateEvent(
    jobs: readonly IJobData[]
  ): CustomEvent<IJobsDataUpdateEvent> {
    const availableStatuses = FilterUtils.extractAvailableStatuses(jobs);
    
    return new CustomEvent('jobs:dataUpdate', {
      detail: {
        jobs,
        availableStatuses,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Dispatch event safely
   */
  static dispatchEvent(event: CustomEvent): void {
    try {
      window.dispatchEvent(event);
    } catch (error) {
      console.warn('Failed to dispatch event:', event.type, error);
    }
  }
}

// =============================================================================
// VALIDATION UTILITIES (Single Responsibility Principle)
// =============================================================================

export class ValidationUtils {

  /**
   * Validate filter state
   */
  static validateFilterState(state: Partial<IFilterState>): IFilterState {
    const defaultState = FilterUtils.getDefaultFilterState();

    return {
      currentFilter: FilterUtils.isValidFilterKey(state.currentFilter || '')
        ? (state.currentFilter as string)
        : defaultState.currentFilter,

      currentSort: SortUtils.isValidSortOption(state.currentSort || '')
        ? (state.currentSort as string)
        : defaultState.currentSort,
      
      searchQuery: typeof state.searchQuery === 'string' 
        ? state.searchQuery.trim() 
        : defaultState.searchQuery,
      
      selectedJobs: state.selectedJobs instanceof Set 
        ? state.selectedJobs 
        : defaultState.selectedJobs,
      
      totalJobs: typeof state.totalJobs === 'number' && state.totalJobs >= 0 
        ? state.totalJobs 
        : defaultState.totalJobs
    };
  }

  /**
   * Validate jobs data
   */
  static validateJobsData(jobs: unknown[]): IJobData[] {
    if (!Array.isArray(jobs)) return [];

    const validJobs = jobs.filter((job): job is { [key: string]: unknown } =>
      job !== null &&
      typeof job === 'object' &&
      'id' in job &&
      'status' in job &&
      typeof (job as { id: unknown }).id === 'string' &&
      typeof (job as { status: unknown }).status === 'string'
    );

    return validJobs.map(job => {
      const metadata = (job as { metadata?: unknown }).metadata;
      const validMetadata = metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : undefined;

      const result: IJobData = {
        id: (job as { id: string }).id,
        status: (job as { status: string }).status as 'pending' | 'processing' | 'completed' | 'failed' | 'queued',
        title: typeof (job as { title?: unknown }).title === 'string' ? (job as { title: string }).title : 'Untitled Job',
        url: typeof (job as { source_url?: unknown }).source_url === 'string' ? (job as { source_url: string }).source_url : 'Unknown URL',
        createdAt: (job as { createdAt?: unknown }).createdAt instanceof Date ? (job as { createdAt: Date }).createdAt : new Date(),
        updatedAt: (job as { updatedAt?: unknown }).updatedAt instanceof Date ? (job as { updatedAt: Date }).updatedAt : new Date(),
        ...(validMetadata && { metadata: validMetadata })
      };

      return result;
    });
  }
}