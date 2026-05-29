import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Config } from './config.js';
import { setup_logger } from './utils.js';
import { OTC_LIST_DATA } from './otc_data.js';
import { VectorStoreManager } from './vector_store.js';

const logger = setup_logger('OTCManager');

export class OTCManager {
    constructor() {
        this.OTC_LIST = OTC_LIST_DATA;
        if (Config.GOOGLE_API_KEY) {
            this.llm = new ChatGoogleGenerativeAI({
                modelName: Config.GEMINI_MODEL_NAME,
                apiKey: Config.GOOGLE_API_KEY
            });
        }
        
        this.vector_store = new VectorStoreManager();
        this.otc_namespace = "otc_medicines";
        
        this.initialized = this._initializeOtcDb();
    }

    async _initializeOtcDb() {
        try {
            logger.info("Initializing OTC Vector DB...");
            
            const texts = this.OTC_LIST.map(item => item.medicine_name);
            const metadatas = this.OTC_LIST.map(item => {
                const meta = { ...item.metadata };
                meta.source = 'general_otc_list';
                return meta;
            });
            
            await this.vector_store.addTexts(texts, metadatas, this.otc_namespace);
            logger.info("OTC List Ingested into local vector store.");
        } catch (error) {
            logger.error(`Failed to initialize OTC DB: ${error}`);
        }
    }

    async searchOtcDb(query, top_k = 10) {
        await this.initialized;
        const matches = await this.vector_store.search(query, null, this.otc_namespace, top_k);
        const results = [];
        for (const m of matches) {
            results.push({
                "Medicine Name": m.metadata.text,
                "Type": m.metadata.type || 'Unknown',
                "Score": parseFloat((m.score).toFixed(2))
            });
        }
        return results;
    }

    getOtcList() {
        return this.OTC_LIST;
    }

    async checkMedicinesWithLlm(medicineList) {
        await this.initialized;
        logger.info("Checking medicines against OTC list using Vector Search + LLM");
        
        const results = { otc_medicines: [], consult_medicines: [] };
        
        for (const med of medicineList) {
            const medStr = String(med);
            
            const matches = await this.vector_store.search(medStr, null, this.otc_namespace, 3);
            const candidates = matches.filter(m => m.score > 0.7).map(m => m.metadata.text);
            
            if (candidates.length === 0) {
                 results.consult_medicines.push({
                     name: medStr.split('(')[0].trim(),
                     reason: "No matching approved OTC medicine found in database."
                 });
                 continue;
            }
            
            const candidatesStr = candidates.join("\n");
            
            const prompt = `
            You are a medical assistant. Verify if the extracted medicine is strictly equivalent to any of the allowed OTC candidates found.

            Extracted Medicine: "${medStr}"

            Allowed OTC Candidates (from database):
            ${candidatesStr}

            Instructions:
            1. Determine if the 'Extracted Medicine' matches any 'Allowed OTC Candidate' (Brand or Generic).
            2. Match must be safe and exact (e.g., "Crocin" matches "Paracetamol").
            3. Return JSON.

            Output Format:
            {
                "is_otc": true/false,
                "matched_candidate": "Name of matched OTC item" or null,
                "reason": "Brief explanation"
            }
            `;
            
            try {
                if (!this.llm) throw new Error("LLM not initialized");
                const response = await this.llm.invoke(prompt);
                let content = response.content.replace("```json", "").replace("```", "").trim();
                const verification = JSON.parse(content);
                
                const nameClean = medStr.split(':')[0].replace(/^-\s*/, '').trim();
                
                if (verification.is_otc) {
                    results.otc_medicines.push({
                        name: nameClean,
                        reason: `Matched with ${verification.matched_candidate}`
                    });
                } else {
                    results.consult_medicines.push({
                        name: nameClean,
                        reason: verification.reason || "Not a valid match with allowed list"
                    });
                }
                    
            } catch (error) {
                logger.error(`Error checking medicine ${medStr}: ${error}`);
                results.consult_medicines.push({ name: medStr, reason: "Error verifying safety" });
            }
        }

        return results;
    }
}
