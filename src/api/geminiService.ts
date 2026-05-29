import { Type, Schema } from '@google/genai';
import { Message, UserProfile, PrescriptionData } from '@/types';

// ---------------------------------------------------------------------------
// Client setup — all AI calls proxied through backend
// Online  → Vertex AI (GCP)      |  Offline → local MedGemma (Ollama)
// ---------------------------------------------------------------------------

/** Backend URL: set VITE_API_BASE_URL in .env to change (default: localhost:5000) */
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const MODEL = 'gemini-2.5-pro';

// ---------------------------------------------------------------------------
// Language helpers
// ---------------------------------------------------------------------------

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  bn: 'Bengali (বাংলা)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)',
};

const langName = (code: string) => LANGUAGE_MAP[code] ?? 'English';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const triageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: 'The response text or question to ask the user.',
    },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2–4 short suggested reply buttons for the user.',
    },
    isFinal: {
      type: Type.BOOLEAN,
      description: 'True only when enough information exists for a triage recommendation.',
    },
    triageResult: {
      type: Type.OBJECT,
      nullable: true,
      description: 'Required when isFinal is true.',
      properties: {
        level: {
          type: Type.STRING,
          enum: ['Green', 'Yellow', 'Red'],
          description: 'Green: Non-urgent. Yellow: Urgent appointment. Red: Emergency room.',
        },
        specialty: {
          type: Type.STRING,
          description: 'Recommended medical specialty.',
        },
        summary: {
          type: Type.STRING,
          description: 'Concise preliminary analysis for the doctor.',
        },
      },
      required: ['level', 'specialty', 'summary'],
    },
  },
  required: ['text', 'isFinal'],
};


// ---------------------------------------------------------------------------
// (Mock fallbacks removed — backend handles online/offline switching)
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract base64 payload from a data URL or return the string as-is. */
const stripDataUrl = (dataUrl: string) => dataUrl.split(',')[1] ?? dataUrl;

/** Build an inline image part for the Gemini API. */
const imagePart = (base64: string, mimeType = 'image/jpeg') => ({
  inlineData: { mimeType, data: base64 },
});

/**
 * FIX: In @google/genai the response text is accessed via the getter property `response.text`, 
 * NOT as a method `response.text()`.
 */
const extractText = (response: { text: string | undefined }): string => {
  const t = response.text;
  if (!t) throw new Error('Empty response from Gemini API.');
  return t;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the symptom-triage conversation.
 * Returns a structured triage object matching `triageSchema`.
 */
export const generateTriageResponse = async (
  history: Message[],
  userProfile: UserProfile,
  language = 'en'
): Promise<unknown> => {

  const selectedLang = langName(language);

  const timelineEvents = (userProfile?.medicalEvents || [])
    .map((e) => `- ${e.date}: ${e.title} (${e.description})`)
    .join('\n');

  const medNames = (userProfile?.medications || []).map((m) => m.name).join(', ') || 'None';
  const allergies = (userProfile?.allergies || []).join(', ') || 'None';

  const systemPrompt = `
You are "VedaX-AI", an intelligent and empathetic medical assistant for the Indian healthcare context.
Your goal is to assess the user's symptoms and recommend a triage level and specialist.

LANGUAGE: You MUST respond ONLY in ${selectedLang}. Never use English when another language is selected.

User Profile:
- Age: ${userProfile.age}
- Allergies: ${allergies}
- Current Medications: ${medNames}
- Medical History: ${userProfile.medicalHistory || 'None recorded'}

Recent Medical Timeline:
${timelineEvents || 'No events on record.'}

Conversation Protocol:
1. TONE – Be affirmative, empathetic, and calming. Use phrases like "Please don't worry" and "Take a deep breath".
2. IMMEDIATE COMFORT – Alongside clinical questions, suggest a calming action (e.g. "Please sit down and drink some water").
3. QUESTIONS – Ask 1–3 focused follow-up questions. Analyse any uploaded images.
4. OPTIONS – Always provide 2–4 short reply buttons in ${selectedLang}.
5. COMPLETION – Set "isFinal: true" once you have sufficient information.
6. EMERGENCIES – For chest pain, severe bleeding, etc., set level "Red" immediately, stay calm, and gently advise calling 112 or 108.
7. TERMINOLOGY – Use Indian medical terminology where appropriate.
`.trim();

  // Convert chat history to Gemini content format
  const contents = history.map((msg) => {
    const parts: object[] = [{ text: msg.text }];

    if (msg.image) {
      const b64 = stripDataUrl(msg.image);
      if (b64) parts.push(imagePart(b64));
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

  try {
    const response = await generateContentWithRetry(MODEL, {
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: triageSchema,
      },
      contents,
    });

    return JSON.parse(extractText(response));
  } catch (error) {
    console.error('[Triage] Gemini error:', error);
    return {
      text:
        language === 'hi'
          ? 'नेटवर्क से कनेक्ट करने में समस्या हो रही है। कृपया पुनः प्रयास करें।'
          : 'Having trouble reaching the AI. Please check your connection and try again.',
      options: ['Try again'],
      isFinal: false,
    };
  }
};

// ---------------------------------------------------------------------------
// HealthWealth Integrated Functions
// ---------------------------------------------------------------------------

export interface MiniProfile {
  age?: string;
  weight?: string;
  allergies?: string;
  gender?: string;
  condition?: string;
}

const cleanJSON = (text: string) => {
  if (!text) return {};
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return { error: "AI format error." };
  }
};

const generateContentWithRetry = async (modelName: string, params: any, retries = 3) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      // Backend auto-selects: Vertex AI (online) → MedGemma (offline)
      const res = await fetch(`${BACKEND_URL}/api/ai/generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, ...params }),
      });
      if (!res.ok) throw new Error(`Backend AI error: ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error: any) {
      lastError = error;
      if (error.status === 429 || error.status === 503 || error.message?.includes('429')) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const transcribeUserAudio = async (base64Data: string, mimeType: string) => {
  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Transcribe audio." }] }]
    });
    return extractText(response).trim() || "";
  } catch (e) { return ""; }
};

export const analyzeImage = async (
  base64Data: string,
  mimeType: string,
  type: 'MEDICINE' | 'DERM' | 'REPORT',
  profile?: MiniProfile
) => {
  let prompt = "";

  if (type === 'MEDICINE') {
    prompt = `Identify this medicine. Return JSON: {name, purpose, dosage_warning}.
     CRITICAL SAFETY CHECK: The user has allergies: "${profile?.allergies || 'None'}".
     If allergens found, warning: "⚠️ DANGER: Contains allergens for this patient". Otherwise standard warning.`;
  } else if (type === 'DERM') {
    prompt = `Analyze skin condition. Patient: ${profile?.age || '?'} yrs, ${profile?.gender || ''}.
     Review the image carefully for skin issues.
     Return JSON: {condition_name, verdict, explanation, recommended_action}.`;
  } else if (type === 'REPORT') {
    prompt = `You are an expert Pathologist & General Physician AI. Analyze this medical lab report (CBC, Lipid, Thyroid, LFT, KFT, Urine, etc.).
     Patient Profile: ${profile?.age || 'Unknown'} years old, ${profile?.gender || 'Unknown'}.

     CRITICAL HOLISTIC LOGIC RULES (Follow Strictly):
     1. **Connect the Dots:** Do NOT analyze parameters in isolation. Look at the relationship between values.
     2. **Conflict Resolution & Examples:**
        - **Thyroid:** If T3/T4 High AND TSH High -> Mark as "Complex/Pituitary Issue" (Don't say thyroid is both fast and slow).
        - **Lipid Profile:** If Total Cholesterol is High BUT HDL (Good Cholesterol) is also High -> This is often OK. Do not panic. Check LDL/HDL ratio instead.
        - **CBC (Anemia):** If Hemoglobin is Low, look at MCV. 
          * MCV Low = Iron Deficiency (Microcytic).
          * MCV High = B12/Folate Deficiency (Macrocytic). -> Give specific advice based on this.
        - **Liver (LFT):** If SGOT/SGPT are mildly elevated but Bilirubin is Normal -> Likely Fatty Liver or Alcohol, not Liver Failure.
        - **Kidney (KFT):** If Creatinine is high, check Urea/BUN. Both high = Kidney stress. Dehydration can also spike these slightly.
     3. **Dummy Data Rule:** If report says "DUMMY", "SAMPLE", or "FORMAT", explicitly mention: "This appears to be a sample report, but here is the analysis of the numbers provided."

     Task:
     1. Identify the Test Type (e.g., Complete Blood Count, Lipid Profile, etc.).
     2. Extract ONLY abnormal or key values.
     3. Provide a 'Medical Interpretation' that explains WHY it is high/low based on the logic above.

     RETURN JSON format:
     {
       "report_type": "string",
       "summary": "string",
       "findings": [
          { 
            "parameter": "string", 
            "value": "string", 
            "status": "High/Low/Normal", 
            "meaning": "string" 
          }
       ],
       "health_tips": ["tip1", "tip2"],
       "overall_status": "Attention Needed / Normal / Critical"
     }`;
  }

  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return cleanJSON(extractText(response) || "{}");
  } catch (e: any) { return { error: `AI Error: ${e.message}` }; }
};

export const analyzeMedicineVideo = async (base64Data: string, mimeType: string) => {
  const prompt = `
  You are a strict Medical Adherence AI. Analyze this video carefully to verify if the patient ACTUALLY took the medicine.
  
  CHECK FOR THESE 3 STEPS:
  1. Presence of Medicine: Can you see a pill, syrup, or inhaler?
  2. Action: Did the person put it in their mouth?
  3. Swallowing: Did they drink water or swallow?

  CRITERIA FOR SUCCESS (true):
  - The person MUST perform the action of taking the medicine. 
  - Just holding the packet or looking at the camera is "success": false.
  
  RETURN PURE JSON:
  {
    "action_detected": "string",
    "success": boolean, 
    "verdict_message": "string"
  }`;

  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return cleanJSON(extractText(response) || "{}");
  } catch (e) {
    console.error("Video Analysis Error:", e);
    return { error: "Failed to analyze video." };
  }
};

export const generateDietPlan = async (condition: string) => {
  const prompt = `You are a Nutritionist. Create a recovery diet plan for: ${condition}.
  RETURN ONLY PURE JSON with this exact structure (no markdown):
  {
    "advice": "string",
    "meals": [
      { "name": "Breakfast", "items": ["Item 1", "Item 2"] },
      { "name": "Lunch", "items": ["Item 1", "Item 2"] },
      { "name": "Dinner", "items": ["Item 1", "Item 2"] }
    ],
    "youtube_queries": ["Yoga for ${condition}", "Exercise for ${condition}"]
  }`;

  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    const rawText = extractText(response) || "{}";
    return cleanJSON(rawText);
  } catch (error) {
    console.error("[generateDietPlan] Error:", error);
    return { error: "Could not generate diet plan. Please check your Gemini API key." };
  }
};

export const findYoutubeVideo = async (query: string) => {
  const prompt = `Generate 3 distinct, specific YouTube search queries for: "${query}".
  RETURN ONLY PURE JSON ARRAY:
  [
    { "title": "Beginner Yoga for Back Pain", "search_term": "Yoga for Back Pain relief exercises" },
    { "title": "10 Min Relief Workout", "search_term": "10 min back pain relief workout" },
    { "title": "Physiotherapy Tips", "search_term": "Physiotherapy exercises for back pain" }
  ]`;

  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    const data = cleanJSON(extractText(response) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

export const analyzeExerciseVideo = async (
  base64Data: string,
  mimeType: string,
  ailment: string,
  exercise: string,
  profile?: MiniProfile
) => {
  const prompt = `You are an expert Physiotherapist AI. 
  Patient Profile: Age ${profile?.age || 'Unknown'}, Weight ${profile?.weight || 'Unknown'}.
  The user has "${ailment}" and is performing "${exercise}".
  Analyze the video for form, safety, and correctness considering their age and weight constraints.
  
  RETURN PURE JSON:
  {
    "score": "Integer 1-10",
    "feedback": "string",
    "tips": ["Tip 1", "Tip 2", "Tip 3 to improve"]
  }`;

  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return cleanJSON(extractText(response) || "{}");
  } catch (e) {
    return { error: "Failed to analyze exercise." };
  }
};

/**
 * Generate a short, personalised health summary paragraph.
 */
export const generateHealthSummary = async (
  userProfile: UserProfile,
  language = 'en'
): Promise<string> => {
  const recentEvents = userProfile.medicalEvents
    .slice(0, 5)
    .map((e) => `- ${e.date}: ${e.title} (${e.type})`)
    .join('\n');

  const medNames = userProfile.medications.map((m) => m.name).join(', ') || 'None';

  const prompt = `
Analyse the following patient profile and write a brief, empathetic 3–4 sentence health summary in ${langName(language)}.
Output plain text only — no markdown, no bullet points.

Name: ${userProfile.name}, Age: ${userProfile.age}
Conditions: ${userProfile.medicalHistory || 'None'}
Medications: ${medNames}
Recent Events:
${recentEvents || 'None'}
`.trim();

  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return extractText(response);
  } catch (error) {
    console.error('[Health Summary] Error:', error);
    return 'Could not generate summary at this time.';
  }
};

/**
 * Generate a single personalised daily health tip (≤30 words).
 */
export const generateHealthTip = async (
  userProfile: UserProfile,
  language = 'en'
): Promise<string> => {
  const medNames = userProfile.medications.map((m) => m.name).join(', ') || 'None';

  const prompt = `
Generate one short, personalised, actionable health tip for today in ${langName(language)}.
Keep it under 30 words. No markdown.

Profile:
- Age: ${userProfile.age}
- Conditions: ${userProfile.medicalHistory || 'None'}
- Medications: ${medNames}
- Allergies: ${userProfile.allergies.join(', ') || 'None'}
`.trim();

  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return extractText(response);
  } catch (error) {
    console.error('[Health Tip] Error:', error);
    return 'Take a 10-minute walk today to boost your energy.';
  }
};

export const runTriageTurn = async (
  history: { role: string; text: string }[],
  currentInput: string,
  step: number,
  userLocation?: { lat: number; lng: number },
  profile?: MiniProfile,
  userAddress?: string
) => {
  let profileText = "";
  if (profile) {
    profileText = `
    PATIENT PROFILE (CRITICAL CONTEXT):
    - Age: ${profile.age || 'Unknown'}
    - Allergies: ${profile.allergies || 'None'}
    
    INSTRUCTION: Consider this profile. If user suggests medicine they are allergic to, WARN them.`;
  }

  let systemInstruction = `You are a professional, empathetic Medical Triage AI.
  ${profileText}
  `;

  if (step < 2) {
    systemInstruction += `CURRENT STATUS: Step ${step + 1} of 3.
  GOAL: Analyze user's complaint and ask EXACTLY 1 focused follow-up question.
  FORMATTING: Keep it brief, empathetic, and single paragraph.`;
  } else if (step === 2) {
    systemInstruction += `CURRENT STATUS: Final Assessment (Step 3/3).
  GOAL: Provide a FINAL VERDICT with specialist category (e.g. "Gastroenterologist").
  
  VERDICT RULES:
  - Specify specialist name starting with "**Verdict:**".
  - CRITICAL: On the final step, you MUST include a risk tag exactly matching "[RISK_LEVEL: RED]", "[RISK_LEVEL: YELLOW]", or "[RISK_LEVEL: GREEN]" based on symptom severity.
  - CRITICAL: Immediately after the risk tag, you MUST include a 1-2 sentence specific explanation of what this implies for their exact symptoms, using this format exactly: "[RISK_REASON: your explanation here]".
  - RED: Life-threatening (chest pain, stroke signs).
  - YELLOW: Urgent but not life-threatening (high fever, moderate injury).
  - GREEN: Non-urgent (mild cold, routine query).
  - Find top relevant clinics nearby.
  - Links: [Clinic Name](https://www.google.com/maps/search/?api=1&query=Clinic+Name+City)
  
  FORMATTING: Markdown, short response.`;
  } else {
    systemInstruction += `CURRENT STATUS: Post-Triage Support Phase.
  GOAL: The user has completed triage. Answer their follow-up questions about medicines, quick solutions, dietary advice, or health suggestions based on their condition.
  
  CRITICAL RULES:
  1. CONCISE & STRUCTURED: Do NOT generate long, dense textual paragraphs. You MUST answer directly using short, highly structured bullet points. Get straight to the point.
  2. MEDICINE DISCLAIMER: If the user asks about ANY drug/medicine, or if you suggest any over-the-counter medicine, you MUST include this exact text at the very end of your response: "**Note: Please consult any practitioner before intake of this medicine.**"
  3. TONE: Be helpful, practical, and safe.`;
  }

  const tools: any[] = [];
  if (step >= 2 && userLocation) {
    tools.push({ googleSearch: {} });
    const locStr = userAddress || `Lat ${userLocation.lat}, Lng ${userLocation.lng}`;
    systemInstruction += `\nUSER LOCATION: ${locStr}. Use this to find REAL doctors nearby.`;
  }

  try {
    const response = await generateContentWithRetry(MODEL, {
      contents: [...history.map(h => ({ role: h.role === 'model' ? 'model' : 'user', parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: currentInput }] }],
      config: { systemInstruction, tools: tools.length > 0 ? tools : undefined }
    });

    let text = extractText(response) || "I couldn't generate a response.";
    const mapChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let groundingUrls = mapChunks.map((c: any) => {
      if (c.maps?.uri) return { title: c.maps.title || "Medical Center", uri: c.maps.uri };
      return null;
    }).filter((i: any) => i !== null);

    // Fallback link extraction from text
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      groundingUrls.push({ title: match[1], uri: match[2] });
    }

    if (step === 2 && groundingUrls.length === 0) {
      groundingUrls.push({ title: "Find Specialist Nearby", uri: `https://www.google.com/maps/search/?api=1&query=specialist+doctor+near+me` });
    }

    return { text, groundingUrls: groundingUrls.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.uri === v.uri) === i) };
  } catch (error) {
    return { text: "Error connecting to AI.", groundingUrls: [] };
  }
};

/**
 * Generate high-quality voice for the given text using Google Cloud TTS via backend.
 * Supports multiple Indian languages.
 */
export const generateTTS = async (text: string, langCode: string = 'en') => {
  if (!text) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, languageCode: langCode }),
    });

    if (!res.ok) throw new Error(`TTS Backend error: ${res.statusText}`);

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return data.audioContent; // Returns base64 string
  } catch (error) {
    console.error('[TTS] Error generating voice:', error);
    return null;
  }
};
