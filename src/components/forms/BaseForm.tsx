/**
 * Base Form Component
 * SOLID: Liskov Substitution Principle - Common form interface
 * All form components can inherit from this to ensure substitutability
 */

import React, { forwardRef } from 'react';
import { LiquidCard, LiquidButton } from '../liquid-glass';
import { useBaseForm } from '../../hooks/useBaseForm.ts';
import type {
  FormComponentProps,
  StandardFormComponent,
  FormValidationSchema
} from '../../interfaces/forms.ts';

// =============================================================================
// BASE FORM COMPONENT
// =============================================================================

/**
 * Base Form Component Implementation
 * Provides consistent behavior that all forms inherit
 * Following Liskov Substitution Principle
 */
export const BaseForm = forwardRef<
  HTMLFormElement,
  FormComponentProps<any> & {
    // Common form structure
    renderFields: (formHook: ReturnType<typeof useBaseForm<any>>) => React.ReactNode;
    renderActions?: ((formHook: ReturnType<typeof useBaseForm<any>>) => React.ReactNode) | undefined;
    
    // Form configuration
    showTitle?: boolean | undefined;
    showReset?: boolean | undefined;
    submitButtonText?: string | undefined;
    resetButtonText?: string | undefined;

    // Card styling
    cardClassName?: string | undefined;
    formClassName?: string | undefined;
  }
>(({
  // Base form props
  initialData,
  validationSchema,
  onSubmit,
  onSuccess,
  onError,
  onStateChange,
  validateOnChange = false,
  validateOnBlur = true,
  className = '',
  title,
  subtitle,
  disabled = false,
  isLoading = false,
  autoFocus = true,
  resetOnSuccess = false,
  
  // Component-specific props
  renderFields,
  renderActions,
  showTitle = true,
  showReset = false,
  submitButtonText = 'Submit',
  resetButtonText = 'Reset',
  cardClassName = '',
  formClassName = '',
  
  children,
  ...props
}, ref) => {

  // =============================================================================
  // FORM HOOK - CONSISTENT BEHAVIOR
  // =============================================================================

  const formHook = useBaseForm({
    initialData,
    validationSchema,
    onSubmit: async (data) => {
      try {
        const result = onSubmit ? await onSubmit(data) : { success: true, data };
        
        if (result.success) {
          onSuccess?.(result.data);
        } else {
          onError?.(result.error || 'Submission failed', result.fieldErrors);
        }
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Submission failed';
        onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    validateOnChange,
    validateOnBlur,
    resetOnSuccess,
  });

  const { state, computed, handlers } = formHook;

  // Notify parent of state changes
  React.useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // =============================================================================
  // CONSISTENT ERROR DISPLAY
  // =============================================================================

  const renderGlobalError = () => {
    if (!state.globalError) return null;
    
    return (
      <div className="p-4 rounded-glass bg-red-500/20 border border-red-500/30 text-red-100 text-sm mb-6">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Form Error</p>
            <p className="mt-1">{state.globalError}</p>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================================
  // CONSISTENT ACTION BUTTONS
  // =============================================================================

  const renderDefaultActions = () => (
    <div className="flex gap-4">
      <LiquidButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth={!showReset}
        loading={state.isSubmitting || isLoading}
        disabled={!computed.canSubmit || disabled}
        leftIcon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
      >
        {state.isSubmitting ? 'Submitting...' : submitButtonText}
      </LiquidButton>
      
      {showReset && (
        <LiquidButton
          type="button"
          variant="secondary"
          size="lg"
          onClick={handlers.handleReset}
          disabled={state.isSubmitting || isLoading || disabled}
        >
          {resetButtonText}
        </LiquidButton>
      )}
    </div>
  );

  // =============================================================================
  // CONSISTENT FORM STRUCTURE
  // =============================================================================

  const formContent = (
    <form 
      ref={ref}
      onSubmit={handlers.handleSubmit}
      onReset={handlers.handleReset}
      className={`space-y-6 ${formClassName}`.trim()}
      noValidate
      {...props}
    >
      {/* Global Error Display */}
      {renderGlobalError()}

      {/* Form Fields */}
      {renderFields(formHook)}
      
      {/* Render children if provided (for custom content) */}
      {typeof children === 'function' ? children(formHook) : children}

      {/* Action Buttons */}
      {renderActions ? renderActions(formHook) : renderDefaultActions()}
    </form>
  );

  // =============================================================================
  // CONSISTENT WRAPPER
  // =============================================================================

  if (showTitle && (title || subtitle)) {
    return (
      <div className={className}>
        <LiquidCard
          title={title}
          subtitle={subtitle}
          className={`w-full ${cardClassName}`.trim()}
        >
          {formContent}
        </LiquidCard>
      </div>
    );
  }

  return (
    <div className={className}>
      {formContent}
    </div>
  );
});

BaseForm.displayName = 'BaseForm';

// =============================================================================
// FORM FIELD COMPONENTS
// =============================================================================

/**
 * Standardized Form Field Wrapper
 * Consistent field styling and error handling
 */
export const FormField: React.FC<{
  children: React.ReactNode;
  error?: string | undefined;
  className?: string | undefined;
}> = ({ children, error, className = '' }) => (
  <div className={`form-field ${className}`.trim()}>
    {children}
    {error && (
      <p className="mt-2 text-sm text-red-400 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

// =============================================================================
// FORM SECTION COMPONENT
// =============================================================================

/**
 * Form Section for Grouping Related Fields
 * Useful for settings forms with multiple sections
 */
export const FormSection: React.FC<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = '' }) => (
  <div className={`form-section ${className}`.trim()}>
    {(title || subtitle) && (
      <div className="form-section-header mb-4">
        {title && <h3 className="text-lg font-medium text-white">{title}</h3>}
        {subtitle && <p className="text-sm text-white/60 mt-1">{subtitle}</p>}
      </div>
    )}
    <div className="form-section-content space-y-4">
      {children}
    </div>
  </div>
);

// =============================================================================
// HIGHER-ORDER COMPONENT FOR FORM CREATION
// =============================================================================

/**
 * Create a standardized form component
 * Ensures all forms follow Liskov Substitution Principle
 */
export function createFormComponent<TData extends Record<string, unknown>>(
  config: {
    displayName: string;
    defaultTitle?: string;
    defaultSubtitle?: string;
    validationSchema?: FormValidationSchema<TData>;
    renderFields: (formHook: ReturnType<typeof useBaseForm<TData>>) => React.ReactNode;
    renderActions?: ((formHook: ReturnType<typeof useBaseForm<TData>>) => React.ReactNode) | undefined;
  }
): StandardFormComponent<TData> {
  
  const FormComponent: StandardFormComponent<TData> = (props) => (
    <BaseForm
      {...props}
      title={props.title || config.defaultTitle}
      subtitle={props.subtitle || config.defaultSubtitle}
      validationSchema={props.validationSchema || config.validationSchema}
      renderFields={config.renderFields}
      renderActions={config.renderActions}
    />
  );
  
  FormComponent.displayName = config.displayName;
  
  return FormComponent;
}

export default BaseForm;