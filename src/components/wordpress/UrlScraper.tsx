/**
 * UrlScraper Component
 * WordPress URL input interface with authentic Liquid Glass material
 * Implements real-time validation and batch processing capabilities
 */

import React, { useState, useCallback, useRef } from 'react';
import { LiquidCard, LiquidButton, LiquidInput } from '../liquid-glass';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import type { ConversionJob, JobStatus } from '../../types';

// Types for URL scraping (extending backend types)
interface UrlValidationResult {
  isValid: boolean;
  isWordPress: boolean;
  isAccessible: boolean;
  contentType?: string;
  error?: string;
  metadata?: {
    title?: string;
    description?: string;
    estimatedSize?: string;
    lastModified?: string;
  };
}

interface ScrapingJobUI extends Omit<ConversionJob, 'id' | 'status'> {
  id: string;
  status: JobStatus | 'validating';
  progress: number;
  error?: string;
  createdAt: Date;
}

export interface UrlScraperProps {
  onJobSubmit?: (job: ScrapingJobUI) => void;
  onJobUpdate?: (job: ScrapingJobUI) => void;
  maxConcurrentJobs?: number;
  className?: string;
}

/**
 * UrlScraper - Professional URL input with Liquid Glass effects
 */
export const UrlScraper: React.FC<UrlScraperProps> = ({
  onJobSubmit,
  onJobUpdate,
  maxConcurrentJobs: _maxConcurrentJobs = 5,
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<UrlValidationResult | null>(null);
  const [_jobs, setJobs] = useState<ScrapingJobUI[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // URL Validation with WordPress detection using real API
  const validateUrl = useCallback(async (inputUrl: string): Promise<UrlValidationResult> => {
    try {
      // Basic URL validation
      new URL(inputUrl);
      
      // Call backend validation API
      const response = await api.validateUrl(inputUrl);
      
      if (response.success && response.data) {
        const validationData = response.data;
        const result: UrlValidationResult = {
          isValid: validationData.isValid,
          isWordPress: validationData.isWordPress,
          isAccessible: validationData.isAccessible,
        };
        
        if (validationData.contentType != null) {
          result.contentType = validationData.contentType;
        }
        
        if (validationData.metadata != null) {
          result.metadata = validationData.metadata;
        }
        
        return result;
      } else {
        return {
          isValid: false,
          isWordPress: false,
          isAccessible: false,
          error: response.error || 'Validation failed'
        };
      }
      
    } catch (error) {
      console.error('URL validation error:', error);
      return {
        isValid: false,
        isWordPress: false,
        isAccessible: false,
        error: error instanceof Error ? error.message : 'Invalid URL format'
      };
    }
  }, []);
  
  // Handle URL input change with real-time validation
  const handleUrlChange = useCallback(async (newUrl: string) => {
    setUrl(newUrl);
    setValidationResult(null);
    
    if (newUrl.length < 10) return;
    
    setIsValidating(true);
    
    // Debounce validation
    setTimeout(async () => {
      const result = await validateUrl(newUrl);
      setValidationResult(result);
      setIsValidating(false);
    }, 500);
  }, [validateUrl]);
  
  // Create new scraping job UI representation
  const createJobUI = (jobData: ConversionJob): ScrapingJobUI => ({
    ...jobData,
    id: jobData.id.toString(),
    status: jobData.status,
    progress: jobData.progress || 0
  });
  
  // Submit single URL for processing
  const handleSubmit = useCallback(async () => {
    if (!validationResult?.isValid || isValidating || isSubmitting || !isAuthenticated) return;
    
    setIsSubmitting(true);
    
    try {
      // Create job via API
      const response = await api.submitJob(url, {
        preserveFormatting: true,
        convertImages: true,
        optimizeImages: true,
        downloadImages: true,
        generateSeoTitle: true,
        generateSeoDescription: true,
        removeWordPressSpecific: true,
        addShopifySpecific: true
      });
      
      if (response.success && response.data) {
        const job = createJobUI(response.data);
        setJobs(prev => [job, ...prev]);
        
        if (onJobSubmit) {
          onJobSubmit(job);
        }
        
        // Start polling for job status updates
        pollJobStatus(job.id);
        
        // Clear form
        setUrl('');
        setValidationResult(null);
      } else {
        console.error('Job creation failed:', response.error);
        // Handle error - could show notification
      }
    } catch (error) {
      console.error('Error creating job:', error);
      // Handle error - could show notification
    } finally {
      setIsSubmitting(false);
    }
  }, [url, validationResult, isValidating, isSubmitting, isAuthenticated, onJobSubmit]);
  
  // Submit batch URLs
  const handleBatchSubmit = useCallback(async () => {
    if (isBatchSubmitting || !isAuthenticated) return;
    
    const urls = batchUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);
    
    if (urls.length === 0) return;
    
    setIsBatchSubmitting(true);
    
    try {
      // Create batch via API
      const response = await api.submitBatch(
        urls,
        {
          preserveFormatting: true,
          convertImages: true,
          optimizeImages: true,
          downloadImages: true,
          generateSeoTitle: true,
          generateSeoDescription: true,
          removeWordPressSpecific: true,
          addShopifySpecific: true
        },
        `Batch - ${new Date().toLocaleDateString()}`
      );
      
      if (response.success && response.data) {
        // Get the batch with jobs
        const batchResponse = await api.getBatch(response.data.id.toString());
        if (batchResponse.success && batchResponse.data && 'jobs' in batchResponse.data) {
          const newJobs = batchResponse.data.jobs.map(createJobUI);
          setJobs(prev => [...newJobs, ...prev]);
          
          newJobs.forEach(job => {
            if (onJobSubmit) {
              onJobSubmit(job);
            }
            // Start polling for each job status
            pollJobStatus(job.id);
          });
        }
        
        setBatchUrls('');
        setBatchMode(false);
      } else {
        console.error('Batch creation failed:', response.error);
        // Handle error - could show notification
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      // Handle error - could show notification
    } finally {
      setIsBatchSubmitting(false);
    }
  }, [batchUrls, isBatchSubmitting, isAuthenticated, onJobSubmit]);
  
  // Poll job status updates from the API
  const pollJobStatus = useCallback((jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.getJob(jobId);
        if (response.success && response.data) {
          const updatedJob = createJobUI(response.data);
          
          // Calculate progress based on status
          switch (updatedJob.status) {
            case 'pending':
              updatedJob.progress = 0;
              break;
            case 'scraping':
              updatedJob.progress = 50; // Could be enhanced with real progress from API
              break;
            case 'completed':
              updatedJob.progress = 100;
              clearInterval(pollInterval);
              break;
            case 'error':
              updatedJob.progress = 0;
              clearInterval(pollInterval);
              break;
            case 'cancelled':
              clearInterval(pollInterval);
              break;
          }
          
          setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
          
          if (onJobUpdate) {
            onJobUpdate(updatedJob);
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        // Continue polling - don't clear interval on error
      }
    }, 2000); // Poll every 2 seconds
    
    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  }, [onJobUpdate]);
  
  // Handle file upload for batch processing
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBatchUrls(content);
    };
    reader.readAsText(file);
  }, []);
  
  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="liquid-glass p-2 rounded-glass flex">
          <button
            onClick={() => setBatchMode(false)}
            className={`px-4 py-2 rounded-glass-sm text-sm font-medium transition-all duration-glass ${
              !batchMode 
                ? 'bg-white/20 text-white shadow-glass' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Single URL
          </button>
          <button
            onClick={() => setBatchMode(true)}
            className={`px-4 py-2 rounded-glass-sm text-sm font-medium transition-all duration-glass ${
              batchMode 
                ? 'bg-white/20 text-white shadow-glass' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Batch Processing
          </button>
        </div>
      </div>
      
      {!batchMode ? (
        /* Single URL Mode */
        <LiquidCard
          title="WordPress URL Converter"
          subtitle="Enter a WordPress URL to convert to Shopify format"
          className="max-w-2xl mx-auto"
        >
          <div className="space-y-4">
            <LiquidInput
              label="WordPress URL"
              placeholder="https://your-wordpress-site.com/post-url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              loading={isValidating}
              error={validationResult?.error ? true : false}
              {...(validationResult?.isValid != null && { success: validationResult.isValid })}
              errorText={validationResult?.error}
              helperText={validationResult?.isValid 
                ? `Detected: ${validationResult.contentType} - ${validationResult.metadata?.estimatedSize}`
                : 'Enter a valid WordPress URL'
              }
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
              clearable
              onClear={() => {
                setUrl('');
                setValidationResult(null);
              }}
            />
            
            <LiquidButton
              variant="primary"
              size="lg"
              fullWidth
              disabled={!validationResult?.isValid || isValidating || isSubmitting || !isAuthenticated}
              loading={isValidating || isSubmitting}
              onClick={handleSubmit}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              {!isAuthenticated ? 'Sign In Required' : isSubmitting ? 'Creating Job...' : 'Convert to Shopify'}
            </LiquidButton>
          </div>
        </LiquidCard>
      ) : (
        /* Batch Processing Mode */
        <LiquidCard
          title="Batch URL Processing"
          subtitle="Convert multiple WordPress URLs simultaneously"
          className="max-w-4xl mx-auto"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text Area Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  URLs (one per line)
                </label>
                <div className="liquid-glass rounded-glass p-4">
                  <textarea
                    value={batchUrls}
                    onChange={(e) => setBatchUrls(e.target.value)}
                    placeholder="https://wordpress-site.com/post-1&#10;https://wordpress-site.com/post-2&#10;https://wordpress-site.com/post-3"
                    className="w-full h-32 bg-transparent border-none outline-none text-white placeholder:text-white/50 resize-none"
                  />
                </div>
              </div>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Or upload text file
                </label>
                <div className="liquid-glass rounded-glass p-4 border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer"
                     onClick={() => fileInputRef.current?.click()}>
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-white/60" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-white/60">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-white/50">TXT files only</p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <LiquidButton
                variant="primary"
                size="lg"
                disabled={!batchUrls.trim() || isBatchSubmitting || !isAuthenticated}
                loading={isBatchSubmitting}
                onClick={handleBatchSubmit}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                {!isAuthenticated ? 'Sign In Required' : isBatchSubmitting ? 'Creating Batch...' : `Process ${batchUrls.split('\n').filter(u => u.trim()).length} URLs`}
              </LiquidButton>
              
              <LiquidButton
                variant="secondary"
                size="lg"
                onClick={() => {
                  setBatchUrls('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Clear All
              </LiquidButton>
            </div>
          </div>
        </LiquidCard>
      )}
    </div>
  );
};

export default UrlScraper;