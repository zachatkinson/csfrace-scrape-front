/**
 * Form Validation Utilities
 * Centralized validation logic to eliminate duplication across forms
 * ZERO TOLERANCE for duplicate validation patterns
 */

import { TIMING_CONSTANTS } from '../constants/timing.ts';

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

// Field validation rules
export interface ValidationRule {
  validator: (value: any) => boolean | Promise<boolean>;
  message: string;
  severity?: 'error' | 'warning';
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  WORDPRESS_URL: /^https?:\/\/[^\/\s]+.*$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
} as const;

// Pre-built validation rules
export const VALIDATION_RULES = {
  // Required field validation
  required: (message = 'This field is required'): ValidationRule => ({
    validator: (value: any) => value !== null && value !== undefined && String(value).trim() !== '',
    message,
  }),

  // String length validations
  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters long`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters long`,
  }),

  // Pattern validations
  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    validator: (value: string) => !value || VALIDATION_PATTERNS.EMAIL.test(value),
    message,
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    validator: (value: string) => !value || VALIDATION_PATTERNS.URL.test(value),
    message,
  }),

  wordpressUrl: (message = 'Please enter a valid WordPress URL'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      const isValidUrl = VALIDATION_PATTERNS.WORDPRESS_URL.test(value);
      const hasWordPressIndicators = value.includes('wp-') || 
                                   value.includes('wordpress') || 
                                   value.includes('/blog') ||
                                   value.includes('?p=') ||
                                   value.includes('/post/');
      return isValidUrl && hasWordPressIndicators;
    },
    message,
  }),

  password: (message = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'): ValidationRule => ({
    validator: (value: string) => !value || (value.length >= 8 && VALIDATION_PATTERNS.PASSWORD_STRONG.test(value)),
    message,
  }),

  // Numeric validations
  minValue: (min: number, message?: string): ValidationRule => ({
    validator: (value: number) => value === null || value === undefined || value >= min,
    message: message || `Must be at least ${min}`,
  }),

  maxValue: (max: number, message?: string): ValidationRule => ({
    validator: (value: number) => value === null || value === undefined || value <= max,
    message: message || `Must be no more than ${max}`,
  }),

  positiveNumber: (message = 'Must be a positive number'): ValidationRule => ({
    validator: (value: number) => value === null || value === undefined || value > 0,
    message,
  }),

  // File validations
  fileSize: (maxSizeBytes: number, message?: string): ValidationRule => ({
    validator: (file: File) => !file || file.size <= maxSizeBytes,
    message: message || `File size must be less than ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB`,
  }),

  fileType: (allowedTypes: string[], message?: string): ValidationRule => ({
    validator: (file: File) => !file || allowedTypes.includes(file.type),
    message: message || `File type must be one of: ${allowedTypes.join(', ')}`,
  }),

  // Custom async validations
  asyncUrlCheck: (message = 'URL is not accessible'): ValidationRule => ({
    validator: async (value: string): Promise<boolean> => {
      if (!value) return true;
      try {
        // Simple head request to check if URL is accessible
        const response = await fetch(value, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    },
    message,
    severity: 'warning', // Don't block form submission, just warn
  }),
} as const;

/**
 * Field Validator class for individual field validation
 */
export class FieldValidator {
  private rules: ValidationRule[] = [];
  private debounceTimeout: number | null = null;

  constructor(private fieldName: string) {}

  /**
   * Add validation rule
   */
  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Add multiple rules
   */
  addRules(rules: ValidationRule[]): this {
    this.rules.push(...rules);
    return this;
  }

  /**
   * Validate field value
   */
  async validate(value: any): Promise<FieldValidationResult> {
    let error: string | undefined;
    let warning: string | undefined;

    for (const rule of this.rules) {
      try {
        const isValid = await rule.validator(value);
        if (!isValid) {
          if (rule.severity === 'warning') {
            warning = rule.message;
          } else {
            error = rule.message;
            break; // Stop on first error
          }
        }
      } catch (validationError) {
        error = 'Validation failed';
        break;
      }
    }

    return {
      isValid: !error,
      error,
      warning,
    };
  }

  /**
   * Validate with debounce (useful for real-time validation)
   */
  validateDebounced(
    value: any, 
    callback: (result: FieldValidationResult) => void,
    delay = TIMING_CONSTANTS.UI.INPUT_VALIDATION_DELAY
  ): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = window.setTimeout(async () => {
      const result = await this.validate(value);
      callback(result);
    }, delay);
  }
}

/**
 * Form Validator class for complete form validation
 */
export class FormValidator {
  private fieldValidators: Map<string, FieldValidator> = new Map();
  private formRules: ValidationRule[] = [];

  /**
   * Add field validator
   */
  addField(fieldName: string): FieldValidator {
    const validator = new FieldValidator(fieldName);
    this.fieldValidators.set(fieldName, validator);
    return validator;
  }

  /**
   * Add form-level validation rule
   */
  addFormRule(rule: ValidationRule): this {
    this.formRules.push(rule);
    return this;
  }

  /**
   * Validate entire form
   */
  async validateForm(formData: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate individual fields
    for (const [fieldName, validator] of this.fieldValidators) {
      const fieldResult = await validator.validate(formData[fieldName]);
      if (fieldResult.error) {
        errors.push(`${fieldName}: ${fieldResult.error}`);
      }
      if (fieldResult.warning) {
        warnings.push(`${fieldName}: ${fieldResult.warning}`);
      }
    }

    // Validate form-level rules
    for (const rule of this.formRules) {
      try {
        const isValid = await rule.validator(formData);
        if (!isValid) {
          if (rule.severity === 'warning') {
            warnings.push(rule.message);
          } else {
            errors.push(rule.message);
          }
        }
      } catch (validationError) {
        errors.push('Form validation failed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate single field
   */
  async validateField(fieldName: string, value: any): Promise<FieldValidationResult> {
    const validator = this.fieldValidators.get(fieldName);
    if (!validator) {
      return { isValid: true };
    }
    return validator.validate(value);
  }
}

/**
 * Pre-built form validators for common scenarios
 */
export const FORM_VALIDATORS = {
  /**
   * WordPress URL scraping form
   */
  wordpressScraping: (): FormValidator => {
    const validator = new FormValidator();
    
    validator.addField('url')
      .addRules([
        VALIDATION_RULES.required('WordPress URL is required'),
        VALIDATION_RULES.url(),
        VALIDATION_RULES.wordpressUrl('Please enter a valid WordPress URL'),
        VALIDATION_RULES.asyncUrlCheck('WordPress site may not be accessible'),
      ]);

    validator.addField('title')
      .addRules([
        VALIDATION_RULES.maxLength(200, 'Title must be less than 200 characters'),
      ]);

    return validator;
  },

  /**
   * User registration form
   */
  userRegistration: (): FormValidator => {
    const validator = new FormValidator();
    
    validator.addField('email')
      .addRules([
        VALIDATION_RULES.required('Email is required'),
        VALIDATION_RULES.email(),
      ]);

    validator.addField('password')
      .addRules([
        VALIDATION_RULES.required('Password is required'),
        VALIDATION_RULES.password(),
      ]);

    validator.addField('confirmPassword')
      .addRule({
        validator: (value: string) => value === validator['formData']?.password,
        message: 'Passwords do not match',
      });

    validator.addField('username')
      .addRules([
        VALIDATION_RULES.required('Username is required'),
        VALIDATION_RULES.minLength(3),
        VALIDATION_RULES.maxLength(20),
        {
          validator: (value: string) => VALIDATION_PATTERNS.USERNAME.test(value),
          message: 'Username can only contain letters, numbers, and underscores',
        },
      ]);

    return validator;
  },

  /**
   * File upload form
   */
  fileUpload: (maxSizeMB = 10, allowedTypes = ['text/plain', 'text/csv']): FormValidator => {
    const validator = new FormValidator();
    
    validator.addField('file')
      .addRules([
        VALIDATION_RULES.required('Please select a file'),
        VALIDATION_RULES.fileSize(maxSizeMB * 1024 * 1024),
        VALIDATION_RULES.fileType(allowedTypes),
      ]);

    return validator;
  },

  /**
   * Settings/configuration form
   */
  settings: (): FormValidator => {
    const validator = new FormValidator();
    
    validator.addField('apiTimeout')
      .addRules([
        VALIDATION_RULES.required('API timeout is required'),
        VALIDATION_RULES.positiveNumber(),
        VALIDATION_RULES.minValue(1000, 'Timeout must be at least 1 second'),
        VALIDATION_RULES.maxValue(300000, 'Timeout must be less than 5 minutes'),
      ]);

    validator.addField('maxRetries')
      .addRules([
        VALIDATION_RULES.required('Max retries is required'),
        VALIDATION_RULES.minValue(0, 'Must be 0 or greater'),
        VALIDATION_RULES.maxValue(10, 'Must be 10 or less'),
      ]);

    validator.addField('apiUrl')
      .addRules([
        VALIDATION_RULES.required('API URL is required'),
        VALIDATION_RULES.url(),
      ]);

    return validator;
  },
} as const;

/**
 * Validation helpers and utilities
 */
export const ValidationHelpers = {
  /**
   * Format validation errors for display
   */
  formatErrors: (errors: string[]): string => {
    if (errors.length === 0) return '';
    if (errors.length === 1) return errors[0];
    return `• ${errors.join('\n• ')}`;
  },

  /**
   * Check if form has any validation errors
   */
  hasErrors: (result: ValidationResult): boolean => {
    return !result.isValid || result.errors.length > 0;
  },

  /**
   * Get first error message
   */
  getFirstError: (result: ValidationResult): string | undefined => {
    return result.errors[0];
  },

  /**
   * Sanitize input value
   */
  sanitizeInput: (value: string): string => {
    return value.trim().replace(/[<>]/g, '');
  },

  /**
   * Validate all fields in a form element
   */
  validateFormElement: async (
    formElement: HTMLFormElement, 
    validator: FormValidator
  ): Promise<ValidationResult> => {
    const formData = new FormData(formElement);
    const data: Record<string, any> = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return validator.validateForm(data);
  },

  /**
   * Show validation errors in form
   */
  displayFormErrors: (
    formElement: HTMLFormElement, 
    result: ValidationResult
  ): void => {
    // Clear existing errors
    formElement.querySelectorAll('.validation-error').forEach(el => el.remove());
    
    // Add new errors
    result.errors.forEach(error => {
      const [fieldName, message] = error.split(': ');
      const field = formElement.querySelector(`[name="${fieldName}"]`);
      if (field) {
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error text-red-400 text-xs mt-1';
        errorElement.textContent = message;
        field.parentNode?.insertBefore(errorElement, field.nextSibling);
      }
    });
  },
} as const;

export default {
  VALIDATION_PATTERNS,
  VALIDATION_RULES,
  FieldValidator,
  FormValidator,
  FORM_VALIDATORS,
  ValidationHelpers,
};