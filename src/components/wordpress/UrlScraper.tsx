/**
 * UrlScraper Component - Following CLAUDE.md Best Practices
 * Uses direct API calls to Docker backend - NO SERVICE ABSTRACTIONS!
 * Simple fetch() calls as per Astro + CLAUDE.md guidelines
 */

import React from "react";
import { useScrapingForm } from "../../hooks/useScrapingForm.ts";
import { ModeSwitcher } from "../scraping/Modeswitcher.tsx";
import { SingleUrlForm } from "../scraping/SingleUrlForm.tsx";
import { BatchUrlForm } from "../scraping/BatchUrlForm.tsx";
import { getApiBaseUrl } from "../../constants/api";

export interface ScrapingResult {
  content?: string;
  metadata?: Record<string, unknown>;
  images?: string[];
  [key: string]: unknown;
}

export interface ScrapingJobUI {
  id?: string;
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: ScrapingResult;
  error?: string;
}

export interface ScrapingOptions {
  format?: "html" | "markdown" | "json";
  includeImages?: boolean;
  timeout?: number;
  [key: string]: unknown;
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
  onJobUpdate: _onJobUpdate,
  maxConcurrentJobs: _maxConcurrentJobs = 5,
  className = "",
}) => {
  // Authentication is now handled by Astro middleware
  // Components receive auth state via props or context if needed
  const { state, actions } = useScrapingForm();

  // Direct API job submission - NO SERVICE ABSTRACTION!
  const submitSingleJob = async (
    url: string,
    options: ScrapingOptions = {},
  ) => {
    try {
      actions.setSubmitting(true);

      const job = await fetch(`${getApiBaseUrl()}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Use HTTP-only cookies for authentication
        body: JSON.stringify({ url, options }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error((await response.text()) || `HTTP ${response.status}`);
        }
        return response.json();
      });

      const uiJob: ScrapingJobUI = {
        id: job.id,
        url: job.source_url,
        status: job.status,
        result: job.result,
        error: job.error,
      };

      onJobSubmit?.(uiJob);
      actions.setSuccess(`Job created successfully: ${url}`);
    } catch (error) {
      actions.setError(
        error instanceof Error ? error.message : "Job submission failed",
      );
    } finally {
      actions.setSubmitting(false);
    }
  };

  // Direct API batch submission - NO SERVICE ABSTRACTION!
  const submitBatchJobs = async (
    urls: string[],
    options: ScrapingOptions = {},
  ) => {
    try {
      actions.setBatchSubmitting(true);

      const batch = await fetch(`${getApiBaseUrl()}/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Use HTTP-only cookies for authentication
        body: JSON.stringify({
          name: `Batch ${new Date().toLocaleString()}`,
          urls,
          options,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error((await response.text()) || `HTTP ${response.status}`);
        }
        return response.json();
      });

      actions.setSuccess(`Batch created successfully with ${urls.length} URLs`);
      return batch;
    } catch (error) {
      actions.setError(
        error instanceof Error ? error.message : "Batch submission failed",
      );
    } finally {
      actions.setBatchSubmitting(false);
    }
  };

  // Form handlers
  const handleSingleUrlSubmit = async () => {
    actions.setSubmitting(true);
    actions.clearMessages();

    try {
      await submitSingleJob(state.url);
      actions.clearUrl();
    } catch (error) {
      actions.setError(
        error instanceof Error ? error.message : "Job submission failed",
      );
    } finally {
      actions.setSubmitting(false);
    }
  };

  const handleBatchFormSubmit = async () => {
    actions.setBatchSubmitting(true);
    actions.clearMessages();

    try {
      const urls = actions.getBatchUrlList();
      await submitBatchJobs(urls);
      actions.clearBatchUrls();
      actions.setBatchMode(false);
    } catch (error) {
      actions.setError(
        error instanceof Error ? error.message : "Batch submission failed",
      );
    } finally {
      actions.setBatchSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      await actions.processFile(file);
    } catch {
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
        />
      ) : (
        <BatchUrlForm
          batchUrls={state.batchUrls}
          onBatchUrlsChange={actions.setBatchUrls}
          onFileUpload={handleFileUpload}
          onSubmit={handleBatchFormSubmit}
          onClear={actions.clearBatchUrls}
          isSubmitting={state.isBatchSubmitting}
        />
      )}

      {/* Success/Error Messages */}
      {state.error && (
        <div className="max-w-2xl mx-auto">
          <div className="liquid-glass rounded-glass p-4 border border-red-400/20">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-red-400 text-sm font-medium">Error</p>
                <p className="text-white/80 text-sm mt-1">{state.error}</p>
              </div>
              <button
                onClick={actions.clearMessages}
                className="ml-auto text-white/60 hover:text-white/80 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
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
              <svg
                className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-green-400 text-sm font-medium">Success</p>
                <p className="text-white/80 text-sm mt-1">{state.success}</p>
              </div>
              <button
                onClick={actions.clearMessages}
                className="ml-auto text-white/60 hover:text-white/80 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
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
