/**
 * Mode Switcher Component
 * Single Responsibility: Handle switching between single and batch mode
 * Extracted from UrlScraper to follow SOLID principles
 */

import React from 'react';
import { BASE_STYLES } from '../../constants/styles.ts';

export interface ModeSwitcherProps {
  batchMode: boolean;
  onModeChange: (batchMode: boolean) => void;
  className?: string;
  singleModeLabel?: string;
  batchModeLabel?: string;
}

/**
 * ModeSwitcher - Clean toggle for switching processing modes
 */
export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  batchMode,
  onModeChange,
  className = '',
  singleModeLabel = 'Single URL',
  batchModeLabel = 'Batch Processing',
}) => {
  const baseClasses = BASE_STYLES.GLASS_CARD;
  const buttonBaseClasses = 'px-4 py-2 rounded-glass-sm text-sm font-medium transition-all duration-glass';
  const activeClasses = 'bg-white/20 text-white shadow-glass';
  const inactiveClasses = 'text-white/70 hover:text-white hover:bg-white/10';

  return (
    <div className={`flex items-center justify-center ${className}`.trim()}>
      <div className={`${baseClasses} p-2 rounded-glass flex`}>
        <button
          onClick={() => onModeChange(false)}
          className={`${buttonBaseClasses} ${
            !batchMode ? activeClasses : inactiveClasses
          }`}
          aria-pressed={!batchMode}
          aria-label={`Switch to ${singleModeLabel.toLowerCase()} mode`}
        >
          {singleModeLabel}
        </button>
        <button
          onClick={() => onModeChange(true)}
          className={`${buttonBaseClasses} ${
            batchMode ? activeClasses : inactiveClasses
          }`}
          aria-pressed={batchMode}
          aria-label={`Switch to ${batchModeLabel.toLowerCase()} mode`}
        >
          {batchModeLabel}
        </button>
      </div>
    </div>
  );
};

export default ModeSwitcher;