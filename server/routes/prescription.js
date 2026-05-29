import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { Config } from '../services/prescription/config.js';
import { setup_logger, ensure_directory } from '../services/prescription/utils.js';
import { PrescriptionExtractor } from '../services/prescription/extractor.js';
import { VectorStoreManager } from '../services/prescription/vector_store.js';
import { RAGGraph } from '../services/prescription/graph.js';
import { MemoryManager } from '../services/prescription/memory.js';
import { OTCManager } from '../services/prescription/otc_manager.js';

const logger = setup_logger('PrescriptionRoute');
Config.validate();

const router = express.Router();

ensure_directory(Config.INPUT_DIR);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, Config.INPUT_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}_${file.originalname}`)
});
const upload = multer({ storage });

const extractor = new PrescriptionExtractor();
const vectorStore = new VectorStoreManager();
const ragGraph = new RAGGraph().buildGraph();
const memoryManager = new MemoryManager();
const otcManager = new OTCManager();

router.get('/history', (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Missing username" });
    const prescriptions = memoryManager.getUserPrescriptions(username);
    res.json({ prescriptions });
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { username } = req.body;
        if (!req.file || !username) return res.status(400).json({ error: "Missing file or username" });

        const originalName = req.file.originalname;
        const filePath = req.file.path;
        
        const existingPId = memoryManager.getPrescriptionByFilename(username, originalName);
        if (existingPId) {
            fs.unlinkSync(filePath);
            return res.json({ success: true, message: "File already uploaded", prescriptionId: existingPId });
        }

        const prescriptionId = uuidv4();
        let data;
        try {
            data = await extractor.extractData(filePath);
        } catch (err) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(500).json({ error: "Extraction failed: " + err.message });
        }
        
        if (!data) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(500).json({ error: "Failed to extract data (returned empty)." });
        }

        const medDetails = data.medicines ? data.medicines.map(med => {
            const timing = med.timing || {};
            const timingStr = `Morning: ${timing.morning}, Afternoon: ${timing.afternoon}, Night: ${timing.night}, Instruction: ${timing.instruction}`;
            return `- ${med.name} (Qty: ${med.quantity}): ${timingStr}, Freq: ${med.frequency}, Duration: ${med.duration}`;
        }) : [];
        
        const medsStr = medDetails.join("\n");
        const textContent = `Date: ${data.date || '-'}\n\nMedicines:\n${medsStr}\n\nNotes: ${data.notes || '-'}`;
        
        await vectorStore.addPrescription(prescriptionId, [textContent], { filename: originalName });

        const medNames = data.medicines ? data.medicines.map(m => m.name) : [];
        let title = medNames.length > 0 ? `Prescription: ${medNames.slice(0, 2).join(', ')}${medNames.length > 2 ? '...' : ''}` : `Prescription ${originalName}`;

        const sessionId = memoryManager.getOrCreateSession(username, prescriptionId, title, originalName, medsStr);

        res.json({ success: true, prescriptionId, sessionId, title });
    } catch (err) {
        logger.error(`Upload error: ${err}`);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/session', (req, res) => {
    const { username, prescriptionId } = req.body;
    if (!username || !prescriptionId) return res.status(400).json({ error: "Missing params" });
    const sessionId = memoryManager.getOrCreateSession(username, prescriptionId);
    const details = memoryManager.getSessionDetails(sessionId);
    const history = memoryManager.getHistory(sessionId);
    res.json({ sessionId, details, history });
});

router.post('/chat', async (req, res) => {
    try {
        const { question, prescriptionId, sessionId } = req.body;
        if (!question || !sessionId) return res.status(400).json({ error: "Missing params" });

        const inputs = {
            question,
            prescription_id: prescriptionId,
            session_id: sessionId,
            context: [],
            answer: ""
        };

        const result = await ragGraph.invoke(inputs);
        res.json({ answer: result.answer });
    } catch (err) {
        logger.error(`Chat error: ${err}`);
        res.status(500).json({ error: "Failed to generate answer" });
    }
});

router.post('/otc-check', async (req, res) => {
    try {
        const { sessionId, activePrescriptionId, details } = req.body;
        
        let otcResult = memoryManager.getOtcResult(sessionId);
        if (otcResult) {
            return res.json(otcResult);
        }
        
        const medLines = details.split('\n').filter(l => l.trim() !== '');
        const result = await otcManager.checkMedicinesWithLlm(medLines);
        if (!result.error) {
           memoryManager.saveOtcResult(sessionId, result);
        }
        res.json(result);
    } catch (err) {
         res.status(500).json({ error: err.message });
    }
});

router.get('/otc-list', async (req, res) => {
    try {
        const query = req.query.q;
        if (query) {
            const results = await otcManager.searchOtcDb(query);
            res.json({ results });
        } else {
            const list = otcManager.getOtcList().map(item => ({
                "Medicine Name": item.medicine_name,
                "Type": item.metadata.type || 'General'
            }));
            res.json({ results: list });
        }
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
