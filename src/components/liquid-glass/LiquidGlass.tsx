/**
 * LiquidGlass Component
 * Core base component implementing Apple's official three-layer Liquid Glass system
 * Based on WWDC 2025 specifications with authentic material physics
 */

import React, { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

// TypeScript interfaces for Liquid Glass properties
export interface LiquidGlassProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  
  // Glass Material Properties
  variant?: 'default' | 'card' | 'button' | 'input' | 'modal' | 'nav' | 'status';
  
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
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Core LiquidGlass component with authentic Apple material implementation
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
  
  // Generate CSS classes based on props
  const getGlassClasses = (): string => {
    const classes = ['liquid-glass'];
    
    // Variant-specific classes
    switch (variant) {
      case 'card':
        classes.push('glass-card');
        break;
      case 'button':
        classes.push('glass-button');
        break;
      case 'input':
        classes.push('glass-input');
        break;
      case 'modal':
        classes.push('glass-modal');
        break;
      case 'nav':
        classes.push('glass-nav');
        break;
      case 'status':
        classes.push('glass-status');
        break;
    }
    
    // Interactive behavior
    if (interactive) {
      classes.push('liquid-glass-interactive');
    }
    
    // Apple's Deference Principle - content-adaptive glass
    if (adaptive) {
      classes.push('liquid-glass-adaptive');
    }
    
    // Physical lensing effects
    if (lensing) {
      classes.push('liquid-glass-lens');
    }
    
    // Loading state with shimmer
    if (loading) {
      classes.push('glass-loading');
    }
    
    // Blur intensity
    switch (blur) {
      case 'subtle':
        classes.push('backdrop-blur-glass-subtle');
        break;
      case 'strong':
        classes.push('backdrop-blur-glass-strong');
        break;
    }
    
    // Accessibility considerations
    if (reducedMotion) {
      classes.push('motion-reduce');
    }
    
    if (highContrast) {
      classes.push('contrast-more');
    }
    
    return classes.join(' ');
  };
  
  // Custom CSS properties for dynamic theming
  const getCustomProperties = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    
    // Dynamic blur adjustment
    if (blur === 'subtle') {
      styles['--glass-blur'] = '10px';
    } else if (blur === 'strong') {
      styles['--glass-blur'] = '40px';
    }
    
    return styles;
  };
  
  return (
    <Component
      ref={ref}
      className={`${getGlassClasses()} ${className}`.trim()}
      style={getCustomProperties()}
      {...props}
    >
      {children}
    </Component>
  );
});

LiquidGlass.displayName = 'LiquidGlass';

export default LiquidGlass;