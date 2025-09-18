/**
 * Icon Library - DRY/SOLID Icon Component Exports
 * Centralized icon component library following DRY and SOLID principles
 */

// Export all icon components for easy importing
export { default as IconArrowLeft } from './IconArrowLeft.astro';
export { default as IconBell } from './IconBell.astro';
export { default as IconClipboard } from './IconClipboard.astro';
export { default as IconClose } from './IconClose.astro';
export { default as IconDisplay } from './IconDisplay.astro';
export { default as IconSettings } from './IconSettings.astro';

// Icon component interface for consistent props
export interface IconProps {
  class?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Size mappings for consistent sizing across all icons
export const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5', 
  lg: 'w-6 h-6'
} as const;