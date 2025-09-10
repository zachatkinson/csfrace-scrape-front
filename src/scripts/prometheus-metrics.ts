// =============================================================================
// PROMETHEUS METRICS SERVICE METRICS - DRY/SOLID IMPLEMENTATION  
// =============================================================================
// Single Responsibility: Update Prometheus metrics service after health check
// Following same efficient pattern as other services
// =============================================================================

import { PrometheusServiceChecker } from '../utils/serviceCheckers.js';

interface PrometheusMetrics {
  version: string;
  targets: number;
  activeTargets: number;
  failedTargets: number;
  tsdbSize: string;
  samples: string;
  uptime: string;
  queryEngine: string;
  scrapeInterval: string;
}

class PrometheusMetricsUpdater {
  private static instance: PrometheusMetricsUpdater;
  
  static getInstance(): PrometheusMetricsUpdater {
    if (!PrometheusMetricsUpdater.instance) {
      PrometheusMetricsUpdater.instance = new PrometheusMetricsUpdater();
    }
    return PrometheusMetricsUpdater.instance;
  }

  async updatePrometheusMetrics(): Promise<void> {
    console.log('📊 Updating Prometheus metrics service...');
    
    try {
      // Get health data from Prometheus
      const healthResult = await PrometheusServiceChecker.checkHealth();
      
      // Prepare metrics using build-time efficiency for static data
      const metrics: PrometheusMetrics = {
        version: healthResult.metrics.version || 'Prometheus v2.45.0',
        targets: healthResult.metrics.targets || 0,
        activeTargets: healthResult.metrics.active || 0,
        failedTargets: healthResult.metrics.failed || 0,
        tsdbSize: healthResult.metrics.tsdb_size || 'Unknown',
        samples: healthResult.metrics.samples || 'Unknown',
        uptime: healthResult.metrics.uptime || 'Unknown',
        queryEngine: healthResult.metrics.query_engine || 'PromQL',
        scrapeInterval: healthResult.metrics.scrape_interval || '15s'
      };

      // Update service info using DRY utilities
      this.updateMetricsInfo(metrics);
      
      // Update scrape targets
      this.updateScrapeTargets(metrics);
      
      // Update storage information
      this.updateStorageInfo(metrics);
      
      // Update overall service status
      this.updateServiceStatus(healthResult.status, healthResult.message);
      
      console.log('✅ Prometheus metrics updated successfully', metrics);
      
    } catch (error) {
      console.error('❌ Failed to update Prometheus metrics:', error);
      this.updateServiceStatus('error', 'Failed to fetch metrics service data');
    }
  }

  // SOLID: Single Responsibility - Metrics info updates (direct DOM like other services)
  private updateMetricsInfo(metrics: PrometheusMetrics): void {
    // Update version (make it dynamic instead of hardcoded)
    const versionElement = document.querySelector('[data-prometheus-version]') as HTMLElement;
    if (versionElement) {
      versionElement.textContent = metrics.version;
    }

    // Update uptime if element exists
    const uptimeElement = document.getElementById('prometheus-uptime');
    if (uptimeElement) {
      uptimeElement.textContent = metrics.uptime;
    }

    // Update query engine if element exists
    const queryEngineElement = document.getElementById('prometheus-query-engine');
    if (queryEngineElement) {
      queryEngineElement.textContent = metrics.queryEngine;
    }

    // Update scrape interval if element exists
    const scrapeIntervalElement = document.getElementById('prometheus-scrape-interval');
    if (scrapeIntervalElement) {
      scrapeIntervalElement.textContent = metrics.scrapeInterval;
    }
  }

  // SOLID: Single Responsibility - Scrape targets updates
  private updateScrapeTargets(metrics: PrometheusMetrics): void {
    // Update total targets
    const targetsElement = document.getElementById('prometheus-targets');
    if (targetsElement) {
      targetsElement.textContent = String(metrics.targets);
    }

    // Update active targets
    const activeElement = document.getElementById('prometheus-active');
    if (activeElement) {
      activeElement.textContent = String(metrics.activeTargets);
    }

    // Update failed targets
    const failedElement = document.getElementById('prometheus-failed');
    if (failedElement) {
      failedElement.textContent = String(metrics.failedTargets);
    }
  }

  // SOLID: Single Responsibility - Storage information updates
  private updateStorageInfo(metrics: PrometheusMetrics): void {
    // Update TSDB size
    const tsdbSizeElement = document.getElementById('prometheus-tsdb-size');
    if (tsdbSizeElement) {
      tsdbSizeElement.textContent = metrics.tsdbSize;
    }

    // Update samples count
    const samplesElement = document.getElementById('prometheus-samples');
    if (samplesElement) {
      samplesElement.textContent = metrics.samples;
    }
  }

  // SOLID: Single Responsibility - Service status updates (direct DOM like other services)
  private updateServiceStatus(status: string, message: string): void {
    const statusIndicator = document.getElementById('prometheus-status-indicator');
    if (statusIndicator) {
      const { color } = this.getStatusStyling(status);
      statusIndicator.className = `w-3 h-3 rounded-full ${color}`;
    }
    
    const statusText = document.getElementById('prometheus-status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // DRY: Status styling mapping (same as other services)
  private getStatusStyling(status: string): { color: string; className: string } {
    switch (status) {
      case 'up':
      case 'healthy':
        return { color: 'bg-green-500', className: 'text-green-400' };
      case 'degraded':
        return { color: 'bg-yellow-500', className: 'text-yellow-400' };
      case 'down':
      case 'error':
        return { color: 'bg-red-500', className: 'text-red-400' };
      default:
        return { color: 'bg-gray-500 animate-pulse', className: 'text-gray-400' };
    }
  }

  // Handle hardcoded Prometheus info in HTML
  private updateHardcodedElements(): void {
    // Check if version is hardcoded and update
    const hardcodedVersion = document.querySelector('[data-hardcoded="prometheus-version"]');
    if (hardcodedVersion) {
      // Will be updated by updateMetricsInfo method with dynamic value
    }
  }
}

// Auto-initialize when script loads (following same pattern as other services)
if (typeof window !== 'undefined') {
  const updater = PrometheusMetricsUpdater.getInstance();
  
  console.log('📊 Prometheus metrics script loaded');
  
  // Initial update after page load
  if (document.readyState === 'complete') {
    console.log('📊 Document ready - updating Prometheus metrics immediately');
    updater.updatePrometheusMetrics();
  } else {
    console.log('⏳ Waiting for page load');
    window.addEventListener('load', () => {
      console.log('📊 Page loaded - updating Prometheus metrics now');
      updater.updatePrometheusMetrics();
    });
  }
  
  // Set up periodic updates (every 30 seconds for dynamic data)
  setInterval(() => {
    console.log('🔄 Periodic Prometheus metrics update');
    updater.updatePrometheusMetrics();
  }, 30000);
}

export default PrometheusMetricsUpdater;