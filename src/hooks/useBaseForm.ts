/**
 * Base Form Hook
 * SOLID: Liskov Substitution Principle - Common form behavior for all forms
 * Provides consistent interface that all forms can use
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  BaseFormState,
  FormValidationResult,
  FormSubmissionResult,
  FormHookConfig,
  FormHookReturn,
  FieldValidationSchema,
  FormValidationSchema,
  FieldValidationRule
} from '../interfaces/forms.ts';

/**
 * Base Form Hook Implementation
 * Provides consistent form behavior following Liskov Substitution Principle
 */
export function useBaseForm<TData extends Record<string, unknown>>(
  config: FormHookConfig<TData> = {}
): FormHookReturn<TData> {
  
  // Initialize form data
  const [data, setDataInternal] = useState<TData>(() => {
    return { ...config.initialData } as TData;
  });

  // Initialize form state
  const [state, setStateInternal] = useState<BaseFormState>({
    isSubmitting: false,
    isValidating: false,
    isValid: true,
    isDirty: false,
    errors: {},
    globalError: null,
    submitCount: 0,
  });

  // Track initial data for dirty checking
  const [initialData] = useState<TData>(() => ({ ...config.initialData } as TData));

  // =============================================================================
  // VALIDATION HELPERS
  // =============================================================================

  const validateField = useCallback(async (
    field: keyof TData, 
    value: unknown, 
    schema?: FieldValidationSchema
  ): Promise<string | null> => {
    if (!schema) return null;

    for (const rule of schema.rules) {
      let isValid = true;
      
      switch (rule.type) {
        case 'required':
          isValid = value !== null && value !== undefined && value !== '';
          break;
        case 'email':
          isValid = typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          break;
        case 'minLength':
          isValid = typeof value === 'string' && value.length >= (rule.value as number);
          break;
        case 'maxLength':
          isValid = typeof value === 'string' && value.length <= (rule.value as number);
          break;
        case 'pattern':
          isValid = typeof value === 'string' && (rule.value as RegExp).test(value);
          break;
        case 'custom':
          if (rule.validator) {
            const result = await rule.validator(value, data);
            isValid = result;
          }
          break;
      }

      if (!isValid) {
        return rule.message;
      }
    }

    return null;
  }, [data]);

  const validate = useCallback(async (): Promise<FormValidationResult> => {
    setStateInternal(prev => ({ ...prev, isValidating: true }));

    const fieldErrors: Record<string, string> = {};
    
    // Validate individual fields
    if (config.validationSchema?.fields) {
      for (const [fieldName, fieldSchema] of Object.entries(config.validationSchema.fields)) {
        const fieldValue = data[fieldName as keyof TData];
        const error = await validateField(fieldName as keyof TData, fieldValue, fieldSchema);
        if (error) {
          fieldErrors[fieldName] = error;
        }
      }
    }

    // Global validation
    let globalError: string | undefined;
    if (config.validationSchema?.globalValidation) {
      try {
        const globalResult = await config.validationSchema.globalValidation(data);
        if (!globalResult.isValid) {
          globalError = globalResult.globalError;
          Object.assign(fieldErrors, globalResult.fieldErrors || {});
        }
      } catch (error) {
        globalError = error instanceof Error ? error.message : 'Validation failed';
      }
    }

    const isValid = Object.keys(fieldErrors).length === 0 && !globalError;
    
    setStateInternal(prev => ({
      ...prev,
      isValidating: false,
      isValid,
      errors: fieldErrors,
      globalError: globalError || null,
    }));

    return {
      isValid,
      fieldErrors,
      globalError,
    };
  }, [data, config.validationSchema, validateField]);

  // =============================================================================
  // STATE MANAGEMENT ACTIONS
  // =============================================================================

  const setData = useCallback((newData: Partial<TData>) => {
    setDataInternal(prev => {
      const updated = { ...prev, ...newData };
      
      // Update dirty state
      const isDirty = JSON.stringify(updated) !== JSON.stringify(initialData);
      setStateInternal(prevState => ({ ...prevState, isDirty }));
      
      // Auto-validate on change if enabled
      if (config.validateOnChange) {
        setTimeout(() => validate(), 0);
      }
      
      return updated;
    });
  }, [config.validateOnChange, validate, initialData]);

  const setFieldValue = useCallback((field: keyof TData, value: unknown) => {
    setData({ [field]: value } as Partial<TData>);
  }, [setData]);

  const setFieldError = useCallback((field: string, error: string) => {
    setStateInternal(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      isValid: false,
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setStateInternal(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0 && !prev.globalError,
      };
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setStateInternal(prev => ({
      ...prev,
      errors: {},
      globalError: null,
      isValid: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setDataInternal({ ...config.initialData } as TData);
    setStateInternal({
      isSubmitting: false,
      isValidating: false,
      isValid: true,
      isDirty: false,
      errors: {},
      globalError: null,
      submitCount: 0,
    });
  }, [config.initialData]);

  // =============================================================================
  // SUBMISSION
  // =============================================================================

  const submit = useCallback(async (): Promise<FormSubmissionResult> => {
    setStateInternal(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      submitCount: prev.submitCount + 1 
    }));

    try {
      // Validate before submission
      const validationResult = await validate();
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.globalError || 'Validation failed',
          fieldErrors: validationResult.fieldErrors,
        };
      }

      // Submit data
      let result: FormSubmissionResult;
      if (config.onSubmit) {
        result = await config.onSubmit(data);
      } else {
        result = { success: true, data };
      }

      if (result.success && config.resetOnSuccess) {
        reset();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed',
      };
    } finally {
      setStateInternal(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [data, validate, config.onSubmit, config.resetOnSuccess, reset]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  }, [submit]);

  const handleReset = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    reset();
  }, [reset]);

  const handleFieldChange = useCallback((field: keyof TData) => (value: unknown) => {
    setFieldValue(field, value);
  }, [setFieldValue]);

  const handleFieldBlur = useCallback((field: keyof TData) => () => {
    if (config.validateOnBlur) {
      const fieldSchema = config.validationSchema?.fields?.[field];
      if (fieldSchema) {
        validateField(field, data[field], fieldSchema).then(error => {
          if (error) {
            setFieldError(field as string, error);
          } else {
            clearFieldError(field as string);
          }
        });
      }
    }
  }, [config.validateOnBlur, config.validationSchema, data, validateField, setFieldError, clearFieldError]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const computed = useMemo(() => {
    const canSubmit = !state.isSubmitting && !state.isValidating && state.isValid;
    const hasErrors = Object.keys(state.errors).length > 0 || !!state.globalError;
    const isClean = !state.isDirty;
    
    // Calculate changed fields
    const changedFields: string[] = [];
    for (const key in data) {
      if (JSON.stringify(data[key]) !== JSON.stringify(initialData[key])) {
        changedFields.push(key);
      }
    }

    return {
      canSubmit,
      hasErrors,
      isClean,
      changedFields,
    };
  }, [state, data, initialData]);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    // State
    state,
    data,
    
    // Actions
    actions: {
      setData,
      setFieldValue,
      setFieldError,
      clearFieldError,
      clearAllErrors,
      reset,
      submit,
      validate,
    },
    
    // Computed values
    computed,
    
    // Event handlers
    handlers: {
      handleSubmit,
      handleReset,
      handleFieldChange,
      handleFieldBlur,
    },
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Create validation rules
 */
export const ValidationRules = {
  required: (message = 'This field is required'): FieldValidationRule => ({
    type: 'required',
    message,
  }),
  
  email: (message = 'Please enter a valid email address'): FieldValidationRule => ({
    type: 'email',
    message,
  }),
  
  minLength: (length: number, message?: string): FieldValidationRule => ({
    type: 'minLength',
    value: length,
    message: message || `Must be at least ${length} characters long`,
  }),
  
  maxLength: (length: number, message?: string): FieldValidationRule => ({
    type: 'maxLength',
    value: length,
    message: message || `Must be no more than ${length} characters long`,
  }),
  
  pattern: (regex: RegExp, message: string): FieldValidationRule => ({
    type: 'pattern',
    value: regex,
    message,
  }),
  
  custom: (
    validator: (value: unknown, data: Record<string, unknown>) => boolean | Promise<boolean>,
    message: string
  ): FieldValidationRule => ({
    type: 'custom',
    validator,
    message,
  }),
};

/**
 * Create field validation schema
 */
export function createFieldSchema(
  rules: FieldValidationRule[],
  validateOn: 'change' | 'blur' | 'submit' = 'submit'
): FieldValidationSchema {
  return {
    rules,
    validateOn,
  };
}

/**
 * Create form validation schema
 */
export function createFormSchema<TData>(
  fields: Record<keyof TData, FieldValidationSchema>,
  globalValidation?: (data: TData) => FormValidationResult | Promise<FormValidationResult>
): FormValidationSchema<TData> {
  return {
    fields,
    globalValidation,
  };
}

export default useBaseForm;