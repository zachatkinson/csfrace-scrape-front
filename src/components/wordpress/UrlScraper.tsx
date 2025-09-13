/**
 * UrlScraper Component - Following CLAUDE.md Best Practices
 * Uses direct API calls to Docker backend - NO SERVICE ABSTRACTIONS!
 * Simple fetch() calls as per Astro + CLAUDE.md guidelines
 */

import React, { useState } from 'react';
import { useScrapingForm } from '../../hooks/useScrapingForm.ts';
import { ModeSwitcher } from '../scraping/Modeswitcher.tsx';
import { SingleUrlForm } from '../scraping/SingleUrlForm.tsx';
import { BatchUrlForm } from '../scraping/BatchUrlForm.tsx';
import { getApiBaseUrl } from '../../constants/api';
import { getAuthHeaders, isAuthenticated } from '../../utils/authApi';

export interface ScrapingJobUI {
  id?: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface UrlScraperProps {
  onJobSubmit?: (job: ScrapingJobUI) => void;
  onJobUpdate?: (job: ScrapingJobUI) => void;
  maxConcurrentJobs?: number;
  className?: string;
}

/**
 * UrlScraper - Simple component using direct Docker API calls
 */
export const UrlScraper: React.FC<UrlScraperProps> = ({
  onJobSubmit,
  onJobUpdate,
  maxConcurrentJobs: _maxConcurrentJobs = 5,
  className = '',
}) => {
  const authenticated = isAuthenticated();

  // Simple form state management
  const { state, actions, computed } = useScrapingForm();
  
  // Simple job submission using direct API calls - NO SERVICE ABSTRACTION!
  const handleJobSubmit = async (url: string, options: any = {}) => {
    try {
      actions.setLoading(true);

      // Direct call to Docker backend - following CLAUDE.md best practices
      const job = await fetch(`${getApiBaseUrl()}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ url, options }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(await response.text() || `HTTP ${response.status}`);
        }
        return response.json();
      });

      // Create UI job object
      const uiJob: ScrapingJobUI = {
        id: job.id,
        url: job.url,
        status: job.status,
        result: job.result,
        error: job.error,
      };

      onJobSubmit?.(uiJob);
      actions.setSuccess(`Job created successfully: ${url}`);
    } catch (error) {
      actions.setError(error instanceof Error ? error.message : 'Job submission failed');
    } finally {
      actions.setLoading(false);
    }
  };

  // Simple batch submission using direct API calls
  const handleBatchSubmit = async (urls: string[], options: any = {}) => {
    try {
      actions.setLoading(true);

      // Direct call to Docker backend - following CLAUDE.md best practices
      const batch = await fetch(`${getApiBaseUrl()}/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: `Batch ${new Date().toLocaleString()}`,
          urls,
          options
        }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(await response.text() || `HTTP ${response.status}`);
        }
        return response.json();
      });

      actions.setSuccess(`Batch created successfully with ${urls.length} URLs`);
      return batch;
    } catch (error) {
      actions.setError(error instanceof Error ? error.message : 'Batch submission failed');
    } finally {
      actions.setLoading(false);
    }
  };

  const handleJobUpdate = (job: ScrapingJobUI) => {
    onJobUpdate?.(job);
  };
  
  const handleBatchSubmitted = (jobs: ScrapingJobUI[]) => {
    jobs.forEach(job => onJobSubmit?.(job));
    actions.setSuccess(`Batch created successfully: ${jobs.length} jobs`);
  };
  
  const handleJobError = (job: ScrapingJobUI, error: string) => {
    actions.setError(`Job failed: ${error}`);
  };

  // Event handlers using service-oriented architecture
  const handleSingleUrlSubmit = async () => {
    actions.setSubmitting(true);
    actions.clearMessages();
    
    try {
      const job = await jobService.submitJob(state.url);
      if (job) {
        actions.clearUrl();
      }
    } catch (error) {
      actions.setError(error instanceof Error ? error.message : 'Job submission failed');
    } finally {
      actions.setSubmitting(false);
    }
  };

  const handleBatchFormSubmit = async () => {
    actions.setBatchSubmitting(true);
    actions.clearMessages();
    
    try {
      const urls = actions.getBatchUrlList();
      const jobs = await jobService.submitBatch(urls);
      if (jobs) {
        actions.clearBatchUrls();
        actions.setBatchMode(false);
      }
    } catch (error) {
      actions.setError(error instanceof Error ? error.message : 'Batch submission failed');
    } finally {
      actions.setBatchSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      await actions.processFile(file);
    } catch (error) {
      // Error handling already done in processFile
    }
  };

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Mode Switcher */}
      <ModeSwitcher
        batchMode={state.batchMode}
        onModeChange={actions.setBatchMode}
      />
      
      {/* Dynamic Form Based on Mode */}
      {!state.batchMode ? (
        <SingleUrlForm
          url={state.url}
          onUrlChange={actions.handleUrlChange}
          onSubmit={handleSingleUrlSubmit}
          onClear={actions.clearUrl}
          validationResult={state.validationResult}
          isValidating={state.isValidating}
          isSubmitting={state.isSubmitting}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <BatchUrlForm
          batchUrls={state.batchUrls}
          onBatchUrlsChange={actions.setBatchUrls}
          onFileUpload={handleFileUpload}
          onSubmit={handleBatchFormSubmit}
          onClear={actions.clearBatchUrls}
          isSubmitting={state.isBatchSubmitting}
          isAuthenticated={isAuthenticated}
        />
      )}
      
      {/* Success/Error Messages */}
      {state.error && (
        <div className="max-w-2xl mx-auto">
          <div className="liquid-glass rounded-glass p-4 border border-red-400/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-400 text-sm font-medium">Error</p>
                <p className="text-white/80 text-sm mt-1">{state.error}</p>
              </div>
              <button
                onClick={actions.clearMessages}
                className="ml-auto text-white/60 hover:text-white/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {state.success && (
        <div className="max-w-2xl mx-auto">
          <div className="liquid-glass rounded-glass p-4 border border-green-400/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-green-400 text-sm font-medium">Success</p>
                <p className="text-white/80 text-sm mt-1">{state.success}</p>
              </div>
              <button
                onClick={actions.clearMessages}
                className="ml-auto text-white/60 hover:text-white/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlScraper;