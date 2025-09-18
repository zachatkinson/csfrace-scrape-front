// =============================================================================
// DRY/SOLID DOM UTILITIES - SINGLE RESPONSIBILITY & EXTENSIBLE
// =============================================================================
// Eliminates repetitive DOM manipulation patterns across the codebase
// Follows SOLID principles with clear abstractions and interfaces
// =============================================================================

import { createContextLogger } from "./logger";

const logger = createContextLogger("DomUtilities");

// =============================================================================
// INTERFACES (Interface Segregation Principle)
// =============================================================================
export interface IDomUpdater {
  updateElement(elementId: string, value: string | number): boolean;
  updateElements(updates: Record<string, string | number>): void;
}

export interface IDomClassUpdater {
  updateClass(elementId: string, className: string): boolean;
  toggleClass(
    elementId: string,
    className: string,
    condition: boolean,
  ): boolean;
}

export interface IDomValidator {
  validateElement(elementId: string): boolean;
  validateElements(elementIds: string[]): string[];
}

// =============================================================================
// SINGLE RESPONSIBILITY: DOM Element Access & Validation
// =============================================================================
export class SafeDomAccessor implements IDomValidator {
  /**
   * Safely get element by ID with error handling
   */
  static getElement(elementId: string): HTMLElement | null {
    try {
      return document.getElementById(elementId);
    } catch (error) {
      logger.warn("DOM access error for element", { elementId, error });
      return null;
    }
  }

  /**
   * Validate if element exists
   */
  validateElement(elementId: string): boolean {
    return SafeDomAccessor.getElement(elementId) !== null;
  }

  /**
   * Validate multiple elements, return missing ones
   */
  validateElements(elementIds: string[]): string[] {
    return elementIds.filter((id) => !this.validateElement(id));
  }
}

// =============================================================================
// SINGLE RESPONSIBILITY: Text Content Updates
// =============================================================================
export class DomTextUpdater implements IDomUpdater {
  /**
   * DRY: Update single element text content
   */
  updateElement(elementId: string, value: string | number): boolean {
    const element = SafeDomAccessor.getElement(elementId);
    if (!element) {
      logger.warn("Element not found for text update", { elementId });
      return false;
    }

    element.textContent = String(value);
    return true;
  }

  /**
   * DRY: Batch update multiple elements (eliminates repetitive patterns)
   */
  updateElements(updates: Record<string, string | number>): void {
    const missingElements: string[] = [];

    Object.entries(updates).forEach(([elementId, value]) => {
      const success = this.updateElement(elementId, value);
      if (!success) {
        missingElements.push(elementId);
      }
    });

    if (missingElements.length > 0) {
      logger.warn("Missing elements for batch update", { missingElements });
    }
  }

  /**
   * DRY: Conditional update (only if condition is met)
   */
  updateElementIf(
    elementId: string,
    value: string | number,
    condition: boolean,
  ): boolean {
    return condition ? this.updateElement(elementId, value) : false;
  }
}

// =============================================================================
// SINGLE RESPONSIBILITY: CSS Class Management
// =============================================================================
export class DomClassUpdater implements IDomClassUpdater {
  /**
   * Update element CSS class
   */
  updateClass(elementId: string, className: string): boolean {
    const element = SafeDomAccessor.getElement(elementId);
    if (!element) {
      logger.warn("Element not found for class update", { elementId });
      return false;
    }

    element.className = className;
    return true;
  }

  /**
   * DRY: Conditional class toggle
   */
  toggleClass(
    elementId: string,
    className: string,
    condition: boolean,
  ): boolean {
    const element = SafeDomAccessor.getElement(elementId);
    if (!element) {
      logger.warn("Element not found for class toggle", { elementId });
      return false;
    }

    if (condition) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }

    return true;
  }

  /**
   * DRY: Batch class updates
   */
  updateClasses(updates: Record<string, string>): void {
    Object.entries(updates).forEach(([elementId, className]) => {
      this.updateClass(elementId, className);
    });
  }
}

// =============================================================================
// FACADE PATTERN: Unified DOM Operations (Single Interface)
// =============================================================================
export class DomManager {
  private textUpdater = new DomTextUpdater();
  private classUpdater = new DomClassUpdater();
  private validator = new SafeDomAccessor();

  /**
   * FACADE: Single interface for all DOM operations
   */
  updateText(elementId: string, value: string | number): boolean {
    return this.textUpdater.updateElement(elementId, value);
  }

  updateTexts(updates: Record<string, string | number>): void {
    this.textUpdater.updateElements(updates);
  }

  updateClass(elementId: string, className: string): boolean {
    return this.classUpdater.updateClass(elementId, className);
  }

  toggleClass(
    elementId: string,
    className: string,
    condition: boolean,
  ): boolean {
    return this.classUpdater.toggleClass(elementId, className, condition);
  }

  validateElements(elementIds: string[]): string[] {
    return this.validator.validateElements(elementIds);
  }

  /**
   * DRY: High-level metric update pattern (used by RealtimeHealthEnhancer)
   */
  updateMetrics(metrics: Record<string, string | number>): void {
    const updates: Record<string, string | number> = {};

    Object.entries(metrics).forEach(([key, value]) => {
      // Map metric keys to element IDs (convention-based)
      const elementId = `frontend-${key.toLowerCase().replace(/([A-Z])/g, "-$1")}`;
      updates[elementId] = value;
    });

    this.updateTexts(updates);
  }

  /**
   * DRY: Feature status update pattern
   */
  updateFeatureStatuses(features: Record<string, boolean>): void {
    const classUpdates: Record<string, string> = {};
    const textUpdates: Record<string, string> = {};

    Object.entries(features).forEach(([featureKey, isEnabled]) => {
      const elementId = `frontend-feature-${featureKey.toLowerCase()}`;
      const status = isEnabled ? "✅" : "❌";
      const className = isEnabled ? "text-green-400" : "text-red-400";

      textUpdates[elementId] =
        `${status} ${this.formatFeatureName(featureKey)}`;
      classUpdates[elementId] = className;
    });

    this.updateTexts(textUpdates);
    this.classUpdater.updateClasses(classUpdates);
  }

  private formatFeatureName(featureKey: string): string {
    // Convert camelCase to readable format
    return featureKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}

// =============================================================================
// SINGLETON: Global DOM Manager Instance (Dependency Injection Ready)
// =============================================================================
export const domManager = new DomManager();

// =============================================================================
// UTILITY FUNCTIONS (Legacy Support - gradually migrate to DomManager)
// =============================================================================

/**
 * @deprecated Use domManager.updateText() instead
 */
export function updateElementText(
  elementId: string,
  value: string | number,
): boolean {
  logger.warn(
    "updateElementText is deprecated - use domManager.updateText() instead",
  );
  return domManager.updateText(elementId, value);
}

/**
 * @deprecated Use domManager.updateTexts() instead
 */
export function updateElementTexts(
  updates: Record<string, string | number>,
): void {
  logger.warn(
    "updateElementTexts is deprecated - use domManager.updateTexts() instead",
  );
  domManager.updateTexts(updates);
}
