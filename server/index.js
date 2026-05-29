import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Connect to database
connectDB();

import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'API is running...' });
});

// Import API routes
import apiRoutes         from './routes/api.js';
import medgemmaRoutes    from './routes/medgemma.js';
import prescriptionRoutes from './routes/prescription.js';
import aiRoutes          from './routes/ai.js';          // Smart: Vertex AI (online) → MedGemma (offline)

app.use('/api', apiRoutes);
app.use('/api/medgemma', medgemmaRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/ai', aiRoutes);          // unified AI endpoint with auto-fallback

// Socket.io logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    });

    socket.on('send_message', (data) => {
        // data: { conversationId, senderId, text, role }
        io.to(data.conversationId).emit('receive_message', data);
    });

    // WebRTC Signaling
    socket.on('join_video_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined video room: ${roomId}`);
    });

    socket.on('video_offer', (data) => {
        // data: { roomId, offer }
        socket.to(data.roomId).emit('video_offer', { offer: data.offer, from: socket.id });
    });

    socket.on('video_answer', (data) => {
        // data: { roomId, answer }
        socket.to(data.roomId).emit('video_answer', { answer: data.answer, from: socket.id });
    });

    socket.on('ice_candidate', (data) => {
        // data: { roomId, candidate }
        socket.to(data.roomId).emit('ice_candidate', { candidate: data.candidate, from: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Serve static assets in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// For any other routes, serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
