/**
 * Dashboard TypeScript Interfaces
 * Following SOLID principles with strict typing for dashboard architecture
 */

// =============================================================================
// CORE DASHBOARD TYPES
// =============================================================================

export interface IDashboardConfig {
  readonly defaultFilter: string;
  readonly defaultSort: string;
  readonly defaultPageSize: number;
  readonly refreshInterval: number;
}

export interface IDashboardStats {
  readonly total: number;
  readonly active: number;
  readonly completed: number;
  readonly failed: number;
  readonly queued: number;
  readonly processing: number;
}

export interface IDashboardState {
  stats: IDashboardStats;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  isLoading: boolean;
  lastUpdated: Date;
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

export interface IDashboardPageProps {
  initialStats?: IDashboardStats | undefined;
  config?: Partial<IDashboardConfig> | undefined;
}

export interface IDashboardHeaderProps {
  stats: IDashboardStats;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastUpdated?: Date | undefined;
}

export interface IJobModalProps {
  isOpen: boolean;
  jobId?: string | undefined;
  onClose: () => void;
}

// =============================================================================
// EVENT INTERFACES
// =============================================================================

export interface IDashboardDataUpdateEvent {
  jobs: readonly IJobData[];
  stats: IDashboardStats;
  timestamp: number;
}

export interface IConnectionStatusEvent {
  status: 'connected' | 'disconnected' | 'reconnecting';
  timestamp: number;
}

// =============================================================================
// UTILITY INTERFACES
// =============================================================================

// Import centralized job type following DRY principle
import type { IJobData } from '../../../types/job.ts';

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

export const DASHBOARD_CONFIG: IDashboardConfig = {
  defaultFilter: 'all',
  defaultSort: 'newest',
  defaultPageSize: 20,
  refreshInterval: 5000
} as const;

export const AVAILABLE_STATUSES = [
  'all', 
  'processing', 
  'completed', 
  'failed', 
  'queued'
] as const;

// =============================================================================
// CSS CLASSES CONSTANTS (DRY Principle)
// =============================================================================

export const DASHBOARD_CSS_CLASSES = {
  HEADER_CONTAINER: 'glass-card p-6',
  NAV_BUTTON: 'glass-button px-3 py-2 text-white/90 hover:text-white flex items-center space-x-2 transition-all duration-200',
  STATUS_INDICATOR: 'w-3 h-3 rounded-full animate-pulse',
  STATUS_CONNECTED: 'bg-green-400',
  STATUS_DISCONNECTED: 'bg-red-400',
  STATUS_RECONNECTING: 'bg-yellow-400',
  MODAL_OVERLAY: 'fixed inset-0 backdrop-blur-sm z-50',
  MODAL_CONTAINER: 'flex items-center justify-center min-h-screen p-4',
  MODAL_CONTENT: 'glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto',
  LOADING_SPINNER: 'animate-spin rounded-full w-12 h-12 border-4 border-blue-400/30 border-t-blue-400',
  STATS_VALUE: 'text-white font-semibold',
  STATS_LABEL: 'text-white/70 text-sm'
} as const;