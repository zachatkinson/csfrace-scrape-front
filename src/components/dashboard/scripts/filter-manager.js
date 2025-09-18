/**
 * Filter Manager - Single Responsibility for Filter State Management
 * Following SOLID principles and Astro Islands Architecture
 */

import { FilterUtils } from '../utils/filter.utils.js';
import { domUtils, waitForDOM } from '../utils/dom.utils.js';

// =============================================================================
// FILTER MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

class FilterManager {
  constructor() {
    this.filterContainer = null;
    this.filterButtons = [];
    this.currentFilter = 'all';
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
      await this.findElements();
      this.setupEventListeners();
      this.loadInitialState();
      this.isInitialized = true;
      console.log('🎯 FilterManager: Initialized successfully');
    } catch (error) {
      console.error('❌ FilterManager: Initialization failed:', error);
    }
  }

  async findElements() {
    this.filterContainer = await domUtils.waitForElement('[data-filter-group="status"]');
    if (!this.filterContainer) {
      throw new Error('Filter container not found');
    }

    this.filterButtons = Array.from(this.filterContainer.querySelectorAll('[data-filter]'));
    console.log(`🔍 FilterManager: Found ${this.filterButtons.length} filter buttons`);
  }

  // =========================================================================
  // EVENT MANAGEMENT (Single Responsibility)
  // =========================================================================

  setupEventListeners() {
    // Filter button clicks
    this.filterButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        this.handleFilterClick(event);
      });
    });

    // Listen for coordinator state changes
    document.addEventListener('coordinator-state-change', (event) => {
      this.handleCoordinatorStateChange(event);
    });

    // Listen for external filter changes
    document.addEventListener('external-filter-change', (event) => {
      this.handleExternalFilterChange(event);
    });
  }

  // =========================================================================
  // EVENT HANDLERS (Single Responsibility)
  // =========================================================================

  handleFilterClick(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const filter = button.getAttribute('data-filter');

    if (button.disabled || filter === this.currentFilter) {
      return;
    }

    this.setActiveFilter(filter);
    this.broadcastFilterChange(filter);
  }

  handleCoordinatorStateChange(event) {
    const { current } = event.detail;
    if (current.filter !== this.currentFilter) {
      this.updateVisualState(current.filter);
    }
  }

  handleExternalFilterChange(event) {
    const { filter } = event.detail;
    this.setActiveFilter(filter, false); // Don't broadcast since it's external
  }

  // =========================================================================
  // FILTER MANAGEMENT (Single Responsibility)
  // =========================================================================

  setActiveFilter(filter, shouldBroadcast = true) {
    if (!FilterUtils.isValidFilter(filter)) {
      console.warn('⚠️ FilterManager: Invalid filter:', filter);
      return;
    }

    const previousFilter = this.currentFilter;
    this.currentFilter = filter;

    this.updateVisualState(filter);

    if (shouldBroadcast) {
      this.broadcastFilterChange(filter);
    }

    console.log(`🔄 FilterManager: Filter changed from "${previousFilter}" to "${filter}"`);
  }

  updateVisualState(filter) {
    this.filterButtons.forEach(button => {
      const buttonFilter = button.getAttribute('data-filter');
      const isActive = buttonFilter === filter;

      // Update classes
      if (isActive) {
        button.classList.add('active');
        button.classList.remove('inactive');
      } else {
        button.classList.remove('active');
        button.classList.add('inactive');
      }

      // Update aria attributes
      button.setAttribute('aria-pressed', isActive.toString());
    });
  }

  // =========================================================================
  // BROADCAST METHODS (Observer Pattern)
  // =========================================================================

  broadcastFilterChange(filter) {
    const event = new CustomEvent('filter-update', {
      detail: {
        filter,
        timestamp: Date.now(),
        source: 'filter-manager'
      }
    });
    document.dispatchEvent(event);
  }

  // =========================================================================
  // STATE PERSISTENCE (Single Responsibility)
  // =========================================================================

  loadInitialState() {
    // Get initial filter from DOM or URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilter = urlParams.get('filter');

    if (urlFilter && FilterUtils.isValidFilter(urlFilter)) {
      this.setActiveFilter(urlFilter);
    } else {
      // Get from panel data attributes
      const panel = document.querySelector('[data-component="filter-panel"]');
      const currentFilter = panel?.getAttribute('data-current-filter') || 'all';
      this.setActiveFilter(currentFilter);
    }
  }

  saveStateToUrl() {
    const url = new URL(window.location);
    url.searchParams.set('filter', this.currentFilter);
    window.history.replaceState({}, '', url);
  }

  // =========================================================================
  // PUBLIC API (Interface Segregation)
  // =========================================================================

  getCurrentFilter() {
    return this.currentFilter;
  }

  setFilter(filter) {
    this.setActiveFilter(filter);
  }

  refreshUI() {
    this.updateVisualState(this.currentFilter);
  }
}

// =============================================================================
// SINGLETON INITIALIZATION (DRY Principle)
// =============================================================================

// Create global singleton instance
if (!window.__filterManager) {
  window.__filterManager = new FilterManager();
  console.log('🚀 FilterManager: Singleton created');
}

export default window.__filterManager;