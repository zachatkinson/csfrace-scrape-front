/**
 * Form Interface Definitions
 * SOLID: Liskov Substitution Principle - Common interface for all forms
 * Ensures all form components are truly substitutable
 */

import type { ReactNode } from 'react';

// =============================================================================
// FORM STATE INTERFACES
// =============================================================================

/**
 * Base Form State
 * Common state that all forms should have
 */
export interface BaseFormState {
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
  globalError: string | null;
  submitCount: number;
}

/**
 * Form Validation Result
 * Standard validation response structure
 */
export interface FormValidationResult {
  isValid: boolean;
  fieldErrors: Record<string, string>;
  globalError?: string | undefined;
}

/**
 * Form Submission Result
 * Standard submission response structure
 */
export interface FormSubmissionResult<T = unknown> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
  fieldErrors?: Record<string, string> | undefined;
}

// =============================================================================
// FORM COMPONENT INTERFACES
// =============================================================================

// =============================================================================
// SEGREGATED FORM INTERFACES - Following Interface Segregation Principle
// =============================================================================

/**
 * Core Form Data Props
 * SOLID: ISP - Only data handling concerns
 */
export interface FormDataProps<TData = unknown> {
  onSubmit?: ((data: TData) => Promise<FormSubmissionResult> | FormSubmissionResult) | undefined;
}

/**
 * Form Event Handlers
 * SOLID: ISP - Only event handling concerns
 */
export interface FormEventProps<TData = unknown> {
  onSuccess?: ((data?: TData) => void) | undefined;
  onError?: ((error: string, fieldErrors?: Record<string, string>) => void) | undefined;
  onStateChange?: ((state: BaseFormState) => void) | undefined;
}

/**
 * Form Validation Props
 * SOLID: ISP - Only validation concerns
 */
export interface FormValidationProps {
  validateOnChange?: boolean | undefined;
  validateOnBlur?: boolean | undefined;
}

/**
 * Form UI Props
 * SOLID: ISP - Only UI/presentation concerns
 */
export interface FormUIProps {
  className?: string | undefined;
  title?: string | undefined;
  subtitle?: string | undefined;
  disabled?: boolean | undefined;
}

/**
 * Form State Props
 * SOLID: ISP - Only state management concerns
 */
export interface FormStateProps {
  isLoading?: boolean | undefined;
}

/**
 * Form Behavior Props
 * SOLID: ISP - Only behavior configuration concerns
 */
export interface FormBehaviorProps {
  autoFocus?: boolean | undefined;
  resetOnSuccess?: boolean | undefined;
}

/**
 * Complete Form Props
 * SOLID: ISP - Composed from segregated interfaces
 * Only use when you need ALL form capabilities
 */
export interface BaseFormProps<TData = unknown>
  extends FormDataProps<TData>,
          FormEventProps<TData>,
          FormValidationProps,
          FormUIProps,
          FormStateProps,
          FormBehaviorProps {}

/**
 * Form Component Interface
 * Contract that all form components must implement
 */
export interface IFormComponent<TData = unknown> {
  // Form state management
  getState(): BaseFormState;
  reset(): void;
  validate(): FormValidationResult;
  
  // Data management
  getData(): TData;
  setData(data: Partial<TData>): void;
  
  // Submission
  submit(): Promise<FormSubmissionResult<unknown>>;
  
  // Field operations
  setFieldError(field: string, error: string): void;
  clearFieldError(field: string): void;
  clearAllErrors(): void;
}

// =============================================================================
// FORM HOOK INTERFACES
// =============================================================================

/**
 * Form Hook Configuration
 */
export interface FormHookConfig<TData = unknown> {
  initialData?: Partial<TData> | undefined;
  validationSchema?: FormValidationSchema<TData> | undefined;
  onSubmit?: ((data: TData) => Promise<FormSubmissionResult> | FormSubmissionResult) | undefined;
  validateOnChange?: boolean | undefined;
  validateOnBlur?: boolean | undefined;
  resetOnSuccess?: boolean | undefined;
}

/**
 * Form Hook Return Type
 */
export interface FormHookReturn<TData = unknown> {
  // State
  state: BaseFormState;
  data: TData;
  
  // Actions
  actions: {
    setData: (data: Partial<TData>) => void;
    setFieldValue: (field: keyof TData, value: unknown) => void;
    setFieldError: (field: string, error: string) => void;
    clearFieldError: (field: string) => void;
    clearAllErrors: () => void;
    reset: () => void;
    submit: () => Promise<FormSubmissionResult>;
    validate: () => Promise<FormValidationResult>;
  };
  
  // Computed values
  computed: {
    canSubmit: boolean;
    hasErrors: boolean;
    isClean: boolean;
    changedFields: string[];
  };
  
  // Event handlers
  handlers: {
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleReset: (e: React.FormEvent) => void;
    handleFieldChange: (field: keyof TData) => (value: unknown) => void;
    handleFieldBlur: (field: keyof TData) => () => void;
  };
}

// =============================================================================
// VALIDATION INTERFACES
// =============================================================================

/**
 * Field Validation Rule
 */
export interface FieldValidationRule<T = unknown> {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: T;
  message: string;
  validator?: (value: unknown, data: Record<string, unknown>) => boolean | Promise<boolean>;
}

/**
 * Field Validation Schema
 */
export interface FieldValidationSchema {
  rules: FieldValidationRule[];
  validateOn?: 'change' | 'blur' | 'submit';
}

/**
 * Form Validation Schema
 */
export interface FormValidationSchema<TData = unknown> {
  fields: Record<keyof TData, FieldValidationSchema>;
  globalValidation?: (data: TData) => FormValidationResult | Promise<FormValidationResult>;
}

// =============================================================================
// SPECIFIC FORM DATA TYPES
// =============================================================================

/**
 * URL Form Data
 * For single and batch URL forms
 */
export interface UrlFormData {
  url?: string;
  urls?: string[];
  batchUrls?: string;
  file?: File | null;
  options?: {
    preserveFormatting?: boolean;
    convertImages?: boolean;
    optimizeImages?: boolean;
    downloadImages?: boolean;
    generateSeoTitle?: boolean;
    generateSeoDescription?: boolean;
    removeWordPressSpecific?: boolean;
    addShopifySpecific?: boolean;
  };
}

/**
 * Auth Form Data
 * For login/register forms
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  termsAccepted: boolean;
}

/**
 * Profile Form Data
 * For user profile forms
 */
export interface ProfileFormData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

/**
 * App Settings Form Data
 * For application preferences
 */
export interface AppSettings {
  // Job Defaults
  defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
  maxRetries: number;
  jobTimeout: number;
  
  // Display Options  
  darkMode: boolean;
  showJobIds: boolean;
  compactMode: boolean;
  jobsPerPage: number;
  timezone: string;
  
  // Notifications
  completionAlerts: boolean;
  errorNotifications: boolean;
  browserNotifications: boolean;
}

/**
 * API Configuration Form Data
 * For backend connection settings
 */
export interface ApiConfigSettings {
  apiUrl: string;
  apiTimeout: number;
  refreshInterval: number;
  retryAttempts: number;
  enableCaching: boolean;
}

// =============================================================================
// FORM COMPONENT TYPES
// =============================================================================

/**
 * Form Component Props with Generic Data Type
 */
export interface FormComponentProps<TData = unknown> extends BaseFormProps<TData> {
  initialData?: Partial<TData> | undefined;
  validationSchema?: FormValidationSchema<TData> | undefined;
  children?: ReactNode | ((formHook: FormHookReturn<TData>) => ReactNode) | undefined;
}

/**
 * Standard Form Component Type
 * All form components should implement this signature
 */
export type StandardFormComponent<TData = unknown> = React.FC<FormComponentProps<TData> & {
  // Component-specific props can be added here
  [key: string]: unknown;
}>;

// =============================================================================
// FORM EVENTS
// =============================================================================

/**
 * Form Events
 * Standard events that forms can emit
 */
export enum FormEventType {
  SUBMIT_START = 'form:submit:start',
  SUBMIT_SUCCESS = 'form:submit:success',
  SUBMIT_ERROR = 'form:submit:error',
  VALIDATION_START = 'form:validation:start',
  VALIDATION_COMPLETE = 'form:validation:complete',
  FIELD_CHANGE = 'form:field:change',
  FIELD_ERROR = 'form:field:error',
  RESET = 'form:reset',
  STATE_CHANGE = 'form:state:change',
}

export interface FormEvent<TData = unknown> {
  type: FormEventType;
  formId?: string;
  data?: TData;
  field?: string;
  error?: string;
  timestamp: number;
}

// =============================================================================
// FORM CONTEXT
// =============================================================================

/**
 * Form Context Value
 * For sharing form state across components
 */
export interface FormContextValue<TData = unknown> {
  formId: string;
  state: BaseFormState;
  data: TData;
  actions: FormHookReturn<TData>['actions'];
  computed: FormHookReturn<TData>['computed'];
  handlers: FormHookReturn<TData>['handlers'];
}

// Note: Default export removed - all types are available as named exports
// This fixes TypeScript verbatimModuleSyntax compliance (types cannot be used as values)