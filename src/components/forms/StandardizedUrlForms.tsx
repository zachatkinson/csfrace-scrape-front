/**
 * Standardized URL Form Components
 * SOLID: Liskov Substitution Principle - Consistent interface for all URL forms
 * Both SingleUrl and BatchUrl forms use the same base interface
 */

import React, { useRef } from 'react';
import { LiquidInput, LiquidButton } from '../liquid-glass';
import { BaseForm, FormField, FormSection } from './BaseForm.tsx';
import { useBaseForm, ValidationRules, createFieldSchema, createFormSchema } from '../../hooks/useBaseForm.ts';
import type { UrlFormData, FormSubmissionResult } from '../../interfaces/forms.ts';

// =============================================================================
// SHARED URL FORM TYPES
// =============================================================================

interface BaseUrlFormProps {
  onSubmit?: (data: UrlFormData) => Promise<FormSubmissionResult>;
  onSuccess?: (data?: unknown) => void;
  onError?: (error: string) => void;
  isAuthenticated: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
}

// =============================================================================
// SINGLE URL FORM
// =============================================================================

interface SingleUrlFormData {
  [key: string]: unknown;
  url: string;
  options: {
    preserveFormatting: boolean;
    convertImages: boolean;
    optimizeImages: boolean;
    downloadImages: boolean;
    generateSeoTitle: boolean;
    generateSeoDescription: boolean;
    removeWordPressSpecific: boolean;
    addShopifySpecific: boolean;
  };
}

const singleUrlValidationSchema = createFormSchema<SingleUrlFormData>({
  url: createFieldSchema([
    ValidationRules.required('URL is required'),
    ValidationRules.pattern(
      /^https?:\/\/.+/,
      'Please enter a valid URL starting with http:// or https://'
    ),
    ValidationRules.custom(
      (value) => {
        try {
          new URL(value as string);
          return true;
        } catch {
          return false;
        }
      },
      'Please enter a valid URL'
    ),
  ]),
  options: createFieldSchema([]),
});

export interface StandardizedSingleUrlFormProps extends BaseUrlFormProps {
  showOptions?: boolean;
}

function renderSingleUrlFields(
  formHook: ReturnType<typeof useBaseForm<SingleUrlFormData>>,
  options: { showOptions?: boolean; isAuthenticated: boolean } = { showOptions: false, isAuthenticated: false }
) {
  const { data, state, handlers } = formHook;

  return (
    <>
      {/* Main URL Field */}
      <FormField error={state.errors.url}>
        <LiquidInput
          type="url"
          label="WordPress URL"
          placeholder="https://example.com/post-or-page"
          value={data.url || ''}
          onChange={(e) => handlers.handleFieldChange('url')(e.target.value)}
          onBlur={handlers.handleFieldBlur('url')}
          error={!!state.errors.url}
          disabled={state.isSubmitting || !options.isAuthenticated}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m0 0l4-4a4 4 0 105.656-5.656l-4 4m-4 4l4-4m0 0l-4-4m4 4l4-4" />
            </svg>
          }
          required
          autoFocus
          helperText="Enter the WordPress URL you want to convert to Shopify format"
        />
      </FormField>

      {/* Conversion Options */}
      {options.showOptions && (
        <FormSection title="Conversion Options" subtitle="Customize how your content is converted">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={data.options?.preserveFormatting ?? true}
                onChange={(e) => handlers.handleFieldChange('options')({
                  ...(data.options || {}),
                  preserveFormatting: e.target.checked
                })}
                disabled={state.isSubmitting}
                className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
              />
              <span>Preserve Formatting</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={data.options?.convertImages ?? true}
                onChange={(e) => handlers.handleFieldChange('options')({
                  ...(data.options || {}),
                  convertImages: e.target.checked
                })}
                disabled={state.isSubmitting}
                className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
              />
              <span>Convert Images</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={data.options?.generateSeoTitle ?? true}
                onChange={(e) => handlers.handleFieldChange('options')({
                  ...(data.options || {}),
                  generateSeoTitle: e.target.checked
                })}
                disabled={state.isSubmitting}
                className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
              />
              <span>Generate SEO Title</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={data.options?.addShopifySpecific ?? true}
                onChange={(e) => handlers.handleFieldChange('options')({
                  ...(data.options || {}),
                  addShopifySpecific: e.target.checked
                })}
                disabled={state.isSubmitting}
                className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
              />
              <span>Add Shopify Specific</span>
            </label>
          </div>
        </FormSection>
      )}

      {/* Authentication Notice */}
      {!options.isAuthenticated && (
        <div className="p-4 rounded-glass bg-blue-500/20 border border-blue-500/30 text-blue-100 text-sm">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Sign in Required</p>
              <p className="mt-1">Please sign in to convert URLs</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const StandardizedSingleUrlForm: React.FC<StandardizedSingleUrlFormProps> = ({
  onSubmit,
  onSuccess,
  onError,
  isAuthenticated,
  className = '',
  title = 'WordPress URL Converter',
  subtitle = 'Enter a WordPress URL to convert to Shopify format',
  disabled = false,
  showOptions = false,
}) => {
  
  const handleSubmit = async (data: SingleUrlFormData): Promise<FormSubmissionResult> => {
    if (!onSubmit) {
      return { success: true, data };
    }
    
    const urlFormData: UrlFormData = {
      url: data.url,
      options: data.options,
    };
    
    return await onSubmit(urlFormData);
  };

  return (
    <div className={className}>
      <BaseForm
        initialData={{
          url: '',
          options: {
            preserveFormatting: true,
            convertImages: true,
            optimizeImages: true,
            downloadImages: true,
            generateSeoTitle: true,
            generateSeoDescription: true,
            removeWordPressSpecific: true,
            addShopifySpecific: true,
          },
        }}
        validationSchema={singleUrlValidationSchema}
        onSubmit={handleSubmit}
        onSuccess={onSuccess}
        onError={onError}
        title={title}
        subtitle={subtitle}
        disabled={disabled || !isAuthenticated}
        submitButtonText="Convert URL"
        className="w-full"
        renderFields={(formHook) => renderSingleUrlFields(formHook, { 
          showOptions, 
          isAuthenticated 
        })}
      />
    </div>
  );
};

// =============================================================================
// BATCH URL FORM
// =============================================================================

interface BatchUrlFormData {
  [key: string]: unknown;
  batchUrls: string;
  file: File | null;
  options: {
    preserveFormatting: boolean;
    convertImages: boolean;
    optimizeImages: boolean;
    downloadImages: boolean;
    generateSeoTitle: boolean;
    generateSeoDescription: boolean;
    removeWordPressSpecific: boolean;
    addShopifySpecific: boolean;
  };
}

const batchUrlValidationSchema = createFormSchema<BatchUrlFormData>({
  batchUrls: createFieldSchema([
    ValidationRules.custom(
      (value, data) => {
        const urls = (value as string || '').trim();
        const file = data.file as File | null;
        
        // Either URLs or file must be provided
        return urls.length > 0 || file !== null;
      },
      'Please enter URLs or upload a file'
    ),
    ValidationRules.custom(
      (value) => {
        const urls = (value as string || '').trim();
        if (!urls) return true; // Skip if empty (file might be provided)
        
        const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
        if (urlList.length > 100) return false;
        
        // Validate each URL
        return urlList.every(url => {
          try {
            new URL(url);
            return /^https?:\/\/.+/.test(url);
          } catch {
            return false;
          }
        });
      },
      'Please enter valid URLs (max 100, one per line)'
    ),
  ]),
  file: createFieldSchema([]),
  options: createFieldSchema([]),
});

export interface StandardizedBatchUrlFormProps extends BaseUrlFormProps {
  showOptions?: boolean;
  maxUrls?: number;
}

function renderBatchUrlFields(
  formHook: ReturnType<typeof useBaseForm<BatchUrlFormData>>,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  options: {
    showOptions?: boolean;
    isAuthenticated: boolean;
    maxUrls?: number;
  } = { showOptions: false, isAuthenticated: false, maxUrls: 100 }
) {
  const { data, state, handlers } = formHook;

  const urlCount = (data.batchUrls || '').split('\n').filter(line => line.trim()).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handlers.handleFieldChange('file')(file);
    
    // Auto-process file content
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const urls = content.split(/[\r\n,;]+/).map(u => u.trim()).filter(Boolean);
        handlers.handleFieldChange('batchUrls')(urls.join('\n'));
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      {/* Batch URLs Input */}
      <FormField error={state.errors.batchUrls}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            WordPress URLs ({urlCount}/{options.maxUrls})
          </label>
          <textarea
            placeholder="Enter WordPress URLs (one per line)&#10;https://example.com/post-1&#10;https://example.com/post-2"
            value={data.batchUrls || ''}
            onChange={(e) => handlers.handleFieldChange('batchUrls')(e.target.value)}
            onBlur={handlers.handleFieldBlur('batchUrls')}
            disabled={state.isSubmitting || !options.isAuthenticated}
            className="w-full h-32 px-4 py-3 bg-black/20 border border-white/20 rounded-glass text-white placeholder-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            rows={6}
          />
          <p className="text-xs text-white/60">
            Enter up to {options.maxUrls} URLs, one per line. You can also upload a file below.
          </p>
        </div>
      </FormField>

      {/* File Upload */}
      <FormSection title="Or Upload File" subtitle="Upload a TXT, CSV, or JSON file with URLs">
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.json"
            onChange={handleFileUpload}
            disabled={state.isSubmitting || !options.isAuthenticated}
            className="hidden"
          />
          
          <div className="flex items-center gap-4">
            <LiquidButton
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={state.isSubmitting || !options.isAuthenticated}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              }
            >
              Choose File
            </LiquidButton>
            
            {data.file && (
              <span className="text-sm text-white/60">
                {data.file.name} ({(data.file.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
          
          <p className="text-xs text-white/50">
            Supported formats: TXT (one URL per line), CSV (URL column), JSON (array of URLs)
          </p>
        </div>
      </FormSection>

      {/* Batch Options */}
      {options.showOptions && (
        <FormSection title="Batch Options" subtitle="Apply these settings to all URLs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={data.options?.preserveFormatting ?? true}
                onChange={(e) => handlers.handleFieldChange('options')({
                  ...(data.options || {}),
                  preserveFormatting: e.target.checked
                })}
                disabled={state.isSubmitting}
                className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
              />
              <span>Preserve Formatting</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={data.options?.convertImages ?? true}
                onChange={(e) => handlers.handleFieldChange('options')({
                  ...(data.options || {}),
                  convertImages: e.target.checked
                })}
                disabled={state.isSubmitting}
                className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
              />
              <span>Convert Images</span>
            </label>
          </div>
        </FormSection>
      )}

      {/* Authentication Notice */}
      {!options.isAuthenticated && (
        <div className="p-4 rounded-glass bg-blue-500/20 border border-blue-500/30 text-blue-100 text-sm">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Sign in Required</p>
              <p className="mt-1">Please sign in to process batch URLs</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const StandardizedBatchUrlForm: React.FC<StandardizedBatchUrlFormProps> = ({
  onSubmit,
  onSuccess,
  onError,
  isAuthenticated,
  className = '',
  title = 'Batch URL Processing',
  subtitle = 'Convert multiple WordPress URLs simultaneously',
  disabled = false,
  showOptions = false,
  maxUrls = 100,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (data: BatchUrlFormData): Promise<FormSubmissionResult> => {
    if (!onSubmit) {
      return { success: true, data };
    }
    
    const urls = data.batchUrls.split('\n').map(u => u.trim()).filter(Boolean);
    
    const urlFormData: UrlFormData = {
      urls,
      batchUrls: data.batchUrls,
      file: data.file,
      options: data.options,
    };
    
    return await onSubmit(urlFormData);
  };

  return (
    <div className={className}>
      <BaseForm
        initialData={{
          batchUrls: '',
          file: null,
          options: {
            preserveFormatting: true,
            convertImages: true,
            optimizeImages: true,
            downloadImages: true,
            generateSeoTitle: true,
            generateSeoDescription: true,
            removeWordPressSpecific: true,
            addShopifySpecific: true,
          },
        }}
        validationSchema={batchUrlValidationSchema}
        onSubmit={handleSubmit}
        onSuccess={onSuccess}
        onError={onError}
        title={title}
        subtitle={subtitle}
        disabled={disabled || !isAuthenticated}
        submitButtonText="Process Batch"
        showReset={true}
        resetButtonText="Clear All"
        className="w-full"
        renderFields={(formHook) => renderBatchUrlFields(formHook, fileInputRef, {
          showOptions,
          isAuthenticated,
          maxUrls
        })}
      />
    </div>
  );
};

// =============================================================================
// EXPORT ALL STANDARDIZED URL FORMS
// =============================================================================

export default {
  StandardizedSingleUrlForm,
  StandardizedBatchUrlForm,
};