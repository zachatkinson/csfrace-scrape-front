/**
 * Settings Bridge Initializer
 *
 * This component initializes the settings bridge with React hooks,
 * enabling vanilla JavaScript components to interact with React state.
 */

import { useEffect } from "react";
import { useAppSettings } from "../../hooks/useAppSettings";
import { settingsBridge } from "../../utils/settingsBridge";

export interface SettingsBridgeInitializerProps {
  /** Optional callback when settings change */
  onSettingsChange?: (settings: { app: any; api: any }) => void;
}

export const SettingsBridgeInitializer: React.FC<SettingsBridgeInitializerProps> = ({
  onSettingsChange,
}) => {
  // Use the app settings hooks - this returns separate appSettings and apiSettings
  const {
    appSettings,
    apiSettings,
    updateAppSettings,
    updateApiSettings
  } = useAppSettings();

  // Create hook objects for the bridge
  const apiHook = {
    settings: apiSettings,
    updateSettings: updateApiSettings,
  };

  const appHook = {
    settings: appSettings,
    updateSettings: updateAppSettings,
  };

  // Initialize the bridge when component mounts
  useEffect(() => {
    settingsBridge.initialize(appHook, apiHook);

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
  }, [appSettings, apiSettings, onSettingsChange]);

  // This component doesn't render anything visible
  return null;
};

export default SettingsBridgeInitializer;