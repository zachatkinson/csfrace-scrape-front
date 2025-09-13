/**
 * FilterPanel TypeScript Interfaces
 * Following SOLID principles with strict typing
 */

// ============================================================================= 
// CORE FILTER TYPES
// =============================================================================

export interface IFilterConfig {
  readonly label: string;
  readonly icon: string;
  readonly count?: number;
}

export interface IFilterState {
  currentFilter: string;
  currentSort: string;
  searchQuery: string;
  selectedJobs: Set<string>;
  totalJobs: number;
}

export interface ISortOption {
  readonly value: string;
  readonly label: string;
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

export interface IFilterPanelProps {
  availableStatuses?: readonly string[];
  currentFilter?: string;
  currentSort?: string;
  searchQuery?: string;
  totalJobs?: number;
  selectedJobs?: number;
}

// =============================================================================
// EVENT INTERFACES (replacing custom events with proper typing)
// =============================================================================

export interface IFilterUpdateEvent {
  filter: string;
  sort: string;
  search: string;
  timestamp: number;
}

export interface IBatchActionEvent {
  action: 'select-all' | 'select-none' | 'delete-selected';
  selectedIds: readonly string[];
  timestamp: number;
}

export interface IJobsDataUpdateEvent {
  jobs: readonly IJobData[];
  availableStatuses: readonly string[];
  timestamp: number;
}

// =============================================================================
// DATA INTERFACES
// =============================================================================

export interface IJobData {
  readonly id: string;
  readonly status: string;
  readonly title?: string;
  readonly url?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// =============================================================================
// MANAGER INTERFACES (Dependency Inversion Principle)
// =============================================================================

export interface IFilterManager {
  getCurrentFilter(): string;
  setCurrentFilter(filter: string): void;
  getAvailableStatuses(): readonly string[];
  updateAvailableStatuses(statuses: readonly string[]): void;
  isFilterDisabled(filter: string): boolean;
}

export interface ISearchManager {
  getCurrentQuery(): string;
  setSearchQuery(query: string): void;
  clearSearch(): void;
}

export interface ISortManager {
  getCurrentSort(): string;
  setCurrentSort(sort: string): void;
  getSortOptions(): readonly ISortOption[];
}

export interface IBatchActionManager {
  getSelectedJobs(): readonly string[];
  selectAll(): void;
  selectNone(): void;
  deleteSelected(): void;
  isAllSelected(): boolean;
  getSelectedCount(): number;
}

// =============================================================================
// UTILITY INTERFACES
// =============================================================================

export interface IDOMUtils {
  querySelector<T extends Element = Element>(selector: string): T | null;
  querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T>;
  addClass(element: Element, className: string): void;
  removeClass(element: Element, className: string): void;
  toggleClass(element: Element, className: string): void;
  setAttribute(element: Element, name: string, value: string): void;
  addEventListener<K extends keyof HTMLElementEventMap>(
    element: Element,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void
  ): void;
}

// =============================================================================
// CONFIGURATION CONSTANTS (DRY principle)
// =============================================================================

export const FILTER_CONFIG: Record<string, IFilterConfig> = {
  all: { label: 'All', icon: '' },
  processing: { label: 'Processing', icon: '' },
  completed: { label: 'Completed', icon: '' },
  failed: { label: 'Failed', icon: '' },
  queued: { label: 'Pending', icon: '' }
} as const;

export const SORT_OPTIONS: readonly ISortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'status', label: 'By Status' },
  { value: 'progress', label: 'By Progress' }
] as const;

// =============================================================================
// CSS CLASSES CONSTANTS (DRY principle)
// =============================================================================

export const CSS_CLASSES = {
  FILTER_BTN: 'filter-btn px-3 py-1 text-xs rounded-full transition-all duration-200',
  FILTER_ACTIVE: 'bg-blue-500/50 text-blue-300 border-blue-400/30',
  FILTER_DISABLED: 'opacity-50 cursor-not-allowed',
  FILTER_HOVER: 'hover:bg-white/20',
  GLASS_INPUT: 'glass-input text-sm px-3 py-1',
  GLASS_BUTTON: 'glass-button px-3 py-1 text-xs'
} as const;