import express from 'express';
import { VertexAI } from '@google-cloud/vertexai';
import textToSpeech from '@google-cloud/text-to-speech';
import { Config } from '../services/prescription/config.js';

const router = express.Router();

// ─── Text-to-Speech Client ──────────────────────────────────────────────────
const ttsClient = new textToSpeech.TextToSpeechClient();

/**
 * Map language codes to Google Cloud TTS voice configuration
 */
const LANGUAGE_VOICE_MAP = {
    'en': { languageCode: 'en-IN', name: 'en-IN-Wavenet-C' }, // Indian English accent
    'hi': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A' },
    'ta': { languageCode: 'ta-IN', name: 'ta-IN-Wavenet-A' },
    'te': { languageCode: 'te-IN', name: 'te-IN-Standard-A' },
    'kn': { languageCode: 'kn-IN', name: 'kn-IN-Standard-A' },
    'ml': { languageCode: 'ml-IN', name: 'ml-IN-Standard-A' },
    'bn': { languageCode: 'bn-IN', name: 'bn-IN-Wavenet-A' },
    'mr': { languageCode: 'mr-IN', name: 'mr-IN-Wavenet-A' },
    'gu': { languageCode: 'gu-IN', name: 'gu-IN-Standard-A' },
};

// ─── Vertex AI (Online / Cloud) ──────────────────────────────────────────────
async function callVertexAI(model, contents, config) {
    const projectId = Config.GCP_PROJECT_ID;
    const location  = Config.GCP_LOCATION || 'us-central1';

    if (!projectId) throw new Error('GCP_PROJECT_ID not configured');

    const vertexAi        = new VertexAI({ project: projectId, location });
    const generativeModel = vertexAi.getGenerativeModel({
        model: model || Config.GEMINI_MODEL || 'gemini-2.5-pro'
    });

    const request = { contents };

    if (config) {
        request.generationConfig = {};
        if (config.responseMimeType)  request.generationConfig.responseMimeType  = config.responseMimeType;
        if (config.responseSchema)    request.generationConfig.responseSchema    = config.responseSchema;
        if (config.responseModalities) request.generationConfig.responseModalities = config.responseModalities;
        if (config.speechConfig)      request.generationConfig.speechConfig      = config.speechConfig;

        if (config.systemInstruction) {
            request.systemInstruction =
                typeof config.systemInstruction === 'string'
                    ? { role: 'system', parts: [{ text: config.systemInstruction }] }
                    : config.systemInstruction;
        }
        if (config.tools) request.tools = config.tools;
    }

    const response = await generativeModel.generateContent(request);

    let text = '';
    try {
        const parts = response.response.candidates?.[0]?.content?.parts || [];
        text = parts.map(p => p.text).filter(Boolean).join('');
    } catch (e) {
        console.warn('[Vertex] Could not extract text:', e.message);
    }

    return { ...response.response, text, _source: 'vertex' };
}

// ─── Gemini API (Online / Cloud, using API Key) ──────────────────────────────
async function callGeminiAPI(model, contents, config) {
    const apiKey = Config.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY not configured');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const modelParams = {
        model: model || Config.GEMINI_MODEL_NAME || 'gemini-2.5-pro'
    };

    if (config && config.systemInstruction) {
        modelParams.systemInstruction = typeof config.systemInstruction === 'string'
            ? config.systemInstruction
            : config.systemInstruction;
    }

    const generativeModel = genAI.getGenerativeModel(modelParams);

    const request = { contents };

    if (config) {
        request.generationConfig = {};
        if (config.responseMimeType)  request.generationConfig.responseMimeType  = config.responseMimeType;
        if (config.responseSchema)    request.generationConfig.responseSchema    = config.responseSchema;
        if (config.responseModalities) request.generationConfig.responseModalities = config.responseModalities;
        if (config.speechConfig)      request.generationConfig.speechConfig      = config.speechConfig;

        if (config.tools) request.tools = config.tools;
    }

    const response = await generativeModel.generateContent(request);

    let text = '';
    try {
        const parts = response.response.candidates?.[0]?.content?.parts || [];
        text = parts.map(p => p.text).filter(Boolean).join('');
    } catch (e) {
        console.warn('[GeminiAPI] Could not extract text:', e.message);
    }

    return { ...response.response, text, _source: 'gemini-api' };
}

// ─── Ollama / Local MedGemma (Offline fallback) ──────────────────────────────
async function callOllama(contents, config) {
    const ollamaUrl = Config.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

    let systemPrompt = config?.systemInstruction || '';
    const isJsonMode = config?.responseMimeType === 'application/json';

    if (config?.responseSchema) {
        systemPrompt += `\n\nYou MUST adhere strictly to the following JSON schema:\n${JSON.stringify(config.responseSchema, null, 2)}`;
    }

    let promptText = '';
    const images   = [];

    if (Array.isArray(contents)) {
        for (const msg of contents) {
            const role = msg.role === 'model' ? 'Assistant' : 'User';
            promptText += `${role}: `;
            for (const part of (msg.parts || [])) {
                if (part.text)              promptText += part.text + '\n';
                if (part.inlineData?.data)  images.push(part.inlineData.data);
            }
            promptText += '\n';
        }
    } else if (contents?.parts) {
        for (const part of contents.parts) {
            if (part.text) promptText += part.text + '\n';
        }
    }

    let finalPrompt = '';
    if (systemPrompt) finalPrompt += `System: ${systemPrompt}\n\n`;
    finalPrompt += promptText;
    if (isJsonMode)   finalPrompt += '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown formatting.';
    if (!finalPrompt.trim()) finalPrompt = 'Hello';

    const targetModel = images.length > 0 ? 'llava:latest' : 'edwardlo12/medgemma-4b-it-Q4_K_M';

    const payload = {
        model:  targetModel,
        prompt: finalPrompt,
        stream: false,
        format: isJsonMode ? 'json' : undefined
    };
    if (images.length > 0) payload.images = images;

    const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(30000)
    });

    if (!ollamaRes.ok) {
        if (ollamaRes.status === 404) {
            throw new Error(`Model '${targetModel}' not found in Ollama. Run: ollama pull ${targetModel}`);
        }
        throw new Error(`Ollama error: ${ollamaRes.statusText} (${ollamaRes.status})`);
    }

    const data = await ollamaRes.json();
    return { text: data.response, _source: 'ollama' };
}

// ─── Helper: is this a network/connectivity error? ───────────────────────────
function isNetworkError(err) {
    const msg = err?.message || '';
    return (
        err?.code === 'ECONNREFUSED'    ||
        err?.code === 'ENOTFOUND'       ||
        msg.includes('ECONNREFUSED')    ||
        msg.includes('ENOTFOUND')       ||
        msg.includes('fetch failed')    ||
        msg.includes('network')         ||
        msg.includes('getaddrinfo')
    );
}

// ─── Main smart route: Gemini API → Vertex AI → MedGemma fallback ─────────────────────────
router.post('/generateContent', async (req, res) => {
    const { model, contents, config } = req.body;

    // 0. Try Gemini API first (requires API key)
    if (Config.GOOGLE_API_KEY) {
        try {
            const result = await callGeminiAPI(model, contents, config);
            console.log('✅ [AI] Served by Gemini API (online)');
            return res.json(result);
        } catch (apiErr) {
            if (isNetworkError(apiErr)) {
                console.warn('⚠️  [AI] No internet — falling back to local MedGemma...');
            } else {
                console.error('❌ [AI] Gemini API error:', apiErr.message, '— falling back to next provider...');
            }
        }
    }

    // 1. Try Vertex AI (requires internet + GCP credentials)
    if (Config.GCP_PROJECT_ID) {
        try {
            const result = await callVertexAI(model, contents, config);
            console.log('✅ [AI] Served by Vertex AI (online)');
            return res.json(result);
        } catch (vertexErr) {
            if (isNetworkError(vertexErr)) {
                console.warn('⚠️  [AI] No internet — falling back to local MedGemma...');
            } else {
                console.error('❌ [AI] Vertex AI error:', vertexErr.message, '— falling back to MedGemma...');
            }
        }
    } else {
        console.warn('⚠️  [AI] GCP_PROJECT_ID not set — using local MedGemma...');
    }

    // 2. Fallback: Ollama / local MedGemma
    try {
        const result = await callOllama(contents, config);
        console.log('🤖 [AI] Served by local MedGemma (offline fallback)');
        return res.json(result);
    } catch (ollamaErr) {
        const connRefused = isNetworkError(ollamaErr) || ollamaErr?.cause?.code === 'ECONNREFUSED';
        if (connRefused) {
            return res.status(503).json({
                error: 'Both Vertex AI (cloud) and local MedGemma (Ollama) are unavailable. Check internet or start Ollama.'
            });
        }
        console.error('❌ [AI] MedGemma error:', ollamaErr.message);
        return res.status(500).json({ error: ollamaErr.message || 'AI request failed' });
    }
});

// ─── TTS Route: Google Cloud Text-to-Speech ─────────────────────────────────
router.post('/tts', async (req, res) => {
    const { text, languageCode = 'en' } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required for TTS' });
    }

    try {
        const voiceConfig = LANGUAGE_VOICE_MAP[languageCode] || LANGUAGE_VOICE_MAP['en'];
        
        const request = {
            input: { text },
            voice: { 
                languageCode: voiceConfig.languageCode, 
                name: voiceConfig.name 
            },
            audioConfig: { 
                audioEncoding: 'LINEAR16',
                sampleRateHertz: 24000,
                speakingRate: 1.0,
                pitch: 0.0
            },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioBase64 = response.audioContent.toString('base64');
        
        console.log(`🔊 [TTS] Generated speech for text (${languageCode})`);
        res.json({ audioContent: audioBase64 });
    } catch (error) {
        console.error('❌ [TTS] Error:', error.message);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

export default router;
