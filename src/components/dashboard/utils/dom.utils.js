/**
 * DOM Utilities - SOLID Utility Functions for DOM Operations
 * Following SOLID principles with pure functions
 */

// =============================================================================
// DOM QUERY UTILITIES (Single Responsibility)
// =============================================================================

export const domUtils = {
  // Wait for an element to appear in the DOM
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout after specified time
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },

  // Wait for multiple elements
  async waitForElements(selectors, timeout = 5000) {
    const promises = selectors.map(selector => this.waitForElement(selector, timeout));
    return Promise.all(promises);
  },

  // Check if element exists
  exists(selector) {
    return document.querySelector(selector) !== null;
  },

  // Get element with error handling
  get(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
    }
    return element;
  },

  // Get all elements
  getAll(selector) {
    return Array.from(document.querySelectorAll(selector));
  },

  // Find closest parent with selector
  closest(element, selector) {
    return element?.closest?.(selector) || null;
  }
};

// =============================================================================
// DOM MANIPULATION UTILITIES (Single Responsibility)
// =============================================================================

export const DOMManipulation = {
  // Add class with validation
  addClass(element, className) {
    if (element && className) {
      element.classList.add(className);
    }
  },

  // Remove class with validation
  removeClass(element, className) {
    if (element && className) {
      element.classList.remove(className);
    }
  },

  // Toggle class with validation
  toggleClass(element, className) {
    if (element && className) {
      element.classList.toggle(className);
      return element.classList.contains(className);
    }
    return false;
  },

  // Set attribute safely
  setAttribute(element, name, value) {
    if (element && name) {
      element.setAttribute(name, value);
    }
  },

  // Get attribute safely
  getAttribute(element, name) {
    return element?.getAttribute?.(name) || null;
  },

  // Set text content safely
  setText(element, text) {
    if (element) {
      element.textContent = text || '';
    }
  },

  // Set HTML safely (with basic sanitization)
  setHTML(element, html) {
    if (element) {
      // Basic sanitization - remove script tags
      const sanitized = (html || '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      element.innerHTML = sanitized;
    }
  }
};

// =============================================================================
// EVENT UTILITIES (Single Responsibility)
// =============================================================================

export const EventUtils = {
  // Add event listener with error handling
  on(element, event, handler, options = {}) {
    if (element && event && handler) {
      element.addEventListener(event, handler, options);
      return () => element.removeEventListener(event, handler, options);
    }
    return () => {};
  },

  // Remove event listener
  off(element, event, handler, options = {}) {
    if (element && event && handler) {
      element.removeEventListener(event, handler, options);
    }
  },

  // Dispatch custom event
  dispatch(element, eventType, detail = {}) {
    if (element && eventType) {
      const event = new CustomEvent(eventType, {
        detail,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
      return event;
    }
    return null;
  },

  // Delegate event handling
  delegate(container, selector, event, handler) {
    if (container && selector && event && handler) {
      const delegateHandler = (e) => {
        const target = e.target.closest(selector);
        if (target) {
          handler.call(target, e);
        }
      };

      container.addEventListener(event, delegateHandler);
      return () => container.removeEventListener(event, delegateHandler);
    }
    return () => {};
  }
};

// =============================================================================
// TIMING UTILITIES (Single Responsibility)
// =============================================================================

export const TimingUtils = {
  // Debounce function calls
  debounce(func, delay) {
    let timeoutId;
    const debounced = function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };

    debounced.cancel = () => clearTimeout(timeoutId);
    return debounced;
  },

  // Throttle function calls
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Wait for specified time
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Animation frame utility
  nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }
};

// =============================================================================
// DOM READY UTILITIES (Single Responsibility)
// =============================================================================

export const ReadyUtils = {
  // Wait for DOM to be ready
  ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  },

  // Wait for DOM ready as promise
  waitForReady() {
    return new Promise(resolve => {
      this.ready(resolve);
    });
  },

  // Check if DOM is ready
  isReady() {
    return document.readyState !== 'loading';
  }
};

// =============================================================================
// VISIBILITY UTILITIES (Single Responsibility)
// =============================================================================

export const VisibilityUtils = {
  // Check if element is visible
  isVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  },

  // Check if element is in viewport
  isInViewport(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Show element
  show(element) {
    if (element) {
      element.style.display = '';
      element.removeAttribute('hidden');
    }
  },

  // Hide element
  hide(element) {
    if (element) {
      element.style.display = 'none';
    }
  },

  // Toggle visibility
  toggle(element) {
    if (element) {
      if (this.isVisible(element)) {
        this.hide(element);
        return false;
      } else {
        this.show(element);
        return true;
      }
    }
    return false;
  }
};

// =============================================================================
// FORM UTILITIES (Single Responsibility)
// =============================================================================

export const FormUtils = {
  // Get form data as object
  getFormData(form) {
    if (!form) return {};
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  },

  // Set form values from object
  setFormData(form, data) {
    if (!form || !data) return;
    Object.entries(data).forEach(([key, value]) => {
      const element = form.querySelector(`[name="${key}"]`);
      if (element) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.checked = Boolean(value);
        } else {
          element.value = value || '';
        }
      }
    });
  },

  // Validate form
  validate(form) {
    if (!form) return false;
    return form.checkValidity();
  },

  // Reset form
  reset(form) {
    if (form) {
      form.reset();
    }
  }
};

// =============================================================================
// CONVENIENCE EXPORTS (DRY Principle)
// =============================================================================

// Export commonly used functions directly
export const waitForDOM = ReadyUtils.waitForReady;
export const debounce = TimingUtils.debounce;
export const throttle = TimingUtils.throttle;
export const ready = ReadyUtils.ready;

// Export all utilities as default
export default {
  domUtils,
  DOMManipulation,
  EventUtils,
  TimingUtils,
  ReadyUtils,
  VisibilityUtils,
  FormUtils,
  waitForDOM,
  debounce,
  throttle,
  ready
};