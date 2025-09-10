/**
 * Unified Form Field Component
 * Single Responsibility: Renders any form field type with consistent behavior
 * Open/Closed: Extensible for new field types without modifying core logic
 * Liskov Substitution: All field types are interchangeable through common interface
 * Interface Segregation: Clean separation of concerns for different field aspects
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { LiquidInput, LiquidButton } from '../../liquid-glass';
import type {
  IUnifiedFieldProps,
  IFieldValidationState,
  IFieldInteractionState,
  FormFieldType,
  IFieldOption,
  IFieldErrorConfig
} from './FormFieldTypes';

/**
 * Field Error Display Component
 * Single Responsibility: Handles error message display and styling
 */
const FieldErrorDisplay: React.FC<{
  error?: string;
  warning?: string;
  info?: string;
  config?: IFieldErrorConfig;
}> = React.memo(({ error, warning, info, config = {} }) => {
  if (!error && !warning && !info) return null;

  const message = error || warning || info;
  const type = error ? 'error' : warning ? 'warning' : 'info';
  const colors = {
    error: 'text-red-400 border-red-500/30 bg-red-500/10',
    warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    info: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
  };

  return (
    <div className={`mt-1 p-2 text-sm rounded-glass border ${colors[type]} ${config.className || ''}`}>
      <div className="flex items-start space-x-2">
        {config.showIcon && (
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {type === 'error' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
            {type === 'warning' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            )}
            {type === 'info' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        )}
        <span>{message}</span>
      </div>
    </div>
  );
});

FieldErrorDisplay.displayName = 'FieldErrorDisplay';

/**
 * Field Help Text Component
 * Single Responsibility: Displays help text with consistent styling
 */
const FieldHelpText: React.FC<{ text: string; className?: string }> = React.memo(({ text, className = '' }) => (
  <div className={`mt-1 text-sm text-white/60 ${className}`.trim()}>
    {text}
  </div>
));

FieldHelpText.displayName = 'FieldHelpText';

/**
 * Select Field Options Component
 * Single Responsibility: Renders select dropdown options with groups
 */
const SelectOptions: React.FC<{
  options: readonly IFieldOption[];
  value?: string | number | (string | number)[];
  multiple?: boolean;
  placeholder?: string;
}> = React.memo(({ options, value, multiple, placeholder }) => {
  const groupedOptions = useMemo(() => {
    const groups: Record<string, IFieldOption[]> = {};
    const ungrouped: IFieldOption[] = [];

    options.forEach(option => {
      if (option.group) {
        if (!groups[option.group]) groups[option.group] = [];
        groups[option.group].push(option);
      } else {
        ungrouped.push(option);
      }
    });

    return { groups, ungrouped };
  }, [options]);

  return (
    <>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      
      {/* Ungrouped options */}
      {groupedOptions.ungrouped.map((option) => (
        <option 
          key={String(option.value)} 
          value={String(option.value)}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}

      {/* Grouped options */}
      {Object.entries(groupedOptions.groups).map(([groupName, groupOptions]) => (
        <optgroup key={groupName} label={groupName}>
          {groupOptions.map((option) => (
            <option 
              key={String(option.value)} 
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
});

SelectOptions.displayName = 'SelectOptions';

/**
 * Radio Group Component
 * Single Responsibility: Renders radio button groups with consistent styling
 */
const RadioGroup: React.FC<{
  name: string;
  options: readonly IFieldOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  className?: string;
}> = React.memo(({ name, options, value, onChange, disabled, className = '' }) => (
  <div className={`space-y-3 ${className}`.trim()}>
    {options.map((option) => (
      <label 
        key={String(option.value)} 
        className="flex items-center space-x-3 cursor-pointer group"
      >
        <input
          type="radio"
          name={name}
          value={String(option.value)}
          checked={value === option.value}
          onChange={() => onChange?.(option.value)}
          disabled={disabled || option.disabled}
          className="form-radio h-4 w-4 text-blue-500 border-white/30 bg-black/50 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
        />
        <div className="flex-1">
          <div className="text-white group-hover:text-blue-400 transition-colors">
            {option.label}
          </div>
          {option.description && (
            <div className="text-sm text-white/60 mt-1">
              {option.description}
            </div>
          )}
        </div>
      </label>
    ))}
  </div>
));

RadioGroup.displayName = 'RadioGroup';

/**
 * Main Unified Form Field Component
 * Implements all form field types through composition pattern
 */
export const UnifiedFormField: React.FC<IUnifiedFieldProps> = React.memo(({
  type,
  name,
  value,
  defaultValue,
  label,
  placeholder,
  helpText,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  fullWidth = true,
  className = '',
  autoComplete,
  autoFocus = false,
  debounceMs = 0,
  maxLength,
  minLength,
  pattern,
  step,
  min,
  max,
  options = [],
  multiple = false,
  accept,
  rows = 3,
  validation = { isValid: true, isInvalid: false, isPending: false },
  interaction = { 
    isFocused: false, 
    isTouched: false, 
    isDirty: false, 
    isDisabled: false, 
    isReadOnly: false, 
    isRequired: false 
  },
  onChange,
  onBlur,
  onFocus,
  onKeyPress,
  onKeyDown,
  onKeyUp,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  id,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '');
  const [isFocused, setIsFocused] = useState(interaction.isFocused);
  const [isTouched, setIsTouched] = useState(interaction.isTouched);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // Debounced change handler
  const handleChange = useCallback((newValue: any) => {
    setInternalValue(newValue);
    
    if (debounceMs > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange?.(newValue);
      }, debounceMs);
    } else {
      onChange?.(newValue);
    }
  }, [onChange, debounceMs]);

  // Focus handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsTouched(true);
    onBlur?.();
  }, [onBlur]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Update internal value when prop value changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Common props for all field types
  const commonProps = {
    id: id || `field-${name}`,
    name,
    disabled: interaction.isDisabled,
    readOnly: interaction.isReadOnly,
    required: interaction.isRequired,
    'data-testid': testId || `field-${name}`,
    'aria-label': ariaLabel || label,
    'aria-describedby': ariaDescribedBy,
    autoComplete,
    autoFocus,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyPress,
    onKeyDown,
    onKeyUp,
  };

  // Render field based on type
  const renderFieldInput = () => {
    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'url':
      case 'tel':
      case 'search':
        return (
          <LiquidInput
            {...commonProps}
            type={type}
            label={label}
            placeholder={placeholder}
            value={String(internalValue)}
            onChange={(e) => handleChange(e.target.value)}
            error={validation.isInvalid}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            className={className}
          />
        );

      case 'number':
        return (
          <LiquidInput
            {...commonProps}
            type="number"
            label={label}
            placeholder={placeholder}
            value={String(internalValue)}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            error={validation.isInvalid}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            step={step}
            min={min}
            max={max}
            className={className}
          />
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            {label && (
              <label htmlFor={commonProps.id} className="block text-sm font-medium text-white">
                {label}
                {interaction.isRequired && <span className="text-red-400 ml-1">*</span>}
              </label>
            )}
            <textarea
              {...commonProps}
              placeholder={placeholder}
              value={String(internalValue)}
              onChange={(e) => handleChange(e.target.value)}
              rows={rows}
              maxLength={maxLength}
              minLength={minLength}
              className={`w-full px-4 py-3 liquid-glass rounded-glass border border-white/20 bg-black/30 text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${validation.isInvalid ? 'border-red-500' : ''} ${className}`.trim()}
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            {label && (
              <label htmlFor={commonProps.id} className="block text-sm font-medium text-white">
                {label}
                {interaction.isRequired && <span className="text-red-400 ml-1">*</span>}
              </label>
            )}
            <select
              {...commonProps}
              value={multiple ? (Array.isArray(internalValue) ? internalValue : []) : String(internalValue)}
              onChange={(e) => {
                if (multiple) {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  handleChange(selectedOptions);
                } else {
                  handleChange(e.target.value);
                }
              }}
              multiple={multiple}
              className={`w-full px-4 py-3 liquid-glass rounded-glass border border-white/20 bg-black/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${validation.isInvalid ? 'border-red-500' : ''} ${className}`.trim()}
            >
              <SelectOptions 
                options={options} 
                value={internalValue} 
                multiple={multiple}
                placeholder={placeholder}
              />
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <label className={`flex items-center space-x-3 cursor-pointer group ${className}`.trim()}>
            <input
              {...commonProps}
              type="checkbox"
              checked={Boolean(internalValue)}
              onChange={(e) => handleChange(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-500 border-white/30 bg-black/50 rounded focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
            />
            {label && (
              <span className="text-white group-hover:text-blue-400 transition-colors">
                {label}
                {interaction.isRequired && <span className="text-red-400 ml-1">*</span>}
              </span>
            )}
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {label && (
              <fieldset>
                <legend className="block text-sm font-medium text-white mb-3">
                  {label}
                  {interaction.isRequired && <span className="text-red-400 ml-1">*</span>}
                </legend>
                <RadioGroup
                  name={name}
                  options={options}
                  value={internalValue as string | number}
                  onChange={handleChange}
                  disabled={interaction.isDisabled}
                  className={className}
                />
              </fieldset>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            {label && (
              <label htmlFor={commonProps.id} className="block text-sm font-medium text-white">
                {label}
                {interaction.isRequired && <span className="text-red-400 ml-1">*</span>}
              </label>
            )}
            <input
              {...commonProps}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(e) => handleChange(multiple ? e.target.files : e.target.files?.[0] || null)}
              className={`w-full px-4 py-3 liquid-glass rounded-glass border border-white/20 bg-black/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-glass file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 disabled:opacity-50 ${validation.isInvalid ? 'border-red-500' : ''} ${className}`.trim()}
            />
          </div>
        );

      case 'date':
      case 'datetime-local':
      case 'time':
        return (
          <LiquidInput
            {...commonProps}
            type={type}
            label={label}
            value={String(internalValue)}
            onChange={(e) => handleChange(e.target.value)}
            error={validation.isInvalid}
            min={min as string}
            max={max as string}
            className={className}
          />
        );

      default:
        console.warn(`Unsupported field type: ${type}`);
        return null;
    }
  };

  return (
    <div className={`unified-form-field ${fullWidth ? 'w-full' : ''} ${className}`.trim()}>
      {renderFieldInput()}
      
      {/* Help Text */}
      {helpText && (
        <FieldHelpText text={helpText} />
      )}
      
      {/* Error/Warning/Info Messages */}
      <FieldErrorDisplay
        error={validation.error}
        warning={validation.warning}
        info={validation.info}
        config={{ showIcon: true }}
      />
    </div>
  );
});

UnifiedFormField.displayName = 'UnifiedFormField';