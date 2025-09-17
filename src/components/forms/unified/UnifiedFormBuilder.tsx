/**
 * Unified Form Builder System
 * Single Responsibility: Builds complete forms from configuration
 * Open/Closed: Extensible for new form types without modifying existing code
 * Liskov Substitution: All forms built with this system are interchangeable
 * Interface Segregation: Clean separation between form structure and behavior
 * Dependency Inversion: Depends on form abstractions, not concrete implementations
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { UnifiedFormField } from './UnifiedFormField';
import { LiquidCard, LiquidButton } from '../../liquid-glass';
import { 
  FormValidationCoordinator, 
  FieldValidationEngine,
  CommonValidationSets,
  validationRules 
} from './FormValidation';
import type {
  IUnifiedFieldConfig,
  IFieldValidationState,
  FormFieldType,
  IFieldOption
} from './FormFieldTypes';

/**
 * Form Configuration Interface
 * Single Responsibility: Defines complete form structure and behavior
 */
export interface IUnifiedFormConfig {
  readonly id: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly fields: readonly IUnifiedFieldConfig[];
  readonly submitLabel?: string;
  readonly cancelLabel?: string;
  readonly resetLabel?: string;
  readonly showReset?: boolean;
  readonly showCancel?: boolean;
  readonly className?: string;
  readonly cardClassName?: string;
  readonly autoFocus?: boolean;
  readonly validateOnChange?: boolean;
  readonly validateOnBlur?: boolean;
  readonly submitOnEnter?: boolean;
}

/**
 * Form State Interface
 * Single Responsibility: Manages form state and validation
 */
export interface IUnifiedFormState {
  readonly data: Record<string, any>;
  readonly validation: Record<string, IFieldValidationState>;
  readonly isSubmitting: boolean;
  readonly isValid: boolean;
  readonly isDirty: boolean;
  readonly touchedFields: Set<string>;
  readonly errors: readonly string[];
}

/**
 * Form Event Handlers Interface
 * Interface Segregation: Separate event handling concerns
 */
export interface IUnifiedFormHandlers {
  readonly onSubmit?: (data: Record<string, any>) => Promise<void> | void;
  readonly onCancel?: () => void;
  readonly onReset?: () => void;
  readonly onChange?: (fieldName: string, value: any, formState: IUnifiedFormState) => void;
  readonly onValidationChange?: (fieldName: string, validation: IFieldValidationState) => void;
  readonly onStateChange?: (state: IUnifiedFormState) => void;
}

/**
 * Form Builder Props
 * Composition: Combines all form concerns
 */
export interface IUnifiedFormBuilderProps extends IUnifiedFormConfig, IUnifiedFormHandlers {}

/**
 * Mutable Field Configuration for Builder
 * Single Responsibility: Internal builder state (no readonly constraints)
 */
interface MutableFieldConfig {
  name?: string;
  type?: FormFieldType;
  label?: string;
  placeholder?: string;
  helpText?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  defaultValue?: any;
  className?: string;
  options?: readonly IFieldOption[];
  interaction?: {
    isRequired?: boolean;
    isDisabled?: boolean;
    isFocused?: boolean;
    isTouched?: boolean;
    isDirty?: boolean;
    isReadOnly?: boolean;
  };
  validationEngine?: any;
}

/**
 * Form Field Builder Utility
 * Single Responsibility: Creates form fields with validation
 */
export class FormFieldBuilder {
  private config: MutableFieldConfig = {};

  static create(name: string, type: FormFieldType): FormFieldBuilder {
    const builder = new FormFieldBuilder();
    builder.config = { name, type };
    return builder;
  }

  label(label: string): this {
    this.config.label = label;
    return this;
  }

  placeholder(placeholder: string): this {
    this.config.placeholder = placeholder;
    return this;
  }

  required(required = true): this {
    this.config.interaction = {
      ...this.config.interaction,
      isRequired: required
    };
    return this;
  }

  disabled(disabled = true): this {
    this.config.interaction = {
      ...this.config.interaction,
      isDisabled: disabled
    };
    return this;
  }

  helpText(text: string): this {
    this.config.helpText = text;
    return this;
  }

  validation(engine: FieldValidationEngine): this {
    // Store validation engine reference for later use
    (this.config as any).validationEngine = engine;
    return this;
  }

  options(options: readonly IFieldOption[]): this {
    this.config.options = options;
    return this;
  }

  defaultValue(value: any): this {
    this.config.defaultValue = value;
    return this;
  }

  className(className: string): this {
    this.config.className = className;
    return this;
  }

  autoComplete(value: string): this {
    this.config.autoComplete = value;
    return this;
  }

  maxLength(length: number): this {
    this.config.maxLength = length;
    return this;
  }

  build(): IUnifiedFieldConfig {
    if (!this.config.name || !this.config.type) {
      throw new Error('Field name and type are required');
    }

    // Convert mutable config to readonly interface
    const readonlyConfig: IUnifiedFieldConfig = {
      name: this.config.name,
      type: this.config.type,
      ...(this.config.label && { label: this.config.label }),
      ...(this.config.placeholder && { placeholder: this.config.placeholder }),
      ...(this.config.helpText && { helpText: this.config.helpText }),
      ...(this.config.autoComplete && { autoComplete: this.config.autoComplete }),
      ...(this.config.maxLength && { maxLength: this.config.maxLength }),
      ...(this.config.minLength && { minLength: this.config.minLength }),
      ...(this.config.defaultValue !== undefined && { defaultValue: this.config.defaultValue }),
      ...(this.config.className && { className: this.config.className }),
      ...(this.config.options && { options: this.config.options }),
      ...(this.config.interaction && {
        interaction: {
          isFocused: this.config.interaction.isFocused ?? false,
          isTouched: this.config.interaction.isTouched ?? false,
          isDirty: this.config.interaction.isDirty ?? false,
          isDisabled: this.config.interaction.isDisabled ?? false,
          isReadOnly: this.config.interaction.isReadOnly ?? false,
          isRequired: this.config.interaction.isRequired ?? false,
        }
      }),
    };

    return readonlyConfig;
  }
}

/**
 * Unified Form Hook
 * Single Responsibility: Manages form state and validation
 */
export function useUnifiedForm(config: IUnifiedFormConfig, handlers: IUnifiedFormHandlers = {}) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initialData: Record<string, any> = {};
    config.fields.forEach(field => {
      initialData[field.name] = field.defaultValue ?? field.value ?? '';
    });
    return initialData;
  });

  const [validation, setValidation] = useState<Record<string, IFieldValidationState>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validationCoordinator = useRef(new FormValidationCoordinator());

  // Initialize validation engines for all fields
  useEffect(() => {
    config.fields.forEach(field => {
      const engine = (field as any).validationEngine || new FieldValidationEngine();
      
      // Add default validation rules based on field properties
      if (field.interaction?.isRequired) {
        engine.addRule(validationRules.required());
      }
      
      if (field.type === 'email') {
        engine.addRule(validationRules.email());
      }
      
      if (field.type === 'url') {
        engine.addRule(validationRules.url());
      }
      
      if (field.type === 'tel') {
        engine.addRule(validationRules.phone());
      }
      
      if (field.maxLength) {
        engine.addRule(validationRules.maxLength(field.maxLength));
      }
      
      if (field.minLength) {
        engine.addRule(validationRules.minLength(field.minLength));
      }

      validationCoordinator.current.registerField(field.name, engine);
    });

    return () => {
      config.fields.forEach(field => {
        validationCoordinator.current.unregisterField(field.name);
      });
    };
  }, [config.fields]);

  // Computed form state
  const formState = useMemo<IUnifiedFormState>(() => {
    const isValid = Object.values(validation).every(v => v.isValid !== false);
    const isDirty = config.fields.some(field => 
      formData[field.name] !== (field.defaultValue ?? field.value ?? '')
    );
    const errors = Object.values(validation)
      .filter(v => v.error)
      .map(v => v.error!);

    return {
      data: formData,
      validation,
      isSubmitting,
      isValid,
      isDirty,
      touchedFields,
      errors
    };
  }, [formData, validation, isSubmitting, touchedFields, config.fields]);

  // Field change handler
  const handleFieldChange = useCallback(async (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    handlers.onChange?.(fieldName, value, formState);

    // Validate on change if enabled
    if (config.validateOnChange || touchedFields.has(fieldName)) {
      const validationResult = await validationCoordinator.current.validateField(fieldName, value);
      setValidation(prev => ({ ...prev, [fieldName]: validationResult }));
      handlers.onValidationChange?.(fieldName, validationResult);
    }
  }, [config.validateOnChange, touchedFields, handlers, formState]);

  // Field blur handler
  const handleFieldBlur = useCallback(async (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));

    if (config.validateOnBlur) {
      const value = formData[fieldName];
      const validationResult = await validationCoordinator.current.validateField(fieldName, value);
      setValidation(prev => ({ ...prev, [fieldName]: validationResult }));
      handlers.onValidationChange?.(fieldName, validationResult);
    }
  }, [config.validateOnBlur, formData, handlers]);

  // Form submission handler
  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    event?.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Validate all fields
      const allValidation = await validationCoordinator.current.validateAllFields(formData);
      setValidation(allValidation);
      
      // Mark all fields as touched
      setTouchedFields(new Set(config.fields.map(field => field.name)));

      if (validationCoordinator.current.isFormValid(allValidation)) {
        await handlers.onSubmit?.(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, handlers, config.fields]);

  // Form reset handler
  const handleReset = useCallback(() => {
    const resetData: Record<string, any> = {};
    config.fields.forEach(field => {
      resetData[field.name] = field.defaultValue ?? field.value ?? '';
    });
    
    setFormData(resetData);
    setValidation({});
    setTouchedFields(new Set());
    setIsSubmitting(false);
    
    handlers.onReset?.();
  }, [config.fields, handlers]);

  // Form cancel handler
  const handleCancel = useCallback(() => {
    handlers.onCancel?.();
  }, [handlers]);

  // State change effect
  useEffect(() => {
    handlers.onStateChange?.(formState);
  }, [formState, handlers]);

  return {
    formState,
    formData,
    validation,
    isSubmitting,
    handlers: {
      handleFieldChange,
      handleFieldBlur,
      handleSubmit,
      handleReset,
      handleCancel
    }
  };
}

/**
 * Unified Form Builder Component
 * Main component that renders complete forms from configuration
 */
export const UnifiedFormBuilder: React.FC<IUnifiedFormBuilderProps> = React.memo(({
  id,
  title,
  subtitle,
  fields,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  resetLabel = 'Reset',
  showReset = false,
  showCancel = false,
  className = '',
  cardClassName = '',
  autoFocus = false,
  validateOnChange = false,
  validateOnBlur = true,
  submitOnEnter = true,
  onSubmit,
  onCancel,
  onReset,
  onChange,
  onValidationChange,
  onStateChange
}) => {
  const config = useMemo<IUnifiedFormConfig>(() => ({
    id,
    fields,
    ...(title && { title }),
    ...(subtitle && { subtitle }),
    ...(submitLabel && { submitLabel }),
    ...(cancelLabel && { cancelLabel }),
    ...(resetLabel && { resetLabel }),
    ...(showReset !== undefined && { showReset }),
    ...(showCancel !== undefined && { showCancel }),
    ...(className && { className }),
    ...(cardClassName && { cardClassName }),
    ...(autoFocus !== undefined && { autoFocus }),
    ...(validateOnChange !== undefined && { validateOnChange }),
    ...(validateOnBlur !== undefined && { validateOnBlur }),
    ...(submitOnEnter !== undefined && { submitOnEnter }),
  }), [
    id, title, subtitle, fields, submitLabel, cancelLabel, resetLabel,
    showReset, showCancel, className, cardClassName, autoFocus,
    validateOnChange, validateOnBlur, submitOnEnter
  ]);

  const handlers = useMemo<IUnifiedFormHandlers>(() => ({
    ...(onSubmit && { onSubmit }),
    ...(onCancel && { onCancel }),
    ...(onReset && { onReset }),
    ...(onChange && { onChange }),
    ...(onValidationChange && { onValidationChange }),
    ...(onStateChange && { onStateChange }),
  }), [onSubmit, onCancel, onReset, onChange, onValidationChange, onStateChange]);

  const { formState, handlers: formHandlers } = useUnifiedForm(config, handlers);

  // Handle Enter key submission
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (submitOnEnter && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      formHandlers.handleSubmit();
    }
  }, [submitOnEnter, formHandlers]);

  const content = (
    <form
      id={id}
      onSubmit={formHandlers.handleSubmit}
      onKeyDown={handleKeyDown}
      className={`unified-form space-y-6 ${className}`.trim()}
      noValidate
    >
      {/* Form Fields */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <UnifiedFormField
            key={field.name}
            {...field}
            value={formState.data[field.name]}
            {...(formState.validation[field.name] && { validation: formState.validation[field.name] })}
            interaction={{
              isFocused: field.interaction?.isFocused ?? false,
              isTouched: formState.touchedFields.has(field.name),
              isDirty: formState.data[field.name] !== (field.defaultValue ?? field.value ?? ''),
              isDisabled: field.interaction?.isDisabled || formState.isSubmitting,
              isReadOnly: field.interaction?.isReadOnly ?? false,
              isRequired: field.interaction?.isRequired ?? false,
            }}
            autoFocus={autoFocus && index === 0}
            onChange={(value) => formHandlers.handleFieldChange(field.name, value)}
            onBlur={() => formHandlers.handleFieldBlur(field.name)}
          />
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-4">
        {showReset && (
          <LiquidButton
            type="button"
            variant="secondary"
            onClick={formHandlers.handleReset}
            disabled={formState.isSubmitting || !formState.isDirty}
          >
            {resetLabel}
          </LiquidButton>
        )}
        
        {showCancel && (
          <LiquidButton
            type="button"
            variant="secondary"
            onClick={formHandlers.handleCancel}
            disabled={formState.isSubmitting}
          >
            {cancelLabel}
          </LiquidButton>
        )}
        
        <LiquidButton
          type="submit"
          variant="primary"
          loading={formState.isSubmitting}
          disabled={!formState.isValid && formState.touchedFields.size > 0}
        >
          {submitLabel}
        </LiquidButton>
      </div>

      {/* Form Errors Summary */}
      {formState.errors.length > 0 && formState.touchedFields.size > 0 && (
        <div className="mt-4 p-4 rounded-glass bg-red-500/20 border border-red-500/30">
          <div className="text-red-400 text-sm">
            <p className="font-medium mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {formState.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </form>
  );

  if (title || subtitle) {
    return (
      <LiquidCard
        title={title}
        subtitle={subtitle}
        className={cardClassName}
      >
        {content}
      </LiquidCard>
    );
  }

  return content;
});

UnifiedFormBuilder.displayName = 'UnifiedFormBuilder';

/**
 * Export utilities for easy form creation
 */
export const Field = FormFieldBuilder;
export { CommonValidationSets, validationRules };