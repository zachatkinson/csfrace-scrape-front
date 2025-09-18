/**
 * Health UI Utilities - Single Responsibility Principle
 * Handles all UI updates and DOM manipulation for health dashboard
 */

import type { ServiceStatus } from '../types/health';

export class HealthUIHelper {
  static createGlassButton(type: 'copy' | 'clear', id: string, title: string) {
    const button = document.createElement('button');
    button.id = id;
    button.title = title;
    button.className = 'glass-button px-3 py-1 text-xs text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded transition-all duration-200';

    const icon = type === 'copy'
      ? '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>'
      : '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';

    button.innerHTML = icon;
    return button;
  }

  static updateElement(elementId: string, content: string, className?: string) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = content;
      if (className) {
        element.className = className;
      }
    }
  }

  static updateTextElement(elementId: string, text: string, status?: ServiceStatus) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
      if (status) {
        element.className = this.getStatusClasses(status);
      }
    }
  }

  static updateStatusIndicator(elementId: string, status: ServiceStatus) {
    const indicator = document.getElementById(elementId);
    if (indicator) {
      // Check if this is the BaseHealthCard structure (single element with status-circle class)
      if (indicator.classList.contains('status-circle')) {
        // Remove all existing status classes
        indicator.classList.remove('status-up', 'status-degraded', 'status-down', 'status-error', 'status-unknown');
        // Add the new status class
        indicator.classList.add(`status-${status}`);
      } else {
        // Legacy structure with nested elements
        const circle = indicator.querySelector('.status-circle');
        const text = indicator.querySelector('.status-text');

        if (circle && text) {
          circle.className = `status-circle ${this.getStatusColor(status)}`;
          text.textContent = status.toUpperCase();
        }
      }
    }
  }

  static updateLastRefresh(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      element.textContent = `Last updated: ${timeString}`;
    }
  }

  static getLatencyStatus(latencyMs: number, type: 'API' | 'DATABASE' | 'CACHE') {
    const thresholds = {
      API: { good: 100, warning: 500 },
      DATABASE: { good: 50, warning: 200 },
      CACHE: { good: 10, warning: 50 }
    };

    const threshold = thresholds[type];
    if (latencyMs <= threshold.good) return 'up';
    if (latencyMs <= threshold.warning) return 'degraded';
    return 'down';
  }

  static updateLatencyElement(elementId: string, latencyText: string, latencyMs: number, type: 'API' | 'DATABASE' | 'CACHE') {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = latencyText;
      const status = this.getLatencyStatus(latencyMs, type);
      element.className = `font-mono text-sm ${this.getStatusColor(status)}`;
    }
  }

  static updateAllLatencyFromHealthData(healthData: Record<string, unknown>, apiLatency: number) {
    this.updateLatencyElement('api-latency', `${apiLatency}ms`, apiLatency, 'API');

    const services = healthData?.services as Record<string, unknown> | undefined;

    if (services?.database && typeof services.database === 'object') {
      const database = services.database as Record<string, unknown>;
      const dbLatency = database.response_time;
      if (typeof dbLatency === 'number') {
        this.updateLatencyElement('database-latency', `${dbLatency}ms`, dbLatency, 'DATABASE');
      }
    }

    if (services?.cache && typeof services.cache === 'object') {
      const cache = services.cache as Record<string, unknown>;
      const cacheLatency = cache.response_time;
      if (typeof cacheLatency === 'number') {
        this.updateLatencyElement('cache-latency', `${cacheLatency}ms`, cacheLatency, 'CACHE');
      }
    }
  }

  private static getStatusColor(status: ServiceStatus): string {
    switch (status) {
      case 'up': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'down': case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  private static getStatusClasses(status: ServiceStatus): string {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'up': return `${baseClasses} bg-green-500/20 text-green-400`;
      case 'degraded': return `${baseClasses} bg-yellow-500/20 text-yellow-400`;
      case 'down': case 'error': return `${baseClasses} bg-red-500/20 text-red-400`;
      default: return `${baseClasses} bg-gray-500/20 text-gray-400`;
    }
  }
}