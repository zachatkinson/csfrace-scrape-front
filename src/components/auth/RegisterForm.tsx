/**
 * Registration Form Component
 * Modern registration form with comprehensive validation and Liquid Glass design
 */

import React, { useState, useCallback, useMemo } from 'react';
import { LiquidCard, LiquidInput, LiquidButton } from '../liquid-glass';
import { useAuth } from '../../contexts/AuthContext.tsx';
import type { RegisterData } from '../../types/auth.ts';

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  className = '',
}) => {
  const { register, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirm_password: '',
    username: '',
    first_name: '',
    last_name: '',
    terms_accepted: false,
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo((): PasswordStrength => {
    const password = formData.password;
    if (!password) {
      return { score: 0, label: 'No password', color: 'text-gray-400', suggestions: [] };
    }

    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Include lowercase letters');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Include uppercase letters');

    // Number check
    if (/\d/.test(password)) score += 1;
    else suggestions.push('Include numbers');

    // Special character check
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else suggestions.push('Include special characters');

    // Common patterns penalty
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/123|abc|password|qwerty/i.test(password)) score -= 2; // Common patterns

    const finalScore = Math.max(0, Math.min(5, score));

    const strengthMap = {
      0: { label: 'Very Weak', color: 'text-red-400' },
      1: { label: 'Weak', color: 'text-red-400' },
      2: { label: 'Fair', color: 'text-orange-400' },
      3: { label: 'Good', color: 'text-yellow-400' },
      4: { label: 'Strong', color: 'text-green-400' },
      5: { label: 'Very Strong', color: 'text-green-400' },
    };

    return {
      score: finalScore,
      label: strengthMap[finalScore as keyof typeof strengthMap].label,
      color: strengthMap[finalScore as keyof typeof strengthMap].color,
      suggestions: suggestions.slice(0, 3), // Show max 3 suggestions
    };
  }, [formData.password]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Username validation (optional but if provided, must be valid)
    if (formData.username && !/^[a-zA-Z0-9_-]{3,20}$/.test(formData.username)) {
      errors.username = 'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      errors.password = 'Please choose a stronger password';
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      errors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    // Terms validation
    if (!formData.terms_accepted) {
      errors.terms_accepted = 'Please accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, passwordStrength]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    if (!validateForm()) {
      return;
    }

    clearError();

    try {
      await register(formData);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
      console.error('Registration failed:', error);
    }
  }, [formData, validateForm, clearError, register, onSuccess]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof RegisterData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    // Clear global error
    if (error) {
      clearError();
    }
  }, [validationErrors, error, clearError]);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`.trim()}>
      <LiquidCard
        title="Create Account"
        subtitle="Join us and start converting WordPress content"
        className="w-full"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Error Display */}
          {error && (
            <div className="p-4 rounded-glass bg-red-500/20 border border-red-500/30 text-red-100 text-sm">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Registration Failed</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <LiquidInput
              type="text"
              label="First Name"
              placeholder="John"
              value={formData.first_name}
              onChange={handleInputChange('first_name')}
              disabled={isLoading}
              autoComplete="given-name"
            />
            <LiquidInput
              type="text"
              label="Last Name"
              placeholder="Doe"
              value={formData.last_name}
              onChange={handleInputChange('last_name')}
              disabled={isLoading}
              autoComplete="family-name"
            />
          </div>

          {/* Email Field */}
          <LiquidInput
            type="email"
            label="Email Address"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!validationErrors.email}
            errorText={validationErrors.email}
            disabled={isLoading}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
            required
            autoComplete="email"
          />

          {/* Username Field */}
          <LiquidInput
            type="text"
            label="Username (Optional)"
            placeholder="johndoe"
            value={formData.username}
            onChange={handleInputChange('username')}
            error={!!validationErrors.username}
            errorText={validationErrors.username}
            helperText="3-20 characters, letters, numbers, hyphens, and underscores only"
            disabled={isLoading}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            autoComplete="username"
          />

          {/* Password Field */}
          <div className="space-y-2">
            <LiquidInput
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter a strong password"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!validationErrors.password}
              errorText={validationErrors.password}
              disabled={isLoading}
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
                  disabled={isLoading}
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

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Password Strength:</span>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.score
                          ? passwordStrength.score <= 2
                            ? 'bg-red-400'
                            : passwordStrength.score <= 3
                            ? 'bg-orange-400'
                            : 'bg-green-400'
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.suggestions.length > 0 && (
                  <div className="text-xs text-white/60">
                    <p>Suggestions:</p>
                    <ul className="ml-4 list-disc">
                      {passwordStrength.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <LiquidInput
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirm_password}
            onChange={handleInputChange('confirm_password')}
            error={!!validationErrors.confirm_password}
            errorText={validationErrors.confirm_password}
            disabled={isLoading}
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
                disabled={isLoading}
              >
                {showConfirmPassword ? (
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

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.terms_accepted}
                onChange={handleInputChange('terms_accepted')}
                disabled={isLoading}
                className="w-4 h-4 mt-1 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2 transition-all"
              />
              <div className="text-sm text-white/80 leading-5">
                I agree to the{' '}
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 transition-colors underline"
                  onClick={() => window.open('/terms', '_blank')}
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 transition-colors underline"
                  onClick={() => window.open('/privacy', '_blank')}
                >
                  Privacy Policy
                </button>
              </div>
            </label>
            {isSubmitted && validationErrors.terms_accepted && (
              <p className="text-red-400 text-sm">{validationErrors.terms_accepted}</p>
            )}
          </div>

          {/* Submit Button */}
          <LiquidButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </LiquidButton>

          {/* Switch to Login */}
          {onSwitchToLogin && (
            <div className="text-center pt-4">
              <p className="text-white/60 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </form>
      </LiquidCard>
    </div>
  );
};