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

// Personalization types
export const PERSONALIZATION_VALUES = [
  'by_customer_type',
  'by_query_type',
  'by_language',
  'by_location',
  'by_preferences',
  'by_product_or_service',
] as const;

export type PersonalizationValue = typeof PERSONALIZATION_VALUES[number];

export const PERSONALIZATION_LABELS: Record<PersonalizationValue, string> = {
  by_customer_type: 'Por tipo de cliente',
  by_query_type: 'Por tipo de consulta',
  by_language: 'Por idioma',
  by_location: 'Por ubicación',
  by_preferences: 'Por preferencias',
  by_product_or_service: 'Por producto/servicio',
};

// Integration types
export const INTEGRATION_VALUES = [
  'calendar',
  'appointments',
  'reservations',
  'crm',
  'ticketing',
  'ecommerce',
  'databases',
  'social_media',
  'erp',
] as const;

export type IntegrationValue = typeof INTEGRATION_VALUES[number];

export const INTEGRATION_LABELS: Record<IntegrationValue, string> = {
  calendar: 'Calendario',
  appointments: 'Citas',
  reservations: 'Reservaciones',
  crm: 'CRM',
  ticketing: 'Ticketing',
  ecommerce: 'E-commerce',
  databases: 'Bases de datos',
  social_media: 'Redes sociales',
  erp: 'ERP',
};

// Demand peaks
export const DEMAND_PEAK_VALUES = [
  'promotions',
  'weekends',
  'high_season',
  'product_launches',
  'events',
] as const;

export type DemandPeakValue = typeof DEMAND_PEAK_VALUES[number];

export const DEMAND_PEAK_LABELS: Record<DemandPeakValue, string> = {
  promotions: 'Promociones',
  weekends: 'Fines de semana',
  high_season: 'Temporada alta',
  product_launches: 'Lanzamientos de productos',
  events: 'Eventos',
};

// Query types
export const QUERY_TYPE_VALUES = [
  'pricing',
  'availability',
  'shipping',
  'returns',
  'reservations',
  'schedules',
  'technical_support',
  'quotations',
  'regulations',
  'product_specs',
] as const;

export type QueryTypeValue = typeof QUERY_TYPE_VALUES[number];

export const QUERY_TYPE_LABELS: Record<QueryTypeValue, string> = {
  pricing: 'Precios',
  availability: 'Disponibilidad',
  shipping: 'Envíos',
  returns: 'Devoluciones',
  reservations: 'Reservaciones',
  schedules: 'Horarios',
  technical_support: 'Soporte técnico',
  quotations: 'Cotizaciones',
  regulations: 'Regulaciones',
  product_specs: 'Especificaciones de productos',
};

// Tools mentioned
export const TOOL_VALUES = [
  'email',
  'whatsapp',
  'instagram',
  'zendesk',
  'freshdesk',
  'hubspot',
  'custom_system',
] as const;

export type ToolValue = typeof TOOL_VALUES[number];

export const TOOL_LABELS: Record<ToolValue, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  zendesk: 'Zendesk',
  freshdesk: 'Freshdesk',
  hubspot: 'HubSpot',
  custom_system: 'Sistema personalizado',
};

// Helper functions
export function getPersonalizationOptions() {
  return PERSONALIZATION_VALUES.map(value => ({
    value,
    label: PERSONALIZATION_LABELS[value],
  }));
}

export function getIntegrationOptions() {
  return INTEGRATION_VALUES.map(value => ({
    value,
    label: INTEGRATION_LABELS[value],
  }));
}

export function getDemandPeakOptions() {
  return DEMAND_PEAK_VALUES.map(value => ({
    value,
    label: DEMAND_PEAK_LABELS[value],
  }));
}

export function getQueryTypeOptions() {
  return QUERY_TYPE_VALUES.map(value => ({
    value,
    label: QUERY_TYPE_LABELS[value],
  }));
}

export function getToolOptions() {
  return TOOL_VALUES.map(value => ({
    value,
    label: TOOL_LABELS[value],
  }));
}
