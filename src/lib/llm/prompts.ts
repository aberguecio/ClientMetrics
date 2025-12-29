import { SECTOR_VALUES, DISCOVERY_CHANNEL_VALUES, COMPANY_SIZE_VALUES } from '@/lib/constants/llm-enums';

// Generate enum strings dynamically from centralized constants
const sectorEnum = SECTOR_VALUES.join('|');
const discoveryChannelEnum = DISCOVERY_CHANNEL_VALUES.join('|');
const companySizeEnum = COMPANY_SIZE_VALUES.join('|');

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
- confidence.sector: Your confidence in the sector classification (0-1 scale)

IMPORTANT:
- Be precise with sector classification - choose the best fit from the consolidated categories
- Always normalize interaction_volume to DAILY
- Use "others" field generously for context that doesn't fit elsewhere
- Respond ONLY with valid JSON, no additional text or markdown.`;

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
