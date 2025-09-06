/**
 * UrlScraper Component - Refactored with SOLID Principles
 * Now uses service-oriented architecture with focused responsibilities
 * Dramatically simplified from 465 lines to clean composition pattern
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useScrapingForm } from '../../hooks/useScrapingForm.ts';
import { useServiceContainer } from '../../services/ServiceContainer.ts';
import { JobProcessingService } from '../../services/JobProcessingService.ts';
import { ModeSwitcher } from '../scraping/Modeswitcher.tsx';
import { SingleUrlForm } from '../scraping/SingleUrlForm.tsx';
import { BatchUrlForm } from '../scraping/BatchUrlForm.tsx';
import type { ScrapingJobUI } from '../../services/JobProcessingService.ts';

export interface UrlScraperProps {
  onJobSubmit?: (job: ScrapingJobUI) => void;
  onJobUpdate?: (job: ScrapingJobUI) => void;
  maxConcurrentJobs?: number;
  className?: string;
}

/**
 * UrlScraper - Clean, service-oriented URL processing interface
 */
export const UrlScraper: React.FC<UrlScraperProps> = ({
  onJobSubmit,
  onJobUpdate,
  maxConcurrentJobs: _maxConcurrentJobs = 5,
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  
  // Service-oriented form state management
  const { state, actions, computed } = useScrapingForm();
  
  // SOLID: Dependency Inversion - Use service container instead of direct instantiation
  const serviceContainer = useServiceContainer();
  
  // Job processing service with dependency injection
  const [jobService] = useState(() => new JobProcessingService(
    serviceContainer.api, // Inject API service dependency
    {
      onJobSubmitted: (job) => {
        onJobSubmit?.(job);
        actions.setSuccess(`Job created successfully: ${job.url}`);
      },
      onJobUpdated: (job) => {
        onJobUpdate?.(job);
      },
      onBatchSubmitted: (jobs) => {
        jobs.forEach(job => onJobSubmit?.(job));
        actions.setSuccess(`Batch created successfully: ${jobs.length} jobs`);
      },
        onJobError: (job, error) => {
        actions.setError(`Job failed: ${error}`);
      },
    }
  ));

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

  const handleBatchSubmit = async () => {
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
          onSubmit={handleBatchSubmit}
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