/**
 * Standardized Login Form Component
 * SOLID: Liskov Substitution Principle - Uses BaseForm for consistent behavior
 * This demonstrates how the LoginForm should be refactored to fix LSP violations
 */

import React, { useState } from 'react';
import { LiquidInput, LiquidButton } from '../liquid-glass';
import { useBasicAuth } from '../../contexts/AuthContext.tsx';
import { createFormComponent, FormField } from './BaseForm.tsx';
import { useBaseForm, ValidationRules, createFieldSchema, createFormSchema } from '../../hooks/useBaseForm.ts';
import type { LoginFormData, FormSubmissionResult } from '../../interfaces/forms.ts';

// =============================================================================
// FORM DATA AND VALIDATION
// =============================================================================

// Define the form data structure
interface LoginFormFields extends LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Create validation schema
const loginValidationSchema = createFormSchema<LoginFormFields>({
  email: createFieldSchema([
    ValidationRules.required('Email is required'),
    ValidationRules.email('Please enter a valid email address'),
  ]),
  password: createFieldSchema([
    ValidationRules.required('Password is required'),
    ValidationRules.minLength(6, 'Password must be at least 6 characters'),
  ]),
});

// =============================================================================
// STANDARDIZED LOGIN FORM PROPS
// =============================================================================

export interface StandardizedLoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  className?: string;
  
  // Optional form customization (inherited from BaseForm)
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  autoFocus?: boolean;
}

// =============================================================================
// FORM FIELD RENDERER
// =============================================================================

function renderLoginFields(
  formHook: ReturnType<typeof useBaseForm<LoginFormFields>>,
  options: {
    onSwitchToRegister?: () => void;
    onForgotPassword?: () => void;
  } = {}
) {
  const { data, state, handlers } = formHook;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Email Field */}
      <FormField error={state.errors.email}>
        <LiquidInput
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          value={data.email || ''}
          onChange={(e) => handlers.handleFieldChange('email')(e.target.value)}
          onBlur={handlers.handleFieldBlur('email')}
          error={!!state.errors.email}
          disabled={state.isSubmitting}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          }
          required
          autoComplete="email"
          autoFocus
        />
      </FormField>

      {/* Password Field */}
      <FormField error={state.errors.password}>
        <LiquidInput
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Enter your password"
          value={data.password || ''}
          onChange={(e) => handlers.handleFieldChange('password')(e.target.value)}
          onBlur={handlers.handleFieldBlur('password')}
          error={!!state.errors.password}
          disabled={state.isSubmitting}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-white/60 hover:text-white transition-colors"
              disabled={state.isSubmitting}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
          required
          autoComplete="current-password"
        />
      </FormField>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={data.rememberMe || false}
            onChange={(e) => handlers.handleFieldChange('rememberMe')(e.target.checked)}
            disabled={state.isSubmitting}
            className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2 transition-all"
          />
          <span>Remember me</span>
        </label>

        {options.onForgotPassword && (
          <button
            type="button"
            onClick={options.onForgotPassword}
            disabled={state.isSubmitting}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            Forgot password?
          </button>
        )}
      </div>
    </>
  );
}

// =============================================================================
// FORM ACTIONS RENDERER
// =============================================================================

function renderLoginActions(
  formHook: ReturnType<typeof useBaseForm<LoginFormFields>>,
  options: {
    onSwitchToRegister?: () => void;
  } = {}
) {
  const { state, computed } = formHook;

  return (
    <div className="space-y-4">
      {/* Submit Button */}
      <LiquidButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={state.isSubmitting}
        disabled={!computed.canSubmit}
        leftIcon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        }
      >
        {state.isSubmitting ? 'Signing In...' : 'Sign In'}
      </LiquidButton>

      {/* Switch to Register */}
      {options.onSwitchToRegister && (
        <div className="text-center pt-4">
          <p className="text-white/60 text-sm">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={options.onSwitchToRegister}
              disabled={state.isSubmitting}
              className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      )}

      {/* Social Login Placeholder */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-black/50 text-white/60">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LiquidButton
          type="button"
          variant="secondary"
          size="md"
          disabled={true} // Will enable when OAuth is implemented
          leftIcon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          }
        >
          Google
        </LiquidButton>

        <LiquidButton
          type="button"
          variant="secondary"
          size="md"
          disabled={true} // Will enable when WebAuthn is implemented
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          }
        >
          Passkey
        </LiquidButton>
      </div>
    </div>
  );
}

// =============================================================================
// STANDARDIZED LOGIN FORM COMPONENT
// =============================================================================

/**
 * Standardized Login Form
 * SOLID: Liskov Substitution - Can be substituted with any other standardized form
 * Uses BaseForm for consistent behavior and interface
 */
export const StandardizedLoginForm: React.FC<StandardizedLoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
  className = '',
  title = 'Welcome Back',
  subtitle = 'Sign in to your account to continue',
  showTitle = true,
  autoFocus = true,
}) => {
  
  // SOLID: Interface Segregation - Only use basic auth features
  const { login } = useBasicAuth();

  // Form submission handler
  const handleSubmit = async (data: LoginFormFields): Promise<FormSubmissionResult> => {
    try {
      await login({
        email: data.email,
        password: data.password,
        remember_me: data.rememberMe,
      });
      
      onSuccess?.();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  // =============================================================================
  // RENDER STANDARDIZED FORM
  // =============================================================================

  return (
    <div className={`w-full max-w-md mx-auto ${className}`.trim()}>
      {/* Use the createFormComponent helper for consistency */}
      {React.createElement(
        createFormComponent<LoginFormFields>({
          displayName: 'LoginForm',
          defaultTitle: title,
          defaultSubtitle: subtitle,
          validationSchema: loginValidationSchema,
          renderFields: (formHook) => renderLoginFields(formHook, { onSwitchToRegister, onForgotPassword }),
          renderActions: (formHook) => renderLoginActions(formHook, { onSwitchToRegister }),
        }),
        {
          initialData: { email: '', password: '', rememberMe: false },
          onSubmit: handleSubmit,
          onSuccess,
          title,
          subtitle,
          showTitle,
          autoFocus,
          className: 'w-full',
        }
      )}
    </div>
  );
};

// Alternative direct implementation using BaseForm
export const DirectStandardizedLoginForm: React.FC<StandardizedLoginFormProps> = (props) => (
  <div className={`w-full max-w-md mx-auto ${props.className || ''}`.trim()}>
    {/* Direct BaseForm usage - also follows LSP */}
    {React.createElement(BaseForm, {
      ...props,
      initialData: { email: '', password: '', rememberMe: false },
      validationSchema: loginValidationSchema,
      title: props.title || 'Welcome Back',
      subtitle: props.subtitle || 'Sign in to your account to continue',
      renderFields: (formHook) => renderLoginFields(formHook, { 
        onSwitchToRegister: props.onSwitchToRegister, 
        onForgotPassword: props.onForgotPassword 
      }),
      renderActions: (formHook) => renderLoginActions(formHook, { 
        onSwitchToRegister: props.onSwitchToRegister 
      }),
    })}
  </div>
);

export default StandardizedLoginForm;