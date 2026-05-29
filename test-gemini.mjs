import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';
config();

async function run() {
    const g = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
    console.log("Key ends with:", process.env.VITE_GEMINI_API_KEY?.substring(30));
    try {
        const res = await g.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Say hi' }] }]
        });
        console.log('SUCCESS:', res.text);
    } catch (err) {
        console.error('API ERROR:', err);
    }
}
run();
