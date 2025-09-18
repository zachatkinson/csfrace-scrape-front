/**
 * Conversion Form Manager - Following Astro Best Practices & SOLID Principles
 * Handles all form functionality: mode toggle, validation, file upload, and submission
 * Single Responsibility: Manages conversion form interactions and state
 */

import { createContextLogger } from '../utils/logger.js';

interface ConversionFormConfig {
  apiBaseUrl: string;
  container: HTMLElement;
  defaultMode?: 'bulk' | 'single';
}

export class ConversionFormManager {
  private readonly logger = createContextLogger('ConversionFormManager');
  private container: HTMLElement;
  private currentMode: 'bulk' | 'single' = 'bulk';
  
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
    this.currentMode = config.defaultMode || 'bulk';
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
    this.singlePostInterface = this.container.querySelector('#single-post-interface');
    this.bulkUploadInterface = this.container.querySelector('#bulk-upload-interface');
    this.modeDescription = this.container.querySelector('#mode-description');
    this.singlePostBtn = this.container.querySelector('#single-post-btn');
    this.bulkUploadBtn = this.container.querySelector('#bulk-upload-btn');
    this.segmentedControl = this.container.querySelector('.liquid-glass-segmented-control');
    
    // Single post elements
    this.urlInput = this.container.querySelector('#wordpress-url') as HTMLInputElement;
    this.convertNowBtn = this.container.querySelector('#convert-now-btn') as HTMLButtonElement;
    
    // Bulk upload elements
    this.dropZone = this.container.querySelector('#drop-zone');
    this.fileInput = this.container.querySelector('#file-input') as HTMLInputElement;
    this.fileName = this.container.querySelector('#file-name');
    this.bulkConvertBtn = this.container.querySelector('#bulk-convert-btn') as HTMLButtonElement;
  }

  /**
   * Set up mode toggle functionality
   */
  private setupModeToggle() {
    if (this.singlePostBtn) {
      this.singlePostBtn.addEventListener('click', () => {
        this.switchToMode('single');
      });
    }
    
    if (this.bulkUploadBtn) {
      this.bulkUploadBtn.addEventListener('click', () => {
        this.switchToMode('bulk');
      });
    }
  }

  /**
   * Switch between form modes with animation
   */
  private switchToMode(mode: 'bulk' | 'single') {
    this.currentMode = mode;
    
    if (mode === 'single') {
      // Update button states
      this.updateActiveSegment(this.singlePostBtn, this.bulkUploadBtn, true);
      
      // Update description
      if (this.modeDescription) {
        this.modeDescription.textContent = 'Convert individual WordPress posts by entering their URL';
      }
      
      // Switch interfaces
      this.bulkUploadInterface?.classList.add('hidden');
      this.singlePostInterface?.classList.remove('hidden');
      
    } else {
      // Update button states
      this.updateActiveSegment(this.bulkUploadBtn, this.singlePostBtn, false);
      
      // Update description
      if (this.modeDescription) {
        this.modeDescription.textContent = 'Upload CSV or TXT files containing multiple WordPress URLs';
      }
      
      // Switch interfaces
      this.singlePostInterface?.classList.add('hidden');
      this.bulkUploadInterface?.classList.remove('hidden');
    }
    
    // Emit custom event for other components (like JobDashboard) to listen to
    this.emitModeChangeEvent(mode);
  }

  /**
   * Update active segment with animation
   */
  private updateActiveSegment(activeBtn: HTMLElement | null, inactiveBtn: HTMLElement | null, isSingleActive: boolean) {
    // Update button states
    activeBtn?.classList.add('active');
    inactiveBtn?.classList.remove('active');
    
    // Update control container state for sliding animation
    if (this.segmentedControl) {
      if (isSingleActive) {
        this.segmentedControl.classList.add('single-active');
      } else {
        this.segmentedControl.classList.remove('single-active');
      }
      
      // Add pulse animation on selection change
      this.segmentedControl.classList.add('selection-changed');
      setTimeout(() => {
        this.segmentedControl?.classList.remove('selection-changed');
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
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
      } catch {
        return false;
      }
    };

    this.urlInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const url = target.value.trim();
      const isValid = url.length > 0 && validateURL(url);
      
      if (this.convertNowBtn) {
        this.convertNowBtn.disabled = !isValid;
      }
      
      // Update input styling based on validity
      if (url.length > 0) {
        if (isValid) {
          target.style.borderColor = 'rgba(34, 197, 94, 0.8)'; // Green for valid
        } else {
          target.style.borderColor = 'rgba(239, 68, 68, 0.8)'; // Red for invalid
        }
      } else {
        target.style.borderColor = ''; // Reset to default
      }
    });
    
    // Also check on paste
    this.urlInput.addEventListener('paste', () => {
      setTimeout(() => {
        this.urlInput?.dispatchEvent(new Event('input'));
      }, 10);
    });

    // Handle form submission
    this.convertNowBtn.addEventListener('click', () => {
      this.handleSinglePostSubmission();
    });
  }

  /**
   * Set up bulk upload drag and drop functionality
   */
  private setupBulkUploadHandling() {
    if (!this.dropZone || !this.fileInput) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      if (this.dropZone) {
        this.dropZone.addEventListener(eventName, this.preventDefaults, false);
      }
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });
    
    // Highlight drop zone when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
      if (this.dropZone) {
        this.dropZone.addEventListener(eventName, this.highlight.bind(this), false);
      }
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      if (this.dropZone) {
        this.dropZone.addEventListener(eventName, this.unhighlight.bind(this), false);
      }
    });
    
    // Handle dropped files
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this), false);

    // Handle bulk form submission
    if (this.bulkConvertBtn) {
      this.bulkConvertBtn.addEventListener('click', () => {
        this.handleBulkUploadSubmission();
      });
    }
  }

  private preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  private highlight() {
    this.dropZone?.classList.add('border-white/70', 'bg-black/30');
  }

  private unhighlight() {
    this.dropZone?.classList.remove('border-white/70', 'bg-black/30');
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
      if (file && (file.type === 'text/csv' || file.type === 'text/plain' ||
          file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
        
        // Show file name
        if (this.fileName) {
          this.fileName.classList.remove('hidden');
          const fileNameText = this.fileName.querySelector('p');
          if (fileNameText) {
            fileNameText.textContent = `📄 ${file.name}`;
          }
        }
        
        // Enable convert button
        if (this.bulkConvertBtn) {
          this.bulkConvertBtn.disabled = false;
        }
      } else {
        alert('Please upload a CSV or TXT file.');
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
  private handleSinglePostSubmission() {
    if (!this.urlInput) return;
    
    const url = this.urlInput.value.trim();
    this.logger.info('Submitting single post conversion', { url });
    
    // TODO: Implement actual API call to backend
    // This should integrate with the backend conversion API
    
    // Emit event for JobDashboard to refresh
    this.emitJobSubmissionEvent('single', { url });
  }

  /**
   * Handle bulk upload form submission
   */
  private handleBulkUploadSubmission() {
    if (!this.fileInput?.files?.[0]) return;
    
    const file = this.fileInput.files[0];
    this.logger.info('Submitting bulk upload conversion', { fileName: file.name });
    
    // TODO: Implement actual API call to backend
    // This should read the file and submit URLs for bulk processing
    
    // Emit event for JobDashboard to refresh
    this.emitJobSubmissionEvent('bulk', { fileName: file.name, fileSize: file.size });
  }

  /**
   * Emit mode change event for other components
   */
  private emitModeChangeEvent(mode: 'bulk' | 'single') {
    const event = new CustomEvent('conversionModeChanged', {
      detail: { mode, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit job submission event for JobDashboard to refresh
   */
  private emitJobSubmissionEvent(type: 'single' | 'bulk', data: Record<string, unknown>) {
    const event = new CustomEvent('conversionJobSubmitted', {
      detail: { type, data, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current form mode
   */
  getCurrentMode(): 'bulk' | 'single' {
    return this.currentMode;
  }

  /**
   * Programmatically switch mode (for external control)
   */
  switchMode(mode: 'bulk' | 'single') {
    this.switchToMode(mode);
  }
}