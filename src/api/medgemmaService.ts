/**
 * medgemmaService.ts
 * Calls the local MedGemma backend when the user is offline.
 * The backend runs at the same host as the main VedaX-AI server.
 */

const MEDGEMMA_API =
  (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api') + '/medgemma/chat';

const OFFLINE_PROMPTS: Record<string, string> = {
  MEDICINE: `You are an expert pharmacist AI. Identify the medicine shown in the image.
Return ONLY valid JSON with NO markdown fences:
{
  "name": "Medicine Name",
  "type": "Category (e.g., Antibiotic / Painkiller)",
  "purpose": "What it treats and how it works",
  "dosage": "Standard adult dosage guidance",
  "warnings": "Key safety warnings and contraindications",
  "dosage_warning": "Overdose or allergy risks"
}`,

  DERM: `You are an expert Dermatologist AI. Analyze the skin condition shown in the image.
Also consider the patient profile provided.
Return ONLY valid JSON with NO markdown fences:
{
  "condition_name": "Dermatological Condition Name",
  "verdict": "Good | Bad | Critical",
  "explanation": "Clinical presentation and what you observe",
  "recommended_action": "Suggested next steps and treatment options"
}`,

  REPORT: `You are an expert Pathologist AI. Analyze the medical lab report shown in the image.
Extract key findings and interpret the values holistically.
Return ONLY valid JSON with NO markdown fences:
{
  "report_type": "Type of test (e.g., CBC, Lipid Profile)",
  "summary": "One sentence overall summary",
  "findings": [
    { "parameter": "Biomarker Name", "value": "Result Value", "status": "High | Low | Normal", "meaning": "Clinical interpretation" }
  ],
  "health_tips": ["Tip 1", "Tip 2"],
  "overall_status": "Normal | Attention Needed | Critical"
}`
};

/**
 * Attempt to parse a JSON string that may be wrapped in markdown fences.
 */
const cleanParse = (text: string): any => {
  if (!text) return { raw_text: '' };
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Return a generic wrapper so the result UI can still display *something*
    return { raw_text: text };
  }
};

export type MedGemmaAnalysisType = 'MEDICINE' | 'DERM' | 'REPORT';

/**
 * Call the local MedGemma backend for offline analysis.
 * @param type    The analysis type – drives the prompt sent to MedGemma.
 * @param imageBase64  Raw base64 image data (no data: prefix).
 * @param extra   Optional extra context appended to the prompt (e.g., patient profile).
 */
export const analyzeWithMedGemma = async (
  type: MedGemmaAnalysisType,
  imageBase64: string,
  extra?: string
): Promise<any> => {
  const prompt = OFFLINE_PROMPTS[type] + (extra ? `\n\nPatient context: ${extra}` : '');

  try {
    const response = await fetch(MEDGEMMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, image: imageBase64 }),
    });

    if (!response.ok) {
      throw new Error(`MedGemma server error: ${response.status}`);
    }

    const data = await response.json();
    const text: string = data.response || data.text || '';
    return cleanParse(text);
  } catch (err: any) {
    console.error('[MedGemma Offline] Error:', err);
    return { error: `Offline AI error: ${err.message || 'Could not reach MedGemma server.'}` };
  }
};
