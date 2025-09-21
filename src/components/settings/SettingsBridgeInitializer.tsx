/**
 * Settings Bridge Initializer
 *
 * This component initializes the settings bridge with React hooks,
 * enabling vanilla JavaScript components to interact with React state.
 */

import React, { useEffect } from "react";
import { useAppSettings } from "../../hooks/useAppSettings";
import { settingsBridge } from "../../utils/settingsBridge";
import type { AppSettings, ApiConfigSettings } from "../../interfaces/forms.ts";

export interface SettingsBridgeInitializerProps {
  /** Optional callback when settings change */
  onSettingsChange?: (settings: {
    app: AppSettings;
    api: ApiConfigSettings;
  }) => void;
}

export const SettingsBridgeInitializer: React.FC<
  SettingsBridgeInitializerProps
> = ({ onSettingsChange }) => {
  // Use the app settings hook - get the complete result object
  const useAppSettingsResult = useAppSettings();

  // Initialize the bridge when component mounts
  useEffect(() => {
    settingsBridge.initialize(useAppSettingsResult);

    // Set up change listener if callback provided
    let unsubscribe: (() => void) | undefined;
    if (onSettingsChange) {
      unsubscribe = settingsBridge.onSettingsChange(onSettingsChange);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [useAppSettingsResult, onSettingsChange]);

  // This component doesn't render anything visible
  return null;
};

export default SettingsBridgeInitializer;
