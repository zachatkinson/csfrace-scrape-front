/**
 * Sort Manager - Single Responsibility for Sort Functionality
 * Following SOLID principles and Astro Islands Architecture
 */

import { SortUtils, EventUtils } from '../utils/filter.utils.js';
import { domUtils, waitForDOM } from '../utils/dom.utils.js';

// =============================================================================
// SORT MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

class SortManager {
  constructor() {
    this.sortSelect = null;
    this.currentSort = 'newest';
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
      console.log('🎯 SortManager: Initialized successfully');
    } catch (error) {
      console.error('❌ SortManager: Initialization failed:', error);
    }
  }

  async findElements() {
    this.sortSelect = await domUtils.waitForElement('#sort-select');
    if (!this.sortSelect) {
      throw new Error('Sort select not found');
    }

    console.log('🔍 SortManager: Sort select found and configured');
  }

  // =========================================================================
  // EVENT MANAGEMENT (Single Responsibility)
  // =========================================================================

  setupEventListeners() {
    // Sort select change events
    this.sortSelect.addEventListener('change', (event) => {
      this.handleSortChange(event);
    });

    // Listen for coordinator state changes
    document.addEventListener('coordinator-state-change', (event) => {
      this.handleCoordinatorStateChange(event);
    });

    // Listen for external sort changes
    document.addEventListener('external-sort-change', (event) => {
      this.handleExternalSortChange(event);
    });
  }

  // =========================================================================
  // EVENT HANDLERS (Single Responsibility)
  // =========================================================================

  handleSortChange(event) {
    const sort = event.target.value;
    this.setActiveSort(sort);
  }

  handleCoordinatorStateChange(event) {
    const { current } = event.detail;
    if (current.sort !== this.currentSort) {
      this.updateVisualState(current.sort);
    }
  }

  handleExternalSortChange(event) {
    const { sort } = event.detail;
    this.setActiveSort(sort, false); // Don't broadcast since it's external
  }

  // =========================================================================
  // SORT MANAGEMENT (Single Responsibility)
  // =========================================================================

  setActiveSort(sort, shouldBroadcast = true) {
    if (!SortUtils.isValidSort(sort)) {
      console.warn('⚠️ SortManager: Invalid sort option:', sort);
      return;
    }

    const previousSort = this.currentSort;
    this.currentSort = sort;

    this.updateVisualState(sort);

    if (shouldBroadcast) {
      this.broadcastSortChange(sort);
    }

    this.saveStateToUrl();

    console.log(`🔄 SortManager: Sort changed from "${previousSort}" to "${sort}"`);
  }

  updateVisualState(sort) {
    if (this.sortSelect.value !== sort) {
      this.sortSelect.value = sort;
    }

    // Update data attribute
    this.sortSelect.setAttribute('data-current-sort', sort);

    // Update visual feedback
    this.sortSelect.classList.add('updated');
    setTimeout(() => {
      this.sortSelect.classList.remove('updated');
    }, 200);
  }

  // =========================================================================
  // BROADCAST METHODS (Observer Pattern)
  // =========================================================================

  broadcastSortChange(sort) {
    const event = new CustomEvent('sort-update', {
      detail: {
        sort,
        timestamp: Date.now(),
        source: 'sort-manager'
      }
    });
    document.dispatchEvent(event);
  }

  // =========================================================================
  // STATE PERSISTENCE (Single Responsibility)
  // =========================================================================

  loadInitialState() {
    // Get initial sort from URL or DOM
    const urlParams = new URLSearchParams(window.location.search);
    const urlSort = urlParams.get('sort');

    if (urlSort && SortUtils.isValidSort(urlSort)) {
      this.setActiveSort(urlSort);
    } else {
      // Get from panel data attributes
      const panel = document.querySelector('[data-component="filter-panel"]');
      const currentSort = panel?.getAttribute('data-current-sort') || 'newest';
      this.setActiveSort(currentSort);
    }
  }

  saveStateToUrl() {
    const url = new URL(window.location);
    url.searchParams.set('sort', this.currentSort);
    window.history.replaceState({}, '', url);
  }

  // =========================================================================
  // SORT UTILITIES (Single Responsibility)
  // =========================================================================

  getSortOptions() {
    const options = Array.from(this.sortSelect.options);
    return options.map(option => ({
      value: option.value,
      label: option.textContent,
      selected: option.selected
    }));
  }

  getSortLabel(sortValue) {
    const option = this.sortSelect.querySelector(`option[value="${sortValue}"]`);
    return option ? option.textContent : sortValue;
  }

  // =========================================================================
  // PUBLIC API (Interface Segregation)
  // =========================================================================

  getCurrentSort() {
    return this.currentSort;
  }

  setSort(sort) {
    this.setActiveSort(sort);
  }

  getAvailableSorts() {
    return this.getSortOptions();
  }

  refreshUI() {
    this.updateVisualState(this.currentSort);
  }
}

// =============================================================================
// SINGLETON INITIALIZATION (DRY Principle)
// =============================================================================

// Create global singleton instance
if (!window.__sortManager) {
  window.__sortManager = new SortManager();
  console.log('🚀 SortManager: Singleton created');
}

export default window.__sortManager;