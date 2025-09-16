/**
 * Search Manager - Single Responsibility for Search Functionality
 * Following SOLID principles and Astro Islands Architecture
 */

import type { ISearchManager } from '../types/filter.types';
import { EventUtils } from '../utils/filter.utils';
import { domUtils, waitForDOM, debounce } from '../utils/dom.utils';

// =============================================================================
// SEARCH MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

class SearchManager implements ISearchManager {
  private currentQuery: string = '';
  private searchInput: HTMLInputElement | null = null;
  private debouncedSearch: (query: string) => void;

  constructor() {
    // Debounce search to improve performance (DRY principle)
    this.debouncedSearch = debounce((query: string) => {
      this.performSearch(query);
    }, 300);

    this.init();
  }

  // =========================================================================
  // INITIALIZATION (Open/Closed Principle)
  // =========================================================================

  private async init(): Promise<void> {
    await waitForDOM();
    
    this.loadInitialState();
    this.attachEventListeners();
    this.emitInitialState();
    
    console.log('🔍 SearchManager: Initialized with debounced search');
  }

  private loadInitialState(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    this.currentQuery = domUtils.getDataAttribute(panel, 'search-query') || '';
    this.searchInput = domUtils.querySelector('#search-input') as HTMLInputElement;

    // Ensure input value matches current state
    if (this.searchInput) {
      this.searchInput.value = this.currentQuery;
    }
  }

  // =========================================================================
  // PUBLIC INTERFACE (Interface Segregation Principle)
  // =========================================================================

  getCurrentQuery(): string {
    return this.currentQuery;
  }

  setSearchQuery(query: string): void {
    const normalizedQuery = query.trim();
    
    if (this.currentQuery !== normalizedQuery) {
      this.currentQuery = normalizedQuery;
      
      // Update input value if different
      if (this.searchInput && this.searchInput.value !== normalizedQuery) {
        this.searchInput.value = normalizedQuery;
      }

      // Update component data attribute for state persistence
      const panel = domUtils.querySelector('[data-component="filter-panel"]');
      if (panel) {
        domUtils.setDataAttribute(panel, 'search-query', normalizedQuery);
      }

      this.emitSearchUpdate();
    }
  }

  clearSearch(): void {
    this.setSearchQuery('');
  }

  // =========================================================================
  // PRIVATE METHODS (Dependency Inversion Principle)
  // =========================================================================

  private attachEventListeners(): void {
    if (!this.searchInput) return;

    // Input event for real-time search (debounced)
    domUtils.addEventListener(this.searchInput, 'input', (event) => {
      const target = event.target as HTMLInputElement;
      const query = target.value;
      
      // Update current query immediately for UI responsiveness
      this.currentQuery = query;
      
      // Debounced search execution
      this.debouncedSearch(query);
    });

    // Handle Enter key for immediate search
    domUtils.addEventListener(this.searchInput, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const target = event.target as HTMLInputElement;
        this.performSearch(target.value);
      }
    });

    // Handle Escape key to clear search
    domUtils.addEventListener(this.searchInput, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.clearSearch();
        this.searchInput?.blur();
      }
    });

    // Focus/blur events for enhanced UX
    domUtils.addEventListener(this.searchInput, 'focus', () => {
      this.addSearchFocusStyles();
    });

    domUtils.addEventListener(this.searchInput, 'blur', () => {
      this.removeSearchFocusStyles();
    });
  }

  private performSearch(query: string): void {
    const normalizedQuery = query.trim();
    
    if (this.currentQuery !== normalizedQuery) {
      this.currentQuery = normalizedQuery;
      
      // Update component data attribute
      const panel = domUtils.querySelector('[data-component="filter-panel"]');
      if (panel) {
        domUtils.setDataAttribute(panel, 'search-query', normalizedQuery);
      }

      this.emitSearchUpdate();
    }
  }

  private emitSearchUpdate(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    const currentFilter = domUtils.getDataAttribute(panel, 'current-filter') || 'all';
    const currentSort = domUtils.getDataAttribute(panel, 'current-sort') || 'newest';

    const event = EventUtils.createFilterUpdateEvent(
      currentFilter,
      currentSort,
      this.currentQuery
    );

    EventUtils.dispatchEvent(event);
    
    console.log('🔍 SearchManager: Search updated', {
      query: this.currentQuery,
      length: this.currentQuery.length
    });
  }

  private emitInitialState(): void {
    // Emit initial state if there's a query
    if (this.currentQuery) {
      setTimeout(() => {
        this.emitSearchUpdate();
      }, 150);
    }
  }

  private addSearchFocusStyles(): void {
    if (!this.searchInput) return;

    domUtils.updateClasses(this.searchInput, {
      add: ['ring-2', 'ring-blue-500/50', 'bg-white/20']
    });
  }

  private removeSearchFocusStyles(): void {
    if (!this.searchInput) return;

    domUtils.updateClasses(this.searchInput, {
      remove: ['ring-2', 'ring-blue-500/50', 'bg-white/20']
    });
  }
}

// =============================================================================
// SEARCH UTILITIES (DRY Principle)
// =============================================================================

class SearchUtils {
  
  /**
   * Highlight search terms in text (for future enhancement)
   */
  static highlightSearchTerms(text: string, query: string): string {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Validate search query
   */
  static isValidSearchQuery(query: string): boolean {
    return typeof query === 'string' && query.trim().length > 0;
  }

  /**
   * Normalize search query for consistent matching
   */
  static normalizeSearchQuery(query: string): string {
    return query.trim().toLowerCase();
  }

  /**
   * Create search suggestions (for future enhancement)
   */
  static createSearchSuggestions(query: string, data: any[]): string[] {
    if (!query.trim() || !Array.isArray(data)) return [];

    const normalizedQuery = this.normalizeSearchQuery(query);
    const suggestions = new Set<string>();

    data.forEach(item => {
      if (item.title && item.title.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(item.title);
      }
      if (item.url && item.url.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(item.url);
      }
    });

    return Array.from(suggestions).slice(0, 5); // Limit to 5 suggestions
  }
}

// =============================================================================
// INITIALIZATION (Following Astro Islands Pattern)
// =============================================================================

// Initialize manager when script loads (Astro Islands architecture)
const searchManager = new SearchManager();

// Expose manager globally for debugging and external access
if (typeof window !== 'undefined') {
  (window as any).searchManager = searchManager;
  (window as any).SearchUtils = SearchUtils;
}