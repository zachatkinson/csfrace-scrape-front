/**
 * Global Type Definitions - SOLID Architecture
 * Centralized type definitions following DRY and SOLID principles
 * Single source of truth for all shared types across the application
 */

// =============================================================================
// GLOBAL WINDOW INTERFACE EXTENSIONS (Interface Segregation Principle)
// =============================================================================

export interface IFilterPanelCoordinator {
  updateJobsData(jobs: IJobData[]): void;
  updateJobSelection(jobIds: string[]): void;
  reset(): void;
  getFilterCriteria(): object;
}

export interface IHealthCoordinator {
  updateHealthData(data: IHealthData): void;
  getHealthStatus(): IHealthStatus;
}

export interface IValidationCoordinator {
  validate(data: unknown): boolean;
  getValidationErrors(): string[];
}

declare global {
  interface Window {
    filterPanelCoordinator?: IFilterPanelCoordinator;
    healthCoordinator?: IHealthCoordinator;
    validationCoordinator?: IValidationCoordinator;
  }
}

// Type alias for extended window (for explicit typing)
export type IExtendedWindow = Window;

// =============================================================================
// API RESPONSE TYPES (Single Responsibility Principle)
// =============================================================================

export interface IApiJobData {
  id: string;
  status: string;
  title: string;
  source_url: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface IApiJobsResponse extends IApiResponse<{ jobs: IApiJobData[] }> {
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// =============================================================================
// EVENT SYSTEM TYPES (Open/Closed Principle)
// =============================================================================

export interface ICustomEventDetail<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
  source?: string;
}

export interface ICustomEventMap {
  'jobs-updated': ICustomEventDetail<IJobData[]>;
  'filter-changed': ICustomEventDetail<IFilterState>;
  'health-changed': ICustomEventDetail<IHealthData>;
  'validation-error': ICustomEventDetail<string[]>;
  'auth-success': ICustomEventDetail<IAuthUser>;
  'auth-error': ICustomEventDetail<IAuthError>;
}

// =============================================================================
// CORE DATA TYPES (Dependency Inversion Principle)
// =============================================================================

export interface IJobData {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'queued';
  title: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface IFilterState {
  status: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  searchTerm: string;
  sortBy: 'created' | 'updated' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface IHealthData {
  status: 'healthy' | 'warning' | 'error';
  services: Record<string, IServiceHealth>;
  metadata: {
    timestamp: number;
    version: string;
    environment: string;
  };
}

export interface IServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
  lastCheck: number;
}

export interface IHealthStatus {
  overall: 'healthy' | 'warning' | 'error';
  details: string;
  timestamp: number;
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface IAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
  tokens?: {
    access: string;
    refresh?: string;
    expires?: number;
  };
}

export interface IAuthError {
  code: string;
  message: string;
  details?: unknown;
}

// =============================================================================
// UTILITY TYPES (DRY Principle)
// =============================================================================

export type IEventHandler<T = unknown> = (event: CustomEvent<T>) => void;

export type IAsyncEventHandler<T = unknown> = (event: CustomEvent<T>) => Promise<void>;

export type IErrorHandler = (error: Error) => void;

export type IAsyncErrorHandler = (error: Error) => Promise<void>;

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error, ...args: unknown[]): void;
}

export interface IValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// COMPONENT PROP TYPES (Interface Segregation Principle)
// =============================================================================

export interface IBaseComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

export interface IIconProps extends IBaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  'aria-label'?: string;
}

export interface IButtonProps extends IBaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface IModalProps extends IBaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface IFormFieldProps extends IBaseComponentProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
}

export interface IFormState<T = Record<string, unknown>> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// =============================================================================
// TYPE GUARDS (Type Safety)
// =============================================================================

export function isIJobData(obj: unknown): obj is IJobData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'status' in obj &&
    'title' in obj &&
    'url' in obj
  );
}

export function isIApiJobsResponse(obj: unknown): obj is IApiJobsResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as IApiResponse).success === 'boolean'
  );
}

export function isIHealthData(obj: unknown): obj is IHealthData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'status' in obj &&
    'services' in obj &&
    'metadata' in obj
  );
}