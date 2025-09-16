/**
 * Batch Actions Manager - Single Responsibility for Batch Operations
 * Following SOLID principles and Astro Islands Architecture
 */

import type { IBatchActionManager } from '../types/filter.types';
import { EventUtils } from '../utils/filter.utils';
import { domUtils, waitForDOM } from '../utils/dom.utils';

// =============================================================================
// BATCH ACTION MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

class BatchActionManager implements IBatchActionManager {
  private selectedJobs: Set<string> = new Set();
  private totalJobs: number = 0;
  private selectAllBtn: HTMLButtonElement | null = null;
  private deleteSelectedBtn: HTMLButtonElement | null = null;

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
    this.updateButtonStates();
    
    console.log('⚡ BatchActionManager: Initialized with batch operations');
  }

  private loadInitialState(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    // Load total jobs count
    const totalJobsAttr = domUtils.getDataAttribute(panel, 'total-jobs');
    this.totalJobs = totalJobsAttr ? parseInt(totalJobsAttr, 10) : 0;

    // Load selected jobs count (for UI consistency)
    const selectedJobsAttr = domUtils.getDataAttribute(panel, 'selected-jobs');
    // Parse selected count but don't store in unused variable
    selectedJobsAttr ? parseInt(selectedJobsAttr, 10) : 0;
    
    // Initialize selected jobs set (will be populated by external job data)
    this.selectedJobs = new Set();

    // Get button references
    this.selectAllBtn = domUtils.querySelector('#select-all-btn') as HTMLButtonElement;
    this.deleteSelectedBtn = domUtils.querySelector('#delete-selected-btn') as HTMLButtonElement;
  }

  // =========================================================================
  // PUBLIC INTERFACE (Interface Segregation Principle)
  // =========================================================================

  getSelectedJobs(): readonly string[] {
    return Array.from(this.selectedJobs);
  }

  selectAll(): void {
    // This will be populated with actual job IDs from external job data
    // For now, we emit an event for the parent component to handle
    this.emitBatchActionEvent('select-all');
    
    console.log('⚡ BatchActionManager: Select all requested');
  }

  selectNone(): void {
    this.selectedJobs.clear();
    this.updateButtonStates();
    this.updateComponentState();
    this.emitBatchActionEvent('select-none');
    
    console.log('⚡ BatchActionManager: Deselected all jobs');
  }

  deleteSelected(): void {
    if (this.selectedJobs.size === 0) {
      console.warn('BatchActionManager: No jobs selected for deletion');
      return;
    }

    // Confirm deletion (basic confirmation, could be enhanced with modal)
    const selectedCount = this.selectedJobs.size;
    const confirmed = confirm(
      `Are you sure you want to delete ${selectedCount} selected job${selectedCount > 1 ? 's' : ''}?`
    );

    if (confirmed) {
      this.emitBatchActionEvent('delete-selected');
      console.log(`⚡ BatchActionManager: Deletion confirmed for ${selectedCount} jobs`);
    }
  }

  isAllSelected(): boolean {
    return this.totalJobs > 0 && this.selectedJobs.size === this.totalJobs;
  }

  getSelectedCount(): number {
    return this.selectedJobs.size;
  }

  // =========================================================================
  // PUBLIC METHODS FOR EXTERNAL UPDATES
  // =========================================================================

  updateSelectedJobs(jobIds: readonly string[]): void {
    this.selectedJobs = new Set(jobIds);
    this.updateButtonStates();
    this.updateComponentState();
  }

  updateTotalJobs(total: number): void {
    this.totalJobs = Math.max(0, total);
    this.updateButtonStates();
    this.updateComponentState();
  }

  toggleJobSelection(jobId: string): void {
    if (this.selectedJobs.has(jobId)) {
      this.selectedJobs.delete(jobId);
    } else {
      this.selectedJobs.add(jobId);
    }
    
    this.updateButtonStates();
    this.updateComponentState();
  }

  // =========================================================================
  // PRIVATE METHODS (Dependency Inversion Principle)
  // =========================================================================

  private attachEventListeners(): void {
    // Select All/None button
    if (this.selectAllBtn) {
      domUtils.addEventListener(this.selectAllBtn, 'click', (event) => {
        event.preventDefault();
        
        if (this.isAllSelected()) {
          this.selectNone();
        } else {
          this.selectAll();
        }
      });
    }

    // Delete Selected button
    if (this.deleteSelectedBtn) {
      domUtils.addEventListener(this.deleteSelectedBtn, 'click', (event) => {
        event.preventDefault();
        this.deleteSelected();
      });
    }

    // Listen for external job selection updates
    window.addEventListener('jobs:selectionUpdate', (event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.selectedJobIds) {
        this.updateSelectedJobs(customEvent.detail.selectedJobIds);
      }
    });

    // Listen for job data updates to update total count
    window.addEventListener('jobs:dataUpdate', (event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.jobs) {
        this.updateTotalJobs(customEvent.detail.jobs.length);
      }
    });

    // Listen for individual job selection changes
    window.addEventListener('job:selectionToggle', (event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.jobId) {
        this.toggleJobSelection(customEvent.detail.jobId);
      }
    });
  }

  private updateButtonStates(): void {
    this.updateSelectAllButton();
    this.updateDeleteSelectedButton();
  }

  private updateSelectAllButton(): void {
    if (!this.selectAllBtn) return;

    const allSelected = this.isAllSelected();
    const hasJobs = this.totalJobs > 0;

    // Update button text
    this.selectAllBtn.textContent = allSelected ? 'Select None' : 'Select All';

    // Update button state
    this.selectAllBtn.disabled = !hasJobs;

    // Update data attributes
    domUtils.setDataAttribute(this.selectAllBtn, 'all-selected', allSelected ? 'true' : 'false');

    // Update ARIA attributes
    domUtils.setAttributes(this.selectAllBtn, {
      'aria-label': allSelected 
        ? 'Deselect all jobs' 
        : `Select all ${this.totalJobs} jobs`,
      'aria-pressed': allSelected ? 'true' : 'false'
    });

    // Update visual styling
    domUtils.updateClasses(this.selectAllBtn, {
      add: allSelected ? ['bg-blue-500/20', 'text-blue-300'] : [],
      remove: allSelected ? [] : ['bg-blue-500/20', 'text-blue-300']
    });
  }

  private updateDeleteSelectedButton(): void {
    if (!this.deleteSelectedBtn) return;

    const selectedCount = this.selectedJobs.size;
    const hasSelection = selectedCount > 0;

    // Update button state
    this.deleteSelectedBtn.disabled = !hasSelection;

    // Update data attribute
    domUtils.setDataAttribute(this.deleteSelectedBtn, 'selected-count', selectedCount.toString());

    // Update ARIA attributes
    domUtils.setAttributes(this.deleteSelectedBtn, {
      'aria-label': hasSelection 
        ? `Delete ${selectedCount} selected job${selectedCount > 1 ? 's' : ''}` 
        : 'No jobs selected for deletion'
    });

    // Update badge in button
    this.updateDeleteButtonBadge(selectedCount);

    // Update visual styling
    domUtils.updateClasses(this.deleteSelectedBtn, {
      add: hasSelection ? [] : ['opacity-50'],
      remove: hasSelection ? ['opacity-50'] : []
    });
  }

  private updateDeleteButtonBadge(count: number): void {
    if (!this.deleteSelectedBtn) return;

    // Find existing badge
    const existingBadge = this.deleteSelectedBtn.querySelector('.selected-count-badge');
    
    if (count > 0) {
      if (existingBadge) {
        existingBadge.textContent = count.toString();
      } else {
        // Create new badge
        const badge = document.createElement('span');
        badge.className = 'selected-count-badge ml-1 bg-red-500/20 px-1 rounded-full text-xs';
        badge.textContent = count.toString();
        this.deleteSelectedBtn.appendChild(badge);
      }
    } else {
      // Remove badge if no selection
      if (existingBadge) {
        existingBadge.remove();
      }
    }
  }

  private updateComponentState(): void {
    const panel = domUtils.querySelector('[data-component="filter-panel"]');
    if (!panel) return;

    // Update data attributes for state persistence
    domUtils.setDataAttribute(panel, 'selected-jobs', this.selectedJobs.size.toString());
    domUtils.setDataAttribute(panel, 'total-jobs', this.totalJobs.toString());
  }

  private emitBatchActionEvent(action: 'select-all' | 'select-none' | 'delete-selected'): void {
    const event = EventUtils.createBatchActionEvent(action, Array.from(this.selectedJobs));
    EventUtils.dispatchEvent(event);
    
    console.log('⚡ BatchActionManager: Batch action emitted', {
      action,
      selectedCount: this.selectedJobs.size,
      totalJobs: this.totalJobs
    });
  }
}

// =============================================================================
// BATCH ACTION UTILITIES (DRY Principle)
// =============================================================================

class BatchActionUtils {
  
  /**
   * Validate job ID format
   */
  static isValidJobId(jobId: string): boolean {
    return typeof jobId === 'string' && jobId.trim().length > 0;
  }

  /**
   * Filter valid job IDs from array
   */
  static filterValidJobIds(jobIds: any[]): string[] {
    return jobIds.filter(id => this.isValidJobId(id)).map(id => String(id).trim());
  }

  /**
   * Create confirmation message for batch deletion
   */
  static createDeletionConfirmationMessage(count: number): string {
    if (count === 0) return 'No jobs selected for deletion.';
    if (count === 1) return 'Are you sure you want to delete the selected job?';
    return `Are you sure you want to delete ${count} selected jobs?`;
  }

  /**
   * Get batch action icon (for future enhancement)
   */
  static getBatchActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'select-all': '☑️',
      'select-none': '⬜',
      'delete-selected': '🗑️'
    };
    
    return icons[action] || '⚡';
  }

  /**
   * Estimate batch operation time (for progress indicators)
   */
  static estimateOperationTime(action: string, count: number): number {
    const baseTimes: Record<string, number> = {
      'select-all': 50,
      'select-none': 10,
      'delete-selected': 200
    };
    
    const baseTime = baseTimes[action] || 100;
    return baseTime + (count * 10); // ms
  }
}

// =============================================================================
// INITIALIZATION (Following Astro Islands Pattern)
// =============================================================================

// Initialize manager when script loads (Astro Islands architecture)
const batchActionManager = new BatchActionManager();

// Expose manager globally for debugging and external access
if (typeof window !== 'undefined') {
  (window as any).batchActionManager = batchActionManager;
  (window as any).BatchActionUtils = BatchActionUtils;
}