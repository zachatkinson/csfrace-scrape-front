/**
 * Unified Form Submission Hook
 * SOLID: Single Responsibility - Handles only form submission logic
 * DRY: Consolidates duplicate form submission patterns from 11+ components
 * Following established FormSubmissionResult interface
 */

import { useState, useCallback } from 'react';
import type { FormSubmissionResult } from '../interfaces/forms.ts';
import { logError, isEnhancedApiError } from '../utils/api-utils.ts';

export interface UseFormSubmissionOptions<TData> {
  onSuccess?: ((data?: TData) => void) | undefined;
  onError?: ((error: string, fieldErrors?: Record<string, string>) => void) | undefined;
  resetFormOnSuccess?: boolean;
  logContext?: string;
}

export interface UseFormSubmissionState {
  isSubmitting: boolean;
  lastSubmissionResult?: FormSubmissionResult | undefined;
  hasSubmitted: boolean;
}

export function useFormSubmission<TData = Record<string, unknown>>(
  submitFunction: (data: TData) => Promise<void> | Promise<FormSubmissionResult>,
  options: UseFormSubmissionOptions<TData> = {}
) {
  const {
    onSuccess,
    onError,
    resetFormOnSuccess = false,
    logContext = 'Form Submission'
  } = options;

  const [state, setState] = useState<UseFormSubmissionState>({
    isSubmitting: false,
    hasSubmitted: false
  });

  const handleSubmit = useCallback(async (data: TData): Promise<FormSubmissionResult> => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      hasSubmitted: true
    }));

    try {
      // Call the provided submit function
      const result = await submitFunction(data);

      // Handle different return types
      let submissionResult: FormSubmissionResult;

      if (result && typeof result === 'object' && 'success' in result) {
        // Function returned a FormSubmissionResult
        submissionResult = result as FormSubmissionResult;
      } else {
        // Function returned void or other value, assume success
        submissionResult = { success: true, data };
      }

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        lastSubmissionResult: submissionResult
      }));

      if (submissionResult.success) {
        onSuccess?.(submissionResult.data || data);

        // Reset form if requested (caller would need to handle this)
        if (resetFormOnSuccess) {
          // Emit custom event for form reset
          const resetEvent = new CustomEvent('formReset', { detail: { data } });
          window.dispatchEvent(resetEvent);
        }
      } else {
        // Handle submission errors
        const errorMessage = submissionResult.error || 'Submission failed';
        const fieldErrors = submissionResult.fieldErrors;

        onError?.(errorMessage, fieldErrors);
        logError(new Error(errorMessage), logContext);
      }

      return submissionResult;

    } catch (error) {
      // Handle unexpected errors
      let errorMessage = 'Submission failed';
      let fieldErrors: Record<string, string> | undefined;

      if (isEnhancedApiError(error)) {
        errorMessage = error.message;
        if (error.hasValidationErrors()) {
          fieldErrors = error.getFormValidationErrors();
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      const failureResult: FormSubmissionResult = {
        success: false,
        error: errorMessage,
        fieldErrors
      };

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        lastSubmissionResult: failureResult
      }));

      onError?.(errorMessage, fieldErrors);
      logError(error, logContext);

      return failureResult;
    }
  }, [submitFunction, onSuccess, onError, resetFormOnSuccess, logContext]);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      hasSubmitted: false,
      lastSubmissionResult: undefined
    });
  }, []);

  return {
    // State
    ...state,

    // Actions
    handleSubmit,
    reset,

    // Computed state
    isSuccess: state.lastSubmissionResult?.success === true,
    isError: state.lastSubmissionResult?.success === false,
    errorMessage: state.lastSubmissionResult?.error,
    fieldErrors: state.lastSubmissionResult?.fieldErrors
  };
}

/**
 * Specialized form submission hook for authentication forms
 * SOLID: Interface Segregation - Auth-specific submission handling
 */
export function useAuthFormSubmission<TData = Record<string, unknown>>(
  authFunction: (data: TData) => Promise<void>,
  options: UseFormSubmissionOptions<TData> = {}
) {
  return useFormSubmission(
    async (data: TData) => {
      await authFunction(data);
      return { success: true };
    },
    {
      logContext: 'Authentication',
      ...options
    }
  );
}

/**
 * Specialized form submission hook for API calls
 * SOLID: Interface Segregation - API-specific submission handling
 */
export function useApiFormSubmission<TData = Record<string, unknown>, TResponse = unknown>(
  apiFunction: (data: TData) => Promise<TResponse>,
  options: UseFormSubmissionOptions<TData> = {}
) {
  return useFormSubmission(
    async (data: TData) => {
      const response = await apiFunction(data);
      return { success: true, data: response };
    },
    {
      logContext: 'API Call',
      ...options
    }
  );
}