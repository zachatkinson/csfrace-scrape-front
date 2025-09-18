/**
 * Modal Manager - Astro Islands Implementation
 * Following SOLID principles with single responsibility for modal operations
 */

import { domUtils, waitForDOM } from '../utils/dom.utils';
import { createContextLogger } from '../../../utils/logger';

const logger = createContextLogger('ModalManager');

// =============================================================================
// MODAL MANAGER CLASS (Single Responsibility Principle)
// =============================================================================

export class ModalManager {
  private modal: Element | null = null;
  private closeButton: Element | null = null;
  private contentArea: Element | null = null;
  private isInitialized = false;

  /**
   * Initialize modal manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await waitForDOM();
    this.setupElements();
    this.attachEventListeners();
    this.isInitialized = true;

    logger.info('Initialized with proper Islands architecture');
  }

  /**
   * Setup DOM element references
   */
  private setupElements(): void {
    this.modal = domUtils.querySelector('#job-modal');
    this.closeButton = domUtils.querySelector('#close-modal');
    this.contentArea = domUtils.querySelector('#job-details-content');
  }

  /**
   * Attach event listeners (DRY pattern)
   */
  private attachEventListeners(): void {
    // Close button click
    if (this.closeButton) {
      domUtils.addEventListener(this.closeButton, 'click', () => this.closeModal());
    }

    // Escape key close
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    });

    // Background click close
    if (this.modal) {
      domUtils.addEventListener(this.modal, 'click', (event) => {
        if (event.target === this.modal) {
          this.closeModal();
        }
      });
    }

    // Listen for job detail requests
    window.addEventListener('job:showDetails', (event) => {
      this.showJobDetails((event as CustomEvent).detail.jobId);
    });
  }

  /**
   * Show modal with job details
   */
  showJobDetails(jobId: string): void {
    if (!this.modal || !this.contentArea) return;

    // Set job ID attribute
    domUtils.setAttribute(this.modal, 'data-job-id', jobId);
    domUtils.setAttribute(this.modal, 'data-modal-open', 'true');

    // Show modal
    domUtils.removeClass(this.modal, 'hidden');

    // Set ARIA attributes
    domUtils.setAttribute(this.contentArea, 'aria-busy', 'true');

    // Fetch and display job details
    this.loadJobDetails(jobId);

    // Focus management for accessibility
    const firstFocusable = this.modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      (firstFocusable as HTMLElement).focus();
    }
  }

  /**
   * Close modal
   */
  closeModal(): void {
    if (!this.modal) return;

    domUtils.addClass(this.modal, 'hidden');
    domUtils.setAttribute(this.modal, 'data-modal-open', 'false');

    // Clear job ID
    domUtils.setAttribute(this.modal, 'data-job-id', '');

    // Clear content
    if (this.contentArea) {
      this.contentArea.innerHTML = `
        <div class="text-center py-8" data-loading-placeholder>
          <div class="animate-spin rounded-full w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 mx-auto mb-4"></div>
          <p class="text-white/70">Loading job details...</p>
        </div>
      `;
    }

    // Emit close event
    window.dispatchEvent(new CustomEvent('modal:closed'));
  }

  /**
   * Load job details from API
   */
  private async loadJobDetails(jobId: string): Promise<void> {
    if (!this.contentArea) return;

    try {
      // This would typically fetch from your API
      // For now, showing mock data structure
      const mockJobDetails = {
        id: jobId,
        title: 'Sample Job',
        status: 'processing',
        progress: 75,
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        logs: ['Started processing...', 'Extracting content...', 'Converting format...']
      };

      // Render job details
      this.renderJobDetails(mockJobDetails);

      // Update ARIA attributes
      domUtils.setAttribute(this.contentArea, 'aria-busy', 'false');

    } catch (error) {
      logger.error('Failed to load job details', { error });
      this.renderError('Failed to load job details');
    }
  }

  /**
   * Render job details in modal
   */
  private renderJobDetails(job: any): void {
    if (!this.contentArea) return;

    this.contentArea.innerHTML = `
      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-white/70 text-sm">Job ID</label>
            <p class="text-white font-mono">${job.id}</p>
          </div>
          <div>
            <label class="text-white/70 text-sm">Status</label>
            <p class="text-white capitalize">${job.status}</p>
          </div>
        </div>
        
        <div>
          <label class="text-white/70 text-sm">URL</label>
          <p class="text-white break-all">${job.source_url}</p>
        </div>
        
        <div>
          <label class="text-white/70 text-sm">Progress</label>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full" style="width: ${job.progress}%"></div>
          </div>
          <p class="text-white/70 text-sm mt-1">${job.progress}% complete</p>
        </div>
        
        <div>
          <label class="text-white/70 text-sm">Logs</label>
          <div class="bg-black/30 rounded p-3 max-h-40 overflow-y-auto">
            ${job.logs.map((log: string) => `<p class="text-green-400 text-sm font-mono">${log}</p>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render error state
   */
  private renderError(message: string): void {
    if (!this.contentArea) return;

    this.contentArea.innerHTML = `
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-red-900/30 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-red-400">${message}</p>
      </div>
    `;
  }
}

// =============================================================================
// INITIALIZE ON DOM READY (Astro Islands Pattern)
// =============================================================================

const modalManager = new ModalManager();
modalManager.initialize().catch(error => logger.error('Failed to initialize modal manager', { error }));