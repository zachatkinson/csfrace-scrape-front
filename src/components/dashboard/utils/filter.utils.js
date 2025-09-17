/**
 * Filter Utilities - DRY/SOLID Utility Functions
 * Following SOLID principles with pure functions
 */

// =============================================================================
// VALIDATION UTILITIES (Single Responsibility)
// =============================================================================

export const ValidationUtils = {
  // Valid filter options
  VALID_FILTERS: ['all', 'processing', 'completed', 'failed', 'queued', 'pending', 'running'],

  // Valid sort options
  VALID_SORTS: ['newest', 'oldest', 'status', 'title', 'progress'],

  isValidFilter(filter) {
    return typeof filter === 'string' && this.VALID_FILTERS.includes(filter);
  },

  isValidSort(sort) {
    return typeof sort === 'string' && this.VALID_SORTS.includes(sort);
  },

  sanitizeQuery(query) {
    if (typeof query !== 'string') return '';
    return query.trim().substring(0, 100); // Limit length
  }
};

// =============================================================================
// FILTER UTILITIES (Single Responsibility)
// =============================================================================

export const FilterUtils = {
  isValidFilter(filter) {
    return ValidationUtils.isValidFilter(filter);
  },

  getFilterLabel(filter) {
    const labels = {
      all: 'All Jobs',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      queued: 'Queued',
      pending: 'Pending',
      running: 'Running'
    };
    return labels[filter] || filter;
  },

  getFilterCount(jobs, filter) {
    if (!Array.isArray(jobs)) return 0;
    if (filter === 'all') return jobs.length;
    return jobs.filter(job => job.status === filter).length;
  }
};

// =============================================================================
// SORT UTILITIES (Single Responsibility)
// =============================================================================

export const SortUtils = {
  isValidSort(sort) {
    return ValidationUtils.isValidSort(sort);
  },

  getSortLabel(sort) {
    const labels = {
      newest: 'Newest First',
      oldest: 'Oldest First',
      status: 'By Status',
      title: 'By Title',
      progress: 'By Progress'
    };
    return labels[sort] || sort;
  },

  applySorting(jobs, sort) {
    if (!Array.isArray(jobs)) return [];

    const sortedJobs = [...jobs];

    switch (sort) {
      case 'newest':
        return sortedJobs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      case 'oldest':
        return sortedJobs.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

      case 'status':
        return sortedJobs.sort((a, b) => (a.status || '').localeCompare(b.status || ''));

      case 'title':
        return sortedJobs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

      case 'progress':
        return sortedJobs.sort((a, b) => (b.progress || 0) - (a.progress || 0));

      default:
        return sortedJobs;
    }
  }
};

// =============================================================================
// EVENT UTILITIES (Single Responsibility)
// =============================================================================

export const EventUtils = {
  createCustomEvent(type, detail) {
    return new CustomEvent(type, {
      detail: {
        ...detail,
        timestamp: Date.now()
      },
      bubbles: true,
      cancelable: true
    });
  },

  dispatch(element, eventType, detail) {
    const event = this.createCustomEvent(eventType, detail);
    element.dispatchEvent(event);
    return event;
  },

  debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// =============================================================================
// SEARCH UTILITIES (Single Responsibility)
// =============================================================================

export const SearchUtils = {
  normalizeQuery(query) {
    if (typeof query !== 'string') return '';
    return query.toLowerCase().trim();
  },

  matchesQuery(job, query) {
    if (!query) return true;

    const normalizedQuery = this.normalizeQuery(query);
    const searchableText = [
      job.title || '',
      job.source_url || '',
      job.domain || '',
      job.id || '',
      job.status || ''
    ].join(' ').toLowerCase();

    return searchableText.includes(normalizedQuery);
  },

  filterJobsByQuery(jobs, query) {
    if (!Array.isArray(jobs)) return [];
    if (!query) return jobs;

    return jobs.filter(job => this.matchesQuery(job, query));
  },

  highlightMatches(text, query) {
    if (!query || !text) return text;

    const normalizedQuery = this.normalizeQuery(query);
    const regex = new RegExp(`(${normalizedQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
};

// =============================================================================
// BATCH UTILITIES (Single Responsibility)
// =============================================================================

export const BatchUtils = {
  validateAction(action) {
    const validActions = ['delete', 'retry', 'cancel', 'download'];
    return validActions.includes(action);
  },

  validateJobIds(jobIds) {
    return Array.isArray(jobIds) && jobIds.every(id => typeof id === 'string' && id.length > 0);
  },

  createBatchPayload(action, jobIds, metadata = {}) {
    return {
      action,
      jobIds,
      metadata,
      timestamp: Date.now()
    };
  }
};

// =============================================================================
// FILTER STATE UTILITIES (Single Responsibility)
// =============================================================================

export const FilterStateUtils = {
  createDefaultState() {
    return {
      filter: 'all',
      sort: 'newest',
      search: '',
      totalJobs: 0,
      selectedJobs: 0,
      isLoading: false,
      lastUpdate: Date.now()
    };
  },

  isValidState(state) {
    return state &&
           ValidationUtils.isValidFilter(state.filter) &&
           ValidationUtils.isValidSort(state.sort) &&
           typeof state.search === 'string' &&
           typeof state.totalJobs === 'number' &&
           typeof state.selectedJobs === 'number';
  },

  mergeStates(currentState, updates) {
    return {
      ...currentState,
      ...updates,
      lastUpdate: Date.now()
    };
  },

  compareStates(state1, state2) {
    const keys = ['filter', 'sort', 'search', 'totalJobs', 'selectedJobs'];
    return keys.every(key => state1[key] === state2[key]);
  }
};

// =============================================================================
// URL STATE UTILITIES (Single Responsibility)
// =============================================================================

export const UrlStateUtils = {
  getStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
      filter: params.get('filter') || 'all',
      sort: params.get('sort') || 'newest',
      search: params.get('search') || params.get('q') || ''
    };
  },

  updateUrlWithState(state) {
    const url = new URL(window.location);

    // Update search params
    if (state.filter && state.filter !== 'all') {
      url.searchParams.set('filter', state.filter);
    } else {
      url.searchParams.delete('filter');
    }

    if (state.sort && state.sort !== 'newest') {
      url.searchParams.set('sort', state.sort);
    } else {
      url.searchParams.delete('sort');
    }

    if (state.search) {
      url.searchParams.set('search', state.search);
    } else {
      url.searchParams.delete('search');
      url.searchParams.delete('q');
    }

    // Update URL without reload
    window.history.replaceState({}, '', url);
  },

  clearUrlState() {
    const url = new URL(window.location);
    url.searchParams.delete('filter');
    url.searchParams.delete('sort');
    url.searchParams.delete('search');
    url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  }
};

// Export all utilities as default for convenience
export default {
  ValidationUtils,
  FilterUtils,
  SortUtils,
  EventUtils,
  SearchUtils,
  BatchUtils,
  FilterStateUtils,
  UrlStateUtils
};