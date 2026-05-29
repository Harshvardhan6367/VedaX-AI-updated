import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Config } from './config.js';
import { setup_logger, ensure_directory } from './utils.js';

const logger = setup_logger('MemoryManager');

export class MemoryManager {
    constructor() {
        this.sessionsFile = path.join(Config.DATA_DIR, "sessions.json");
        this.messagesFile = path.join(Config.DATA_DIR, "messages.json");
        this._ensureDataFiles();
        logger.info("MemoryManager initialized with local storage");
    }

    _ensureDataFiles() {
        ensure_directory(Config.DATA_DIR);
        if (!fs.existsSync(this.sessionsFile)) {
            fs.writeFileSync(this.sessionsFile, JSON.stringify({ sessions: [] }, null, 2));
        }
        if (!fs.existsSync(this.messagesFile)) {
            fs.writeFileSync(this.messagesFile, JSON.stringify({ messages: [] }, null, 2));
        }
    }

    _loadSessions() {
        try {
            const data = fs.readFileSync(this.sessionsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { sessions: [] };
        }
    }

    _saveSessions(data) {
        fs.writeFileSync(this.sessionsFile, JSON.stringify(data, null, 2), 'utf8');
    }

    _loadMessages() {
        try {
            const data = fs.readFileSync(this.messagesFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { messages: [] };
        }
    }

    _saveMessages(data) {
        fs.writeFileSync(this.messagesFile, JSON.stringify(data, null, 2), 'utf8');
    }

    getOrCreateSession(userId, prescriptionId, title = null, filename = null, details = null) {
        const data = this._loadSessions();
        
        const existingSession = data.sessions.find(
            s => s.user_id === userId && s.prescription_id === prescriptionId
        );
        
        if (existingSession) {
            let updated = false;
            if (title && !existingSession.title) {
                existingSession.title = title;
                updated = true;
            }
            if (filename && !existingSession.filename) {
                existingSession.filename = filename;
                updated = true;
            }
            if (details && !existingSession.details) {
                existingSession.details = details;
                updated = true;
            }
            
            if (updated) {
                this._saveSessions(data);
            }
            return existingSession.session_id;
        }
            
        const sessionId = uuidv4();
        const newSession = {
            session_id: sessionId,
            user_id: userId,
            prescription_id: prescriptionId,
            summary: "",
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString()
        };
        
        if (title) newSession.title = title;
        if (filename) newSession.filename = filename;
        if (details) newSession.details = details;
            
        data.sessions.push(newSession);
        this._saveSessions(data);
        logger.info(`Created new session ${sessionId} for user ${userId} on prescription ${prescriptionId}`);
        return sessionId;
    }

    getSessionDetails(sessionId) {
        const data = this._loadSessions();
        const session = data.sessions.find(s => s.session_id === sessionId);
        return session && session.details ? session.details : "";
    }

    getPrescriptionByFilename(userId, filename) {
        const data = this._loadSessions();
        const session = data.sessions.find(
            s => s.user_id === userId && s.filename === filename
        );
        if (session) {
            return session.prescription_id;
        }
        return null;
    }

    addMessage(sessionId, role, content) {
        const data = this._loadMessages();
        data.messages.push({
            session_id: sessionId,
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });
        this._saveMessages(data);
        this.updateLastActive(sessionId);
    }

    getHistory(sessionId, limit = 10) {
        const data = this._loadMessages();
        const sessionMessages = data.messages.filter(m => m.session_id === sessionId);
        sessionMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return sessionMessages.slice(-limit);
    }

    getSummary(sessionId) {
        const data = this._loadSessions();
        const session = data.sessions.find(s => s.session_id === sessionId);
        return session && session.summary ? session.summary : "";
    }

    updateSummary(sessionId, newSummary) {
        const data = this._loadSessions();
        for (let session of data.sessions) {
            if (session.session_id === sessionId) {
                session.summary = newSummary;
                session.last_active = new Date().toISOString();
                break;
            }
        }
        this._saveSessions(data);
    }

    updateLastActive(sessionId) {
        const data = this._loadSessions();
        for (let session of data.sessions) {
            if (session.session_id === sessionId) {
                session.last_active = new Date().toISOString();
                break;
            }
        }
        this._saveSessions(data);
    }
    
    getUserPrescriptions(userId) {
        const data = this._loadSessions();
        
        let userSessions = data.sessions.filter(
            s => s.user_id === userId && s.prescription_id !== "GLOBAL"
        );
        
        userSessions.sort((a, b) => {
            const dateA = new Date(a.last_active || 0).getTime();
            const dateB = new Date(b.last_active || 0).getTime();
            return dateB - dateA;
        });
        
        const results = [];
        const seenIds = new Set();
        for (let session of userSessions) {
            const pId = session.prescription_id;
            if (!seenIds.has(pId)) {
                results.push({
                    id: pId,
                    title: session.title || `Prescription ${pId.substring(0, 8)}...`
                });
                seenIds.add(pId);
            }
        }
        return results;
    }

    getAllSessions() {
        const data = this._loadSessions();
        const sessions = data.sessions;
        sessions.sort((a, b) => {
             const dateA = new Date(a.last_active || 0).getTime();
             const dateB = new Date(b.last_active || 0).getTime();
             return dateB - dateA;
        });
        return sessions;
    }

    saveOtcResult(sessionId, otcResult) {
        const data = this._loadSessions();
        for (let session of data.sessions) {
            if (session.session_id === sessionId) {
                session.otc_result = otcResult;
                break;
            }
        }
        this._saveSessions(data);
    }

    getOtcResult(sessionId) {
        const data = this._loadSessions();
        const session = data.sessions.find(s => s.session_id === sessionId);
        return session && session.otc_result ? session.otc_result : null;
    }
}
