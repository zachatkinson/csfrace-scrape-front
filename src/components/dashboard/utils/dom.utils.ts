/**
 * DOM Utilities - DRY principle implementation
 * Reusable DOM manipulation functions following SOLID principles
 */

import type { IDOMUtils } from '../types/filter.types';

// =============================================================================
// DOM UTILITIES CLASS (Single Responsibility Principle)
// =============================================================================

export class DOMUtils implements IDOMUtils {
  
  /**
   * Safe querySelector with null check
   */
  querySelector<T extends Element = Element>(selector: string): T | null {
    try {
      return document.querySelector<T>(selector);
    } catch (error) {
      console.warn(`DOM selector failed: ${selector}`, error);
      return null;
    }
  }

  /**
   * Safe querySelectorAll with error handling
   */
  querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    try {
      return document.querySelectorAll<T>(selector);
    } catch (error) {
      console.warn(`DOM selector failed: ${selector}`, error);
      return document.querySelectorAll('');
    }
  }

  /**
   * Add CSS class safely
   */
  addClass(element: Element, className: string): void {
    if (!element || !className) return;
    element.classList.add(className);
  }

  /**
   * Remove CSS class safely
   */
  removeClass(element: Element, className: string): void {
    if (!element || !className) return;
    element.classList.remove(className);
  }

  /**
   * Toggle CSS class safely
   */
  toggleClass(element: Element, className: string): void {
    if (!element || !className) return;
    element.classList.toggle(className);
  }

  /**
   * Set attribute safely
   */
  setAttribute(element: Element, name: string, value: string): void {
    if (!element || !name) return;
    element.setAttribute(name, value);
  }

  /**
   * Add event listener with error handling (generic event support)
   */
  addEventListener<K extends keyof HTMLElementEventMap>(
    element: Element,
    type: K,
    listener: (this: Element, ev: HTMLElementEventMap[K]) => any
  ): void;
  addEventListener(
    element: Element,
    type: string,
    listener: EventListener
  ): void;
  addEventListener(
    element: Element,
    type: string,
    listener: EventListener | ((this: Element, ev: Event) => any)
  ): void {
    if (!element || !type || !listener) return;

    try {
      element.addEventListener(type, listener as EventListener);
    } catch (error) {
      console.warn(`Failed to add event listener: ${type}`, error);
    }
  }

  /**
   * Update multiple classes at once (DRY pattern)
   */
  updateClasses(element: Element, classUpdates: {
    add?: string[];
    remove?: string[];
    toggle?: string[];
  }): void {
    if (!element) return;

    const { add = [], remove = [], toggle = [] } = classUpdates;

    remove.forEach(className => this.removeClass(element, className));
    add.forEach(className => this.addClass(element, className));
    toggle.forEach(className => this.toggleClass(element, className));
  }

  /**
   * Set multiple attributes at once (DRY pattern)
   */
  setAttributes(element: Element, attributes: Record<string, string>): void {
    if (!element) return;

    Object.entries(attributes).forEach(([name, value]) => {
      this.setAttribute(element, name, value);
    });
  }

  /**
   * Get data attribute value safely
   */
  getDataAttribute(element: Element, attributeName: string): string | null {
    if (!element || !attributeName) return null;
    
    return element.getAttribute(`data-${attributeName}`);
  }

  /**
   * Set data attribute safely
   */
  setDataAttribute(element: Element, attributeName: string, value: string): void {
    if (!element || !attributeName) return;
    
    this.setAttribute(element, `data-${attributeName}`, value);
  }
}

// =============================================================================
// SINGLETON INSTANCE (following DRY principle)
// =============================================================================

export const domUtils = new DOMUtils();

// =============================================================================
// CONVENIENCE FUNCTIONS (DRY principle)
// =============================================================================

/**
 * Wait for DOM to be ready
 */
export function waitForDOM(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve());
    } else {
      resolve();
    }
  });
}

/**
 * Debounce function for performance (DRY pattern)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function for performance (DRY pattern)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}