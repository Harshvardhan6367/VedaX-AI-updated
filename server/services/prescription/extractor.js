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

            const response = await this.model.generateContent(contents);
            let text = response.response.text();
            
            if (text.includes("```json")) {
                text = text.split("```json")[1].split("```")[0];
            } else if (text.includes("```")) {
                text = text.split("```")[1].split("```")[0];
            }
            
            return JSON.parse(text.trim());

        } catch (error) {
            logger.error(`Extraction failed: ${error}`);
            throw error;
        }
    }
}
