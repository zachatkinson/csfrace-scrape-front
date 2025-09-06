/**
 * Scraping Form State Management Hook
 * Single Responsibility: Manage form state and interactions
 * Extracted from UrlScraper to follow SOLID principles
 */

import { useState, useCallback, useRef } from 'react';
import { TIMING_CONSTANTS } from '../constants/timing.ts';
import { UrlValidationService, type UrlValidationResult } from '../services/UrlValidationService.ts';
import { FileProcessingService, type FileProcessingResult } from '../services/FileProcessingService.ts';
import { FORM_VALIDATORS } from '../utils/form-validation.ts';

export interface ScrapingFormState {
  // Single URL mode
  url: string;
  validationResult: UrlValidationResult | null;
  isValidating: boolean;
  isSubmitting: boolean;
  
  // Batch mode
  batchMode: boolean;
  batchUrls: string;
  isBatchSubmitting: boolean;
  fileProcessingResult: FileProcessingResult | null;
  
  // UI state
  error: string | null;
  success: string | null;
}

export interface ScrapingFormActions {
  // URL actions
  setUrl: (url: string) => void;
  handleUrlChange: (url: string) => void;
  clearUrl: () => void;
  
  // Batch actions
  setBatchMode: (enabled: boolean) => void;
  setBatchUrls: (urls: string) => void;
  clearBatchUrls: () => void;
  processFile: (file: File) => Promise<void>;
  
  // Form actions
  setSubmitting: (submitting: boolean) => void;
  setBatchSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  clearMessages: () => void;
  resetForm: () => void;
  
  // Validation
  isValidForSubmission: () => boolean;
  getBatchUrlList: () => string[];
}

export interface UseScrapingFormOptions {
  enableRealTimeValidation?: boolean;
  validationDelay?: number;
  maxBatchUrls?: number;
}

/**
 * Custom hook for managing scraping form state and validation
 */
export function useScrapingForm(options: UseScrapingFormOptions = {}) {
  const {
    enableRealTimeValidation = true,
    validationDelay = TIMING_CONSTANTS.UI.INPUT_VALIDATION_DELAY,
    maxBatchUrls = 100,
  } = options;

  // Services
  const [urlValidationService] = useState(() => new UrlValidationService({
    onValidationStart: () => setState(prev => ({ ...prev, isValidating: true })),
    onValidationComplete: (_, result) => setState(prev => ({ 
      ...prev, 
      validationResult: result,
      isValidating: false 
    })),
    onValidationError: (_, error) => setState(prev => ({ 
      ...prev, 
      error,
      isValidating: false 
    })),
  }));

  const [fileProcessingService] = useState(() => new FileProcessingService({
    onFileProcessed: (urls, filename) => {
      setState(prev => ({ 
        ...prev, 
        batchUrls: urls.join('\n'),
        success: `Processed ${urls.length} URLs from ${filename}`
      }));
    },
    onFileError: (error) => setState(prev => ({ ...prev, error })),
  }));

  // Form validation
  const [formValidator] = useState(() => FORM_VALIDATORS.wordpressScraping());

  // State
  const [state, setState] = useState<ScrapingFormState>({
    url: '',
    validationResult: null,
    isValidating: false,
    isSubmitting: false,
    batchMode: false,
    batchUrls: '',
    isBatchSubmitting: false,
    fileProcessingResult: null,
    error: null,
    success: null,
  });

  // Validation timeout ref
  const validationTimeoutRef = useRef<number>();

  // URL Actions
  const setUrl = useCallback((url: string) => {
    setState(prev => ({ ...prev, url }));
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setState(prev => ({ 
      ...prev, 
      url, 
      validationResult: null,
      error: null,
      success: null 
    }));
    
    if (!enableRealTimeValidation || url.length < 10) {
      return;
    }
    
    // Debounced validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    validationTimeoutRef.current = window.setTimeout(() => {
      urlValidationService.validateUrl(url);
    }, validationDelay);
  }, [urlValidationService, enableRealTimeValidation, validationDelay]);

  const clearUrl = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      url: '', 
      validationResult: null,
      error: null,
      success: null 
    }));
  }, []);

  // Batch Actions
  const setBatchMode = useCallback((enabled: boolean) => {
    setState(prev => ({ 
      ...prev, 
      batchMode: enabled,
      error: null,
      success: null 
    }));
  }, []);

  const setBatchUrls = useCallback((urls: string) => {
    setState(prev => ({ 
      ...prev, 
      batchUrls: urls,
      error: null,
      success: null 
    }));
  }, []);

  const clearBatchUrls = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      batchUrls: '',
      fileProcessingResult: null,
      error: null,
      success: null 
    }));
  }, []);

  const processFile = useCallback(async (file: File) => {
    try {
      setState(prev => ({ ...prev, error: null, success: null }));
      const result = await fileProcessingService.processFile(file);
      setState(prev => ({ ...prev, fileProcessingResult: result }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'File processing failed' 
      }));
    }
  }, [fileProcessingService]);

  // Form Actions
  const setSubmitting = useCallback((submitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting: submitting }));
  }, []);

  const setBatchSubmitting = useCallback((submitting: boolean) => {
    setState(prev => ({ ...prev, isBatchSubmitting: submitting }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setSuccess = useCallback((success: string | null) => {
    setState(prev => ({ ...prev, success }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      url: '',
      validationResult: null,
      isValidating: false,
      isSubmitting: false,
      batchMode: false,
      batchUrls: '',
      isBatchSubmitting: false,
      fileProcessingResult: null,
      error: null,
      success: null,
    });
    
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
  }, []);

  // Validation
  const isValidForSubmission = useCallback((): boolean => {
    if (state.batchMode) {
      const urls = getBatchUrlList();
      return urls.length > 0 && urls.length <= maxBatchUrls && !state.isBatchSubmitting;
    } else {
      return Boolean(
        state.validationResult?.isValid && 
        !state.isValidating && 
        !state.isSubmitting
      );
    }
  }, [state, maxBatchUrls]);

  const getBatchUrlList = useCallback((): string[] => {
    return state.batchUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
  }, [state.batchUrls]);

  // Validation helpers
  const getUrlValidationStatus = useCallback(() => {
    if (state.isValidating) return 'validating';
    if (!state.validationResult) return 'idle';
    if (state.validationResult.error) return 'error';
    if (state.validationResult.isValid) return 'valid';
    return 'invalid';
  }, [state.validationResult, state.isValidating]);

  const getBatchValidationStatus = useCallback(() => {
    const urls = getBatchUrlList();
    if (urls.length === 0) return 'empty';
    if (urls.length > maxBatchUrls) return 'too_many';
    return 'valid';
  }, [getBatchUrlList, maxBatchUrls]);

  // Form validation using centralized validator
  const validateCurrentForm = useCallback(async () => {
    if (state.batchMode) {
      // Validate batch URLs
      const urls = getBatchUrlList();
      if (urls.length === 0) {
        return { isValid: false, errors: ['Please enter at least one URL'] };
      }
      if (urls.length > maxBatchUrls) {
        return { isValid: false, errors: [`Too many URLs. Maximum is ${maxBatchUrls}`] };
      }
      return { isValid: true, errors: [] };
    } else {
      // Validate single URL
      return formValidator.validateField('url', state.url);
    }
  }, [state.batchMode, state.url, getBatchUrlList, maxBatchUrls, formValidator]);

  const actions: ScrapingFormActions = {
    setUrl,
    handleUrlChange,
    clearUrl,
    setBatchMode,
    setBatchUrls,
    clearBatchUrls,
    processFile,
    setSubmitting,
    setBatchSubmitting,
    setError,
    setSuccess,
    clearMessages,
    resetForm,
    isValidForSubmission,
    getBatchUrlList,
  };

  return {
    state,
    actions,
    services: {
      urlValidation: urlValidationService,
      fileProcessing: fileProcessingService,
    },
    validation: {
      getUrlValidationStatus,
      getBatchValidationStatus,
      validateCurrentForm,
    },
    computed: {
      isLoading: state.isValidating || state.isSubmitting || state.isBatchSubmitting,
      canSubmit: isValidForSubmission(),
      batchUrlCount: getBatchUrlList().length,
      hasValidationResult: Boolean(state.validationResult),
      hasError: Boolean(state.error),
      hasSuccess: Boolean(state.success),
    },
  };
}

export default useScrapingForm;