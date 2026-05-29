import express from 'express';
import { generateResponse } from '../services/medgemmaService.js';

const router = express.Router();

// Validates base64 matches basic image signatures
const isValidBase64Image = (base64) => {
    if (!base64) return false;
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Regex.test(base64);
};

router.post('/chat', async (req, res) => {
    try {
        const { message, image } = req.body;

        if (!message?.trim() && !image) {
            return res.status(400).json({ error: "Message or image is required" });
        }

        if (message?.length > 1000) {
            return res.status(400).json({ error: "Message exceeds maximum length of 1000 characters." });
        }

        if (image && !isValidBase64Image(image)) {
            return res.status(400).json({ error: "Invalid image format." });
        }

        const response = await generateResponse(message, image);
        res.json({ response });
    } catch (error) {
        console.error('MedGemma Error:', error);

        // Ollama not running or model not found
        if (
            error.cause?.code === 'ECONNREFUSED' ||
            error.message?.includes('fetch failed') ||
            error.message?.includes('ECONNREFUSED')
        ) {
            return res.status(503).json({
                error: "Unable to connect to the local MedGemma engine. Please ensure Ollama is running with: ollama serve"
            });
        }

        res.status(500).json({ error: "Failed to process MedGemma request" });
    }
});

export default router;
