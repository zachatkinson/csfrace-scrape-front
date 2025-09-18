/**
 * Batch Actions Manager - Single Responsibility for Batch Operations
 * Following SOLID principles and Astro Islands Architecture
 */

import { domUtils, waitForDOM } from '../utils/dom.utils.js';
import { createContextLogger } from '../../../utils/logger.js';

const logger = createContextLogger('BatchActionsManager');

// =============================================================================
// BATCH ACTIONS MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

class BatchActionsManager {
  constructor() {
    this.selectAllBtn = null;
    this.deleteSelectedBtn = null;
    this.selectedJobs = new Set();
    this.totalJobs = 0;
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
      logger.info('Initialized successfully');
    } catch (error) {
      logger.error('Initialization failed', { error });
    }
  }

  async findElements() {
    this.selectAllBtn = await domUtils.waitForElement('#select-all-btn');
    this.deleteSelectedBtn = await domUtils.waitForElement('#delete-selected-btn');

    if (!this.selectAllBtn || !this.deleteSelectedBtn) {
      throw new Error('Batch action buttons not found');
    }

    logger.debug('Batch action buttons found');
  }

  // =========================================================================
  // EVENT MANAGEMENT (Single Responsibility)
  // =========================================================================

  setupEventListeners() {
    // Select All button
    this.selectAllBtn.addEventListener('click', (event) => {
      this.handleSelectAllClick(event);
    });

    // Delete Selected button
    this.deleteSelectedBtn.addEventListener('click', (event) => {
      this.handleDeleteSelectedClick(event);
    });

    // Listen for job checkbox changes
    document.addEventListener('change', (event) => {
      if (event.target.classList.contains('job-checkbox')) {
        this.handleJobCheckboxChange(event);
      }
    });

    // Listen for coordinator state changes
    document.addEventListener('coordinator-state-change', (event) => {
      this.handleCoordinatorStateChange(event);
    });

    // Listen for jobs data updates
    document.addEventListener('jobs-data-update', (event) => {
      this.handleJobsDataUpdate(event);
    });
  }

  // =========================================================================
  // EVENT HANDLERS (Single Responsibility)
  // =========================================================================

  handleSelectAllClick(event) {
    event.preventDefault();

    const allSelected = this.selectedJobs.size === this.totalJobs && this.totalJobs > 0;

    if (allSelected) {
      this.deselectAllJobs();
    } else {
      this.selectAllJobs();
    }
  }

  handleDeleteSelectedClick(event) {
    event.preventDefault();

    if (this.selectedJobs.size === 0) {
      return;
    }

    this.confirmAndDeleteSelected();
  }

  handleJobCheckboxChange(event) {
    const checkbox = event.target;
    const jobId = checkbox.getAttribute('data-job-id');

    if (!jobId) return;

    if (checkbox.checked) {
      this.selectJob(jobId);
    } else {
      this.deselectJob(jobId);
    }

    this.updateUI();
    this.broadcastSelectionChange();
  }

  handleCoordinatorStateChange(event) {
    const { current } = event.detail;
    if (current.totalJobs !== this.totalJobs || current.selectedJobs !== this.selectedJobs.size) {
      this.updateJobCounts(current.totalJobs, current.selectedJobs);
    }
  }

  handleJobsDataUpdate(event) {
    const { totalJobs, selectedJobs, jobIds } = event.detail;
    this.updateJobCounts(totalJobs, selectedJobs);

    if (jobIds) {
      // Sync selection state with provided job IDs
      this.syncSelectionWithJobIds(jobIds);
    }
  }

  // =========================================================================
  // SELECTION MANAGEMENT (Single Responsibility)
  // =========================================================================

  selectJob(jobId) {
    this.selectedJobs.add(jobId);
    logger.debug('Selected job', { jobId });
  }

  deselectJob(jobId) {
    this.selectedJobs.delete(jobId);
    logger.debug('Deselected job', { jobId });
  }

  selectAllJobs() {
    const jobCheckboxes = document.querySelectorAll('.job-checkbox');
    jobCheckboxes.forEach(checkbox => {
      const jobId = checkbox.getAttribute('data-job-id');
      if (jobId) {
        checkbox.checked = true;
        this.selectJob(jobId);
      }
    });

    this.updateUI();
    this.broadcastSelectionChange();
    logger.info('Selected all jobs', { count: this.selectedJobs.size });
  }

  deselectAllJobs() {
    const jobCheckboxes = document.querySelectorAll('.job-checkbox');
    jobCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
      const jobId = checkbox.getAttribute('data-job-id');
      if (jobId) {
        this.deselectJob(jobId);
      }
    });

    this.selectedJobs.clear();
    this.updateUI();
    this.broadcastSelectionChange();
    logger.info('Deselected all jobs');
  }

  syncSelectionWithJobIds(jobIds) {
    // Clear current selection
    this.selectedJobs.clear();

    // Add provided job IDs
    jobIds.forEach(jobId => {
      this.selectedJobs.add(jobId);
    });

    // Update checkbox states
    const jobCheckboxes = document.querySelectorAll('.job-checkbox');
    jobCheckboxes.forEach(checkbox => {
      const jobId = checkbox.getAttribute('data-job-id');
      checkbox.checked = jobId && this.selectedJobs.has(jobId);
    });

    this.updateUI();
  }

  // =========================================================================
  // BATCH OPERATIONS (Single Responsibility)
  // =========================================================================

  async confirmAndDeleteSelected() {
    const count = this.selectedJobs.size;
    const confirmation = confirm(`Are you sure you want to delete ${count} selected job${count === 1 ? '' : 's'}?`);

    if (!confirmation) {
      return;
    }

    await this.deleteSelectedJobs();
  }

  async deleteSelectedJobs() {
    const jobIds = Array.from(this.selectedJobs);

    try {
      // Show loading state
      this.setLoadingState(true);

      // Broadcast batch delete action
      this.broadcastBatchAction('delete', jobIds);

      // Simulate API call (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear selection after successful delete
      this.selectedJobs.clear();
      this.updateUI();
      this.broadcastSelectionChange();

      logger.info('Deleted jobs', { count: jobIds.length });
    } catch (error) {
      logger.error('Delete failed', { error, jobIds });
    } finally {
      this.setLoadingState(false);
    }
  }

  // =========================================================================
  // UI MANAGEMENT (Single Responsibility)
  // =========================================================================

  updateUI() {
    this.updateSelectAllButton();
    this.updateDeleteButton();
  }

  updateSelectAllButton() {
    const allSelected = this.selectedJobs.size === this.totalJobs && this.totalJobs > 0;

    this.selectAllBtn.textContent = allSelected ? 'Select None' : 'Select All';
    this.selectAllBtn.setAttribute('data-all-selected', allSelected.toString());

    // Update aria label
    const label = allSelected ? 'Deselect all jobs' : 'Select all jobs';
    this.selectAllBtn.setAttribute('aria-label', label);
  }

  updateDeleteButton() {
    const hasSelection = this.selectedJobs.size > 0;

    this.deleteSelectedBtn.disabled = !hasSelection;
    this.deleteSelectedBtn.setAttribute('data-selected-count', this.selectedJobs.size.toString());

    // Update button text with count
    const countBadge = this.deleteSelectedBtn.querySelector('.count-badge');

    if (hasSelection) {
      if (countBadge) {
        countBadge.textContent = this.selectedJobs.size.toString();
      } else {
        // Add count badge if it doesn't exist
        const badge = document.createElement('span');
        badge.className = 'ml-1 bg-red-500/20 px-1 rounded-full text-xs count-badge';
        badge.textContent = this.selectedJobs.size.toString();
        this.deleteSelectedBtn.appendChild(badge);
      }
    } else if (countBadge) {
      countBadge.remove();
    }

    // Update aria label
    const label = hasSelection ? `Delete ${this.selectedJobs.size} selected jobs` : 'No jobs selected';
    this.deleteSelectedBtn.setAttribute('aria-label', label);
  }

  setLoadingState(isLoading) {
    [this.selectAllBtn, this.deleteSelectedBtn].forEach(btn => {
      btn.disabled = isLoading;
      if (isLoading) {
        btn.classList.add('loading');
      } else {
        btn.classList.remove('loading');
      }
    });
  }

  // =========================================================================
  // BROADCAST METHODS (Observer Pattern)
  // =========================================================================

  broadcastSelectionChange() {
    const event = new CustomEvent('selection-change', {
      detail: {
        selectedJobs: Array.from(this.selectedJobs),
        selectedCount: this.selectedJobs.size,
        totalJobs: this.totalJobs,
        timestamp: Date.now(),
        source: 'batch-actions'
      }
    });
    document.dispatchEvent(event);
  }

  broadcastBatchAction(action, jobIds) {
    const event = new CustomEvent('batch-action', {
      detail: {
        action,
        jobIds,
        timestamp: Date.now(),
        source: 'batch-actions'
      }
    });
    document.dispatchEvent(event);
  }

  // =========================================================================
  // STATE MANAGEMENT (Single Responsibility)
  // =========================================================================

  loadInitialState() {
    // Get initial state from DOM
    const panel = document.querySelector('[data-component="filter-panel"]');
    if (panel) {
      this.totalJobs = parseInt(panel.getAttribute('data-total-jobs') || '0');

      // Sync with actual checkbox states
      this.syncWithCheckboxes();
    }
  }

  syncWithCheckboxes() {
    this.selectedJobs.clear();
    const checkedBoxes = document.querySelectorAll('.job-checkbox:checked');
    checkedBoxes.forEach(checkbox => {
      const jobId = checkbox.getAttribute('data-job-id');
      if (jobId) {
        this.selectedJobs.add(jobId);
      }
    });

    this.updateUI();
  }

  updateJobCounts(totalJobs, selectedJobs) {
    this.totalJobs = totalJobs || 0;
    // Validate selectedJobs parameter for consistency but trust our internal state
    if (typeof selectedJobs === 'number' && selectedJobs !== this.selectedJobs.size) {
      // Log mismatch for debugging
      logger.warn('Selected jobs count mismatch', { expected: selectedJobs, actual: this.selectedJobs.size });
    }
    this.updateUI();
  }

  // =========================================================================
  // PUBLIC API (Interface Segregation)
  // =========================================================================

  getSelectedJobs() {
    return Array.from(this.selectedJobs);
  }

  getSelectedCount() {
    return this.selectedJobs.size;
  }

  getTotalCount() {
    return this.totalJobs;
  }

  clearSelection() {
    this.deselectAllJobs();
  }

  refreshUI() {
    this.syncWithCheckboxes();
  }
}

// =============================================================================
// SINGLETON INITIALIZATION (DRY Principle)
// =============================================================================

// Create global singleton instance
if (!window.__batchActionsManager) {
  window.__batchActionsManager = new BatchActionsManager();
  logger.debug('Singleton created');
}

export default window.__batchActionsManager;