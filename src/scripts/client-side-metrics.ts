// =============================================================================
// CLIENT-SIDE METRICS COLLECTION - DRY/SOLID
// =============================================================================
// Single Responsibility: Update frontend metrics after page load
// Runs only on client-side to collect browser-specific data
// =============================================================================

import { PerformanceMetrics, FrameworkDetector, EnvironmentDetector } from '../utils/serviceCheckers.js';

interface ClientMetrics {
  memory: string;
  bundleSize: string;
  pageLoadTime: number;
  framework: string;
  features: Record<string, boolean>;
}

class ClientSideMetricsUpdater {
  private static instance: ClientSideMetricsUpdater;
  
  static getInstance(): ClientSideMetricsUpdater {
    if (!ClientSideMetricsUpdater.instance) {
      ClientSideMetricsUpdater.instance = new ClientSideMetricsUpdater();
    }
    return ClientSideMetricsUpdater.instance;
  }

  async updateFrontendMetrics(): Promise<void> {
    // Wait for page to fully load before collecting metrics
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(void 0);
        } else {
          window.addEventListener('load', () => resolve(void 0), { once: true });
        }
      });
    }

    // Additional delay to ensure all resources are loaded
    await new Promise(resolve => setTimeout(resolve, 1000));

    const metrics: ClientMetrics = {
      memory: PerformanceMetrics.getMemoryUsage(),
      bundleSize: PerformanceMetrics.getBundleSize(),
      pageLoadTime: PerformanceMetrics.getPageLoadTime(),
      framework: FrameworkDetector.getFrameworkInfo(),
      features: FrameworkDetector.getFeatureDetection()
    };

    this.updateHealthCardMetrics(metrics);
  }

  private updateHealthCardMetrics(metrics: ClientMetrics): void {
    // Update memory usage (specific ID from test-health page)
    const memoryElement = document.getElementById('frontend-memory');
    if (memoryElement) {
      memoryElement.textContent = metrics.memory;
    }

    // Update bundle size (specific ID from test-health page)
    const bundleElement = document.getElementById('frontend-bundle-size');
    if (bundleElement) {
      bundleElement.textContent = metrics.bundleSize;
    }

    // Update page load time (specific ID from test-health page)
    const loadTimeElement = document.getElementById('frontend-load-time');
    if (loadTimeElement && metrics.pageLoadTime > 0) {
      loadTimeElement.textContent = `${metrics.pageLoadTime}ms`;
    }

    // Update framework info (specific ID from test-health page)
    const frameworkElement = document.getElementById('frontend-framework');
    if (frameworkElement && metrics.framework !== 'Astro (Server-side)') {
      frameworkElement.textContent = metrics.framework;
    }

    // Update port (specific ID from test-health page)
    const portElement = document.getElementById('frontend-port');
    if (portElement) {
      const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      portElement.textContent = currentPort;
    }

    // Fix environment styling to match other blue values
    const envElement = document.getElementById('frontend-env');
    if (envElement) {
      // Change from 'text-white' to 'text-blue-400' to match other values
      envElement.className = 'ml-2 text-blue-400';
    }

    // Update feature status dynamically
    this.updateFeatureStatus(metrics.features);
  }

  private updateFeatureStatus(features: Record<string, boolean>): void {
    // Debug logging to see what features are detected
    console.log('🔍 Feature Detection Results:', features);
    
    // Map features to their corresponding elements
    const featureMap = {
      reactComponents: 'frontend-feature-react',
      typescriptSupport: 'frontend-feature-typescript', 
      tailwindCSS: 'frontend-feature-tailwind',
      hotModuleReload: 'frontend-feature-hmr'
    };

    // Update each feature with dynamic detection
    Object.entries(featureMap).forEach(([featureKey, elementId]) => {
      const element = document.getElementById(elementId);
      if (element) {
        const isEnabled = features[featureKey] || false;
        const status = isEnabled ? '✅' : '❌';
        const featureName = this.getFeatureName(featureKey);
        element.textContent = `${status} ${featureName}`;
        
        // Add dynamic styling based on status
        element.className = isEnabled ? 'text-green-400' : 'text-red-400';
        
        console.log(`📊 ${featureName}: ${isEnabled ? 'DETECTED' : 'NOT DETECTED'}`);
      }
    });
  }

  private getFeatureName(featureKey: string): string {
    const featureNames = {
      reactComponents: 'React Components',
      typescriptSupport: 'TypeScript Support',
      tailwindCSS: 'Tailwind CSS', 
      hotModuleReload: 'Hot Module Reload'
    };
    
    return featureNames[featureKey as keyof typeof featureNames] || featureKey;
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  const updater = ClientSideMetricsUpdater.getInstance();
  
  // Debug info
  console.log('🔧 Client-side metrics script loaded');
  
  // Update metrics after page load
  if (document.readyState === 'complete') {
    console.log('📊 Document ready - updating metrics immediately');
    updater.updateFrontendMetrics();
  } else {
    console.log('⏳ Waiting for page load');
    window.addEventListener('load', () => {
      console.log('📊 Page loaded - updating metrics now');
      updater.updateFrontendMetrics();
    });
  }
  
  // Also try after DOMContentLoaded for faster execution
  if (document.readyState !== 'loading') {
    // DOM is already loaded, run immediately
    setTimeout(() => {
      console.log('🚀 DOM ready - updating metrics via timeout');
      updater.updateFrontendMetrics();
    }, 1000);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        console.log('🚀 DOM loaded - updating metrics via timeout');
        updater.updateFrontendMetrics();
      }, 1000);
    });
  }
}

export default ClientSideMetricsUpdater;