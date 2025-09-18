/**
 * Unified Form Validation System
 * Single Responsibility: Handles all form validation logic
 * Open/Closed: Extensible for new validation rules without modifying existing code
 * Interface Segregation: Separate concerns for different validation types
 * Dependency Inversion: Depends on validation rule abstractions
 */

import type {
  FieldValidationRule,
  IFieldValidationState,
  IFieldValidationRules
} from './FormFieldTypes';

/**
 * Validation Error Types
 * Single Responsibility: Defines validation error categories
 */
export enum ValidationErrorType {
  REQUIRED = 'required',
  FORMAT = 'format',
  LENGTH = 'length',
  RANGE = 'range',
  CUSTOM = 'custom'
}

/**
 * Validation Result Interface
 * Single Responsibility: Standardizes validation results
 */
export interface IValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly errorType?: ValidationErrorType;
}

/**
 * Async Validation Interface
 * Single Responsibility: Handles asynchronous validation (e.g., server-side checks)
 */
export interface IAsyncValidator<T = unknown> {
  readonly validate: (value: T) => Promise<IValidationResult>;
  readonly debounceMs?: number;
}

/**
 * Field-Specific Validation Rules
 * Open/Closed: New validation rules can be added without modifying existing ones
 */
export class UnifiedValidationRules implements IFieldValidationRules {
  /**
   * Required field validation
   */
  required(message = 'This field is required'): FieldValidationRule<unknown> {
    return (value: unknown): string | undefined => {
      if (value === null || value === undefined) {
        return message;
      }
      
      if (typeof value === 'string' && value.trim() === '') {
        return message;
      }
      
      if (Array.isArray(value) && value.length === 0) {
        return message;
      }
      
      if (typeof value === 'boolean' && !value) {
        return message;
      }
      
      return undefined;
    };
  }

  /**
   * Email format validation
   */
  email(message = 'Please enter a valid email address'): FieldValidationRule<string> {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    return (value: string): string | undefined => {
      if (!value) return undefined; // Let required rule handle empty values
      return emailRegex.test(value.trim()) ? undefined : message;
    };
  }

  /**
   * URL format validation
   */
  url(message = 'Please enter a valid URL'): FieldValidationRule<string> {
    return (value: string): string | undefined => {
      if (!value) return undefined;
      
      try {
        new URL(value);
        return undefined;
      } catch {
        return message;
      }
    };
  }

  /**
   * Phone number validation
   */
  phone(message = 'Please enter a valid phone number'): FieldValidationRule<string> {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    
    return (value: string): string | undefined => {
      if (!value) return undefined;
      const cleaned = value.replace(/\s/g, '');
      return phoneRegex.test(cleaned) && cleaned.length >= 7 ? undefined : message;
    };
  }

  /**
   * Minimum length validation
   */
  minLength(min: number, message?: string): FieldValidationRule<string> {
    const defaultMessage = `Must be at least ${min} characters`;
    
    return (value: string): string | undefined => {
      if (!value) return undefined;
      return value.length >= min ? undefined : (message || defaultMessage);
    };
  }

  /**
   * Maximum length validation
   */
  maxLength(max: number, message?: string): FieldValidationRule<string> {
    const defaultMessage = `Must be no more than ${max} characters`;
    
    return (value: string): string | undefined => {
      if (!value) return undefined;
      return value.length <= max ? undefined : (message || defaultMessage);
    };
  }

  /**
   * Pattern matching validation
   */
  pattern(pattern: RegExp, message = 'Invalid format'): FieldValidationRule<string> {
    return (value: string): string | undefined => {
      if (!value) return undefined;
      return pattern.test(value) ? undefined : message;
    };
  }

  /**
   * Minimum numeric value validation
   */
  min(min: number, message?: string): FieldValidationRule<number> {
    const defaultMessage = `Must be at least ${min}`;
    
    return (value: number): string | undefined => {
      if (value === null || value === undefined) return undefined;
      return value >= min ? undefined : (message || defaultMessage);
    };
  }

  /**
   * Maximum numeric value validation
   */
  max(max: number, message?: string): FieldValidationRule<number> {
    const defaultMessage = `Must be no more than ${max}`;
    
    return (value: number): string | undefined => {
      if (value === null || value === undefined) return undefined;
      return value <= max ? undefined : (message || defaultMessage);
    };
  }

  /**
   * Custom validation rule
   */
  custom<T>(validator: (value: T) => boolean, message: string): FieldValidationRule<T> {
    return (value: T): string | undefined => {
      return validator(value) ? undefined : message;
    };
  }

  /**
   * Password strength validation
   */
  passwordStrength(
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    message = 'Password must meet strength requirements'
  ): FieldValidationRule<string> {
    return (value: string): string | undefined => {
      if (!value) return undefined;

      const checks = [
        { test: value.length >= minLength, msg: `at least ${minLength} characters` },
        { test: !requireUppercase || /[A-Z]/.test(value), msg: 'uppercase letter' },
        { test: !requireLowercase || /[a-z]/.test(value), msg: 'lowercase letter' },
        { test: !requireNumbers || /\d/.test(value), msg: 'number' },
        { test: !requireSpecialChars || /[!@#$%^&*(),.?":{}|<>]/.test(value), msg: 'special character' }
      ];

      const failures = checks.filter(check => !check.test).map(check => check.msg);
      
      return failures.length === 0 ? undefined : 
        `${message}: ${failures.join(', ')}`;
    };
  }

  /**
   * Confirm password validation
   */
  confirmPassword(originalPassword: string, message = 'Passwords do not match'): FieldValidationRule<string> {
    return (value: string): string | undefined => {
      if (!value || !originalPassword) return undefined;
      return value === originalPassword ? undefined : message;
    };
  }

  /**
   * File validation
   */
  fileValidation(options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  }): FieldValidationRule<FileList | File[] | null> {
    return (value: FileList | File[] | null): string | undefined => {
      if (!value) return undefined;

      const files = Array.isArray(value) ? value : Array.from(value);

      // Check file count
      if (options.maxFiles && files.length > options.maxFiles) {
        return `Maximum ${options.maxFiles} files allowed`;
      }

      // Check individual files
      for (const file of files) {
        // Check file size
        if (options.maxSize && file.size > options.maxSize) {
          const maxSizeMB = (options.maxSize / 1024 / 1024).toFixed(1);
          return `File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`;
        }

        // Check file type
        if (options.allowedTypes && options.allowedTypes.length > 0) {
          const isAllowed = options.allowedTypes.some(type => 
            file.type.includes(type) || file.name.toLowerCase().endsWith(type.toLowerCase())
          );
          
          if (!isAllowed) {
            return `File "${file.name}" is not an allowed type. Allowed types: ${options.allowedTypes.join(', ')}`;
          }
        }
      }

      return undefined;
    };
  }
}

/**
 * Field Validation Engine
 * Single Responsibility: Orchestrates validation rule execution
 */
export class FieldValidationEngine {
  private rules: FieldValidationRule<unknown>[] = [];
  private asyncValidators: IAsyncValidator<unknown>[] = [];

  /**
   * Add synchronous validation rule
   */
  addRule<T>(rule: FieldValidationRule<T>): this {
    this.rules.push(rule as FieldValidationRule<unknown>);
    return this;
  }

  /**
   * Add asynchronous validator
   */
  addAsyncValidator<T>(validator: IAsyncValidator<T>): this {
    this.asyncValidators.push(validator as IAsyncValidator<unknown>);
    return this;
  }

  /**
   * Validate value synchronously
   */
  validateSync<T>(value: T): IFieldValidationState {
    const errors: string[] = [];
    
    for (const rule of this.rules) {
      const error = rule(value);
      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      isInvalid: errors.length > 0,
      isPending: false,
      ...(errors.length > 0 && { error: errors[0] }),
    };
  }

  /**
   * Validate value asynchronously
   */
  async validateAsync<T>(value: T): Promise<IFieldValidationState> {
    // First run synchronous validation
    const syncResult = this.validateSync(value);
    if (!syncResult.isValid) {
      return syncResult;
    }

    // If sync validation passes, run async validators
    if (this.asyncValidators.length === 0) {
      return syncResult;
    }

    const asyncResults = await Promise.all(
      this.asyncValidators.map(validator => validator.validate(value))
    );

    const allErrors = asyncResults.flatMap(result => result.errors);
    const allWarnings = asyncResults.flatMap(result => result.warnings);

    return {
      isValid: allErrors.length === 0,
      isInvalid: allErrors.length > 0,
      isPending: false,
      ...(allErrors.length > 0 && { error: allErrors[0] }),
      ...(allWarnings.length > 0 && { warning: allWarnings[0] }),
    };
  }

  /**
   * Clear all validation rules
   */
  clear(): this {
    this.rules = [];
    this.asyncValidators = [];
    return this;
  }
}

/**
 * Form-level validation coordinator
 * Single Responsibility: Coordinates validation across multiple fields
 */
export class FormValidationCoordinator {
  private fieldEngines = new Map<string, FieldValidationEngine>();

  /**
   * Register field validation engine
   */
  registerField(name: string, engine: FieldValidationEngine): void {
    this.fieldEngines.set(name, engine);
  }

  /**
   * Unregister field
   */
  unregisterField(name: string): void {
    this.fieldEngines.delete(name);
  }

  /**
   * Validate single field
   */
  async validateField<T>(name: string, value: T): Promise<IFieldValidationState> {
    const engine = this.fieldEngines.get(name);
    if (!engine) {
      return { isValid: true, isInvalid: false, isPending: false };
    }

    return engine.validateAsync(value);
  }

  /**
   * Validate all registered fields
   */
  async validateAllFields(formData: Record<string, unknown>): Promise<Record<string, IFieldValidationState>> {
    const results: Record<string, IFieldValidationState> = {};

    const validationPromises = Array.from(this.fieldEngines.entries()).map(
      async ([fieldName, engine]) => {
        const value = formData[fieldName];
        const result = await engine.validateAsync(value);
        return { fieldName, result };
      }
    );

    const validationResults = await Promise.all(validationPromises);
    
    validationResults.forEach(({ fieldName, result }) => {
      results[fieldName] = result;
    });

    return results;
  }

  /**
   * Check if form is valid
   */
  isFormValid(validationResults: Record<string, IFieldValidationState>): boolean {
    return Object.values(validationResults).every(result => result.isValid);
  }
}

/**
 * Predefined validation rule sets for common field types
 * Open/Closed: New rule sets can be added without modifying existing ones
 */
export const CommonValidationSets = {
  email: () => new FieldValidationEngine()
    .addRule(new UnifiedValidationRules().required())
    .addRule(new UnifiedValidationRules().email()),

  password: () => new FieldValidationEngine()
    .addRule(new UnifiedValidationRules().required())
    .addRule(new UnifiedValidationRules().passwordStrength()),

  url: () => new FieldValidationEngine()
    .addRule(new UnifiedValidationRules().required())
    .addRule(new UnifiedValidationRules().url()),

  phone: () => new FieldValidationEngine()
    .addRule(new UnifiedValidationRules().phone()),

  required: () => new FieldValidationEngine()
    .addRule(new UnifiedValidationRules().required()),

  text: (minLength?: number, maxLength?: number) => {
    const engine = new FieldValidationEngine();
    if (minLength) engine.addRule(new UnifiedValidationRules().minLength(minLength));
    if (maxLength) engine.addRule(new UnifiedValidationRules().maxLength(maxLength));
    return engine;
  },
};

/**
 * Export singleton instances for common use
 */
export const validationRules = new UnifiedValidationRules();
export const formValidationCoordinator = new FormValidationCoordinator();