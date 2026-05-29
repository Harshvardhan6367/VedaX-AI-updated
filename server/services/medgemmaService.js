import { Ollama } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MEDGEMMA_MODEL  = 'medgemma:4b';

const model = new Ollama({
    baseUrl: OLLAMA_BASE_URL,
    model:   MEDGEMMA_MODEL,
});

const systemPrompt = `You are MedGemma, a certified virtual physician powered by Google's MedGemma 4B model running locally.
Respond **only** with medical information that is factual, concise, and evidence-based.
If unsure, say you don't know.
When analyzing medical images, provide detailed observations and potential diagnoses while always emphasizing the need for professional consultation.`;

const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', '{question}'],
]);

const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

/**
 * Generate a response from the local MedGemma 4B model via Ollama.
 * @param {string}  message     - User text message.
 * @param {string}  [image]     - Base64 image data (no data: prefix).
 */
export async function generateResponse(message, image) {
    if (image) {
        const userPrompt = message?.trim()
            ? `User's question: ${message}`
            : 'No specific question provided. Perform a general clinical analysis of this image.';

        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                model:  MEDGEMMA_MODEL,
                prompt: `${systemPrompt}\n\nAnalyze this medical image in detail. ${userPrompt}`,
                images: [image],
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    }

    // Text-only query
    return await chain.invoke({ question: message });
}
