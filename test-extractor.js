import dotenv from 'dotenv';
dotenv.config();

process.env.GOOGLE_API_KEY = process.env.VITE_GEMINI_API_KEY;

import { PrescriptionExtractor } from './server/services/prescription/extractor.js';

async function test() {
    console.log("Starting test with key:", process.env.GOOGLE_API_KEY ? "Loaded" : "Missing");
    const extractor = new PrescriptionExtractor();
    const result = await extractor.extractData('./IMG_20260320_111211.jpg.jpeg');
    console.log('Result:', result);
}
test().catch(console.error);
