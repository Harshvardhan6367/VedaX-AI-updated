import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { Config } from './config.js';
import { setup_logger } from './utils.js';

const logger = setup_logger('PrescriptionExtractor');

export class PrescriptionExtractor {
    constructor() {
        if (!Config.GOOGLE_API_KEY) {
            logger.warn("Google API Key not found");
        } else {
            this.genai = new GoogleGenerativeAI(Config.GOOGLE_API_KEY);
            this.model = this.genai.getGenerativeModel({ model: Config.GEMINI_MODEL_NAME });
        }
    }

    parseJSONResponse(text) {
        if (text.includes("```json")) {
            text = text.split("```json")[1].split("```")[0];
        } else if (text.includes("```")) {
            text = text.split("```")[1].split("```")[0];
        }
        return JSON.parse(text.trim());
    }

    async extractData(filePath) {
        const prompt = `
        You are an expert medical assistant. Analyze this prescription and extract the following information in JSON format.
        Focus strictly on the medicine details and instructions.
        
        {
            "date": "Date of prescription",
            "medicines": [
                {
                    "name": "Exact name of the tablet/medicine",
                    "quantity": "How much to take (e.g., 1 tablet, 5ml)",
                    "timing": {
                        "morning": "Yes/No",
                        "afternoon": "Yes/No",
                        "night": "Yes/No",
                        "instruction": "Before meal / After meal / Empty stomach / etc."
                    },
                    "frequency": "Raw frequency string (e.g., 1-0-1)",
                    "duration": "For how many days the medicine should be taken"
                }
            ],
            "notes": "Any special instructions"
        }
        If a field is missing, use "-". Return ONLY the JSON.
        `;

        try {
            const ext = filePath.split('.').pop().toLowerCase();
            const contents = [prompt];
            
            if (['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
                const data = fs.readFileSync(filePath);
                const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                
                contents.push({
                    inlineData: {
                        data: data.toString("base64"),
                        mimeType: mimeType
                    }
                });
            } else {
                throw new Error("Unsupported file format for extraction.");
            }

            // 1. Try Vertex AI first (if GCP credentials exist)
            if (Config.GCP_PROJECT_ID) {
                try {
                    logger.info("Attempting extraction using Vertex AI...");
                    const { VertexAI } = await import('@google-cloud/vertexai');
                    const vertexAi = new VertexAI({ project: Config.GCP_PROJECT_ID, location: Config.GCP_LOCATION });
                    const modelName = Config.GEMINI_MODEL || 'gemini-2.5-pro';
                    const vertexModel = vertexAi.getGenerativeModel({ model: modelName });
                    
                    const response = await vertexModel.generateContent({ contents });
                    let text = '';
                    const parts = response.response.candidates?.[0]?.content?.parts || [];
                    text = parts.map(p => p.text).filter(Boolean).join('');
                    
                    if (text) {
                        logger.info("Extraction successful via Vertex AI!");
                        return this.parseJSONResponse(text);
                    }
                } catch (err) {
                    logger.error(`Vertex AI extraction failed: ${err.message}. Falling back to Gemini API...`);
                }
            }

            // 2. Try Gemini API fallback (original method)
            if (Config.GOOGLE_API_KEY) {
                try {
                    logger.info("Attempting extraction using Gemini API...");
                    if (!this.model) {
                        this.genai = new GoogleGenerativeAI(Config.GOOGLE_API_KEY);
                        this.model = this.genai.getGenerativeModel({ model: Config.GEMINI_MODEL_NAME || 'gemini-2.5-pro' });
                    }
                    const response = await this.model.generateContent(contents);
                    let text = response.response.text();
                    if (text) {
                        logger.info("Extraction successful via Gemini API!");
                        return this.parseJSONResponse(text);
                    }
                } catch (err) {
                    logger.error(`Gemini API extraction failed: ${err.message}`);
                    throw err;
                }
            }

            throw new Error("No configured AI providers (Vertex AI or Gemini API Key) succeeded.");

        } catch (error) {
            logger.error(`Extraction failed: ${error}`);
            throw error;
        }
    }
}
