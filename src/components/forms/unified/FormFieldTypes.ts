/**
 * Unified Form Field Type System
 * Single Responsibility: Defines all form field types and their configurations
 * Open/Closed: Extensible for new field types without modifying existing code
 * Interface Segregation: Separate interfaces for different field concerns
 */

import type { ReactNode } from 'react';

/**
 * Base Field Type Enumeration
 * Extensible enum pattern for type safety
 */
export type FormFieldType = 
  | 'text'
  | 'email' 
  | 'password'
  | 'url'
  | 'tel'
  | 'search'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'date'
  | 'datetime-local'
  | 'time';

/**
 * Field Validation State
 * Single Responsibility: Manages field validation state
 */
export interface IFieldValidationState {
  readonly isValid: boolean;
  readonly isInvalid: boolean;
  readonly isPending: boolean;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
}

/**
 * Field Interaction State
 * Single Responsibility: Manages field interaction state
 */
export interface IFieldInteractionState {
  readonly isFocused: boolean;
  readonly isTouched: boolean;
  readonly isDirty: boolean;
  readonly isDisabled: boolean;
  readonly isReadOnly: boolean;
  readonly isRequired: boolean;
}

/**
 * Field Visual Configuration
 * Single Responsibility: Manages field visual presentation
 */
export interface IFieldVisualConfig {
  readonly label?: string;
  readonly placeholder?: string;
  readonly helpText?: string;
  readonly leftIcon?: ReactNode;
  readonly rightIcon?: ReactNode;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'default' | 'outlined' | 'filled';
  readonly fullWidth?: boolean;
  readonly className?: string;
}

/**
 * Field Behavior Configuration
 * Single Responsibility: Manages field behavior
 */
export interface IFieldBehaviorConfig {
  readonly autoComplete?: string;
  readonly autoFocus?: boolean;
  readonly debounceMs?: number;
  readonly maxLength?: number;
  readonly minLength?: number;
  readonly pattern?: string;
  readonly step?: number;
  readonly min?: number | string;
  readonly max?: number | string;
}

/**
 * Select/Radio Options
 * Single Responsibility: Manages option data for select/radio fields
 */
export interface IFieldOption {
  readonly value: string | number | boolean;
  readonly label: string;
  readonly disabled?: boolean;
  readonly description?: string;
  readonly group?: string;
}

/**
 * Field Event Handlers
 * Interface Segregation: Separate event handling concerns
 */
export interface IFieldEventHandlers<T = any> {
  readonly onChange?: (value: T) => void;
  readonly onBlur?: () => void;
  readonly onFocus?: () => void;
  readonly onKeyPress?: (event: React.KeyboardEvent) => void;
  readonly onKeyDown?: (event: React.KeyboardEvent) => void;
  readonly onKeyUp?: (event: React.KeyboardEvent) => void;
}

/**
 * Complete Field Configuration
 * Composition: Combines all field concerns into single interface
 */
export interface IUnifiedFieldConfig<T = any> extends 
  IFieldVisualConfig, 
  IFieldBehaviorConfig, 
  IFieldEventHandlers<T> {
  readonly type: FormFieldType;
  readonly name: string;
  readonly value?: T;
  readonly defaultValue?: T;
  readonly options?: readonly IFieldOption[]; // For select/radio fields
  readonly multiple?: boolean; // For select fields
  readonly accept?: string; // For file fields
  readonly rows?: number; // For textarea fields
  readonly validation?: IFieldValidationState;
  readonly interaction?: IFieldInteractionState;
}

/**
 * Field Type-Specific Configuration
 * Open/Closed: Extensible for new field type configurations
 */
export interface ITextFieldConfig extends IUnifiedFieldConfig<string> {
  readonly type: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
}

export interface INumberFieldConfig extends IUnifiedFieldConfig<number> {
  readonly type: 'number';
}

export interface ITextAreaFieldConfig extends IUnifiedFieldConfig<string> {
  readonly type: 'textarea';
  readonly rows?: number;
  readonly cols?: number;
  readonly resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export interface ISelectFieldConfig<T = string | number> extends IUnifiedFieldConfig<T> {
  readonly type: 'select';
  readonly options: readonly IFieldOption[];
  readonly multiple?: boolean;
  readonly searchable?: boolean;
  readonly clearable?: boolean;
}

export interface ICheckboxFieldConfig extends IUnifiedFieldConfig<boolean> {
  readonly type: 'checkbox';
  readonly checked?: boolean;
  readonly indeterminate?: boolean;
}

export interface IRadioFieldConfig<T = string | number> extends IUnifiedFieldConfig<T> {
  readonly type: 'radio';
  readonly options: readonly IFieldOption[];
}

export interface IFileFieldConfig extends IUnifiedFieldConfig<FileList | File[] | null> {
  readonly type: 'file';
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxSize?: number; // in bytes
  readonly maxFiles?: number;
}

export interface IDateFieldConfig extends IUnifiedFieldConfig<string | Date> {
  readonly type: 'date' | 'datetime-local' | 'time';
}

/**
 * Field Configuration Union Type
 * Type Safety: Ensures proper field configuration based on type
 */
export type FieldConfig = 
  | ITextFieldConfig
  | INumberFieldConfig
  | ITextAreaFieldConfig
  | ISelectFieldConfig
  | ICheckboxFieldConfig
  | IRadioFieldConfig
  | IFileFieldConfig
  | IDateFieldConfig;

/**
 * Field Registration Interface
 * Dependency Inversion: Abstract field registration system
 */
export interface IFieldRegistry {
  readonly register: <T>(config: IUnifiedFieldConfig<T>) => void;
  readonly unregister: (name: string) => void;
  readonly get: <T>(name: string) => IUnifiedFieldConfig<T> | undefined;
  readonly getAll: () => readonly IUnifiedFieldConfig[];
  readonly validate: (name: string) => Promise<IFieldValidationState>;
  readonly validateAll: () => Promise<Record<string, IFieldValidationState>>;
}

/**
 * Field Validation Rules
 * Single Responsibility: Defines validation logic
 */
export type FieldValidationRule<T = any> = (value: T) => string | undefined;

export interface IFieldValidationRules {
  readonly required: (message?: string) => FieldValidationRule<any>;
  readonly email: (message?: string) => FieldValidationRule<string>;
  readonly minLength: (min: number, message?: string) => FieldValidationRule<string>;
  readonly maxLength: (max: number, message?: string) => FieldValidationRule<string>;
  readonly pattern: (pattern: RegExp, message?: string) => FieldValidationRule<string>;
  readonly min: (min: number, message?: string) => FieldValidationRule<number>;
  readonly max: (max: number, message?: string) => FieldValidationRule<number>;
  readonly custom: <T>(validator: (value: T) => boolean, message: string) => FieldValidationRule<T>;
}

/**
 * Async Validator Interface
 * Single Responsibility: Defines contract for async validation
 */
export interface IAsyncValidator {
  readonly validate: (value: any) => Promise<{ errors: string[]; warnings: string[] }>;
  readonly name: string;
  readonly priority?: number;
}

/**
 * Field Component Props
 * Interface Segregation: Clean component interface
 */
export interface IUnifiedFieldProps<T = any> extends IUnifiedFieldConfig<T> {
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly id?: string;
}

/**
 * Field Error Display Configuration
 * Single Responsibility: Manages error display
 */
export interface IFieldErrorConfig {
  readonly showIcon?: boolean;
  readonly showTooltip?: boolean;
  readonly position?: 'bottom' | 'top' | 'right' | 'left';
  readonly className?: string;
}

/**
 * Unified Form Configuration
 * Single Responsibility: Overall form configuration and behavior
 */
export interface IUnifiedFormConfig {
  readonly id?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly validateOnChange?: boolean;
  readonly validateOnBlur?: boolean;
  readonly validateOnSubmit?: boolean;
  readonly submitOnEnter?: boolean;
  readonly showErrorSummary?: boolean;
  readonly preventSubmitOnError?: boolean;
  readonly resetOnSuccess?: boolean;
  readonly autoFocus?: boolean;
  readonly className?: string;
  readonly fields?: readonly IUnifiedFieldConfig[];
}

/**
 * Unified Form State
 * Single Responsibility: Manages overall form state
 */
export interface IUnifiedFormState<T = Record<string, unknown>> {
  readonly data: T;
  readonly errors: Record<keyof T, string | undefined>;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly isLoading: boolean;
  readonly isDirty: boolean;
  readonly touched: Record<keyof T, boolean>;
  readonly submitCount: number;
}

/**
 * Unified Form Handlers
 * Single Responsibility: Form interaction methods
 */
export interface IUnifiedFormHandlers<T = Record<string, unknown>> {
  readonly handleSubmit: (onSubmit: (data: T) => void | Promise<void>) => (e?: React.FormEvent) => Promise<void>;
  readonly handleReset: () => void;
  readonly handleFieldChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  readonly handleFieldBlur: <K extends keyof T>(field: K) => () => void;
  readonly setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  readonly setFieldError: <K extends keyof T>(field: K, error: string | undefined) => void;
  readonly clearErrors: () => void;
  readonly validateField: <K extends keyof T>(field: K) => Promise<boolean>;
  readonly validateForm: () => Promise<boolean>;
}

/**
 * Unified Form Builder Props
 * Single Responsibility: Props for the form builder component
 */
export interface IUnifiedFormBuilderProps<T = Record<string, unknown>> {
  readonly id: string;
  readonly config?: IUnifiedFormConfig;
  readonly fields: Record<keyof T, IUnifiedFieldConfig>;
  readonly initialData?: Partial<T>;
  readonly onSubmit?: (data: T) => void | Promise<void>;
  readonly onValidationError?: (errors: Record<keyof T, string>) => void;
  readonly className?: string;
  readonly children?: React.ReactNode;
}