import {
  SECTOR_VALUES,
  DISCOVERY_CHANNEL_VALUES,
  COMPANY_SIZE_VALUES,
  PERSONALIZATION_VALUES,
  INTEGRATION_VALUES,
  DEMAND_PEAK_VALUES,
  QUERY_TYPE_VALUES,
  TOOL_VALUES,
} from '@/lib/constants/llm-enums';

// Generate enum strings dynamically from centralized constants
const sectorEnum = SECTOR_VALUES.join('|');
const discoveryChannelEnum = DISCOVERY_CHANNEL_VALUES.join('|');
const companySizeEnum = COMPANY_SIZE_VALUES.join('|');
const personalizationEnum = PERSONALIZATION_VALUES.join('|');
const integrationEnum = INTEGRATION_VALUES.join('|');
const demandPeakEnum = DEMAND_PEAK_VALUES.join('|');
const queryTypeEnum = QUERY_TYPE_VALUES.join('|');
const toolEnum = TOOL_VALUES.join('|');

export const CATEGORIZATION_PROMPT_V1 = `You are an expert sales analyst for Vambe, a customer service automation platform. Analyze the following sales meeting transcript and extract structured information.

Meeting Information:
- Client: {clientName}
- Sales Representative: {salesRep}
- Meeting Date: {meetingDate}
- Deal Status: {closed}

Transcript:
{transcript}

Analyze this meeting and provide a JSON response with the following exact structure:

{
  "sector": "${sectorEnum}",
  "company_size": "${companySizeEnum}",
  "interaction_volume_daily": <integer - normalize to daily if weekly/monthly mentioned>,
  "discovery_channel": "${discoveryChannelEnum}",
  "pain_points": ["array of specific pain points"],
  "use_cases": ["array of specific use cases mentioned"],
  "objections": ["array of objections or concerns raised"],
  "others": "<free-form field for any other important insights, concerns, or context not captured in other fields>",
  "requirements": {
    "personalization": ["array of: ${personalizationEnum}"],
    "integrations": ["array of: ${integrationEnum}"],
    "confidentiality": true/false,
    "multilingual": true/false,
    "real_time": true/false
  },
  "demand_peaks": ["array of: ${demandPeakEnum}"],
  "query_types": ["array of: ${queryTypeEnum}"],
  "tools_mentioned": ["array of: ${toolEnum}"],
  "confidence": {
    "sector": 0.0-1.0
  }
}

Guidelines:
- sector: Industry/vertical of the client's business. Choose the most appropriate category:
  * tecnologia_software: Technology companies, software development, IT services, design, audiovisual production, photography
  * servicios_profesionales: Consulting, legal, accounting, translation, architecture, marketing agencies
  * comercio_retail: E-commerce, fashion, retail stores, bookstores
  * salud_bienestar: Healthcare, wellness, beauty, yoga, cosmetics
  * alimentos_bebidas: Restaurants, catering, bakeries, food services
  * inmobiliario_construccion: Real estate, construction
  * eventos_turismo: Events, tourism, travel agencies
  * financiero: Financial services, banking, insurance
  * logistica_transporte: Logistics, transportation, shipping
  * educacion: Education, training, schools
  * sostenibilidad: Environmental services, renewable energy, agriculture
  * otros: NGOs, security, or anything not fitting above categories
- company_size: Estimate based on team mentions, operations scale, etc.
  * pequeña: Small businesses, startups, few employees
  * mediana: Mid-sized companies, established businesses
  * grande: Large corporations, enterprise-level organizations
- interaction_volume_daily: IMPORTANT - Convert to daily number (if they say "500/week" → 71, "300/month" → 10)
- discovery_channel: How they found out about Vambe
  * referencia: Colleague or friend recommendation
  * busqueda_organica: Google search or articles
  * eventos_presenciales: In-person events (conferences, trade shows, seminars, networking events, talks)
  * eventos_virtuales: Virtual events (webinars, podcasts)
  * redes_profesionales: LinkedIn, forums, entrepreneur groups
  * otro: Any other channel
- pain_points: List specific problems mentioned
- use_cases: Specific ways they want to use the solution
- objections: Any concerns, doubts, or barriers mentioned
- others: Capture ANY other relevant information not fitting elsewhere (integration needs, special requirements, competitors mentioned, decision-making process, team structure, etc.)

NEW FIELDS:
- requirements.personalization: Array of personalization types mentioned (can be empty [])
  * by_customer_type: Different responses per customer segment
  * by_query_type: Tailored to question category
  * by_language: Multi-language support
  * by_location: Geographic customization
  * by_preferences: Based on user history/preferences
  * by_product_or_service: Product-specific responses

- requirements.integrations: Array of integrations mentioned or implied (can be empty [])
  * scheduling: Calendar, appointments, or reservation system integration
  * crm: CRM integration
  * ticketing: Support ticket system
  * ecommerce: E-commerce platform
  * databases: Database connectivity
  * social_media: Social media platforms
  * erp: ERP system

- requirements.confidentiality: Boolean - Do they mention data privacy, GDPR, sensitive information handling?
- requirements.multilingual: Boolean - Do they need multiple language support?
- requirements.real_time: Boolean - Do they need real-time/instant responses?

- demand_peaks: Array of demand peak patterns mentioned (can be empty [])
  * promotions: During sales/promotions
  * weekends: Weekend traffic spikes
  * high_season: Seasonal peaks
  * product_launches: New product releases
  * events: Special events/campaigns

- query_types: Array of query types the client handles (can be empty [])
  * pricing: Price inquiries and quotations
  * availability: Stock/availability
  * shipping: Delivery questions
  * returns: Return policy
  * scheduling: Booking/reservations and hours/schedules
  * technical_support: Technical help
  * regulations: Compliance/regulations
  * product_specs: Product specifications

- tools_mentioned: Array of tools/platforms currently used (can be empty [])
  * email: Email communication
  * whatsapp: WhatsApp
  * instagram: Instagram
  * zendesk: Zendesk
  * freshdesk: Freshdesk
  * hubspot: HubSpot
  * custom_system: Custom/proprietary system

- confidence.sector: Your confidence in the sector classification (0-1 scale)

IMPORTANT:
- Be precise with sector classification - choose the best fit from the consolidated categories
- Always normalize interaction_volume to DAILY
- Use "others" field generously for context that doesn't fit elsewhere
- Arrays can be empty [] if not mentioned. Booleans default to false if not discussed
- Respond ONLY with valid JSON, no additional text or markdown.
- CRITICAL: Use the EXACT enum values provided (e.g., "pricing", "availability"). DO NOT translate them to Spanish or any other language, even if the transcript is in Spanish.`;

export function buildCategorizationPrompt(params: {
  clientName: string;
  salesRep: string;
  meetingDate: string;
  closed: boolean;
  transcript: string;
}): string {
  return CATEGORIZATION_PROMPT_V1
    .replace('{clientName}', params.clientName)
    .replace('{salesRep}', params.salesRep)
    .replace('{meetingDate}', params.meetingDate)
    .replace('{closed}', params.closed ? 'Closed/Won' : 'Open')
    .replace('{transcript}', params.transcript);
}
