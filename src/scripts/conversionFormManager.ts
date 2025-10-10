/**
 * Conversion Form Manager - Following Astro Best Practices & SOLID Principles
 * Handles all form functionality: mode toggle, validation, file upload, and submission
 * Single Responsibility: Manages conversion form interactions and state
 */

import { createContextLogger } from "../utils/logger.js";

interface ConversionFormConfig {
  apiBaseUrl: string;
  container: HTMLElement;
  defaultMode?: "bulk" | "single";
}

export class ConversionFormManager {
  private readonly logger = createContextLogger("ConversionFormManager");
  private container: HTMLElement;
  private currentMode: "bulk" | "single" = "bulk";
  private apiBaseUrl: string;

  // Form elements
  private singlePostInterface: HTMLElement | null = null;
  private bulkUploadInterface: HTMLElement | null = null;
  private modeDescription: HTMLElement | null = null;
  private singlePostBtn: HTMLElement | null = null;
  private bulkUploadBtn: HTMLElement | null = null;
  private segmentedControl: HTMLElement | null = null;

  // Single post elements
  private urlInput: HTMLInputElement | null = null;
  private convertNowBtn: HTMLButtonElement | null = null;

  // Bulk upload elements
  private dropZone: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private fileName: HTMLElement | null = null;
  private bulkConvertBtn: HTMLButtonElement | null = null;

  constructor(config: ConversionFormConfig) {
    this.container = config.container;
    this.currentMode = config.defaultMode || "bulk";
    this.apiBaseUrl = config.apiBaseUrl;
  }

  /**
   * Initialize the form manager
   */
  init() {
    this.cacheElements();
    this.setupModeToggle();
    this.setupSinglePostValidation();
    this.setupBulkUploadHandling();
    this.setInitialMode();
  }

  /**
   * Cache DOM elements for performance
   */
  private cacheElements() {
    this.singlePostInterface = this.container.querySelector(
      "#single-post-interface",
    );
    this.bulkUploadInterface = this.container.querySelector(
      "#bulk-upload-interface",
    );
    this.modeDescription = this.container.querySelector("#mode-description");
    this.singlePostBtn = this.container.querySelector("#single-post-btn");
    this.bulkUploadBtn = this.container.querySelector("#bulk-upload-btn");
    this.segmentedControl = this.container.querySelector(
      ".liquid-glass-segmented-control",
    );

    // Single post elements
    this.urlInput = this.container.querySelector(
      "#wordpress-url",
    ) as HTMLInputElement;
    this.convertNowBtn = this.container.querySelector(
      "#convert-now-btn",
    ) as HTMLButtonElement;

    // Bulk upload elements
    this.dropZone = this.container.querySelector("#drop-zone");
    this.fileInput = this.container.querySelector(
      "#file-input",
    ) as HTMLInputElement;
    this.fileName = this.container.querySelector("#file-name");
    this.bulkConvertBtn = this.container.querySelector(
      "#bulk-convert-btn",
    ) as HTMLButtonElement;
  }

  /**
   * Set up mode toggle functionality
   */
  private setupModeToggle() {
    if (this.singlePostBtn) {
      this.singlePostBtn.addEventListener("click", () => {
        this.switchToMode("single");
      });
    }

    if (this.bulkUploadBtn) {
      this.bulkUploadBtn.addEventListener("click", () => {
        this.switchToMode("bulk");
      });
    }
  }

  /**
   * Switch between form modes with animation
   */
  private switchToMode(mode: "bulk" | "single") {
    this.currentMode = mode;

    if (mode === "single") {
      // Update button states
      this.updateActiveSegment(this.singlePostBtn, this.bulkUploadBtn, true);

      // Update description
      if (this.modeDescription) {
        this.modeDescription.textContent =
          "Convert individual WordPress posts by entering their URL";
      }

      // Switch interfaces
      this.bulkUploadInterface?.classList.add("hidden");
      this.singlePostInterface?.classList.remove("hidden");
    } else {
      // Update button states
      this.updateActiveSegment(this.bulkUploadBtn, this.singlePostBtn, false);

      // Update description
      if (this.modeDescription) {
        this.modeDescription.textContent =
          "Upload CSV or TXT files containing multiple WordPress URLs";
      }

      // Switch interfaces
      this.singlePostInterface?.classList.add("hidden");
      this.bulkUploadInterface?.classList.remove("hidden");
    }

    // Emit custom event for other components (like JobDashboard) to listen to
    this.emitModeChangeEvent(mode);
  }

  /**
   * Update active segment with animation
   */
  private updateActiveSegment(
    activeBtn: HTMLElement | null,
    inactiveBtn: HTMLElement | null,
    isSingleActive: boolean,
  ) {
    // Update button states
    activeBtn?.classList.add("active");
    inactiveBtn?.classList.remove("active");

    // Update control container state for sliding animation
    if (this.segmentedControl) {
      if (isSingleActive) {
        this.segmentedControl.classList.add("single-active");
      } else {
        this.segmentedControl.classList.remove("single-active");
      }

      // Add pulse animation on selection change
      this.segmentedControl.classList.add("selection-changed");
      setTimeout(() => {
        this.segmentedControl?.classList.remove("selection-changed");
      }, 400);
    }
  }

  /**
   * Set up URL validation for single post mode
   */
  private setupSinglePostValidation() {
    if (!this.urlInput || !this.convertNowBtn) return;

    const validateURL = (url: string): boolean => {
      try {
        const urlObj = new URL(url);
        return urlObj.protocol === "http:" || urlObj.protocol === "https:";
      } catch {
        return false;
      }
    };

    this.urlInput.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const url = target.value.trim();
      const isValid = url.length > 0 && validateURL(url);

      if (this.convertNowBtn) {
        this.convertNowBtn.disabled = !isValid;
      }

      // Update input styling based on validity
      if (url.length > 0) {
        if (isValid) {
          target.style.borderColor = "rgba(34, 197, 94, 0.8)"; // Green for valid
        } else {
          target.style.borderColor = "rgba(239, 68, 68, 0.8)"; // Red for invalid
        }
      } else {
        target.style.borderColor = ""; // Reset to default
      }
    });

    // Also check on paste
    this.urlInput.addEventListener("paste", () => {
      setTimeout(() => {
        this.urlInput?.dispatchEvent(new Event("input"));
      }, 10);
    });

    // Handle form submission
    this.convertNowBtn.addEventListener("click", () => {
      this.handleSinglePostSubmission();
    });
  }

  /**
   * Set up bulk upload drag and drop functionality
   */
  private setupBulkUploadHandling() {
    if (!this.dropZone || !this.fileInput) return;

    // Prevent default drag behaviors
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      if (this.dropZone) {
        this.dropZone.addEventListener(eventName, this.preventDefaults, false);
      }
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    // Highlight drop zone when dragging over
    ["dragenter", "dragover"].forEach((eventName) => {
      if (this.dropZone) {
        this.dropZone.addEventListener(
          eventName,
          this.highlight.bind(this),
          false,
        );
      }
    });

    ["dragleave", "drop"].forEach((eventName) => {
      if (this.dropZone) {
        this.dropZone.addEventListener(
          eventName,
          this.unhighlight.bind(this),
          false,
        );
      }
    });

    // Handle dropped files
    this.dropZone.addEventListener("drop", this.handleDrop.bind(this), false);
    this.fileInput.addEventListener(
      "change",
      this.handleFileSelect.bind(this),
      false,
    );

    // Handle bulk form submission
    if (this.bulkConvertBtn) {
      this.bulkConvertBtn.addEventListener("click", () => {
        this.handleBulkUploadSubmission();
      });
    }
  }

  private preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  private highlight() {
    this.dropZone?.classList.add("border-white/70", "bg-black/30");
  }

  private unhighlight() {
    this.dropZone?.classList.remove("border-white/70", "bg-black/30");
  }

  private handleDrop(e: DragEvent) {
    const files = e.dataTransfer?.files;
    if (files) this.handleFiles(files);
  }

  private handleFileSelect(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files) this.handleFiles(files);
  }

  private handleFiles(files: FileList) {
    if (files.length > 0) {
      const file = files[0];
      if (
        file &&
        (file.type === "text/csv" ||
          file.type === "text/plain" ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".txt"))
      ) {
        // Show file name
        if (this.fileName) {
          this.fileName.classList.remove("hidden");
          const fileNameText = this.fileName.querySelector("p");
          if (fileNameText) {
            fileNameText.textContent = `📄 ${file.name}`;
          }
        }

        // Enable convert button
        if (this.bulkConvertBtn) {
          this.bulkConvertBtn.disabled = false;
        }
      } else {
        alert("Please upload a CSV or TXT file.");
      }
    }
  }

  /**
   * Set initial mode based on configuration
   */
  private setInitialMode() {
    this.switchToMode(this.currentMode);
  }

  /**
   * Handle single post form submission
   */
  private async handleSinglePostSubmission() {
    if (!this.urlInput || !this.convertNowBtn) return;

    const url = this.urlInput.value.trim();

    // Validate URL
    if (!url) {
      this.logger.warn("Empty URL provided");
      alert("Please enter a valid WordPress URL");
      return;
    }

    this.logger.info("Submitting single post conversion", { url });

    // Disable button and show loading state
    this.convertNowBtn.disabled = true;
    const originalText = this.convertNowBtn.textContent;
    this.convertNowBtn.textContent = "Converting...";

    try {
      // Create job via backend API
      const response = await fetch(`${this.apiBaseUrl}/jobs/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: [url],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();
      this.logger.info("Job created successfully", { result });

      // Clear input on success
      this.urlInput.value = "";

      // Show success feedback
      this.convertNowBtn.textContent = "✓ Submitted!";
      setTimeout(() => {
        if (this.convertNowBtn && originalText) {
          this.convertNowBtn.textContent = originalText;
        }
      }, 2000);

      // Emit event for JobDashboard to refresh
      this.emitJobSubmissionEvent("single", { url, jobId: result.job_id });
    } catch (error) {
      this.logger.error("Failed to create job", { error });
      alert(
        `Failed to create conversion job: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Restore button state
      if (this.convertNowBtn && originalText) {
        this.convertNowBtn.textContent = originalText;
      }
    } finally {
      // Re-enable button
      if (this.convertNowBtn) {
        this.convertNowBtn.disabled = false;
      }
    }
  }

  /**
   * Handle bulk upload form submission
   * Reads CSV/TXT file and submits URLs to backend for bulk processing
   */
  private async handleBulkUploadSubmission() {
    if (!this.fileInput?.files?.[0] || !this.bulkConvertBtn) return;

    const file = this.fileInput.files[0];
    this.logger.info("Submitting bulk upload conversion", {
      fileName: file.name,
    });

    // Disable button and show loading state
    this.bulkConvertBtn.disabled = true;
    const originalText = this.bulkConvertBtn.textContent;
    this.bulkConvertBtn.textContent = "Processing file...";

    try {
      // Read file content
      const fileContent = await this.readFileContent(file);

      // Parse URLs from file (support both CSV and plain text formats)
      const urls = this.parseUrlsFromFile(fileContent, file.name);

      if (urls.length === 0) {
        throw new Error("No valid URLs found in the file");
      }

      this.logger.info("Parsed URLs from file", { count: urls.length, urls });

      // Update button text to show progress
      this.bulkConvertBtn.textContent = `Submitting ${urls.length} URL${urls.length > 1 ? "s" : ""}...`;

      // Submit bulk job to backend API
      const response = await fetch(`${this.apiBaseUrl}/jobs/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          urls: urls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();
      this.logger.info("Bulk job created successfully", {
        result,
        urlCount: urls.length,
      });

      // Show success feedback
      this.bulkConvertBtn.textContent = `✓ Submitted ${urls.length} URL${urls.length > 1 ? "s" : ""}!`;

      // Clear file selection
      if (this.fileInput) {
        this.fileInput.value = "";
      }
      if (this.fileName) {
        this.fileName.classList.add("hidden");
      }

      // Restore button after delay
      setTimeout(() => {
        if (this.bulkConvertBtn && originalText) {
          this.bulkConvertBtn.textContent = originalText;
        }
      }, 2000);

      // Emit event for JobDashboard to refresh
      this.emitJobSubmissionEvent("bulk", {
        fileName: file.name,
        fileSize: file.size,
        urlCount: urls.length,
        jobId: result.job_id,
      });
    } catch (error) {
      this.logger.error("Failed to process bulk upload", { error });
      alert(
        `Failed to process bulk upload: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Restore button state
      if (this.bulkConvertBtn && originalText) {
        this.bulkConvertBtn.textContent = originalText;
      }
    } finally {
      // Re-enable button
      if (this.bulkConvertBtn) {
        this.bulkConvertBtn.disabled = false;
      }
    }
  }

  /**
   * Read file content as text
   */
  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          resolve(content);
        } else {
          reject(new Error("Failed to read file as text"));
        }
      };
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsText(file);
    });
  }

  /**
   * Parse URLs from file content
   * Supports CSV (comma-separated) and plain text (line-separated) formats
   */
  private parseUrlsFromFile(content: string, fileName: string): string[] {
    const urls: string[] = [];
    const isCsv = fileName.toLowerCase().endsWith(".csv");

    // Split content into lines
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

    for (const line of lines) {
      if (isCsv) {
        // For CSV, split by comma and extract URLs
        const fields = line.split(",").map((field) => field.trim());
        for (const field of fields) {
          if (this.isValidUrl(field)) {
            urls.push(field);
          }
        }
      } else {
        // For plain text, treat each line as a URL
        const trimmedLine = line.trim();
        if (this.isValidUrl(trimmedLine)) {
          urls.push(trimmedLine);
        }
      }
    }

    // Remove duplicates while preserving order
    return Array.from(new Set(urls));
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Emit mode change event for other components
   */
  private emitModeChangeEvent(mode: "bulk" | "single") {
    const event = new CustomEvent("conversionModeChanged", {
      detail: { mode, timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit job submission event for JobDashboard to refresh
   */
  private emitJobSubmissionEvent(
    type: "single" | "bulk",
    data: Record<string, unknown>,
  ) {
    const event = new CustomEvent("conversionJobSubmitted", {
      detail: { type, data, timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current form mode
   */
  getCurrentMode(): "bulk" | "single" {
    return this.currentMode;
  }

  /**
   * Programmatically switch mode (for external control)
   */
  switchMode(mode: "bulk" | "single") {
    this.switchToMode(mode);
  }
}
