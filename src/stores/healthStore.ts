/**
 * Centralized Health Data Store
 * Following Astro MCP best practices with Nano Stores
 * Replaces window globals with proper state management
 *
 * Features:
 * - Type-safe health data management
 * - Persistent state across page navigations
 * - Single source of truth for all health data
 * - Framework-agnostic (works with Astro, React, vanilla JS)
 */

import { atom, map, computed } from 'nanostores';
import type { IServiceResult } from '../utils/serviceCheckers.ts';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface IHealthServiceStatuses {
  frontend: IServiceResult | null;
  backend: IServiceResult | null;
  database: IServiceResult | null;
  cache: IServiceResult | null;
}

export interface IHealthMetadata {
  timestamp: number;
  isPolling: boolean;
  isVisible: boolean;
  lastUpdateFormatted: string;
}

export interface IOverallStatus {
  status: 'up' | 'degraded' | 'down' | 'unknown';
  text: string;
  summary: string;
  color: string;
}

export interface IConsolidatedHealthData {
  services: IHealthServiceStatuses;
  overallStatus: IOverallStatus;
  metadata: IHealthMetadata;
}

// =============================================================================
// NANO STORES - SINGLE SOURCE OF TRUTH
// =============================================================================

/**
 * Core health data store
 * Contains all service statuses and metadata
 */
export const $healthData = map<IConsolidatedHealthData>({
  services: {
    frontend: null,
    backend: null,
    database: null,
    cache: null,
  },
  overallStatus: {
    status: 'unknown',
    text: 'Loading System Status',
    summary: 'Initializing health monitoring...',
    color: 'bg-gray-500'
  },
  metadata: {
    timestamp: 0,
    isPolling: false,
    isVisible: true,
    lastUpdateFormatted: 'Never'
  }
});

/**
 * Tracking store for initialization state
 * Prevents duplicate polling setup
 */
export const $healthInitialized = atom<boolean>(false);

/**
 * Last health timestamp store
 * Used for "Last Updated: Never" vs actual timestamps
 */
export const $lastHealthTimestamp = atom<Date | null>(null);

// =============================================================================
// COMPUTED STORES
// =============================================================================

/**
 * Computed store for service count metrics
 * Automatically recalculates when health data changes
 */
export const $serviceMetrics = computed($healthData, (healthData) => {
  const serviceList = ['frontend', 'backend', 'database', 'cache'] as const;
  const services = healthData.services;

  const loadedServices = serviceList.filter(service =>
    services[service] && services[service]?.status
  );
  const upServices = serviceList.filter(service =>
    services[service] && services[service]?.status === 'up'
  );

  return {
    total: serviceList.length,
    loaded: loadedServices.length,
    up: upServices.length,
    hasAnyData: loadedServices.length > 0
  };
});

/**
 * Computed store for overall status based on service metrics
 * Automatically updates when service data changes
 */
export const $computedOverallStatus = computed(
  [$healthData, $serviceMetrics],
  (_healthData: any, metrics: any) => {
    if (metrics.loaded === 0) {
      // No data loaded yet - loading state
      return {
        status: 'unknown' as const,
        text: 'Loading System Status',
        summary: 'Initializing health monitoring...',
        color: 'bg-blue-500'
      };
    } else if (metrics.up === metrics.total) {
      // All services operational
      return {
        status: 'up' as const,
        text: '✅ All Services Operational',
        summary: `${metrics.up} of ${metrics.total} services operational`,
        color: 'bg-green-500'
      };
    } else {
      // Some services have issues
      return {
        status: 'degraded' as const,
        text: '⚠️ Service Issues, Please Review Details',
        summary: `${metrics.up} of ${metrics.total} services operational`,
        color: 'bg-red-500'
      };
    }
  }
);

// =============================================================================
// STORE ACTIONS - SINGLE RESPONSIBILITY FUNCTIONS
// =============================================================================

/**
 * Update health data with new consolidated information
 * This is the primary action called by RealtimeHealthEnhancer
 */
export function updateHealthData(data: {
  services: IHealthServiceStatuses;
  overallStatus: IOverallStatus;
  metadata: IHealthMetadata;
}): void {
  console.log('🏪 HealthStore: Updating health data', data);

  // Update the main health data store
  $healthData.set(data);

  // Update the timestamp store if we have real service data
  const realServices = ['frontend', 'backend', 'database', 'cache'];
  const hasRealServiceData = Object.keys(data.services).some(service =>
    realServices.includes(service) && data.services[service as keyof IHealthServiceStatuses]
  );

  if (hasRealServiceData && data.metadata.timestamp > 0) {
    $lastHealthTimestamp.set(new Date(data.metadata.timestamp));
    console.log('🏪 HealthStore: Updated timestamp with real service data:', new Date(data.metadata.timestamp));
  } else {
    console.log('🏪 HealthStore: No real service data yet, keeping timestamp as null');
  }
}

/**
 * Update only the formatted timestamp (for timezone changes)
 * Does not trigger health data updates
 */
export function updateFormattedTimestamp(formatted: string): void {
  const currentData = $healthData.get();
  $healthData.setKey('metadata', {
    ...currentData.metadata,
    lastUpdateFormatted: formatted
  });
  console.log('🏪 HealthStore: Updated formatted timestamp only:', formatted);
}

/**
 * Mark health monitoring as initialized
 * Prevents duplicate polling setup
 */
export function markHealthInitialized(): void {
  $healthInitialized.set(true);
  console.log('🏪 HealthStore: Marked health monitoring as initialized');
}

/**
 * Reset health state (for testing or cleanup)
 */
export function resetHealthState(): void {
  $healthInitialized.set(false);
  $lastHealthTimestamp.set(null);
  $healthData.set({
    services: {
      frontend: null,
      backend: null,
      database: null,
      cache: null,
    },
    overallStatus: {
      status: 'unknown',
      text: 'Loading System Status',
      summary: 'Initializing health monitoring...',
      color: 'bg-gray-500'
    },
    metadata: {
      timestamp: 0,
      isPolling: false,
      isVisible: true,
      lastUpdateFormatted: 'Never'
    }
  });
  console.log('🏪 HealthStore: Reset health state to initial values');
}

// =============================================================================
// UTILITY FUNCTIONS FOR COMPONENTS
// =============================================================================

/**
 * Get current health data snapshot
 * Useful for immediate access without subscribing
 */
export function getCurrentHealthData(): IConsolidatedHealthData {
  return $healthData.get();
}

/**
 * Get current service metrics snapshot
 * Useful for immediate access without subscribing
 */
export function getCurrentServiceMetrics() {
  return $serviceMetrics.get();
}

/**
 * Check if health monitoring is initialized
 */
export function isHealthInitialized(): boolean {
  return $healthInitialized.get();
}

/**
 * Get last health timestamp
 */
export function getLastHealthTimestamp(): Date | null {
  return $lastHealthTimestamp.get();
}

// =============================================================================
// MIGRATION HELPERS
// =============================================================================

/**
 * Migrate from window globals to Nano Stores
 * This function helps transition existing code
 */
export function migrateFromWindowGlobals(): void {
  // Check for existing window global data
  const windowHealthData = (window as any).__latestConsolidatedHealthData;
  const windowHealthState = (window as any).__healthStatusState;

  if (windowHealthData) {
    console.log('🔄 HealthStore: Migrating from window global data');
    updateHealthData(windowHealthData);

    // Clean up window globals
    delete (window as any).__latestConsolidatedHealthData;
  }

  if (windowHealthState) {
    console.log('🔄 HealthStore: Migrating timestamp state from window globals');
    if (windowHealthState.lastHealthTimestamp) {
      $lastHealthTimestamp.set(new Date(windowHealthState.lastHealthTimestamp));
    }
    if (windowHealthState.isInitialized) {
      $healthInitialized.set(true);
    }

    // Clean up window globals
    delete (window as any).__healthStatusState;
  }
}

// =============================================================================
// ASTRO MCP COMPLIANCE NOTES
// =============================================================================

/**
 * This implementation follows Astro MCP best practices:
 *
 * ✅ Framework-agnostic: Works with Astro, React, vanilla JS
 * ✅ Type-safe: Full TypeScript support with strict typing
 * ✅ Single source of truth: All health data flows through these stores
 * ✅ Computed values: Automatic recalculation of derived state
 * ✅ Action-based updates: Clear separation of read/write operations
 * ✅ Persistence-friendly: State persists across page navigations
 * ✅ DRY compliance: No duplicate state management logic
 * ✅ SOLID principles: Single responsibility, open/closed design
 *
 * Benefits over window globals:
 * - Type safety and IntelliSense support
 * - Reactive updates with proper change detection
 * - Framework integration with @nanostores/react
 * - Better debugging and dev tools support
 * - Cleaner testing with predictable state management
 * - No memory leaks or global namespace pollution
 */