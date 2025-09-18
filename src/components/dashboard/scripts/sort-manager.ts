/**
 * Sort Manager - Single Responsibility for Sort Functionality
 * Following SOLID principles and Astro Islands Architecture
 */

import type { ISortManager, ISortOption } from "../types/filter.types";
import { SortUtils, EventUtils } from "../utils/filter.utils";
import { domUtils, waitForDOM } from "../utils/dom.utils";
import { createContextLogger } from "../../../utils/logger";

const logger = createContextLogger("SortManager");

// =============================================================================
// SORT MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

class SortManager implements ISortManager {
  private currentSort: string = "newest";
  private sortSelect: HTMLSelectElement | null = null;

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
    this.updateSortState();
    this.emitInitialState();

    logger.info("SortManager initialized with sort options");
  }

  private loadInitialState(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    this.currentSort =
      domUtils.getDataAttribute(panel, "current-sort") || "newest";
    this.sortSelect = domUtils.querySelector(
      "#sort-select",
    ) as HTMLSelectElement;

    // Ensure select value matches current state
    if (this.sortSelect) {
      this.sortSelect.value = this.currentSort;
    }
  }

  // =========================================================================
  // PUBLIC INTERFACE (Interface Segregation Principle)
  // =========================================================================

  getCurrentSort(): string {
    return this.currentSort;
  }

  setCurrentSort(sort: string): void {
    if (!SortUtils.isValidSortOption(sort)) {
      console.warn(`SortManager: Invalid sort option: ${sort}`);
      return;
    }

    if (this.currentSort !== sort) {
      this.currentSort = sort;

      // Update select value if different
      if (this.sortSelect && this.sortSelect.value !== sort) {
        this.sortSelect.value = sort;
      }

      // Update component data attribute for state persistence
      const panel = domUtils.querySelector('[data-component="filter-panel"]');
      if (panel) {
        domUtils.setDataAttribute(panel, "current-sort", sort);
      }

      this.updateSortState();
      this.emitSortUpdate();
    }
  }

  getSortOptions(): readonly ISortOption[] {
    return SortUtils.getSortOptions();
  }

  // =========================================================================
  // PRIVATE METHODS (Dependency Inversion Principle)
  // =========================================================================

  private attachEventListeners(): void {
    if (!this.sortSelect) return;

    // Change event for sort selection
    domUtils.addEventListener(this.sortSelect, "change", (event) => {
      const target = event.target as HTMLSelectElement;
      this.setCurrentSort(target.value);
    });

    // Keyboard navigation enhancement
    domUtils.addEventListener(
      this.sortSelect,
      "keydown",
      (event: KeyboardEvent) => {
        // Handle Enter key
        if (event.key === "Enter") {
          event.preventDefault();
          const target = event.target as HTMLSelectElement;
          this.setCurrentSort(target.value);
        }

        // Handle Escape key to revert selection
        if (event.key === "Escape") {
          event.preventDefault();
          if (this.sortSelect) {
            this.sortSelect.value = this.currentSort;
            this.sortSelect.blur();
          }
        }
      },
    );

    // Focus/blur events for enhanced UX
    domUtils.addEventListener(this.sortSelect, "focus", () => {
      this.addSortFocusStyles();
    });

    domUtils.addEventListener(this.sortSelect, "blur", () => {
      this.removeSortFocusStyles();
    });
  }

  private updateSortState(): void {
    if (!this.sortSelect) return;

    // Update ARIA attributes for accessibility
    const selectedOption = SortUtils.getSortOption(this.currentSort);
    if (selectedOption) {
      domUtils.setAttributes(this.sortSelect, {
        "aria-label": `Sort jobs by: ${selectedOption.label}`,
        title: `Currently sorting by: ${selectedOption.label}`,
      });
    }

    // Update visual feedback
    this.updateSortVisualState();
  }

  private updateSortVisualState(): void {
    if (!this.sortSelect) return;

    // Add visual indicator that sort is active
    const hasCustomSort = this.currentSort !== "newest";

    domUtils.updateClasses(this.sortSelect, {
      add: hasCustomSort ? ["border-blue-400/50"] : [],
      remove: hasCustomSort ? [] : ["border-blue-400/50"],
    });
  }

  private emitSortUpdate(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    const currentFilter =
      domUtils.getDataAttribute(panel, "current-filter") || "all";
    const searchQuery = domUtils.getDataAttribute(panel, "search-query") || "";

    const event = EventUtils.createFilterUpdateEvent(
      currentFilter,
      this.currentSort,
      searchQuery,
    );

    EventUtils.dispatchEvent(event);

    logger.debug("Sort updated", {
      sort: this.currentSort,
      option: SortUtils.getSortOption(this.currentSort),
    });
  }

  private emitInitialState(): void {
    // Emit initial state after a brief delay
    setTimeout(() => {
      this.emitSortUpdate();
    }, 200);
  }

  private addSortFocusStyles(): void {
    if (!this.sortSelect) return;

    domUtils.updateClasses(this.sortSelect, {
      add: ["ring-2", "ring-blue-500/50", "bg-white/20"],
    });
  }

  private removeSortFocusStyles(): void {
    if (!this.sortSelect) return;

    domUtils.updateClasses(this.sortSelect, {
      remove: ["ring-2", "ring-blue-500/50", "bg-white/20"],
    });
  }
}

// =============================================================================
// SORT UTILITIES (DRY Principle)
// =============================================================================

class SortUtilities {
  /**
   * Get sort icon for visual feedback (future enhancement)
   */
  static getSortIcon(sortOption: string): string {
    const icons: Record<string, string> = {
      newest: "📅⬇️",
      oldest: "📅⬆️",
      status: "🏷️",
      progress: "📊",
    };

    return icons[sortOption] || "📋";
  }

  /**
   * Get sort description for accessibility
   */
  static getSortDescription(sortOption: string): string {
    const descriptions: Record<string, string> = {
      newest: "Sort by creation date, newest first",
      oldest: "Sort by creation date, oldest first",
      status: "Sort alphabetically by status",
      progress: "Sort by completion progress",
    };

    return descriptions[sortOption] || "Sort jobs";
  }

  /**
   * Validate and normalize sort direction
   */
  static normalizeSortDirection(direction: string): "asc" | "desc" {
    return direction.toLowerCase() === "asc" ? "asc" : "desc";
  }

  /**
   * Create compound sort key for complex sorting
   */
  static createCompoundSortKey(
    primary: string,
    secondary: string = "newest",
  ): string {
    return `${primary}:${secondary}`;
  }

  /**
   * Parse compound sort key
   */
  static parseCompoundSortKey(key: string): {
    primary: string;
    secondary: string;
  } {
    const [primary, secondary = "newest"] = key.split(":");
    return {
      primary: primary || "newest",
      secondary: secondary,
    };
  }
}

// =============================================================================
// INITIALIZATION (Following Astro Islands Pattern)
// =============================================================================

// Initialize manager when script loads (Astro Islands architecture)
const sortManager = new SortManager();

// Expose manager globally for debugging and external access
if (typeof window !== "undefined") {
  (
    window as Window & {
      sortManager?: SortManager;
      SortUtilities?: typeof SortUtilities;
    }
  ).sortManager = sortManager;
  (
    window as Window & {
      sortManager?: SortManager;
      SortUtilities?: typeof SortUtilities;
    }
  ).SortUtilities = SortUtilities;
}
