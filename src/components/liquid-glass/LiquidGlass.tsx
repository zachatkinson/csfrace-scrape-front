/**
 * LiquidGlass Component - Refactored with Strategy Pattern
 * Implements SOLID principles with extensible glass variants
 * Fixes Open/Closed Principle violation through Strategy Pattern
 */

import React, { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode, ElementType } from 'react';
import { getGlassVariantConfig } from './strategies/GlassVariantRegistry.ts';
import type { GlassVariantProps } from './strategies/GlassVariantStrategy.ts';

// TypeScript interfaces for Liquid Glass properties
export interface LiquidGlassProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  
  // Glass Material Properties - now extensible through strategy pattern
  variant?: string; // No longer limited to hardcoded variants!
  
  // Interactive Behavior
  interactive?: boolean;
  
  // Apple's Design Principles
  adaptive?: boolean;    // Content-adaptive (Deference principle)
  lensing?: boolean;     // Physical lensing effects
  loading?: boolean;     // Loading shimmer state
  
  // Environmental Adaptation
  blur?: 'subtle' | 'default' | 'strong';
  
  // Accessibility
  reducedMotion?: boolean;
  highContrast?: boolean;
  
  // Custom styling
  as?: ElementType;
  className?: string;
}

/**
 * Core LiquidGlass component - now using Strategy Pattern
 * Open for extension, closed for modification
 */
export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(({
  children,
  variant = 'default',
  interactive = false,
  adaptive = false,
  lensing = false,
  loading = false,
  blur = 'default',
  reducedMotion,
  highContrast,
  as: Component = 'div',
  className = '',
  ...props
}, ref) => {
  
  // Prepare props for strategy pattern
  const glassVariantProps: GlassVariantProps = {
    interactive,
    adaptive,
    lensing,
    loading,
    blur,
    reducedMotion,
    highContrast,
  };
  
  // Get configuration from strategy pattern - extensible without modification!
  const variantConfig = getGlassVariantConfig(variant, glassVariantProps);
  
  // Combine all classes from strategy
  const allClasses = [
    ...variantConfig.classes,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <Component
      ref={ref}
      className={allClasses}
      style={variantConfig.customProperties}
      {...props}
    >
      {children}
    </Component>
  );
});

LiquidGlass.displayName = 'LiquidGlass';

export default LiquidGlass;