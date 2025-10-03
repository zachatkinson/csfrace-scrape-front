/**
 * App Settings Hook (Nano Store Bridge)
 * REFACTORED: Thin wrapper around Nano store
 *
 * SOLID: Single Responsibility - Just exposes Nano store to React components
 * DRY: No duplication - delegates everything to Nano store
 */

import { useStore } from "@nanostores/react";
import {
  userSettingsStore,
  updateAppSettings,
  updateApiSettings,
  resetToDefaults,
} from "../stores/userSettings";

/**
 * App Settings Hook
 * Ultra-thin wrapper for Nano store - just for React components
 */
export const useAppSettings = () => {
  const state = useStore(userSettingsStore);

  return {
    // State
    ...state,

    // Actions
    updateAppSettings,
    updateApiSettings,
    resetToDefaults,
  };
};

export default useAppSettings;
