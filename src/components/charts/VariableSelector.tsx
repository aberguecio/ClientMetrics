'use client';

import { getFieldsByCategories, FieldCategory, type FieldMetadata } from '@/lib/charts/field-metadata';

interface VariableSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowedCategories: FieldCategory[];  // Use FieldCategory enum instead of strings
  required?: boolean;
}

/**
 * Get visual indicator for field type
 */
function getFieldTypeIndicator(field: FieldMetadata): string {
  switch (field.category) {
    case FieldCategory.CLOSED_ARRAY:
      return ' 📊 [Frecuencia]';
    case FieldCategory.BOOLEAN:
      return ' ✓ [Sí/No]';
    case FieldCategory.TEMPORAL:
      return ' 📅 [Tiempo]';
    case FieldCategory.NUMERIC:
      return ' 🔢 [Numérico]';
    case FieldCategory.OPEN_ARRAY:
      return ' 💬 [Texto]';
    case FieldCategory.FREE_TEXT:
      return ' 📝 [Texto Libre]';
    default:
      return '';
  }
}

export default function VariableSelector({
  label,
  value,
  onChange,
  disabled,
  allowedCategories,
  required = false,
}: VariableSelectorProps) {
  // Get fields dynamically from registry based on allowed categories
  const fields = getFieldsByCategories(allowedCategories);

  // Group by source (Base vs LLM Analysis)
  const groupedFields: Record<string, FieldMetadata[]> = {};

  for (const field of fields) {
    const groupName = field.isNested ? 'Análisis LLM' : 'Campos Base';
    if (!groupedFields[groupName]) {
      groupedFields[groupName] = [];
    }
    groupedFields[groupName].push(field);
  }

  return (
    <div>
      {label && (
        <label htmlFor={label} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <select
        id={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          backgroundColor: disabled ? '#f3f4f6' : 'white',
        }}
      >
        <option value="">Selecciona una variable</option>
        {Object.entries(groupedFields).map(([groupName, fields]) => (
          <optgroup key={groupName} label={groupName}>
            {fields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}{getFieldTypeIndicator(field)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
