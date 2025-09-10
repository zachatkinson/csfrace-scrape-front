/**
 * Unified Form System - Barrel Export
 * Single entry point for the complete unified form system
 * Eliminates form duplication and provides consistent, type-safe form building
 */

// Core Components
export { UnifiedFormField } from './UnifiedFormField';
export { UnifiedFormBuilder, useUnifiedForm } from './UnifiedFormBuilder';

// Form Building Utilities
export { FormFieldBuilder, Field, CommonValidationSets, validationRules } from './UnifiedFormBuilder';

// Validation System
export {
  UnifiedValidationRules,
  FieldValidationEngine,
  FormValidationCoordinator,
  ValidationErrorType
} from './FormValidation';

// Type Definitions
export type {
  // Field Types
  FormFieldType,
  IUnifiedFieldConfig,
  IFieldValidationState,
  IFieldInteractionState,
  IFieldOption,
  IUnifiedFieldProps,
  
  // Specific Field Configs
  ITextFieldConfig,
  INumberFieldConfig,
  ITextAreaFieldConfig,
  ISelectFieldConfig,
  ICheckboxFieldConfig,
  IRadioFieldConfig,
  IFileFieldConfig,
  IDateFieldConfig,
  FieldConfig,

  // Form Types
  IUnifiedFormConfig,
  IUnifiedFormState,
  IUnifiedFormHandlers,
  IUnifiedFormBuilderProps,

  // Validation Types
  FieldValidationRule,
  IFieldValidationRules,
  IValidationResult,
  IAsyncValidator
} from './FormFieldTypes';

export type { IValidationResult } from './FormValidation';