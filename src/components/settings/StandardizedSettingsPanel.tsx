/**
 * Standardized Settings Panel Component
 * SOLID: Liskov Substitution - Uses BaseForm for consistent behavior
 * Replaces the static HTML settings panel with standardized form components
 */

import React, { useState, useEffect } from 'react';
import { LiquidButton } from '../liquid-glass';
import { StandardizedAppSettingsForm } from '../forms/StandardizedSettingsForms.tsx';
import { useAppSettings } from '../../hooks/useAppSettings.ts';
import type { AppSettings, ApiConfigSettings } from '../../interfaces/forms.ts';

// =============================================================================
// SETTINGS PANEL INTERFACE
// =============================================================================

export interface StandardizedSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// =============================================================================
// SETTINGS TABS
// =============================================================================

type SettingsTab = 'app' | 'api' | 'notifications';

interface SettingsTabInfo {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

const SETTINGS_TABS: SettingsTabInfo[] = [
  {
    id: 'app',
    label: 'App Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'api',
    label: 'API Config',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 12v8a1 1 0 001 1h9m-9-9V5a1 1 0 011-1h7l5 5v7m-9-9h4l5 5v7" />
      </svg>
    ),
  },
];

// =============================================================================
// STANDARDIZED SETTINGS PANEL COMPONENT
// =============================================================================

/**
 * Standardized Settings Panel
 * SOLID: Single Responsibility - Only handles panel UI and form orchestration
 * SOLID: Liskov Substitution - Forms are substitutable and follow same interface
 */
export const StandardizedSettingsPanel: React.FC<StandardizedSettingsPanelProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('app');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Use settings hook for state management
  const { 
    appSettings, 
    apiSettings,
    updateAppSettings, 
    updateApiSettings, 
    resetToDefaults,
    applySettings 
  } = useAppSettings();

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!shouldClose) return;
    }
    onClose();
    setHasUnsavedChanges(false);
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      handleClose();
    }
  };

  const handleAppSettingsSuccess = (data: AppSettings) => {
    updateAppSettings(data);
    applySettings({ ...data, ...apiSettings });
    setHasUnsavedChanges(false);
    
    // Show success feedback
    console.log('App settings saved successfully');
  };

  const handleApiSettingsSuccess = (data: ApiConfigSettings) => {
    updateApiSettings(data);
    applySettings({ ...appSettings, ...data });
    setHasUnsavedChanges(false);
    
    // Show success feedback
    console.log('API settings saved successfully');
  };

  const handleResetToDefaults = async () => {
    const confirmed = window.confirm(
      'Reset all settings to defaults? This cannot be undone.'
    );
    
    if (confirmed) {
      await resetToDefaults();
      setHasUnsavedChanges(false);
      
      // Show success feedback
      console.log('Settings reset to defaults');
    }
  };

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, hasUnsavedChanges]);

  // =============================================================================
  // TAB RENDERER
  // =============================================================================

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'app':
        return (
          <StandardizedAppSettingsForm
            onSuccess={handleAppSettingsSuccess}
            onStateChange={(state) => setHasUnsavedChanges(state.isDirty)}
            initialData={appSettings}
            title="Application Settings"
            subtitle="Customize your app experience"
            showTitle={false}
            className="w-full"
          />
        );

      case 'api':
        return (
          <div className="w-full p-6 text-center text-white/60">
            <p>API Configuration form coming soon...</p>
          </div>
        );

      case 'notifications':
        // For now, show a placeholder - could be expanded with notification settings form
        return (
          <div className="p-6 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 12v8a1 1 0 001 1h9m-9-9V5a1 1 0 011-1h7l5 5v7m-9-9h4l5 5v7" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">Notifications</h3>
            <p className="text-white/60 text-sm mb-4">
              Notification preferences will be available in a future update
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // =============================================================================
  // RENDER SETTINGS PANEL
  // =============================================================================

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed top-20 left-0 right-0 z-40 transform transition-transform duration-300 ease-out ${className}`.trim()}
    >
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="liquid-glass rounded-glass p-6 border border-white/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <p className="text-white/60 text-sm mt-1">
                Customize your application preferences
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Reset Button */}
              <LiquidButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResetToDefaults}
                className="text-red-300 hover:text-red-200"
              >
                Reset All
              </LiquidButton>
              
              {/* Close Button */}
              <button 
                onClick={handleClose}
                className="glass-button p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Close Settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Unsaved Changes Warning */}
          {hasUnsavedChanges && (
            <div className="mb-6 p-4 rounded-glass bg-yellow-500/20 border border-yellow-500/30">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-7.938-6h15.876C20.477 6.477 21 5.523 21 4.5V3a1 1 0 00-1-1H4a1 1 0 00-1 1v1.5C3 5.523 3.523 6.477 4.062 9z" />
                </svg>
                <div>
                  <p className="text-yellow-200 font-medium">Unsaved Changes</p>
                  <p className="text-yellow-300/80 text-sm">
                    You have unsaved changes that will be lost if you close this panel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardizedSettingsPanel;