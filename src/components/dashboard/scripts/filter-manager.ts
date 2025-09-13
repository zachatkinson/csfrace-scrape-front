/**
 * Filter Manager - Single Responsibility for Filter State Management
 * Following SOLID principles and Astro Islands Architecture
 */

import type { IFilterManager, IFilterState } from '../types/filter.types';
import { FilterUtils, EventUtils } from '../utils/filter.utils';
import { domUtils, waitForDOM } from '../utils/dom.utils';

// =============================================================================
// FILTER MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

class FilterManager implements IFilterManager {
  private currentFilter: string = 'all';
  private availableStatuses: readonly string[] = ['all'];

  constructor() {
    this.init();
  }

  // =========================================================================
  // INITIALIZATION (Open/Closed Principle)
  // =========================================================================

  private async init(): Promise<void> {
    await waitForDOM();
    
    this.loadInitialState();
    this.attachEventListeners();
    this.updateFilterStates();
    this.emitInitialState();
    
    console.log('🎛️ FilterManager: Initialized with Astro Islands architecture');
  }

  private loadInitialState(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    this.currentFilter = domUtils.getDataAttribute(panel, 'current-filter') || 'all';
    
    const statusesAttr = domUtils.getDataAttribute(panel, 'available-statuses');
    if (statusesAttr) {
      try {
        this.availableStatuses = JSON.parse(statusesAttr);
      } catch (error) {
        console.warn('FilterManager: Failed to parse available statuses', error);
      }
    }
  }

  // =========================================================================
  // PUBLIC INTERFACE (Interface Segregation Principle)
  // =========================================================================

  getCurrentFilter(): string {
    return this.currentFilter;
  }

  setCurrentFilter(filter: string): void {
    if (!FilterUtils.isValidFilterKey(filter)) {
      console.warn(`FilterManager: Invalid filter key: ${filter}`);
      return;
    }

    if (this.currentFilter !== filter) {
      this.currentFilter = filter;
      this.updateFilterStates();
      this.emitFilterUpdate();
      
      // Update component data attribute for state persistence
      const panel = domUtils.querySelector('[data-component="filter-panel"]');
      if (panel) {
        domUtils.setDataAttribute(panel, 'current-filter', filter);
      }
    }
  }

  getAvailableStatuses(): readonly string[] {
    return this.availableStatuses;
  }

  updateAvailableStatuses(statuses: readonly string[]): void {
    this.availableStatuses = statuses;
    this.updateFilterStates();
    
    // Update component data attribute
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (panel) {
      domUtils.setDataAttribute(panel, 'available-statuses', JSON.stringify(statuses));
    }
  }

  isFilterDisabled(filter: string): boolean {
    return FilterUtils.isFilterDisabled(filter, this.availableStatuses);
  }

  // =========================================================================
  // PRIVATE METHODS (Dependency Inversion Principle)
  // =========================================================================

  private attachEventListeners(): void {
    // Listen for filter button clicks
    const filterButtons = domUtils.querySelectorAll('[data-filter]');
    
    filterButtons.forEach(button => {
      domUtils.addEventListener(button, 'click', (event) => {
        event.preventDefault();
        
        const filterKey = domUtils.getDataAttribute(button, 'filter');
        if (filterKey && !this.isFilterDisabled(filterKey)) {
          this.setCurrentFilter(filterKey);
        }
      });
    });

    // Listen for external jobs data updates
    window.addEventListener('jobs:dataUpdate', (event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.availableStatuses) {
        this.updateAvailableStatuses(customEvent.detail.availableStatuses);
      }
    });
  }

  private updateFilterStates(): void {
    const filterButtons = domUtils.querySelectorAll('[data-filter]');
    
    filterButtons.forEach(button => {
      const filter = domUtils.getDataAttribute(button, 'filter');
      if (!filter) return;

      const isDisabled = this.isFilterDisabled(filter);
      const isActive = filter === this.currentFilter;

      // Update disabled state
      if (button instanceof HTMLButtonElement) {
        button.disabled = isDisabled;
      }

      // Update visual styling using utility classes
      domUtils.updateClasses(button, {
        add: isActive ? ['bg-blue-500/50', 'text-blue-300', 'border-blue-400/30'] : [],
        remove: isActive ? [] : ['bg-blue-500/50', 'text-blue-300', 'border-blue-400/30'],
        toggle: isDisabled ? ['opacity-50', 'cursor-not-allowed'] : []
      });

      // Update hover states
      if (isDisabled) {
        domUtils.removeClass(button, 'hover:bg-white/20');
      } else {
        domUtils.addClass(button, 'hover:bg-white/20');
      }

      // Update ARIA attributes for accessibility
      domUtils.setAttributes(button, {
        'aria-pressed': isActive ? 'true' : 'false',
        'aria-disabled': isDisabled ? 'true' : 'false'
      });
    });
  }

  private emitFilterUpdate(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    const currentSort = domUtils.getDataAttribute(panel, 'current-sort') || 'newest';
    const searchQuery = domUtils.getDataAttribute(panel, 'search-query') || '';

    const event = EventUtils.createFilterUpdateEvent(
      this.currentFilter,
      currentSort,
      searchQuery
    );

    EventUtils.dispatchEvent(event);
    
    console.log('🎛️ FilterManager: Filter updated', {
      filter: this.currentFilter,
      availableStatuses: this.availableStatuses
    });
  }

  private emitInitialState(): void {
    // Emit initial state after a brief delay to ensure other managers are ready
    setTimeout(() => {
      this.emitFilterUpdate();
    }, 100);
  }
}

// =============================================================================
// INITIALIZATION (Following Astro Islands Pattern)
// =============================================================================

// Initialize manager when script loads (Astro Islands architecture)
const filterManager = new FilterManager();

// Expose manager globally for debugging and external access
if (typeof window !== 'undefined') {
  (window as any).filterManager = filterManager;
}