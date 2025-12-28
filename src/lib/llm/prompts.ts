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
  "interest_level": "low|medium|high",
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high",
  "icp_fit": "low|medium|high",
  "sector": "financiero|ecommerce|salud|educacion|logistica|viajes|moda|consultoria|restaurante|software|catering|bienes_raices|ong|seguridad|turismo|legal|eventos|tecnologia|ambiental|transporte|traduccion|diseño|produccion_audiovisual|contabilidad|belleza|energia_renovable|yoga|construccion|pasteleria|cosmeticos|arquitectura|alimentos|marketing|libreria|fotografia|agricultura|otro",
  "company_size": "startup|pequeña|mediana|grande|enterprise",
  "interaction_volume_daily": <integer - normalize to daily if weekly/monthly mentioned>,
  "specific_pain": "<main concrete pain point in detail>",
  "discovery_channel": "colega|google|conferencia|feria|webinar|podcast|articulo|linkedin|recomendacion_amigo|foro|grupo_emprendedores|seminario|evento_networking|charla|otro",
  "clear_vambe_interest": true|false,
  "pain_points": ["array of specific pain points"],
  "use_cases": ["array of specific use cases mentioned"],
  "objections": ["array of objections or concerns raised"],
  "others": "<free-form field for any other important insights, concerns, or context not captured in other fields>",
  "confidence": {
    "interest_level": 0.0-1.0,
    "sector": 0.0-1.0
  }
}

Guidelines:
- interest_level: Client's genuine interest level in Vambe
- sentiment: Overall emotional tone of the conversation
- urgency: How urgent is their need to solve the problem
- icp_fit: How well client fits Vambe's Ideal Customer Profile
- sector: Industry/vertical of the client's business
- company_size: Estimate based on team mentions, operations scale, etc.
- interaction_volume_daily: IMPORTANT - Convert to daily number (if they say "500/week" → 71, "300/month" → 10)
- specific_pain: The main, concrete problem they're trying to solve (be specific)
- discovery_channel: How they found out about Vambe
- clear_vambe_interest: Whether they explicitly show interest in Vambe specifically
- pain_points: List specific problems mentioned
- use_cases: Specific ways they want to use the solution
- objections: Any concerns, doubts, or barriers mentioned
- others: Capture ANY other relevant information not fitting elsewhere (integration needs, special requirements, competitors mentioned, decision-making process, team structure, etc.)
- confidence: Your confidence in the assessments (0-1 scale)

IMPORTANT:
- Be precise with sector classification
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
