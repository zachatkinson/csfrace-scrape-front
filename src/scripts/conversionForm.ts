/**
 * ConversionForm Custom Element - TypeScript Implementation
 * Single Responsibility: Handle conversion form custom element registration and lifecycle
 * SOLID: Single responsibility for custom element management
 * DRY: Centralized form element management
 */

import type { ConversionFormManager } from './conversionFormManager';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger('ConversionFormModule');

// Define interfaces for type safety
interface ConversionFormElement extends HTMLElement {
  formManager: ConversionFormManager | null;
  dataset: {
    apiUrl?: string;
    defaultMode?: string;
  };
}

interface ConversionJobEvent extends CustomEvent {
  detail: {
    jobId?: string;
    urls?: string[];
    mode?: string;
  };
}

interface JobDashboardElement extends HTMLElement {
  refresh?: (force?: boolean) => void;
}

/**
 * ConversionForm Custom Element Class
 * Follows Web Components best practices with TypeScript
 */
class ConversionForm extends HTMLElement implements ConversionFormElement {
  public formManager: ConversionFormManager | null = null;
  private readonly logger = createContextLogger('ConversionForm');

  constructor() {
    super();
    this.logger.info('Constructor called');
  }

  async connectedCallback(): Promise<void> {
    this.logger.info('connectedCallback called');

    try {
      // Dynamic imports to load the compiled TypeScript modules
      const [managerModule, apiModule] = await Promise.all([
        import('./conversionFormManager'),
        import('../constants/api')
      ]);

      const { ConversionFormManager } = managerModule;
      const { getApiBaseUrl } = apiModule;

      // Read configuration from data attributes (Astro best practice)
      const apiUrl = this.dataset.apiUrl || getApiBaseUrl();
      const defaultMode = this.dataset.defaultMode || 'bulk';

      this.logger.info('About to create manager', { apiUrl, defaultMode });

      // Initialize form manager with proper types
      this.formManager = new ConversionFormManager({
        apiBaseUrl: apiUrl,
        container: this,
        defaultMode: defaultMode as 'bulk' | 'single'
      });

      // Initialize the form functionality
      this.formManager.init();

      // Set up job dashboard integration
      this.setupJobDashboardIntegration();

      this.logger.info('Initialization completed successfully');
    } catch (error) {
      this.logger.error('Failed to initialize', error);
      // Follow SOLID principle: handle errors gracefully
      this.handleInitializationError(error);
    }
  }

  disconnectedCallback(): void {
    // Cleanup when element is removed - prevent memory leaks
    this.logger.info('disconnectedCallback called');
    this.cleanup();
  }

  /**
   * Set up integration with JobDashboard component
   * SOLID: Single responsibility for dashboard integration
   */
  private setupJobDashboardIntegration(): void {
    // Listen for job submissions and refresh the job dashboard
    window.addEventListener('conversionJobSubmitted', this.handleJobSubmission.bind(this));
  }

  /**
   * Handle job submission events with proper typing
   */
  private handleJobSubmission(event: Event): void {
    const customEvent = event as ConversionJobEvent;
    this.logger.info('Form submitted, refreshing job dashboard', customEvent.detail);

    // Find JobDashboard component and refresh it
    const jobDashboard = document.querySelector('job-dashboard') as JobDashboardElement;
    if (jobDashboard && typeof jobDashboard.refresh === 'function') {
      // Small delay to allow the API call to process
      setTimeout(() => {
        if (jobDashboard.refresh) {
          jobDashboard.refresh(true);
        }
      }, 1000);
    }
  }

  /**
   * Handle initialization errors gracefully
   */
  private handleInitializationError(error: unknown): void {
    // Display user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
    console.error('ConversionForm initialization failed:', errorMessage);

    // Could implement user notification here if needed
    // For now, just log for debugging
  }

  /**
   * Cleanup resources to prevent memory leaks
   */
  private cleanup(): void {
    if (this.formManager) {
      // If formManager has cleanup methods, call them
      const managerWithDestroy = this.formManager as ConversionFormManager & { destroy?: () => void };
      if (typeof managerWithDestroy.destroy === 'function') {
        managerWithDestroy.destroy();
      }
      this.formManager = null;
    }

    // Remove event listeners
    window.removeEventListener('conversionJobSubmitted', this.handleJobSubmission.bind(this));
  }

  // Public API methods with proper types

  /**
   * Switch form mode programmatically
   */
  public switchMode(mode: string): void {
    this.formManager?.switchMode(mode as 'bulk' | 'single');
  }

  /**
   * Get current form mode
   */
  public getCurrentMode(): string | null {
    return this.formManager?.getCurrentMode() || null;
  }

  /**
   * Check if form is ready
   */
  public isReady(): boolean {
    return this.formManager !== null;
  }
}

// Define the custom element
if (!customElements.get('conversion-form')) {
  customElements.define('conversion-form', ConversionForm);
  logger.info('Custom element defined');
} else {
  logger.info('Custom element already defined');
}

// Export for testing purposes
export { ConversionForm };
export type { ConversionFormElement, ConversionJobEvent, JobDashboardElement };