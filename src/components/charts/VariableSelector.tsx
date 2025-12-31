'use client';

interface VariableSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  types?: Array<'category' | 'metric' | 'text_analysis' | 'closed_array'>; // NEW: Array of types
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
    // NEW: Boolean fields
    { value: 'requirements.confidentiality', label: 'Requiere Confidencialidad' },
    { value: 'requirements.multilingual', label: 'Requiere Multiidioma' },
    { value: 'requirements.real_time', label: 'Requiere Tiempo Real' },
  ],
};

// Quantifiable fields (for Y-Axis, Metrics)
const QUANTIFIABLE_FIELDS = {
  'Métricas': [
    { value: 'count', label: 'Cantidad de Reuniones' },
    { value: 'interaction_volume_daily', label: 'Volumen de Interacción Diaria (promedio)' },
  ],
};

// Text analysis fields (for Wordcloud)
const TEXT_ANALYSIS_FIELDS = {
  'Análisis de Texto': [
    { value: 'pain_points', label: 'Pain Points (Puntos de Dolor)' },
    { value: 'use_cases', label: 'Use Cases (Casos de Uso)' },
    { value: 'objections', label: 'Objections (Objeciones)' },
    { value: 'others', label: 'Others (Insights Adicionales)' },
  ],
};

// NEW: Closed array fields (for frequency visualization)
const CLOSED_ARRAY_FIELDS = {
  'Requerimientos Técnicos': [
    { value: 'requirements.personalization', label: 'Tipos de Personalización' },
    { value: 'requirements.integrations', label: 'Integraciones Requeridas' },
  ],
  'Patrones de Negocio': [
    { value: 'demand_peaks', label: 'Picos de Demanda' },
    { value: 'query_types', label: 'Tipos de Consultas' },
  ],
  'Herramientas': [
    { value: 'tools_mentioned', label: 'Herramientas Mencionadas' },
  ],
};

export default function VariableSelector({ label, value, onChange, disabled, types = ['category'] }: VariableSelectorProps) {
  // Merge field groups based on types array
  let mergedGroups: Record<string, Array<{ value: string; label: string }>> = {};

  for (const type of types) {
    const groups =
      type === 'metric' ? QUANTIFIABLE_FIELDS :
      type === 'text_analysis' ? TEXT_ANALYSIS_FIELDS :
      type === 'closed_array' ? CLOSED_ARRAY_FIELDS :
      CATEGORICAL_FIELDS;

    // Merge groups
    for (const [groupName, fields] of Object.entries(groups)) {
      if (!mergedGroups[groupName]) {
        mergedGroups[groupName] = [];
      }
      mergedGroups[groupName].push(...fields);
    }
  }

  const fieldGroups = mergedGroups;

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
