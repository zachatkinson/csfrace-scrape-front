// Pure JavaScript file for browser consumption
// Custom element definition for conversion-form

console.log('🎯 ConversionForm.js: Loading...');

class ConversionForm extends HTMLElement {
  constructor() {
    super();
    this.formManager = null;
    console.log('🎯 ConversionForm: Constructor called');
  }

  async connectedCallback() {
    console.log('🎯 ConversionForm: connectedCallback called');

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

      console.log('🎯 ConversionForm: About to create manager with:', { apiUrl, defaultMode });

      // Initialize form manager
      this.formManager = new ConversionFormManager({
        apiBaseUrl: apiUrl,
        container: this,
        defaultMode
      });

      // Initialize the form functionality
      this.formManager.init();

      // Set up job dashboard integration
      this.setupJobDashboardIntegration();

      console.log('🎯 ConversionForm: Initialization completed successfully');
    } catch (error) {
      console.error('🎯 ConversionForm: Failed to initialize:', error);
    }
  }

  disconnectedCallback() {
    // Cleanup when element is removed
    this.formManager = null;
  }

  /**
   * Set up integration with JobDashboard component
   */
  setupJobDashboardIntegration() {
    // Listen for job submissions and refresh the job dashboard
    window.addEventListener('conversionJobSubmitted', (event) => {
      const customEvent = event;
      console.log('Form submitted, refreshing job dashboard:', customEvent.detail);

      // Find JobDashboard component and refresh it
      const jobDashboard = document.querySelector('job-dashboard');
      if (jobDashboard && typeof jobDashboard.refresh === 'function') {
        // Small delay to allow the API call to process
        setTimeout(() => {
          jobDashboard.refresh(true);
        }, 1000);
      }
    });
  }


  // Public method for external control
  switchMode(mode) {
    this.formManager?.switchMode(mode);
  }

  // Public method to get current mode
  getCurrentMode() {
    return this.formManager?.getCurrentMode() || null;
  }
}

// Define the custom element
customElements.define('conversion-form', ConversionForm);

console.log('🎯 ConversionForm.js: Custom element defined');