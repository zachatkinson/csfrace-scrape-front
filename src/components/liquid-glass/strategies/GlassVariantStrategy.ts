/**
 * Glass Variant Strategy Pattern
 * Implements Strategy Pattern to fix Open/Closed Principle violation
 * Allows extensible glass variants without modifying core component
 */

import type { CSSProperties } from 'react';

/**
 * Glass variant configuration interface
 */
export interface GlassVariantConfig {
  classes: string[];
  customProperties?: Record<string, string | number | boolean | undefined>;
  interactiveClasses?: string[];
  adaptiveClasses?: string[];
  lensingClasses?: string[];
  loadingClasses?: string[];
}

/**
 * Strategy interface for glass variants
 */
export interface IGlassVariantStrategy {
  readonly name: string;
  readonly description: string;
  getConfig(props: GlassVariantProps): GlassVariantConfig;
}

/**
 * Props that influence variant configuration
 */
export interface GlassVariantProps {
  interactive?: boolean;
  adaptive?: boolean;
  lensing?: boolean;
  loading?: boolean;
  blur?: 'subtle' | 'default' | 'strong';
  reducedMotion?: boolean;
  highContrast?: boolean;
}

/**
 * Abstract base strategy with common functionality
 */
export abstract class BaseGlassVariantStrategy implements IGlassVariantStrategy {
  constructor(
    public readonly name: string,
    public readonly description: string
  ) {}

  abstract getConfig(props: GlassVariantProps): GlassVariantConfig;

  /**
   * Get common interaction classes
   */
  protected getInteractiveClasses(interactive?: boolean): string[] {
    return interactive ? ['liquid-glass-interactive'] : [];
  }

  /**
   * Get common adaptive classes
   */
  protected getAdaptiveClasses(adaptive?: boolean): string[] {
    return adaptive ? ['liquid-glass-adaptive'] : [];
  }

  /**
   * Get common lensing classes
   */
  protected getLensingClasses(lensing?: boolean): string[] {
    return lensing ? ['liquid-glass-lens'] : [];
  }

  /**
   * Get common loading classes
   */
  protected getLoadingClasses(loading?: boolean): string[] {
    return loading ? ['glass-loading'] : [];
  }

  /**
   * Get blur-specific classes
   */
  protected getBlurClasses(blur?: 'subtle' | 'default' | 'strong'): string[] {
    switch (blur) {
      case 'subtle':
        return ['backdrop-blur-glass-subtle'];
      case 'strong':
        return ['backdrop-blur-glass-strong'];
      default:
        return [];
    }
  }

  /**
   * Get accessibility classes
   */
  protected getAccessibilityClasses(props: GlassVariantProps): string[] {
    const classes: string[] = [];
    
    if (props.reducedMotion) {
      classes.push('motion-reduce');
    }
    
    if (props.highContrast) {
      classes.push('contrast-more');
    }
    
    return classes;
  }

  /**
   * Get custom CSS properties for blur
   */
  protected getBlurCustomProperties(blur?: 'subtle' | 'default' | 'strong'): CSSProperties & Record<string, string> {
    switch (blur) {
      case 'subtle':
        return { '--glass-blur': '10px' };
      case 'strong':
        return { '--glass-blur': '40px' };
      default:
        return {};
    }
  }

  /**
   * Merge all common classes
   */
  protected getCommonClasses(props: GlassVariantProps): string[] {
    return [
      'liquid-glass',
      ...this.getInteractiveClasses(props.interactive),
      ...this.getAdaptiveClasses(props.adaptive),
      ...this.getLensingClasses(props.lensing),
      ...this.getLoadingClasses(props.loading),
      ...this.getBlurClasses(props.blur),
      ...this.getAccessibilityClasses(props),
    ];
  }

  /**
   * Get common custom properties
   */
  protected getCommonCustomProperties(props: GlassVariantProps): CSSProperties & Record<string, string> {
    return {
      ...this.getBlurCustomProperties(props.blur),
    };
  }
}

export default BaseGlassVariantStrategy;