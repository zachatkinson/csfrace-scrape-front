/**
 * Job Status Strategy Pattern
 * SOLID: Open/Closed Principle - New status types can be added without modifying existing code
 * SOLID: Strategy Pattern - Different behaviors for different job statuses
 */

import type { ReactNode } from 'react';
import type { JobStatus } from '../types/job.ts';

// =============================================================================
// JOB STATUS INTERFACES
// =============================================================================

export interface JobStatusDisplay {
  label: string;
  color: string;
  bgColor: string;
  icon: ReactNode;
}

export interface JobStatusBehavior {
  canCancel: boolean;
  canRetry: boolean;
  canDownload: boolean;
  canDelete: boolean;
  showProgress: boolean;
  isActive: boolean;
  priority: number; // For sorting/prioritization
  defaultProgress: number; // Default progress percentage
}

export interface JobStatusStats {
  category: 'pending' | 'processing' | 'completed' | 'error';
  isTerminal: boolean; // Whether this is a final state
  includeInActiveCount: boolean;
}

// =============================================================================
// JOB STATUS STRATEGY INTERFACE
// =============================================================================

export interface IJobStatusStrategy {
  readonly status: JobStatus;
  
  // Display properties
  getDisplay(): JobStatusDisplay;
  
  // Behavioral properties
  getBehavior(): JobStatusBehavior;
  
  // Statistics properties
  getStats(): JobStatusStats;
  
  // Actions
  getAvailableActions(): JobAction[];
  
  // Transitions - what statuses can this status transition to
  getAllowedTransitions(): JobStatus[];
}

export type JobAction = 'cancel' | 'retry' | 'download' | 'delete' | 'view';

// =============================================================================
// CONCRETE STATUS STRATEGIES
// =============================================================================

/**
 * Pending Job Status Strategy
 */
export class PendingStatusStrategy implements IJobStatusStrategy {
  readonly status: JobStatus = 'pending';
  
  getDisplay(): JobStatusDisplay {
    return {
      label: 'Queued',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };
  }
  
  getBehavior(): JobStatusBehavior {
    return {
      canCancel: true,
      canRetry: false,
      canDownload: false,
      canDelete: true,
      showProgress: false,
      isActive: false,
      priority: 1,
      defaultProgress: 0,
    };
  }
  
  getStats(): JobStatusStats {
    return {
      category: 'pending',
      isTerminal: false,
      includeInActiveCount: true,
    };
  }
  
  getAvailableActions(): JobAction[] {
    return ['cancel', 'delete'];
  }
  
  getAllowedTransitions(): JobStatus[] {
    return ['validating', 'cancelled', 'error'];
  }
}

/**
 * Validating Job Status Strategy
 */
export class ValidatingStatusStrategy implements IJobStatusStrategy {
  readonly status: JobStatus = 'validating';
  
  getDisplay(): JobStatusDisplay {
    return {
      label: 'Validating',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      icon: (
        <div className="animate-spin rounded-full w-4 h-4 border-2 border-blue-400/30 border-t-blue-400"></div>
      ),
    };
  }
  
  getBehavior(): JobStatusBehavior {
    return {
      canCancel: true,
      canRetry: false,
      canDownload: false,
      canDelete: false,
      showProgress: true,
      isActive: true,
      priority: 3,
      defaultProgress: 25,
    };
  }
  
  getStats(): JobStatusStats {
    return {
      category: 'processing',
      isTerminal: false,
      includeInActiveCount: true,
    };
  }
  
  getAvailableActions(): JobAction[] {
    return ['cancel'];
  }
  
  getAllowedTransitions(): JobStatus[] {
    return ['scraping', 'cancelled', 'error'];
  }
}

/**
 * Scraping Job Status Strategy
 */
export class ScrapingStatusStrategy implements IJobStatusStrategy {
  readonly status: JobStatus = 'scraping';
  
  getDisplay(): JobStatusDisplay {
    return {
      label: 'Converting',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      icon: (
        <div className="animate-spin rounded-full w-4 h-4 border-2 border-purple-400/30 border-t-purple-400"></div>
      ),
    };
  }
  
  getBehavior(): JobStatusBehavior {
    return {
      canCancel: true,
      canRetry: false,
      canDownload: false,
      canDelete: false,
      showProgress: true,
      isActive: true,
      priority: 4,
      defaultProgress: 75,
    };
  }
  
  getStats(): JobStatusStats {
    return {
      category: 'processing',
      isTerminal: false,
      includeInActiveCount: true,
    };
  }
  
  getAvailableActions(): JobAction[] {
    return ['cancel'];
  }
  
  getAllowedTransitions(): JobStatus[] {
    return ['completed', 'cancelled', 'error'];
  }
}

/**
 * Completed Job Status Strategy
 */
export class CompletedStatusStrategy implements IJobStatusStrategy {
  readonly status: JobStatus = 'completed';
  
  getDisplay(): JobStatusDisplay {
    return {
      label: 'Completed',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    };
  }
  
  getBehavior(): JobStatusBehavior {
    return {
      canCancel: false,
      canRetry: false,
      canDownload: true,
      canDelete: true,
      showProgress: false,
      isActive: false,
      priority: 5,
      defaultProgress: 100,
    };
  }
  
  getStats(): JobStatusStats {
    return {
      category: 'completed',
      isTerminal: true,
      includeInActiveCount: false,
    };
  }
  
  getAvailableActions(): JobAction[] {
    return ['download', 'delete', 'view'];
  }
  
  getAllowedTransitions(): JobStatus[] {
    return []; // Terminal state
  }
}

/**
 * Error Job Status Strategy
 */
export class ErrorStatusStrategy implements IJobStatusStrategy {
  readonly status: JobStatus = 'error';
  
  getDisplay(): JobStatusDisplay {
    return {
      label: 'Failed',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    };
  }
  
  getBehavior(): JobStatusBehavior {
    return {
      canCancel: false,
      canRetry: true,
      canDownload: false,
      canDelete: true,
      showProgress: false,
      isActive: false,
      priority: 2,
      defaultProgress: 0,
    };
  }
  
  getStats(): JobStatusStats {
    return {
      category: 'error',
      isTerminal: true,
      includeInActiveCount: false,
    };
  }
  
  getAvailableActions(): JobAction[] {
    return ['retry', 'delete'];
  }
  
  getAllowedTransitions(): JobStatus[] {
    return ['pending', 'validating']; // Can be retried
  }
}

/**
 * Cancelled Job Status Strategy
 */
export class CancelledStatusStrategy implements IJobStatusStrategy {
  readonly status: JobStatus = 'cancelled';
  
  getDisplay(): JobStatusDisplay {
    return {
      label: 'Cancelled',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
        </svg>
      ),
    };
  }
  
  getBehavior(): JobStatusBehavior {
    return {
      canCancel: false,
      canRetry: true,
      canDownload: false,
      canDelete: true,
      showProgress: false,
      isActive: false,
      priority: 1,
      defaultProgress: 0,
    };
  }
  
  getStats(): JobStatusStats {
    return {
      category: 'error',
      isTerminal: true,
      includeInActiveCount: false,
    };
  }
  
  getAvailableActions(): JobAction[] {
    return ['retry', 'delete'];
  }
  
  getAllowedTransitions(): JobStatus[] {
    return ['pending', 'validating']; // Can be retried
  }
}

// =============================================================================
// STATUS STRATEGY FACTORY
// =============================================================================

/**
 * Factory for creating job status strategies
 * SOLID: Factory Pattern - Centralized creation logic
 */
export class JobStatusStrategyFactory {
  private static readonly strategies = new Map<JobStatus, () => IJobStatusStrategy>([
    ['pending', () => new PendingStatusStrategy()],
    ['validating', () => new ValidatingStatusStrategy()],
    ['scraping', () => new ScrapingStatusStrategy()],
    ['completed', () => new CompletedStatusStrategy()],
    ['error', () => new ErrorStatusStrategy()],
    ['cancelled', () => new CancelledStatusStrategy()],
  ]);
  
  static create(status: JobStatus): IJobStatusStrategy {
    const strategyFactory = this.strategies.get(status);
    if (!strategyFactory) {
      throw new Error(`Unsupported job status: ${status}`);
    }
    return strategyFactory();
  }
  
  static getAllStatuses(): JobStatus[] {
    return Array.from(this.strategies.keys());
  }
  
  static isValidStatus(status: string): status is JobStatus {
    return this.strategies.has(status as JobStatus);
  }
}

// =============================================================================
// JOB STATUS MANAGER
// =============================================================================

/**
 * Manager for job status operations
 * SOLID: Single Responsibility - Manages status-related operations
 */
export class JobStatusManager {
  private static strategyCache = new Map<JobStatus, IJobStatusStrategy>();
  
  static getStrategy(status: JobStatus): IJobStatusStrategy {
    if (!this.strategyCache.has(status)) {
      this.strategyCache.set(status, JobStatusStrategyFactory.create(status));
    }
    const strategy = this.strategyCache.get(status);
    if (!strategy) {
      throw new Error(`Failed to create strategy for status: ${status}`);
    }
    return strategy;
  }
  
  static getDisplay(status: JobStatus): JobStatusDisplay {
    return this.getStrategy(status).getDisplay();
  }
  
  static getBehavior(status: JobStatus): JobStatusBehavior {
    return this.getStrategy(status).getBehavior();
  }
  
  static getStats(status: JobStatus): JobStatusStats {
    return this.getStrategy(status).getStats();
  }
  
  static getAvailableActions(status: JobStatus): JobAction[] {
    return this.getStrategy(status).getAvailableActions();
  }
  
  static canTransition(fromStatus: JobStatus, toStatus: JobStatus): boolean {
    const allowedTransitions = this.getStrategy(fromStatus).getAllowedTransitions();
    return allowedTransitions.includes(toStatus);
  }
  
  static isTerminal(status: JobStatus): boolean {
    return this.getStats(status).isTerminal;
  }
  
  static isActive(status: JobStatus): boolean {
    return this.getBehavior(status).isActive;
  }
  
  static shouldShowProgress(status: JobStatus): boolean {
    return this.getBehavior(status).showProgress;
  }
  
  static getStatusPriority(status: JobStatus): number {
    return this.getBehavior(status).priority;
  }
  
  static getDefaultProgress(status: JobStatus): number {
    return this.getBehavior(status).defaultProgress;
  }
  
  static categorizeStatuses(statuses: JobStatus[]): Record<string, number> {
    const categories = {
      pending: 0,
      processing: 0,
      completed: 0,
      error: 0,
    };
    
    statuses.forEach(status => {
      const stats = this.getStats(status);
      categories[stats.category]++;
    });
    
    return categories;
  }
}

export default {
  JobStatusStrategyFactory,
  JobStatusManager,
  PendingStatusStrategy,
  ValidatingStatusStrategy,
  ScrapingStatusStrategy,
  CompletedStatusStrategy,
  ErrorStatusStrategy,
  CancelledStatusStrategy,
};