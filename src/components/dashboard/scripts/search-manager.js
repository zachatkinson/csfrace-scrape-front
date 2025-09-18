/**
 * Search Manager - Single Responsibility for Search Functionality
 * Following SOLID principles and Astro Islands Architecture
 */

// No imports from filter.utils.js needed
import { domUtils, waitForDOM, debounce } from '../utils/dom.utils.js';

// =============================================================================
// SEARCH MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

class SearchManager {
  constructor() {
    this.searchInput = null;
    this.searchQuery = '';
    this.isInitialized = false;
    this.debounceDelay = 300;
    this.debouncedSearch = null;
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
      console.log('🎯 SearchManager: Initialized successfully');
    } catch (error) {
      console.error('❌ SearchManager: Initialization failed:', error);
    }
  }

  async findElements() {
    this.searchInput = await domUtils.waitForElement('#search-input');
    if (!this.searchInput) {
      throw new Error('Search input not found');
    }

    // Create debounced search function
    this.debouncedSearch = debounce((query) => {
      this.performSearch(query);
    }, this.debounceDelay);

    console.log('🔍 SearchManager: Search input found and configured');
  }

  // =========================================================================
  // EVENT MANAGEMENT (Single Responsibility)
  // =========================================================================

  setupEventListeners() {
    // Search input events
    this.searchInput.addEventListener('input', (event) => {
      this.handleSearchInput(event);
    });

    this.searchInput.addEventListener('keydown', (event) => {
      this.handleSearchKeydown(event);
    });

    this.searchInput.addEventListener('focus', () => {
      this.handleSearchFocus();
    });

    this.searchInput.addEventListener('blur', () => {
      this.handleSearchBlur();
    });

    // Listen for coordinator state changes
    document.addEventListener('coordinator-state-change', (event) => {
      this.handleCoordinatorStateChange(event);
    });

    // Listen for external search changes
    document.addEventListener('external-search-change', (event) => {
      this.handleExternalSearchChange(event);
    });
  }

  // =========================================================================
  // EVENT HANDLERS (Single Responsibility)
  // =========================================================================

  handleSearchInput(event) {
    const query = event.target.value.trim();
    this.updateSearchQuery(query);
    this.debouncedSearch(query);
  }

  handleSearchKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const query = event.target.value.trim();
      this.performImmediateSearch(query);
    } else if (event.key === 'Escape') {
      this.clearSearch();
    }
  }

  handleSearchFocus() {
    this.searchInput.classList.add('focused');
  }

  handleSearchBlur() {
    this.searchInput.classList.remove('focused');
  }

  handleCoordinatorStateChange(event) {
    const { current } = event.detail;
    if (current.search !== this.searchQuery) {
      this.updateVisualState(current.search);
    }
  }

  handleExternalSearchChange(event) {
    const { query } = event.detail;
    this.setSearchQuery(query, false); // Don't broadcast since it's external
  }

  // =========================================================================
  // SEARCH MANAGEMENT (Single Responsibility)
  // =========================================================================

  updateSearchQuery(query) {
    this.searchQuery = query;
    this.updateVisualState(query);
  }

  setSearchQuery(query, shouldBroadcast = true) {
    this.searchQuery = query;
    this.updateVisualState(query);

    if (shouldBroadcast) {
      this.broadcastSearchChange(query);
    }
  }

  performSearch(query) {
    this.setSearchQuery(query);
    this.saveStateToUrl();
    console.log(`🔍 SearchManager: Performing search for "${query}"`);
  }

  performImmediateSearch(query) {
    // Cancel any pending debounced search
    if (this.debouncedSearch.cancel) {
      this.debouncedSearch.cancel();
    }
    this.performSearch(query);
  }

  clearSearch() {
    this.setSearchQuery('');
    this.searchInput.focus();
  }

  updateVisualState(query) {
    if (this.searchInput.value !== query) {
      this.searchInput.value = query;
    }

    // Update placeholder state
    if (query) {
      this.searchInput.classList.add('has-value');
    } else {
      this.searchInput.classList.remove('has-value');
    }

    // Update data attribute
    this.searchInput.setAttribute('data-current-query', query);
  }

  // =========================================================================
  // BROADCAST METHODS (Observer Pattern)
  // =========================================================================

  broadcastSearchChange(query) {
    const event = new CustomEvent('search-update', {
      detail: {
        query,
        timestamp: Date.now(),
        source: 'search-manager'
      }
    });
    document.dispatchEvent(event);
  }

  // =========================================================================
  // STATE PERSISTENCE (Single Responsibility)
  // =========================================================================

  loadInitialState() {
    // Get initial search from URL or DOM
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('search') || urlParams.get('q');

    if (urlQuery) {
      this.setSearchQuery(urlQuery);
    } else {
      // Get from panel data attributes
      const panel = document.querySelector('[data-component="filter-panel"]');
      const currentQuery = panel?.getAttribute('data-search-query') || '';
      this.setSearchQuery(currentQuery);
    }
  }

  saveStateToUrl() {
    const url = new URL(window.location);
    if (this.searchQuery) {
      url.searchParams.set('search', this.searchQuery);
    } else {
      url.searchParams.delete('search');
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);
  }

  // =========================================================================
  // PUBLIC API (Interface Segregation)
  // =========================================================================

  getCurrentQuery() {
    return this.searchQuery;
  }

  setQuery(query) {
    this.setSearchQuery(query);
  }

  clear() {
    this.clearSearch();
  }

  focus() {
    this.searchInput?.focus();
  }

  refreshUI() {
    this.updateVisualState(this.searchQuery);
  }
}

// =============================================================================
// SINGLETON INITIALIZATION (DRY Principle)
// =============================================================================

// Create global singleton instance
if (!window.__searchManager) {
  window.__searchManager = new SearchManager();
  console.log('🚀 SearchManager: Singleton created');
}

export default window.__searchManager;