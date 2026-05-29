import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Config } from './config.js';
import { setup_logger } from './utils.js';

const logger = setup_logger('VectorStoreManager');

export class VectorStoreManager {
    constructor() {
        this.storageDir = path.join(Config.DATA_DIR, "vectors");
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
        
        if (Config.GOOGLE_API_KEY) {
            this.embeddings = new GoogleGenerativeAIEmbeddings({
                modelName: "gemini-embedding-001",
                apiKey: Config.GOOGLE_API_KEY
            });
        } else {
            logger.warn("Google API Key missing for embeddings.");
            this.embeddings = null;
        }
        
        logger.info("VectorStoreManager initialized with local storage");
    }

    _getStoragePath(namespace = null) {
        const filename = namespace ? `${namespace}.json` : "default.json";
        return path.join(this.storageDir, filename);
    }

    _loadVectors(namespace = null) {
        const filePath = this._getStoragePath(namespace);
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                return { vectors: [] };
            }
        }
        return { vectors: [] };
    }

    _saveVectors(data, namespace = null) {
        const filePath = this._getStoragePath(namespace);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    _cosineSimilarity(vec1, vec2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);
        
        if (norm1 === 0 || norm2 === 0) return 0.0;
        return dotProduct / (norm1 * norm2);
    }

    async addTexts(texts, metadataList, namespace = null) {
        if (!this.embeddings) {
            logger.error("No embeddings available");
            return false;
        }

        const data = this._loadVectors(namespace);
        const existingIds = new Set(data.vectors.map(v => v.id));
        
        const newVectors = [];
        for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            const textHash = crypto.createHash('md5').update(text, 'utf8').digest('hex');
            const vectorId = namespace ? `${namespace}_${textHash}` : textHash;
            
            if (existingIds.has(vectorId)) continue;
            
            const embedding = await this.embeddings.embedQuery(text);
            
            const meta = i < metadataList.length ? { ...metadataList[i] } : {};
            meta.text = text;
            
            newVectors.push({
                id: vectorId,
                embedding: embedding,
                metadata: meta
            });
        }
        
        data.vectors.push(...newVectors);
        this._saveVectors(data, namespace);
        
        logger.info(`Stored ${newVectors.length} texts in namespace '${namespace}'`);
        return true;
    }

    async addPrescription(prescriptionId, textChunks, metadata) {
        if (!this.embeddings) return false;

        const data = this._loadVectors();
        const existingIds = new Set(data.vectors.map(v => v.id));
        
        const newVectors = [];
        for (let i = 0; i < textChunks.length; i++) {
            const chunk = textChunks[i];
            const vectorId = `${prescriptionId}_${i}`;
            
            if (existingIds.has(vectorId)) continue;
            
            const embedding = await this.embeddings.embedQuery(chunk);
            
            const chunkMetadata = { ...metadata };
            Object.assign(chunkMetadata, {
                text: chunk,
                chunk_id: i,
                prescription_id: prescriptionId
            });
            
            newVectors.push({
                id: vectorId,
                embedding: embedding,
                metadata: chunkMetadata
            });
        }

        data.vectors.push(...newVectors);
        this._saveVectors(data);
        
        logger.info(`Stored ${newVectors.length} chunks for prescription ${prescriptionId}`);
        return true;
    }

    async search(query, prescriptionId = null, namespace = null, topK = 5) {
        if (!this.embeddings) return [];

        const queryEmbedding = await this.embeddings.embedQuery(query);
        const data = this._loadVectors(namespace);
        
        let vectors = data.vectors;
        if (prescriptionId) {
            vectors = vectors.filter(v => 
                v.metadata && v.metadata.prescription_id === prescriptionId
            );
        }
        
        const results = [];
        for (const vector of vectors) {
            const similarity = this._cosineSimilarity(queryEmbedding, vector.embedding);
            results.push({
                id: vector.id,
                score: similarity,
                metadata: vector.metadata
            });
        }
        
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
    }
}
