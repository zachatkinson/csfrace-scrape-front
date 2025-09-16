/**
 * LiquidCard Component
 * Content card with authentic Apple Liquid Glass material system
 * Implements layered depth and content-first design principles
 */

import React, { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { LiquidGlass, type LiquidGlassProps } from './LiquidGlass';

export interface LiquidCardProps extends Omit<LiquidGlassProps, 'variant'> {
  children: ReactNode;
  
  // Card-specific properties
  title?: string | undefined;
  subtitle?: string | undefined;
  header?: ReactNode | undefined;
  footer?: ReactNode | undefined;

  // Layout options
  padding?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
  spacing?: 'tight' | 'normal' | 'relaxed' | undefined;

  // Visual hierarchy
  elevation?: 'low' | 'medium' | 'high' | undefined;
  
  // Status indication
  status?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'processing' | undefined;
}

/**
 * LiquidCard - Premium card component with glass material
 */
export const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(({
  children,
  title,
  subtitle,
  header,
  footer,
  padding = 'md',
  spacing = 'normal',
  elevation = 'medium',
  status = 'default',
  className = '',
  ...glassProps
}, ref) => {
  
  // Generate padding classes
  const getPaddingClasses = (): string => {
    const paddingMap = {
      'sm': 'p-4',
      'md': 'p-6',  
      'lg': 'p-8',
      'xl': 'p-10'
    };
    return paddingMap[padding];
  };
  
  // Generate spacing classes for internal elements
  const getSpacingClasses = (): string => {
    const spacingMap = {
      'tight': 'space-y-2',
      'normal': 'space-y-4',
      'relaxed': 'space-y-6'
    };
    return spacingMap[spacing];
  };
  
  // Generate elevation-based shadow and blur
  const getElevationProps = () => {
    switch (elevation) {
      case 'low':
        return { blur: 'subtle' as const };
      case 'high':
        return { blur: 'strong' as const, lensing: true };
      default:
        return { blur: 'default' as const };
    }
  };
  
  // Status-based styling
  const getStatusClasses = (): string => {
    if (status === 'default') return '';
    
    const statusMap = {
      'success': 'border-l-4 border-status-success',
      'warning': 'border-l-4 border-status-warning',
      'error': 'border-l-4 border-status-error',
      'info': 'border-l-4 border-status-info',
      'processing': 'border-l-4 border-status-processing'
    };
    
    return statusMap[status] || '';
  };
  
  const cardClasses = `
    ${getPaddingClasses()}
    ${getSpacingClasses()}
    ${getStatusClasses()}
    ${className}
  `.trim();
  
  return (
    <LiquidGlass
      ref={ref}
      variant="card"
      className={cardClasses}
      {...getElevationProps()}
      {...glassProps}
    >
      {/* Card Header */}
      {(title || subtitle || header) && (
        <div className="glass-card-header mb-4">
          {header && (
            <div className="mb-3">
              {header}
            </div>
          )}
          
          {title && (
            <h3 className="text-lg font-semibold text-white/90 mb-1">
              {title}
            </h3>
          )}
          
          {subtitle && (
            <p className="text-sm text-white/70">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <div className="glass-card-content">
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className="glass-card-footer mt-4 pt-4 border-t border-white/10">
          {footer}
        </div>
      )}
    </LiquidGlass>
  );
});

LiquidCard.displayName = 'LiquidCard';

export default LiquidCard;