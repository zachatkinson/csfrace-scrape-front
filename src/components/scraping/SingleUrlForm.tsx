/**
 * Single URL Form Component
 * Single Responsibility: Handle single URL input and validation UI
 * Extracted from UrlScraper to follow SOLID principles
 */

import React from 'react';
import { LiquidCard, LiquidButton, LiquidInput } from '../liquid-glass';
import type { UrlValidationResult } from '../../services/UrlValidationService.ts';
import { SecurityUtils } from '../../utils/security.ts';

export interface SingleUrlFormProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  
  // Validation state
  validationResult: UrlValidationResult | null;
  isValidating: boolean;
  isSubmitting: boolean;
  
  // Auth state
  isAuthenticated: boolean;
  
  // UI customization
  className?: string;
  title?: string;
  subtitle?: string;
}

/**
 * SingleUrlForm - Clean, focused URL input component
 */
export const SingleUrlForm: React.FC<SingleUrlFormProps> = ({
  url,
  onUrlChange,
  onSubmit,
  onClear,
  validationResult,
  isValidating,
  isSubmitting,
  isAuthenticated,
  className = '',
  title = 'WordPress URL Converter',
  subtitle = 'Enter a WordPress URL to convert to Shopify format',
}) => {
  // Get validation status for UI
  const getValidationStatus = () => {
    if (isValidating) return 'loading';
    if (!validationResult) return 'idle';
    if (validationResult.error) return 'error';
    if (validationResult.isValid) return 'success';
    return 'error';
  };

  const getHelperText = () => {
    if (validationResult?.isValid) {
      const metadata = validationResult.metadata;
      return `Detected: ${validationResult.contentType}${metadata?.estimatedSize ? ` - ${metadata.estimatedSize}` : ''}`;
    }
    return 'Enter a valid WordPress URL';
  };

  const getButtonText = () => {
    if (!isAuthenticated) return 'Sign In Required';
    if (isSubmitting) return 'Creating Job...';
    return 'Convert to Shopify';
  };

  const isDisabled = () => {
    return !validationResult?.isValid || 
           isValidating || 
           isSubmitting || 
           !isAuthenticated;
  };

  const validationStatus = getValidationStatus();

  return (
    <LiquidCard
      title={title}
      subtitle={subtitle}
      className={`max-w-2xl mx-auto ${className}`.trim()}
    >
      <div className="space-y-4">
        <LiquidInput
          label="WordPress URL"
          placeholder="https://your-wordpress-site.com/post-url"
          value={url}
          onChange={(e) => {
            const sanitizedValue = SecurityUtils.sanitizeText(e.target.value);
            if (SecurityUtils.validateInput(sanitizedValue, 2000)) {
              onUrlChange(sanitizedValue);
            }
          }}
          loading={isValidating}
          error={validationStatus === 'error'}
          success={validationStatus === 'success'}
          errorText={validationResult?.error}
          helperText={getHelperText()}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
              />
            </svg>
          }
          clearable
          onClear={onClear}
        />
        
        {/* Validation details for valid WordPress sites */}
        {validationResult?.isValid && validationResult.metadata && (
          <div className="liquid-glass rounded-glass p-3 space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-400">WordPress Site Detected</span>
            </div>
            
            <div className="text-xs text-white/70 space-y-1">
              {validationResult.metadata.title && (
                <div>
                  <span className="text-white/50">Title:</span> {validationResult.metadata.title}
                </div>
              )}
              {validationResult.metadata.description && (
                <div>
                  <span className="text-white/50">Description:</span> {validationResult.metadata.description}
                </div>
              )}
              {validationResult.metadata.lastModified && (
                <div>
                  <span className="text-white/50">Modified:</span> {validationResult.metadata.lastModified}
                </div>
              )}
            </div>
          </div>
        )}
        
        <LiquidButton
          variant="primary"
          size="lg"
          fullWidth
          disabled={isDisabled()}
          loading={isValidating || isSubmitting}
          onClick={onSubmit}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
          }
        >
          {getButtonText()}
        </LiquidButton>
      </div>
    </LiquidCard>
  );
};

export default SingleUrlForm;