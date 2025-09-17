/**
 * Standardized Settings Forms
 * SOLID: Liskov Substitution Principle - Consistent interface for all settings forms
 * Future-ready forms for settings pages, modals, and profile management
 */

import React from 'react';
import { LiquidInput } from '../liquid-glass';
import { useUserProfile } from '../../contexts/AuthContext.tsx';
import { BaseForm, FormField, FormSection } from './BaseForm.tsx';
import { useBaseForm, ValidationRules, createFieldSchema, createFormSchema } from '../../hooks/useBaseForm.ts';
import type { ProfileFormData, FormSubmissionResult } from '../../interfaces/forms.ts';

// =============================================================================
// USER PROFILE FORM
// =============================================================================

interface UserProfileFormData extends ProfileFormData {
  [key: string]: unknown;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  avatarUrl?: string;
  preferences?: {
    autoSave?: boolean;
    defaultFormat?: string;
    theme?: string;
  };
  privacy?: {
    profileVisibility?: string;
    allowAnalytics?: boolean;
  };
}

const profileValidationSchema = createFormSchema<UserProfileFormData>({
  firstName: createFieldSchema([
    ValidationRules.maxLength(50, 'First name must be less than 50 characters'),
  ]),
  lastName: createFieldSchema([
    ValidationRules.maxLength(50, 'Last name must be less than 50 characters'),
  ]),
  displayName: createFieldSchema([
    ValidationRules.maxLength(100, 'Display name must be less than 100 characters'),
  ]),
  email: createFieldSchema([
    ValidationRules.required('Email is required'),
    ValidationRules.email('Please enter a valid email address'),
  ]),
  bio: createFieldSchema([
    ValidationRules.maxLength(500, 'Bio must be less than 500 characters'),
  ]),
  timezone: createFieldSchema([]),
  language: createFieldSchema([]),
  avatarUrl: createFieldSchema([]),
  preferences: createFieldSchema([]),
  privacy: createFieldSchema([]),
});

export interface StandardizedUserProfileFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  title?: string;
  subtitle?: string;
  showAllFields?: boolean;
}

function renderProfileFields(
  formHook: ReturnType<typeof useBaseForm<UserProfileFormData>>,
  options: { showAllFields?: boolean } = {}
) {
  const { data, state, handlers } = formHook;

  return (
    <>
      {/* Basic Info Section */}
      <FormSection title="Basic Information" subtitle="Your personal details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField error={state.errors.firstName}>
            <LiquidInput
              type="text"
              label="First Name"
              placeholder="Enter your first name"
              value={data.firstName || ''}
              onChange={(e) => handlers.handleFieldChange('firstName')(e.target.value)}
              onBlur={handlers.handleFieldBlur('firstName')}
              error={!!state.errors.firstName}
              disabled={state.isSubmitting}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              autoComplete="given-name"
            />
          </FormField>

          <FormField error={state.errors.lastName}>
            <LiquidInput
              type="text"
              label="Last Name"
              placeholder="Enter your last name"
              value={data.lastName || ''}
              onChange={(e) => handlers.handleFieldChange('lastName')(e.target.value)}
              onBlur={handlers.handleFieldBlur('lastName')}
              error={!!state.errors.lastName}
              disabled={state.isSubmitting}
              autoComplete="family-name"
            />
          </FormField>
        </div>

        <FormField error={state.errors.displayName}>
          <LiquidInput
            type="text"
            label="Display Name"
            placeholder="How should we display your name?"
            value={data.displayName || ''}
            onChange={(e) => handlers.handleFieldChange('displayName')(e.target.value)}
            onBlur={handlers.handleFieldBlur('displayName')}
            error={!!state.errors.displayName}
            disabled={state.isSubmitting}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />
        </FormField>

        <FormField error={state.errors.email}>
          <LiquidInput
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={data.email || ''}
            onChange={(e) => handlers.handleFieldChange('email')(e.target.value)}
            onBlur={handlers.handleFieldBlur('email')}
            error={!!state.errors.email}
            disabled={state.isSubmitting}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
            required
            autoComplete="email"
          />
        </FormField>
      </FormSection>

      {/* Extended Fields */}
      {options.showAllFields && (
        <>
          <FormSection title="About You" subtitle="Tell others about yourself">
            <FormField error={state.errors.bio}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Bio ({(data.bio || '').length}/500)
                </label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={data.bio || ''}
                  onChange={(e) => handlers.handleFieldChange('bio')(e.target.value)}
                  onBlur={handlers.handleFieldBlur('bio')}
                  disabled={state.isSubmitting}
                  className="w-full h-24 px-4 py-3 bg-black/20 border border-white/20 rounded-glass text-white placeholder-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  rows={4}
                  maxLength={500}
                />
              </div>
            </FormField>
          </FormSection>

          <FormSection title="Preferences" subtitle="Customize your experience">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField error={state.errors.timezone}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Timezone</label>
                  <select
                    value={data.timezone || ''}
                    onChange={(e) => handlers.handleFieldChange('timezone')(e.target.value)}
                    onBlur={handlers.handleFieldBlur('timezone')}
                    disabled={state.isSubmitting}
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-glass text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Select timezone...</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>
              </FormField>

              <FormField error={state.errors.language}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Language</label>
                  <select
                    value={data.language || ''}
                    onChange={(e) => handlers.handleFieldChange('language')(e.target.value)}
                    onBlur={handlers.handleFieldBlur('language')}
                    disabled={state.isSubmitting}
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-glass text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Select language...</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </FormField>
            </div>
          </FormSection>
        </>
      )}
    </>
  );
}

export const StandardizedUserProfileForm: React.FC<StandardizedUserProfileFormProps> = ({
  onSuccess,
  onError,
  className = '',
  title = 'Profile Settings',
  subtitle = 'Manage your account information',
  showAllFields = true,
}) => {
  
  // SOLID: Interface Segregation - Only use profile features
  const { user, updateProfile } = useUserProfile();

  const handleSubmit = async (data: UserProfileFormData): Promise<FormSubmissionResult> => {
    try {
      await updateProfile(data);
      
      onSuccess?.();
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      onError?.(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return (
    <div className={className}>
      <BaseForm
        initialData={{
          firstName: user?.profile?.first_name || '',
          lastName: user?.profile?.last_name || '',
          displayName: user?.profile?.display_name || '',
          email: user?.email || '',
          bio: user?.profile?.bio || '',
          timezone: user?.profile?.timezone || '',
          language: user?.profile?.language || '',
        }}
        validationSchema={profileValidationSchema}
        onSubmit={handleSubmit}
        onSuccess={onSuccess}
        onError={onError}
        title={title}
        subtitle={subtitle}
        submitButtonText="Save Changes"
        showReset={true}
        resetButtonText="Reset"
        className="w-full"
        renderFields={(formHook) => renderProfileFields(formHook, { showAllFields })}
      />
    </div>
  );
};

// =============================================================================
// APPLICATION SETTINGS FORM
// =============================================================================

interface AppSettingsFormData {
  [key: string]: unknown;
  notifications: {
    email: boolean;
    browser: boolean;
    jobComplete: boolean;
    jobFailed: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    allowAnalytics: boolean;
  };
  preferences: {
    theme: 'dark' | 'light' | 'auto';
    defaultFormat: 'html' | 'json' | 'markdown';
    autoSave: boolean;
  };
}

export interface StandardizedAppSettingsFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onStateChange?: (state: any) => void;
  initialData?: any;
  className?: string;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
}

function renderAppSettingsFields(
  formHook: ReturnType<typeof useBaseForm<AppSettingsFormData>>
) {
  const { data, state, handlers } = formHook;

  return (
    <>
      {/* Notifications Section */}
      <FormSection title="Notifications" subtitle="Choose how you want to be notified">
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-white/80">Email Notifications</span>
            <input
              type="checkbox"
              checked={data.notifications?.email ?? true}
              onChange={(e) => handlers.handleFieldChange('notifications')({
                ...(data.notifications || {}),
                email: e.target.checked
              })}
              disabled={state.isSubmitting}
              className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-white/80">Browser Notifications</span>
            <input
              type="checkbox"
              checked={data.notifications?.browser ?? false}
              onChange={(e) => handlers.handleFieldChange('notifications')({
                ...(data.notifications || {}),
                browser: e.target.checked
              })}
              disabled={state.isSubmitting}
              className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-white/80">Job Completion Alerts</span>
            <input
              type="checkbox"
              checked={data.notifications?.jobComplete ?? true}
              onChange={(e) => handlers.handleFieldChange('notifications')({
                ...(data.notifications || {}),
                jobComplete: e.target.checked
              })}
              disabled={state.isSubmitting}
              className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
            />
          </label>
        </div>
      </FormSection>

      {/* Privacy Section */}
      <FormSection title="Privacy" subtitle="Control your privacy settings">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Profile Visibility</label>
            <select
              value={data.privacy?.profileVisibility || 'private'}
              onChange={(e) => handlers.handleFieldChange('privacy')({
                ...(data.privacy || {}),
                profileVisibility: e.target.value as 'public' | 'private'
              })}
              disabled={state.isSubmitting}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-glass text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <label className="flex items-center justify-between">
            <span className="text-sm text-white/80">Allow Analytics</span>
            <input
              type="checkbox"
              checked={data.privacy?.allowAnalytics ?? true}
              onChange={(e) => handlers.handleFieldChange('privacy')({
                ...(data.privacy || {}),
                allowAnalytics: e.target.checked
              })}
              disabled={state.isSubmitting}
              className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
            />
          </label>
        </div>
      </FormSection>

      {/* Preferences Section */}
      <FormSection title="Preferences" subtitle="Customize your experience">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Theme</label>
            <select
              value={data.preferences?.theme || 'dark'}
              onChange={(e) => handlers.handleFieldChange('preferences')({
                ...(data.preferences || {}),
                theme: e.target.value as 'dark' | 'light' | 'auto'
              })}
              disabled={state.isSubmitting}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-glass text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Default Export Format</label>
            <select
              value={data.preferences?.defaultFormat || 'html'}
              onChange={(e) => handlers.handleFieldChange('preferences')({
                ...(data.preferences || {}),
                defaultFormat: e.target.value as 'html' | 'json' | 'markdown'
              })}
              disabled={state.isSubmitting}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-glass text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="html">HTML</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>

          <label className="flex items-center justify-between">
            <span className="text-sm text-white/80">Auto-save Drafts</span>
            <input
              type="checkbox"
              checked={data.preferences?.autoSave ?? true}
              onChange={(e) => handlers.handleFieldChange('preferences')({
                ...(data.preferences || {}),
                autoSave: e.target.checked
              })}
              disabled={state.isSubmitting}
              className="w-4 h-4 rounded border-white/30 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
            />
          </label>
        </div>
      </FormSection>
    </>
  );
}

export const StandardizedAppSettingsForm: React.FC<StandardizedAppSettingsFormProps> = ({
  onSuccess,
  onError,
  className = '',
  title = 'App Settings',
  subtitle = 'Configure your application preferences',
}) => {

  const handleSubmit = async (data: AppSettingsFormData): Promise<FormSubmissionResult> => {
    try {
      // Save settings to local storage or API
      localStorage.setItem('app_settings', JSON.stringify(data));
      
      onSuccess?.();
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Settings save failed';
      onError?.(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Load existing settings
  const existingSettings = (() => {
    try {
      return JSON.parse(localStorage.getItem('app_settings') || '{}');
    } catch {
      return {};
    }
  })();

  return (
    <div className={className}>
      <BaseForm
        initialData={{
          notifications: {
            email: true,
            browser: false,
            jobComplete: true,
            jobFailed: true,
            weeklyDigest: false,
            ...existingSettings.notifications,
          },
          privacy: {
            profileVisibility: 'private',
            showEmail: false,
            allowAnalytics: true,
            ...(existingSettings.privacy || {}),
          },
          preferences: {
            theme: 'dark',
            defaultFormat: 'html',
            autoSave: true,
            ...(existingSettings.preferences || {}),
          },
        }}
        onSubmit={handleSubmit}
        onSuccess={onSuccess}
        onError={onError}
        title={title}
        subtitle={subtitle}
        submitButtonText="Save Settings"
        showReset={true}
        resetButtonText="Reset to Defaults"
        className="w-full"
        renderFields={renderAppSettingsFields}
      />
    </div>
  );
};

// =============================================================================
// EXPORT ALL SETTINGS FORMS
// =============================================================================

export default {
  StandardizedUserProfileForm,
  StandardizedAppSettingsForm,
};