/**
 * Standardized Register Form Component
 * SOLID: Liskov Substitution Principle - Uses BaseForm for consistent behavior
 * Can be substituted with any other standardized form
 */

import React, { useState, useMemo } from 'react';
import { LiquidInput } from '../liquid-glass';
import { useBasicAuth } from '../../contexts/AuthContext.tsx';
import { BaseForm, FormField } from './BaseForm.tsx';
import { useBaseForm, ValidationRules, createFieldSchema, createFormSchema } from '../../hooks/useBaseForm.ts';
import type { RegisterFormData, FormSubmissionResult } from '../../interfaces/forms.ts';

// =============================================================================
// FORM DATA AND VALIDATION
// =============================================================================

interface RegisterFormFields extends RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  termsAccepted: boolean;
}

// Advanced validation schema with cross-field validation
const registerValidationSchema = createFormSchema<RegisterFormFields>({
  email: createFieldSchema([
    ValidationRules.required('Email is required'),
    ValidationRules.email('Please enter a valid email address'),
  ]),
  password: createFieldSchema([
    ValidationRules.required('Password is required'),
    ValidationRules.minLength(8, 'Password must be at least 8 characters'),
    ValidationRules.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  ]),
  confirmPassword: createFieldSchema([
    ValidationRules.required('Please confirm your password'),
  ]),
  termsAccepted: createFieldSchema([
    ValidationRules.custom(
      (value) => Boolean(value),
      'You must accept the terms and conditions'
    ),
  ]),
}, async (data) => {
  // Global validation for password confirmation
  const errors: Record<string, string> = {};
  
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    fieldErrors: errors,
    globalError: Object.keys(errors).length > 0 ? 'Please fix the errors above' : undefined,
  };
});

// =============================================================================
// STANDARDIZED REGISTER FORM PROPS
// =============================================================================

export interface StandardizedRegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  autoFocus?: boolean;
  showOptionalFields?: boolean;
}

// =============================================================================
// PASSWORD STRENGTH COMPONENT
// =============================================================================

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'No password', color: 'text-gray-400', suggestions: [] };
  }

  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  // Uppercase check
  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Add uppercase letters');

  // Lowercase check
  if (/[a-z]/.test(password)) score++;
  else suggestions.push('Add lowercase letters');

  // Number check
  if (/\d/.test(password)) score++;
  else suggestions.push('Add numbers');

  // Special character check
  if (/[@$!%*?&]/.test(password)) score++;
  else suggestions.push('Add special characters (@$!%*?&)');

  const strengthLevels = [
    { score: 0, label: 'Very Weak', color: 'text-red-500' },
    { score: 1, label: 'Weak', color: 'text-red-400' },
    { score: 2, label: 'Fair', color: 'text-yellow-500' },
    { score: 3, label: 'Good', color: 'text-yellow-400' },
    { score: 4, label: 'Strong', color: 'text-green-400' },
    { score: 5, label: 'Very Strong', color: 'text-green-500' },
  ];

  const strength = strengthLevels[Math.min(score, 5)];
  
  return {
    score,
    label: strength.label,
    color: strength.color,
    suggestions,
  };
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">Password Strength:</span>
        <span className={`text-sm font-medium ${strength.color}`}>
          {strength.label}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-black/30 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            strength.score <= 1 ? 'bg-red-500' :
            strength.score <= 2 ? 'bg-yellow-500' :
            strength.score <= 3 ? 'bg-yellow-400' :
            'bg-green-400'
          }`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>
      
      {/* Suggestions */}
      {strength.suggestions.length > 0 && (
        <ul className="text-xs text-white/50 space-y-1 mt-2">
          {strength.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-center">
              <span className="w-1 h-1 bg-white/50 rounded-full mr-2" />
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// =============================================================================
// FORM FIELD RENDERER
// =============================================================================

function renderRegisterFields(
  formHook: ReturnType<typeof useBaseForm<RegisterFormFields>>,
  options: {
    showOptionalFields?: boolean;
    onSwitchToLogin?: () => void;
  } = {}
) {
  const { data, state, handlers } = formHook;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      {/* Optional Username Field */}
      {options.showOptionalFields && (
        <FormField error={state.errors.username}>
          <LiquidInput
            type="text"
            label="Username (Optional)"
            placeholder="Choose a username"
            value={data.username || ''}
            onChange={(e) => handlers.handleFieldChange('username')(e.target.value)}
            onBlur={handlers.handleFieldBlur('username')}
            disabled={state.isSubmitting}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            autoComplete="username"
          />
        </FormField>
      )}

      {/* Optional Name Fields */}
      {options.showOptionalFields && (
        <div className="grid grid-cols-2 gap-4">
          <FormField error={state.errors.firstName}>
            <LiquidInput
              type="text"
              label="First Name (Optional)"
              placeholder="First name"
              value={data.firstName || ''}
              onChange={(e) => handlers.handleFieldChange('firstName')(e.target.value)}
              disabled={state.isSubmitting}
              autoComplete="given-name"
            />
          </FormField>

          <FormField error={state.errors.lastName}>
            <LiquidInput
              type="text"
              label="Last Name (Optional)"
              placeholder="Last name"
              value={data.lastName || ''}
              onChange={(e) => handlers.handleFieldChange('lastName')(e.target.value)}
              disabled={state.isSubmitting}
              autoComplete="family-name"
            />
          </FormField>
        </div>
      )}

      {/* Password Field with Strength Indicator */}
      <FormField error={state.errors.password}>
        <LiquidInput
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Create a strong password"
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
          autoComplete="new-password"
        />
        <PasswordStrengthIndicator password={data.password || ''} />
      </FormField>

      {/* Confirm Password Field */}
      <FormField error={state.errors.confirmPassword}>
        <LiquidInput
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          placeholder="Confirm your password"
          value={data.confirmPassword || ''}
          onChange={(e) => handlers.handleFieldChange('confirmPassword')(e.target.value)}
          onBlur={handlers.handleFieldBlur('confirmPassword')}
          error={!!state.errors.confirmPassword}
          disabled={state.isSubmitting}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 text-white/60 hover:text-white transition-colors"
              disabled={state.isSubmitting}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          }
          required
          autoComplete="new-password"
        />
      </FormField>

      {/* Terms and Conditions */}
      <FormField error={state.errors.termsAccepted}>
        <label className="flex items-start space-x-3 text-sm text-white/80 cursor-pointer">
          <input
            type="checkbox"
            checked={data.termsAccepted || false}
            onChange={(e) => handlers.handleFieldChange('termsAccepted')(e.target.checked)}
            disabled={state.isSubmitting}
            className="mt-1 w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2 transition-all"
            required
          />
          <span className="leading-relaxed">
            I agree to the{' '}
            <button
              type="button"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button
              type="button"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Privacy Policy
            </button>
          </span>
        </label>
      </FormField>
    </>
  );
}

// =============================================================================
// STANDARDIZED REGISTER FORM COMPONENT
// =============================================================================

export const StandardizedRegisterForm: React.FC<StandardizedRegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  className = '',
  title = 'Create Account',
  subtitle = 'Join us and start converting your content',
  showTitle = true,
  autoFocus = true,
  showOptionalFields = false,
}) => {
  
  // SOLID: Interface Segregation - Only use basic auth features
  const { register } = useBasicAuth();

  // Form submission handler
  const handleSubmit = async (data: RegisterFormFields): Promise<FormSubmissionResult> => {
    try {
      await register({
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        terms_accepted: data.termsAccepted,
      });
      
      onSuccess?.();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`.trim()}>
      <BaseForm
        initialData={{
          email: '',
          password: '',
          confirmPassword: '',
          username: '',
          firstName: '',
          lastName: '',
          termsAccepted: false,
        }}
        validationSchema={registerValidationSchema}
        onSubmit={handleSubmit}
        onSuccess={onSuccess}
        title={title}
        subtitle={subtitle}
        showTitle={showTitle}
        autoFocus={autoFocus}
        submitButtonText="Create Account"
        className="w-full"
        renderFields={(formHook) => renderRegisterFields(formHook, { 
          showOptionalFields, 
          onSwitchToLogin 
        })}
        renderActions={(formHook) => (
          <div className="space-y-4">
            {/* Submit Button */}
            {(BaseForm.defaultProps?.renderActions && BaseForm.defaultProps.renderActions(formHook)) || (
              <button
                type="submit"
                disabled={!formHook.computed.canSubmit}
                className="w-full py-3 px-6 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-glass transition-all shadow-glass hover:shadow-glass-lg"
              >
                {formHook.state.isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            )}

            {/* Switch to Login */}
            {onSwitchToLogin && (
              <div className="text-center pt-4">
                <p className="text-white/60 text-sm">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    disabled={formHook.state.isSubmitting}
                    className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default StandardizedRegisterForm;