// Sector values and labels
export const SECTOR_VALUES = [
  'tecnologia_software',
  'servicios_profesionales',
  'comercio_retail',
  'salud_bienestar',
  'alimentos_bebidas',
  'inmobiliario_construccion',
  'eventos_turismo',
  'financiero',
  'logistica_transporte',
  'educacion',
  'sostenibilidad',
  'otros',
] as const;

export type SectorValue = typeof SECTOR_VALUES[number];

export const SECTOR_LABELS: Record<SectorValue, string> = {
  tecnologia_software: 'Tecnología y Software',
  servicios_profesionales: 'Servicios Profesionales',
  comercio_retail: 'Comercio y Retail',
  salud_bienestar: 'Salud y Bienestar',
  alimentos_bebidas: 'Alimentos y Bebidas',
  inmobiliario_construccion: 'Inmobiliario y Construcción',
  eventos_turismo: 'Eventos y Turismo',
  financiero: 'Financiero',
  logistica_transporte: 'Logística y Transporte',
  educacion: 'Educación',
  sostenibilidad: 'Sostenibilidad',
  otros: 'Otros',
};

// Discovery channel values and labels
export const DISCOVERY_CHANNEL_VALUES = [
  'referencia',
  'busqueda_organica',
  'eventos_presenciales',
  'eventos_virtuales',
  'redes_profesionales',
  'otro',
] as const;

export type DiscoveryChannelValue = typeof DISCOVERY_CHANNEL_VALUES[number];

export const DISCOVERY_CHANNEL_LABELS: Record<DiscoveryChannelValue, string> = {
  referencia: 'Referencia (Colega/Amigo)',
  busqueda_organica: 'Búsqueda Orgánica',
  eventos_presenciales: 'Eventos Presenciales',
  eventos_virtuales: 'Eventos Virtuales',
  redes_profesionales: 'Redes Profesionales',
  otro: 'Otro',
};

// Company size values and labels
export const COMPANY_SIZE_VALUES = ['pequeña', 'mediana', 'grande'] as const;

export type CompanySizeValue = typeof COMPANY_SIZE_VALUES[number];

export const COMPANY_SIZE_LABELS: Record<CompanySizeValue, string> = {
  pequeña: 'Pequeña',
  mediana: 'Mediana',
  grande: 'Grande',
};

// Helper functions to get options for dropdowns
export function getSectorOptions() {
  return SECTOR_VALUES.map(value => ({
    value,
    label: SECTOR_LABELS[value],
  }));
}

export function getDiscoveryChannelOptions() {
  return DISCOVERY_CHANNEL_VALUES.map(value => ({
    value,
    label: DISCOVERY_CHANNEL_LABELS[value],
  }));
}

export function getCompanySizeOptions() {
  return COMPANY_SIZE_VALUES.map(value => ({
    value,
    label: COMPANY_SIZE_LABELS[value],
  }));
}
