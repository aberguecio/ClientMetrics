'use client';

import { ChangeEvent } from 'react';

/**
 * Reusable select field component with consistent styling
 *
 * @param label - Field label text
 * @param value - Current selected value
 * @param onChange - Callback when selection changes
 * @param options - Array of {value, label} option objects
 * @param required - Whether the field is required
 * @param disabled - Whether the field is disabled
 * @param placeholder - Placeholder text for empty state
 * @param error - Optional error message to display
 */
export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  placeholder = 'Select an option...',
  error
}: SelectFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="form-field">
      <label className="input-label">
        {label}
        {required && <span className="required-asterisk"> *</span>}
      </label>
      <select
        className={`input-select ${error ? 'input-error' : ''}`}
        value={value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
