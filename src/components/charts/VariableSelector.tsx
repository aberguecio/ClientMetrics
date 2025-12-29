'use client';

interface VariableSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: 'category' | 'metric'; // New prop to filter by field type
}

// Categorical fields (for X-Axis, Category, Group By)
const CATEGORICAL_FIELDS = {
  'Campos Base': [
    { value: 'salesRep', label: 'Representante de Ventas' },
    { value: 'closed', label: 'Estado (Cerrada/Abierta)' },
    { value: 'meetingDate', label: 'Fecha de Reunión' },
  ],
  'Análisis LLM': [
    { value: 'sector', label: 'Sector' },
    { value: 'company_size', label: 'Tamaño de Empresa' },
    { value: 'discovery_channel', label: 'Canal de Descubrimiento' },
  ],
};

// Quantifiable fields (for Y-Axis, Metrics)
const QUANTIFIABLE_FIELDS = {
  'Métricas': [
    { value: 'count', label: 'Cantidad de Reuniones' },
    { value: 'interaction_volume_daily', label: 'Volumen de Interacción Diaria (promedio)' },
  ],
};

export default function VariableSelector({ label, value, onChange, disabled, type = 'category' }: VariableSelectorProps) {
  // Select appropriate field groups based on type
  const fieldGroups = type === 'metric' ? QUANTIFIABLE_FIELDS : CATEGORICAL_FIELDS;

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
        <option value="">Selecciona una variable</option>
        {Object.entries(fieldGroups).map(([groupName, variables]) => (
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
