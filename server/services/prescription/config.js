import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export class Config {
    // ── Google / Gemini (used by @langchain/google-genai embeddings & RAG LLM) ──
    static GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
    static GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

    // ── Vertex AI / GCP (used by smart AI route for online requests) ────────────
    static GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.VITE_GOOGLE_CLOUD_PROJECT || '';
    static GCP_LOCATION   = process.env.GCP_LOCATION   || process.env.VITE_GOOGLE_CLOUD_LOCATION || 'us-central1';
    static GEMINI_MODEL   = process.env.GEMINI_MODEL   || process.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro';

    // ── Ollama (local MedGemma fallback) ────────────────────────────────────────
    static OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

    // ── File paths ───────────────────────────────────────────────────────────────
    static BASE_DIR      = process.cwd();
    static DATA_DIR      = path.join(this.BASE_DIR, 'data');
    static INPUT_DIR     = path.join(this.DATA_DIR, 'input');
    static PROCESSED_DIR = path.join(this.DATA_DIR, 'processed');

    static validate() {
        if (!Config.GOOGLE_API_KEY) {
            console.warn(
                '⚠️  GOOGLE_API_KEY is missing — prescription RAG/embeddings may fail. ' +
                'Check .env in project root.'
            );
        }
        if (!Config.GCP_PROJECT_ID) {
            console.warn(
                '⚠️  GCP_PROJECT_ID is missing — Vertex AI will not be used. ' +
                'AI requests will fall back to local MedGemma (Ollama).'
            );
        } else {
            console.log(`✅  Vertex AI configured: project=${Config.GCP_PROJECT_ID}, location=${Config.GCP_LOCATION}, model=${Config.GEMINI_MODEL}`);
        }
    }
}

