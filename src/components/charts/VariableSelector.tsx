'use client';

interface VariableSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Available variables grouped by category
const VARIABLE_GROUPS = {
  'Base Fields': [
    { value: 'salesRep', label: 'Sales Rep' },
    { value: 'closed', label: 'Closed Status' },
    { value: 'meetingDate', label: 'Meeting Date' },
  ],
  'LLM Analysis': [
    { value: 'sector', label: 'Sector' },
    { value: 'company_size', label: 'Company Size' },
    { value: 'discovery_channel', label: 'Discovery Channel' },
    { value: 'budget_range', label: 'Budget Range' },
    { value: 'decision_maker', label: 'Decision Maker' },
  ],
  'Metrics': [
    { value: 'count', label: 'Count' },
  ],
};

export default function VariableSelector({ label, value, onChange, disabled }: VariableSelectorProps) {
  return (
    <div>
      <label htmlFor={label} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
        {label}
      </label>
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
        <option value="">Select a variable</option>
        {Object.entries(VARIABLE_GROUPS).map(([groupName, variables]) => (
          <optgroup key={groupName} label={groupName}>
            {variables.map((variable) => (
              <option key={variable.value} value={variable.value}>
                {variable.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
