/**
 * Batch URL Form Component
 * Single Responsibility: Handle batch URL input and file upload UI
 * Extracted from UrlScraper to follow SOLID principles
 */

import React, { useRef } from "react";
import { LiquidCard, LiquidButton } from "../liquid-glass";

export interface BatchUrlFormProps {
  batchUrls: string;
  onBatchUrlsChange: (urls: string) => void;
  onFileUpload: (file: File) => void;
  onSubmit: () => void;
  onClear: () => void;

  // Submission state
  isSubmitting: boolean;

  // UI customization
  className?: string;
  title?: string;
  subtitle?: string;
  maxUrls?: number;
}

/**
 * BatchUrlForm - Clean, focused batch processing component
 */
export const BatchUrlForm: React.FC<BatchUrlFormProps> = ({
  batchUrls,
  onBatchUrlsChange,
  onFileUpload,
  onSubmit,
  onClear,
  isSubmitting,
  className = "",
  title = "Batch URL Processing",
  subtitle = "Convert multiple WordPress URLs simultaneously",
  maxUrls = 100,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate URL count and validation
  const urlList = batchUrls
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  const urlCount = urlList.length;
  const isValid = urlCount > 0 && urlCount <= maxUrls;
  const hasUrls = batchUrls.trim().length > 0;

  const getButtonText = () => {
    if (isSubmitting) return "Creating Batch...";
    return `Process ${urlCount} URL${urlCount !== 1 ? "s" : ""}`;
  };

  const getValidationMessage = () => {
    if (urlCount === 0) return null;
    if (urlCount > maxUrls) {
      return `Too many URLs. Maximum is ${maxUrls}, you have ${urlCount}.`;
    }
    return `Ready to process ${urlCount} URL${urlCount !== 1 ? "s" : ""}`;
  };

  const validationMessage = getValidationMessage();
  const hasValidationError = urlCount > maxUrls;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset input to allow same file upload again
      event.target.value = "";
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "text/plain") {
      onFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <LiquidCard
      title={title}
      subtitle={subtitle}
      className={`max-w-4xl mx-auto ${className}`.trim()}
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
                onChange={(e) => onBatchUrlsChange(e.target.value)}
                placeholder="https://wordpress-site.com/post-1&#10;https://wordpress-site.com/post-2&#10;https://wordpress-site.com/post-3"
                className="w-full h-32 bg-transparent border-none outline-none text-white placeholder:text-white/50 resize-none"
              />
            </div>

            {/* URL count and validation */}
            {validationMessage && (
              <div
                className={`mt-2 text-xs ${hasValidationError ? "text-red-400" : "text-green-400"}`}
              >
                {validationMessage}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Or upload text file
            </label>
            <div
              className="liquid-glass rounded-glass p-4 border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer h-32 flex flex-col justify-center"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-center">
                <svg
                  className="mx-auto h-8 w-8 text-white/60"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-1 text-sm text-white/60">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-white/50">TXT, CSV, or JSON files</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Processing Options */}
        <div className="liquid-glass rounded-glass p-4">
          <h3 className="text-sm font-medium text-white/80 mb-3">
            Processing Options
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/70">Preserve formatting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/70">Convert images</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/70">Generate SEO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/70">Shopify optimization</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <LiquidButton
            variant="primary"
            size="lg"
            disabled={!isValid}
            loading={isSubmitting}
            onClick={onSubmit}
            leftIcon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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

          <LiquidButton
            variant="secondary"
            size="lg"
            disabled={!hasUrls}
            onClick={() => {
              onClear();
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            Clear All
          </LiquidButton>
        </div>

        {/* Help Text */}
        <div className="text-xs text-white/50 space-y-1">
          <div>• Maximum {maxUrls} URLs per batch</div>
          <div>
            • Supported formats: Plain text (one URL per line), CSV, JSON
          </div>
          <div>
            • Batch processing runs all URLs simultaneously for faster results
          </div>
        </div>
      </div>
    </LiquidCard>
  );
};

export default BatchUrlForm;
