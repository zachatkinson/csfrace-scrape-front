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

      // Set up dynamic greeting functionality
      this.setupGreeting();

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

  /**
   * Set up dynamic greeting functionality
   * Following DRY principle - moved from index.astro but kept minimal here
   * TODO: Could be extracted to a separate GreetingManager if it grows
   */
  setupGreeting() {
    const getTimezoneFromSettings = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('csfrace-settings') || '{}');
        return settings.timezone || 'auto';
      } catch {
        return 'auto';
      }
    };

    const getUserTimezone = () => {
      const settingsTimezone = getTimezoneFromSettings();
      if (settingsTimezone === 'auto') {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
      return settingsTimezone;
    };

    const getTimeInTimezone = (timezone) => {
      const now = new Date();
      if (timezone === 'auto') {
        return now;
      }

      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        const parts = formatter.formatToParts(now);
        const dateStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;

        return new Date(dateStr);
      } catch (error) {
        console.warn('Failed to get time in timezone:', timezone, error);
        return now;
      }
    };

    const updateGreeting = () => {
      const userTimezone = getUserTimezone();
      const now = getTimeInTimezone(userTimezone);
      const hour = now.getHours();

      // Simple greeting based on time of day
      let greeting = "What are we working on today?";

      if (hour >= 5 && hour < 12) {
        greeting = "Good morning! Ready to convert some content?";
      } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon! Let's transform some WordPress sites!";
      } else if (hour >= 17 && hour < 21) {
        greeting = "Good evening! Time for some conversion magic?";
      } else {
        greeting = "Working late? Let's make it count with some conversions!";
      }

      const greetingElement = this.querySelector('#greeting');
      if (greetingElement) {
        greetingElement.textContent = greeting;
      }
    };

    // Initialize greeting once
    updateGreeting();
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