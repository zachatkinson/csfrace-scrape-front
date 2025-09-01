/**
 * UrlScraper Component
 * WordPress URL input interface with authentic Liquid Glass material
 * Implements real-time validation and batch processing capabilities
 */

import React, { useState, useCallback, useRef } from 'react';
import { LiquidCard, LiquidButton, LiquidInput } from '../liquid-glass';

// Types for URL scraping
interface UrlValidationResult {
  isValid: boolean;
  isWordPress: boolean;
  error?: string;
  metadata?: {
    title?: string;
    type?: 'post' | 'page' | 'product';
    estimatedSize?: string;
  };
}

interface ScrapingJob {
  id: string;
  url: string;
  status: 'pending' | 'validating' | 'scraping' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
}

export interface UrlScraperProps {
  onJobSubmit?: (job: ScrapingJob) => void;
  onJobUpdate?: (job: ScrapingJob) => void;
  maxConcurrentJobs?: number;
  className?: string;
}

/**
 * UrlScraper - Professional URL input with Liquid Glass effects
 */
export const UrlScraper: React.FC<UrlScraperProps> = ({
  onJobSubmit,
  onJobUpdate,
  maxConcurrentJobs = 5,
  className = '',
}) => {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<UrlValidationResult | null>(null);
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // URL Validation with WordPress detection
  const validateUrl = useCallback(async (inputUrl: string): Promise<UrlValidationResult> => {
    try {
      // Basic URL validation
      const urlObj = new URL(inputUrl);
      
      // Mock WordPress detection (would be replaced with actual API call)
      const isWordPress = inputUrl.includes('wordpress') || 
                         inputUrl.includes('wp-') ||
                         Math.random() > 0.3; // Mock detection
      
      if (!isWordPress) {
        return {
          isValid: false,
          isWordPress: false,
          error: 'This doesn\'t appear to be a WordPress site'
        };
      }
      
      // Mock metadata extraction
      const metadata = {
        title: 'Sample WordPress Post',
        type: 'post' as const,
        estimatedSize: '2.4 MB'
      };
      
      return {
        isValid: true,
        isWordPress: true,
        metadata
      };
      
    } catch (error) {
      return {
        isValid: false,
        isWordPress: false,
        error: 'Invalid URL format'
      };
    }
  }, []);\n  
  // Handle URL input change with real-time validation\n  const handleUrlChange = useCallback(async (newUrl: string) => {\n    setUrl(newUrl);\n    setValidationResult(null);\n    \n    if (newUrl.length < 10) return;\n    \n    setIsValidating(true);\n    \n    // Debounce validation\n    setTimeout(async () => {\n      const result = await validateUrl(newUrl);\n      setValidationResult(result);\n      setIsValidating(false);\n    }, 500);\n  }, [validateUrl]);\n  \n  // Create new scraping job\n  const createJob = (jobUrl: string): ScrapingJob => ({\n    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,\n    url: jobUrl,\n    status: 'pending',\n    progress: 0,\n    createdAt: new Date()\n  });\n  \n  // Submit single URL for processing\n  const handleSubmit = useCallback(() => {\n    if (!validationResult?.isValid || isValidating) return;\n    \n    const job = createJob(url);\n    setJobs(prev => [job, ...prev]);\n    \n    if (onJobSubmit) {\n      onJobSubmit(job);\n    }\n    \n    // Start processing simulation\n    simulateJobProcessing(job);\n    \n    // Clear form\n    setUrl('');\n    setValidationResult(null);\n  }, [url, validationResult, isValidating, onJobSubmit]);\n  \n  // Submit batch URLs\n  const handleBatchSubmit = useCallback(() => {\n    const urls = batchUrls\n      .split('\\n')\n      .map(u => u.trim())\n      .filter(u => u.length > 0);\n    \n    const newJobs = urls.map(createJob);\n    setJobs(prev => [...newJobs, ...prev]);\n    \n    newJobs.forEach(job => {\n      if (onJobSubmit) {\n        onJobSubmit(job);\n      }\n      simulateJobProcessing(job);\n    });\n    \n    setBatchUrls('');\n    setBatchMode(false);\n  }, [batchUrls, onJobSubmit]);\n  \n  // Simulate job processing (replace with actual API calls)\n  const simulateJobProcessing = useCallback((job: ScrapingJob) => {\n    let currentProgress = 0;\n    \n    const updateJob = (updates: Partial<ScrapingJob>) => {\n      const updatedJob = { ...job, ...updates };\n      \n      setJobs(prev => prev.map(j => j.id === job.id ? updatedJob : j));\n      \n      if (onJobUpdate) {\n        onJobUpdate(updatedJob);\n      }\n    };\n    \n    // Start validation phase\n    setTimeout(() => {\n      updateJob({ status: 'validating', progress: 10 });\n    }, 500);\n    \n    // Start scraping phase\n    setTimeout(() => {\n      updateJob({ status: 'scraping', progress: 25 });\n      \n      // Simulate progressive updates\n      const progressInterval = setInterval(() => {\n        currentProgress += Math.random() * 15 + 5;\n        \n        if (currentProgress >= 100) {\n          clearInterval(progressInterval);\n          updateJob({ \n            status: 'completed', \n            progress: 100,\n            result: {\n              convertedHtml: '<div>Sample converted content</div>',\n              images: ['image1.jpg', 'image2.jpg'],\n              metadata: validationResult?.metadata\n            }\n          });\n        } else {\n          updateJob({ progress: Math.min(currentProgress, 95) });\n        }\n      }, 1000);\n    }, 2000);\n  }, [validationResult, onJobUpdate]);\n  \n  // Handle file upload for batch processing\n  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {\n    const file = event.target.files?.[0];\n    if (!file) return;\n    \n    const reader = new FileReader();\n    reader.onload = (e) => {\n      const content = e.target?.result as string;\n      setBatchUrls(content);\n    };\n    reader.readAsText(file);\n  }, []);\n  \n  return (\n    <div className={`space-y-6 ${className}`.trim()}>\n      {/* Mode Switcher */}\n      <div className=\"flex items-center justify-center\">\n        <div className=\"liquid-glass p-2 rounded-glass flex\">\n          <button\n            onClick={() => setBatchMode(false)}\n            className={`px-4 py-2 rounded-glass-sm text-sm font-medium transition-all duration-glass ${\n              !batchMode \n                ? 'bg-white/20 text-white shadow-glass' \n                : 'text-white/70 hover:text-white hover:bg-white/10'\n            }`}\n          >\n            Single URL\n          </button>\n          <button\n            onClick={() => setBatchMode(true)}\n            className={`px-4 py-2 rounded-glass-sm text-sm font-medium transition-all duration-glass ${\n              batchMode \n                ? 'bg-white/20 text-white shadow-glass' \n                : 'text-white/70 hover:text-white hover:bg-white/10'\n            }`}\n          >\n            Batch Processing\n          </button>\n        </div>\n      </div>\n      \n      {!batchMode ? (\n        /* Single URL Mode */\n        <LiquidCard\n          title=\"WordPress URL Converter\"\n          subtitle=\"Enter a WordPress URL to convert to Shopify format\"\n          className=\"max-w-2xl mx-auto\"\n        >\n          <div className=\"space-y-4\">\n            <LiquidInput\n              label=\"WordPress URL\"\n              placeholder=\"https://your-wordpress-site.com/post-url\"\n              value={url}\n              onChange={(e) => handleUrlChange(e.target.value)}\n              loading={isValidating}\n              error={validationResult?.error ? true : false}\n              success={validationResult?.isValid}\n              errorText={validationResult?.error}\n              helperText={validationResult?.isValid \n                ? `Detected: ${validationResult.metadata?.type} - ${validationResult.metadata?.estimatedSize}`\n                : 'Enter a valid WordPress URL'\n              }\n              leftIcon={\n                <svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1\" />\n                </svg>\n              }\n              clearable\n              onClear={() => {\n                setUrl('');\n                setValidationResult(null);\n              }}\n            />\n            \n            <LiquidButton\n              variant=\"primary\"\n              size=\"lg\"\n              fullWidth\n              disabled={!validationResult?.isValid || isValidating}\n              loading={isValidating}\n              onClick={handleSubmit}\n              leftIcon={\n                <svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4\" />\n                </svg>\n              }\n            >\n              Convert to Shopify\n            </LiquidButton>\n          </div>\n        </LiquidCard>\n      ) : (\n        /* Batch Processing Mode */\n        <LiquidCard\n          title=\"Batch URL Processing\"\n          subtitle=\"Convert multiple WordPress URLs simultaneously\"\n          className=\"max-w-4xl mx-auto\"\n        >\n          <div className=\"space-y-4\">\n            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n              {/* Text Area Input */}\n              <div>\n                <label className=\"block text-sm font-medium text-white/80 mb-2\">\n                  URLs (one per line)\n                </label>\n                <div className=\"liquid-glass rounded-glass p-4\">\n                  <textarea\n                    value={batchUrls}\n                    onChange={(e) => setBatchUrls(e.target.value)}\n                    placeholder=\"https://wordpress-site.com/post-1&#10;https://wordpress-site.com/post-2&#10;https://wordpress-site.com/post-3\"\n                    className=\"w-full h-32 bg-transparent border-none outline-none text-white placeholder:text-white/50 resize-none\"\n                  />\n                </div>\n              </div>\n              \n              {/* File Upload */}\n              <div>\n                <label className=\"block text-sm font-medium text-white/80 mb-2\">\n                  Or upload text file\n                </label>\n                <div className=\"liquid-glass rounded-glass p-4 border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer\"\n                     onClick={() => fileInputRef.current?.click()}>\n                  <div className=\"text-center\">\n                    <svg className=\"mx-auto h-12 w-12 text-white/60\" stroke=\"currentColor\" fill=\"none\" viewBox=\"0 0 48 48\">\n                      <path d=\"M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02\" strokeWidth={2} strokeLinecap=\"round\" strokeLinejoin=\"round\" />\n                    </svg>\n                    <p className=\"mt-2 text-sm text-white/60\">\n                      Click to upload or drag and drop\n                    </p>\n                    <p className=\"text-xs text-white/50\">TXT files only</p>\n                  </div>\n                  \n                  <input\n                    ref={fileInputRef}\n                    type=\"file\"\n                    accept=\".txt\"\n                    onChange={handleFileUpload}\n                    className=\"hidden\"\n                  />\n                </div>\n              </div>\n            </div>\n            \n            <div className=\"flex gap-4\">\n              <LiquidButton\n                variant=\"primary\"\n                size=\"lg\"\n                disabled={!batchUrls.trim()}\n                onClick={handleBatchSubmit}\n                leftIcon={\n                  <svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4\" />\n                  </svg>\n                }\n              >\n                Process {batchUrls.split('\\n').filter(u => u.trim()).length} URLs\n              </LiquidButton>\n              \n              <LiquidButton\n                variant=\"secondary\"\n                size=\"lg\"\n                onClick={() => {\n                  setBatchUrls('');\n                  if (fileInputRef.current) {\n                    fileInputRef.current.value = '';\n                  }\n                }}\n              >\n                Clear All\n              </LiquidButton>\n            </div>\n          </div>\n        </LiquidCard>\n      )}\n    </div>\n  );\n};\n\nexport default UrlScraper;"