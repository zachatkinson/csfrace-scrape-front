/**
 * Modal Utilities - DRY/SOLID shared functionality
 * Single Responsibility: Provide consistent modal behavior detection
 * Interface Segregation: Simple utility functions for modal interactions
 */

import type React from 'react';

/**
 * Detect if a click event should close a modal based on backdrop patterns
 * Works with both React and Astro modal implementations
 * 
 * @param event - The click event
 * @param modalContainer - The modal container element
 * @param backdropClasses - Array of CSS classes that indicate backdrop elements
 * @returns boolean indicating if the modal should close
 */
export function isBackdropClick(
  event: Event | React.MouseEvent,
  modalContainer: Element | null,
  backdropClasses: string[] = ['base-modal-backdrop', 'backdrop-blur-md']
): boolean {
  const target = event.target as HTMLElement;
  const currentTarget = event.currentTarget as HTMLElement;
  
  // Check if clicked directly on the modal container
  const isModalContainer = target === modalContainer || target === currentTarget;
  
  // Check if clicked on any backdrop element
  const isBackdropElement = backdropClasses.some(className => 
    target?.classList.contains(className)
  );
  
  return isModalContainer || isBackdropElement;
}

/**
 * Add backdrop click listener to a modal element
 * 
 * @param modalElement - The modal container element
 * @param onClose - Callback function to close the modal
 * @param backdropClasses - Optional custom backdrop classes
 */
export function addBackdropClickListener(
  modalElement: HTMLElement,
  onClose: () => void,
  backdropClasses?: string[]
): () => void {
  const handleClick = (event: Event) => {
    if (isBackdropClick(event, modalElement, backdropClasses)) {
      onClose();
    }
  };
  
  modalElement.addEventListener('click', handleClick);
  
  // Return cleanup function
  return () => {
    modalElement.removeEventListener('click', handleClick);
  };
}

/**
 * React hook version of backdrop click detection
 */
export function createBackdropClickHandler(
  onClose: () => void,
  backdropClasses?: string[]
) {
  return (event: React.MouseEvent) => {
    if (isBackdropClick(event, event.currentTarget, backdropClasses)) {
      onClose();
    }
  };
}