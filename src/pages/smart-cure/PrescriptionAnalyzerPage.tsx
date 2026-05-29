import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '@/types';
import ReactMarkdown from 'react-markdown';
import { Volume2, VolumeX, Loader2, Mic, MicOff } from 'lucide-react';
import { generateTTS } from '@/api/geminiService';
import { decodeBase64Audio, decodeAudioData } from '@/utils/audioUtils';
import { getActiveLanguage } from '@/utils/languageUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PrescriptionAnalyzerPageProps {
    user: UserProfile;
    onBack?: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const PrescriptionAnalyzerPage: React.FC<PrescriptionAnalyzerPageProps> = ({ user, onBack }) => {
    const [view, setView] = useState<'home' | 'otc'>('home');
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    
    // Chat state
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string>('');
    const [details, setDetails] = useState<string>('');
    const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
    const [inputText, setInputText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStage, setUploadStage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // OTC State
    const [otcChecked, setOtcChecked] = useState(false);
    const [otcResult, setOtcResult] = useState<any>(null);
    const [isCheckingOtc, setIsCheckingOtc] = useState(false);
    const [otcList, setOtcList] = useState<any[]>([]);
    const [otcSearch, setOtcSearch] = useState('');
    
    // Audio & Voice state
    const { language } = useLanguage();
    const [playingId, setPlayingId] = useState<string | number | null>(null);
    const [audioLoadingId, setAudioLoadingId] = useState<string | number | null>(null);
    const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
    
    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch (e) {}
            sourceNodeRef.current = null;
        }
        setPlayingId(null);
        setAudioLoadingId(null);
    };

    // Initialize Voice Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = false;
            recog.interimResults = false;
            
            recog.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsListening(false);
            };

            recog.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recog.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recog;
        }
    }, []);

    const toggleListening = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!recognitionRef.current) {
            alert("Voice recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            try { recognitionRef.current.stop(); } catch(e){}
            setIsListening(false);
        } else {
            try {
                // Ensure the recognition engine uses the current active language context!
                recognitionRef.current.lang = getActiveLanguage(language);
                recognitionRef.current.start(); 
                setIsListening(true);
            } catch(e){}
        }
    };

    useEffect(() => {
        return () => stopAudio();
    }, []);

    const toggleAudio = async (text: string, id: string | number) => {
        if (playingId === id) {
            stopAudio();
            return;
        }

        stopAudio();
        if (!text) return;
        setAudioLoadingId(id);

        try {
            const activeLanguage = getActiveLanguage(language);
            const audioBase64 = await generateTTS(text, activeLanguage);
            if (!audioBase64) {
                setAudioLoadingId(null);
                return;
            }

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const audioBuffer = await decodeAudioData(decodeBase64Audio(audioBase64), ctx, 24000, 1);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.onended = () => setPlayingId(current => current === id ? null : current);

            sourceNodeRef.current = source;
            source.start();

            setAudioLoadingId(null);
            setPlayingId(id);
        } catch (error) {
            console.error("Audio playback error:", error);
            setAudioLoadingId(null);
            setPlayingId(null);
        }
    };

    const loadHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/prescription/history?username=${user.name || 'guest'}`);
            const data = await res.json();
            if (data.prescriptions) {
                setPrescriptions(data.prescriptions);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    const loadSession = async (prescriptionId: string, title: string) => {
        stopAudio();
        try {
            setCurrentPrescriptionId(prescriptionId);
            setCurrentTitle(title);
            const res = await fetch(`${API_BASE}/prescription/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.name || 'guest', prescriptionId })
            });
            const data = await res.json();
            if (data.sessionId) {
                setCurrentSessionId(data.sessionId);
                setDetails(data.details);
                setMessages(data.history || []);
                setOtcChecked(false);
                setOtcResult(null);
                setView('home');
            }
        } catch (e) {
            console.error("Failed to load session", e);
        }
    };

    const handleFileUpload = async (file: File) => {
        
        setIsUploading(true);
        setUploadProgress(0);
        setUploadStage('Uploading file...');
        
        let progress = 0;
        const stages = ['Uploading file...', 'Analyzing Document...', 'Extracting Medicines...', 'Updating Database...'];
        let stageIdx = 0;
        
        const progressInterval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 5; // Random increment between 5 and 20
            if (progress > 90) progress = 90;
            setUploadProgress(progress);
            
            if (progress > 25 && stageIdx < 1) { stageIdx = 1; setUploadStage(stages[1]); }
            else if (progress > 50 && stageIdx < 2) { stageIdx = 2; setUploadStage(stages[2]); }
            else if (progress > 75 && stageIdx < 3) { stageIdx = 3; setUploadStage(stages[3]); }
            
        }, 600);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('username', user.name || 'guest');

        try {
            const res = await fetch(`${API_BASE}/prescription/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            clearInterval(progressInterval);
            
            if (data.success && data.prescriptionId) {
                setUploadProgress(100);
                setUploadStage('Complete!');
                setTimeout(async () => {
                    await loadHistory();
                    loadSession(data.prescriptionId, data.title || 'Extracted Prescription');
                    setIsUploading(false);
                    setUploadProgress(0);
                    setUploadStage('');
                }, 800);
            } else {
                alert("Error: " + data.error);
                setIsUploading(false);
                setUploadProgress(0);
                setUploadStage('');
            }
        } catch (error) {
            clearInterval(progressInterval);
            console.error(error);
            alert("Upload failed.");
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStage('');
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !currentSessionId) return;

        const text = inputText;
        setInputText('');
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setIsSending(true);

        try {
            const res = await fetch(`${API_BASE}/prescription/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    prescriptionId: currentPrescriptionId,
                    sessionId: currentSessionId
                })
            });
            const data = await res.json();
            if (data.answer) {
                const aiMsgIndex = messages.length + 1;
                setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
                
                if (isAutoPlayEnabled) {
                    toggleAudio(data.answer, aiMsgIndex);
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Error processing request.' }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleOtcToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setOtcChecked(e.target.checked);
        if (!e.target.checked) {
            setOtcResult(null);
            return;
        }

        if (!details) return;

        setIsCheckingOtc(true);
        try {
            const res = await fetch(`${API_BASE}/prescription/otc-check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    activePrescriptionId: currentPrescriptionId,
                    details: details
                })
            });
            const data = await res.json();
            setOtcResult(data);
        } catch (error) {
            setOtcResult({ error: "Failed to verify medicines." });
        } finally {
            setIsCheckingOtc(false);
        }
    };

    useEffect(() => {
        if (view === 'otc') {
            const delay = setTimeout(() => {
                fetch(`${API_BASE}/prescription/otc-list?q=${encodeURIComponent(otcSearch)}`)
                    .then(r => r.json())
                    .then(data => setOtcList(data.results || []))
                    .catch(e => console.error(e));
            }, 300);
            return () => clearTimeout(delay);
        }
    }, [view, otcSearch]);

    return (
        <div className="rx-rag-app">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600&display=swap');
                
                .rx-rag-app {
                    /* Light theme variables */
                    --bg-color: #ffffff;
                    --secondary-bg-color: #f1f5f9;
                    --text-color: #0f172a;
                    --text-muted: #64748b;
                    --accent-color: #FF4B4B;
                    --accent-hover: #FF9051;
                    --border-color: rgba(0, 0, 0, 0.1);
                    --box-bg: #f8fafc;
                    --hr-color: rgba(0, 0, 0, 0.1);
                    --info-blue-bg: #eff6ff;
                    --info-blue-text: #1d4ed8;
                    --input-bg: #ffffff;
                    --input-text: #0f172a;
                    --success-bg: rgba(0,200,100,0.1);
                    --warning-bg: rgba(255,200,0,0.1);

                    background-color: var(--bg-color);
                    color: var(--text-color);
                    font-family: 'IBM Plex Sans', sans-serif;
                    height: 100%;
                    min-height: 100%;
                    display: flex;
                    width: 100%;
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                .dark .rx-rag-app {
                    /* Dark theme variables */
                    --bg-color: #0E1117;
                    --secondary-bg-color: #262730;
                    --text-color: #FAFAFA;
                    --text-muted: #dddddd;
                    --accent-color: #FF4B4B;
                    --accent-hover: #FF9051;
                    --border-color: rgba(250, 250, 250, 0.2);
                    --box-bg: #1A1C23;
                    --hr-color: rgba(255, 255, 255, 0.1);
                    --info-blue-bg: #1B2936;
                    --info-blue-text: #5B95B8;
                    --input-bg: #262730;
                    --input-text: white;
                    --success-bg: rgba(0,200,100,0.1);
                    --warning-bg: rgba(255,200,0,0.1);
                }

                .rx-rag-app * {
                    box-sizing: border-box;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                .rx-rag-app *::-webkit-scrollbar {
                    display: none;
                }

                @keyframes rx-fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes rx-gradient-flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes rx-float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }

                @keyframes rx-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes rx-pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }

                .rx-animate-header { animation: rx-fadeInUp 0.8s ease-out; }
                .rx-floating-icon { display: inline-block; animation: rx-float 3s ease-in-out infinite; }
                .rx-gradient-text {
                    background: linear-gradient(-45deg, #FF4B4B, #FF9051, #FF4B4B, #FF9051);
                    background-size: 300%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: rx-gradient-flow 2s ease infinite;
                    display: inline-block;
                }

                /* Sidebar */
                .rx-sidebar { 
                    width: 330px; 
                    background-color: var(--secondary-bg-color); 
                    padding: 40px 20px; 
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                    height: 100%;
                }

                .rx-nav-menu { margin-bottom: 20px; }
                .rx-nav-label { font-size: 14px; margin-bottom: 12px; font-weight: 500; }
                .rx-radio-label { display: flex; align-items: center; cursor: pointer; margin-bottom: 12px; font-size: 14px; color: var(--text-muted);}
                .rx-radio-label input[type="radio"] { display: none; }
                .rx-custom-radio {
                    width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border-color);
                    margin-right: 10px; position: relative; background-color: transparent; transition: border-color 0.2s;
                }
                .rx-radio-label input[type="radio"]:checked + .rx-custom-radio { border-color: #FF4B4B; }
                .rx-radio-label input[type="radio"]:checked + .rx-custom-radio::after {
                    content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 6px; height: 6px; border-radius: 50%; background-color: #FF4B4B; transition: background-color 0.2s;
                }

                .rx-sidebar-spacer { height: 35px; }
                .rx-sidebar-title { font-size: 18px; font-weight: 600; margin-bottom: 20px; }

                /* File Uploader */
                .rx-upload-container { margin-bottom: 20px; }
                .rx-upload-label { font-size: 14px; margin-bottom: 8px; color: var(--text-muted);}
                .rx-stFileUploader {
                    background-color: var(--box-bg); border: 1px dashed var(--border-color); border-radius: 8px;
                    padding: 30px 20px; text-align: center; cursor: pointer; transition: all 0.3s ease;
                }
                .rx-stFileUploader:hover { border-color: #FF4B4B; }
                .rx-drag-text { font-weight: 600; margin-bottom: 5px; color: var(--text-color); font-size: 15px;}
                .rx-limit-text { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
                .rx-browse-btn {
                    background-color: var(--secondary-bg-color); border: 1px solid var(--border-color); color: var(--text-color); 
                    padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-family: inherit;
                    transition: all 0.2s;
                }
                .rx-browse-btn:hover { border-color: #FF4B4B; color: #FF4B4B;}
                
                .rx-progress-container {
                    width: 100%; height: 6px; background-color: var(--secondary-bg-color);
                    border-radius: 4px; margin: 15px 0; overflow: hidden;
                }
                .rx-progress-bar {
                    height: 100%; background: linear-gradient(90deg, #FF4B4B, #FF9051);
                    transition: width 0.4s ease;
                }
                .rx-upload-stage {
                    font-size: 13px; color: var(--accent-color); font-weight: 500;
                    margin-top: 5px; animation: rx-pulse 1.5s infinite;
                }
                .rx-spinner {
                    display: inline-block; width: 24px; height: 24px;
                    border: 3px solid rgba(255, 75, 75, 0.3); border-radius: 50%;
                    border-top-color: #FF4B4B; animation: rx-spin 1s ease-in-out infinite;
                    margin-bottom: 15px;
                }
                
                .rx-sidebar-hr { border: 0; height: 1px; background: var(--hr-color); margin: 30px 0; }
                .rx-sidebar-subtitle { font-size: 16px; font-weight: 600; margin-bottom: 15px; }

                /* Chat Buttons */
                .rx-chat-list {
                    flex-grow: 1;
                    overflow-y: auto;
                }
                .rx-chat-list button {
                    display: block; width: 100%; text-align: left; padding: 12px 15px; margin-bottom: 15px;
                    background: linear-gradient(90deg, #FF6B6B 0%, #FF8E53 100%);
                    border: none; color: white; cursor: pointer; border-radius: 8px; font-weight: 500;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 14px;
                }
                .rx-chat-list button:hover { opacity: 0.9; }

                /* Main Content */
                .rx-main-content { 
                    flex: 1; padding: 40px 60px 0; max-width: 1000px; margin: 0 auto; 
                    position: relative; overflow-y: auto; height: 100%;
                    display: flex; flex-direction: column;
                }

                .rx-welcome-main-title { text-align: center; font-size: 2.8rem; margin-bottom: 30px; margin-top: 50px; font-weight: 700;}
                .rx-gradient-text-orange {
                    background: linear-gradient(90deg, #FF4B4B, #FF9051);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .rx-info-box-blue {
                    background: var(--info-blue-bg); color: var(--info-blue-text); padding: 18px 20px; border-radius: 6px; 
                    font-size: 15px; text-align: left;
                }

                .rx-info-box { background: rgba(0, 150, 255, 0.1); padding: 15px; border-left: 4px solid #0096ff; margin: 20px 0; border-radius: 5px;}

                .rx-expander { margin: 20px 0; border: 1px solid var(--border-color); border-radius: 5px; overflow: hidden; }
                .rx-expander summary { padding: 10px; cursor: pointer; background: var(--secondary-bg-color); font-weight: bold; list-style: none; }
                .rx-expander summary::-webkit-details-marker { display:none; }
                .rx-expander summary:hover { color: #FF4B4B; background-color: rgba(255, 75, 75, 0.05); }
                .rx-expander-content { padding: 15px; white-space: pre-wrap; font-size: 14px; border-top: 1px solid var(--border-color); }

                .rx-otc-check-container { margin: 20px 0; font-size: 14px; }
                .rx-otc-check-container label { display: flex; align-items: center; gap: 8px; cursor: pointer; }

                .rx-chat-history { margin: 30px 0 0; padding-bottom: 20px; display: flex; flex-direction: column; gap: 15px; flex-grow: 1; }
                .rx-chat-msg { animation: rx-fadeInUp 0.3s ease-out; padding: 15px; border-radius: 8px; max-width: 80%; font-size: 15px; line-height: 1.5; white-space: pre-wrap; }
                .rx-user-msg { background: var(--secondary-bg-color); align-self: flex-end; border-bottom-right-radius: 0; }
                .rx-ai-msg { background: rgba(255, 75, 75, 0.1); align-self: flex-start; border-bottom-left-radius: 0; border: 1px solid var(--accent-color); }

                .rx-chat-input-form { 
                    display: flex; gap: 10px; 
                    position: sticky; bottom: 0; background-color: var(--bg-color);
                    padding-top: 10px; padding-bottom: 20px;
                    margin-top: auto;
                }
                .rx-chat-input-form input { 
                    flex: 1; padding: 12px 15px; border-radius: 5px;
                    border: 1px solid var(--border-color); background: var(--input-bg); color: var(--input-text);
                    font-size: 15px;
                }
                .rx-chat-input-form input:focus { outline: none; border-color: var(--accent-color); }
                .rx-chat-input-form button { 
                    padding: 0 20px; background: transparent; border: 1px solid var(--border-color); color: var(--input-text); border-radius: 5px; cursor: pointer;
                    font-size: 18px; font-weight: bold;
                }
                .rx-chat-input-form button:hover { border-color: var(--accent-color); color: var(--accent-color); }
                .rx-chat-input-form button:disabled { opacity: 0.5; cursor: not-allowed; border-color: var(--border-color); color: var(--text-muted); }

                .rx-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .rx-table th, .rx-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); font-size: 14px;}
                .rx-table th { background: var(--secondary-bg-color); font-weight: 600; }

                .rx-otc-search { width: 100%; padding: 12px; margin-top: 15px; border-radius: 5px; border: 1px solid var(--border-color); background: var(--secondary-bg-color); color: var(--input-text); font-size: 14px; }
                .rx-otc-search:focus { outline: none; border-color: #0096ff; }

                .rx-otc-success { background: var(--success-bg); border-left: 4px solid #00c864; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .rx-otc-warning { background: var(--warning-bg); border-left: 4px solid #ffaa00; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .rx-otc-item { margin-left: 20px; margin-top: 8px; font-size: 14px; }
                .rx-otc-item b { color: var(--text-color); }
                
                .rx-back-btn {
                    margin-bottom: 20px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-weight: 600;
                    font-size: 14px;
                }
                .rx-back-btn:hover { color: var(--text-color); }
            `}</style>

            <div className="rx-sidebar">
                {onBack && (
                    <button onClick={onBack} className="rx-back-btn">
                        ← Back
                    </button>
                )}
                
                <div className="rx-nav-menu">
                    <div className="rx-nav-label">Menu</div>
                    <label className="rx-radio-label">
                        <input type="radio" name="nav" value="Home" checked={view === 'home'} onChange={() => setView('home')} />
                        <span className="rx-custom-radio"></span> Home
                    </label>
                    <label className="rx-radio-label">
                        <input type="radio" name="nav" value="OTC List" checked={view === 'otc'} onChange={() => setView('otc')} />
                        <span className="rx-custom-radio"></span> OTC List
                    </label>
                </div>

                <div className="rx-sidebar-spacer"></div>

                <h2 className="rx-sidebar-title">Prescription RAG</h2>
                
                <div className="rx-upload-container">
                    <div className="rx-upload-label">Upload Prescription (PDF/Image)</div>
                    <div 
                        className="rx-stFileUploader" 
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (!isUploading && e.dataTransfer.files?.length) {
                                handleFileUpload(e.dataTransfer.files[0]);
                            }
                        }}
                        style={{
                            borderColor: isDragging ? '#FF4B4B' : '',
                            backgroundColor: isDragging ? 'rgba(255, 75, 75, 0.05)' : ''
                        }}
                    >
                        {isUploading ? (
                            <div style={{ padding: '10px 0' }}>
                                <div className="rx-spinner"></div>
                                <div className="rx-drag-text" style={{ fontSize: '14px' }}>Processing Document...</div>
                                <div className="rx-progress-container">
                                    <div className="rx-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                                <div className="rx-upload-stage">{uploadStage}</div>
                            </div>
                        ) : (
                            <>
                                <p className="rx-drag-text">Drag and drop file here</p>
                                <p className="rx-limit-text">Limit 200MB per file • PDF, PNG...</p>
                                <button className="rx-browse-btn" disabled={isUploading}>Browse files</button>
                            </>
                        )}
                        <input 
                            type="file" 
                            style={{ display: 'none' }} 
                            ref={fileInputRef} 
                            accept=".pdf,.png,.jpg,.jpeg" 
                            onChange={(e) => e.target.files?.length && handleFileUpload(e.target.files[0])}
                        />
                    </div>
                </div>

                <hr className="rx-sidebar-hr" />

                <h3 className="rx-sidebar-subtitle">Your Chats</h3>
                <div className="rx-chat-list">
                    {prescriptions.map(p => (
                        <button key={p.id} onClick={() => loadSession(p.id, p.title)}>
                            {p.title}
                        </button>
                    ))}
                    {prescriptions.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '10px 0' }}>No history found</div>
                    )}
                </div>
            </div>

            <div className="rx-main-content">
                {view === 'home' && (
                    <>
                        {!currentSessionId ? (
                            <div className="rx-animate-header">
                                <h1 className="rx-welcome-main-title">
                                    <span className="rx-floating-icon">💊</span> <span className="rx-gradient-text-orange">Welcome to Prescription RAG</span>
                                </h1>
                                <div className="rx-info-box-blue">
                                    Please upload a prescription or select a chat from the sidebar to begin.
                                </div>
                            </div>
                        ) : (
                            <div className="rx-animate-header" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                    <h2 style={{ margin: 0 }}>{currentTitle}</h2>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAutoPlayEnabled(prev => !prev); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            backgroundColor: isAutoPlayEnabled ? 'rgba(0, 200, 100, 0.1)' : 'rgba(255, 75, 75, 0.1)',
                                            color: isAutoPlayEnabled ? '#00c864' : '#FF4B4B',
                                            border: `1px solid ${isAutoPlayEnabled ? '#00c864' : '#FF4B4B'}`,
                                            padding: '6px 14px', borderRadius: '20px', fontSize: '13px',
                                            fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.15s ease-in-out',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={isAutoPlayEnabled ? "Turn off Voice Auto-Play" : "Turn on Voice Auto-Play"}
                                    >   
                                        <span style={{ display: isAutoPlayEnabled ? 'flex' : 'none', alignItems: 'center' }}>
                                            <Volume2 size={15} color="#00c864" />
                                        </span>
                                        <span style={{ display: isAutoPlayEnabled ? 'none' : 'flex', alignItems: 'center' }}>
                                            <VolumeX size={15} color="#FF4B4B" />
                                        </span>
                                        <span>{isAutoPlayEnabled ? "Auto-Play ON" : "Auto-Play OFF"}</span>
                                    </button>
                                </div>
                                
                                <details className="rx-expander" open>
                                    <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>💊 Medicine Details</span>
                                        <button 
                                            onClick={(e) => { e.preventDefault(); toggleAudio(details, 'details'); }}
                                            disabled={audioLoadingId === 'details'}
                                            style={{
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                padding: '4px', borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title={playingId === 'details' ? "Stop playing" : "Listen to extraction"}
                                        >
                                            {audioLoadingId === 'details' ? (
                                                <Loader2 size={16} style={{ animation: 'rx-spin 1s linear infinite' }} color="#64748b" />
                                            ) : playingId === 'details' ? (
                                                <VolumeX size={16} color="#FF4B4B" style={{ animation: 'rx-pulse 1.5s infinite' }} />
                                            ) : (
                                                <Volume2 size={16} color="#64748b" />
                                            )}
                                        </button>
                                    </summary>
                                    <div className="rx-expander-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {details ? details.split('\n').map((line, i) => (
                                            line.trim() ? <div key={i}>{line}</div> : null
                                        )) : null}
                                    </div>
                                </details>

                                <div className="rx-otc-check-container">
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={otcChecked}
                                            onChange={handleOtcToggle}
                                        /> Check for OTC Medicines
                                    </label>
                                    
                                    {isCheckingOtc && <div style={{ marginTop: '10px', color: 'var(--text-muted)' }}>Checking database...</div>}
                                    
                                    {otcResult && !otcResult.error && (
                                        <div style={{ marginTop: '15px' }}>
                                            {otcResult.otc_medicines?.length > 0 && (
                                                <div className="rx-otc-success">
                                                    <strong>Safe to Buy (OTC):</strong>
                                                    {otcResult.otc_medicines.map((m: any, i: number) => (
                                                        <div key={i} className="rx-otc-item">
                                                            • <b>{m.name}</b>: {m.reason}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {otcResult.consult_medicines?.length > 0 && (
                                                <div className="rx-otc-warning">
                                                    <strong>Consult Doctor:</strong>
                                                    {otcResult.consult_medicines.map((m: any, i: number) => (
                                                        <div key={i} className="rx-otc-item">
                                                            • <b>{m.name}</b>: {m.reason}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {otcResult?.error && (
                                        <div className="rx-otc-warning" style={{ backgroundColor: 'rgba(255,0,0,0.1)', borderLeftColor: 'red' }}>
                                            {otcResult.error}
                                        </div>
                                    )}
                                </div>

                                <div className="rx-chat-history">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`rx-chat-msg ${msg.role === 'user' ? 'rx-user-msg' : 'rx-ai-msg group'}`} style={msg.role === 'ai' ? { position: 'relative' } : {}}>
                                            {msg.role === 'ai' ? (
                                                <>
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    <button 
                                                        onClick={() => toggleAudio(msg.content, idx)}
                                                        disabled={audioLoadingId === idx}
                                                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
                                                        style={{
                                                            position: 'absolute', bottom: '-14px', right: '-12px',
                                                            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '50%', padding: '8px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
                                                            zIndex: 10,
                                                            transform: 'translateY(2px)' // subtle aesthetic shift
                                                        }}
                                                        title={playingId === idx ? "Stop playing" : "Listen to response"}
                                                    >
                                                        {audioLoadingId === idx ? (
                                                            <Loader2 size={15} style={{ animation: 'rx-spin 1s linear infinite' }} color="#64748b" />
                                                        ) : playingId === idx ? (
                                                            <VolumeX size={15} color="#FF4B4B" style={{ animation: 'rx-pulse 1.5s infinite' }} />
                                                        ) : (
                                                            <Volume2 size={15} color="#3b82f6" />
                                                        )}
                                                    </button>
                                                </>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    ))}
                                    {isSending && (
                                        <div className="rx-chat-msg rx-ai-msg" style={{ opacity: 0.7 }}>
                                            Thinking...
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form className="rx-chat-input-form" onSubmit={handleSendMessage}>
                                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            value={inputText}
                                            onChange={e => setInputText(e.target.value)}
                                            placeholder={isListening ? "Listening..." : "Ask about prescriptions..."} 
                                            disabled={isSending}
                                            style={{ 
                                                width: '100%', 
                                                paddingRight: '64px',
                                                borderColor: isListening ? '#FF4B4B' : 'var(--border-color)',
                                                borderWidth: isListening ? '2px' : '1px'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleListening}
                                            disabled={isSending}
                                            style={{
                                                position: 'absolute', right: '12px',
                                                background: 'transparent', border: 'none', cursor: isSending ? 'not-allowed' : 'pointer',
                                                padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: isListening ? '#FF4B4B' : 'var(--text-muted)'
                                            }}
                                            title={isListening ? "Stop Listening" : "Start Voice Input"}
                                        >
                                            {isListening ? (
                                                <MicOff size={22} style={{ animation: 'rx-pulse 1.5s infinite' }} />
                                            ) : (
                                                <Mic size={22} className="hover:text-[#FF4B4B] transition-colors" />
                                            )}
                                        </button>
                                    </div>
                                    <button type="submit" disabled={!inputText.trim() || isSending}>→</button>
                                </form>
                            </div>
                        )}
                    </>
                )}

                {view === 'otc' && (
                    <div className="rx-animate-header">
                        <h1><span className="rx-gradient-text">Allowed OTC Medicines</span></h1>
                        <div className="rx-info-box">
                            These medicines are generally considered safe for over-the-counter purchase. However, always consult a doctor if you are unsure.
                        </div>
                        
                        <input 
                            type="text" 
                            className="rx-otc-search"
                            value={otcSearch}
                            onChange={e => setOtcSearch(e.target.value)}
                            placeholder="🔍 Search OTC Medicines..." 
                        />
                        
                        <table className="rx-table">
                            <thead>
                                <tr>
                                    <th>Medicine Name</th>
                                    <th>Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otcList.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item['Medicine Name']}</td>
                                        <td>{item.Type}</td>
                                    </tr>
                                ))}
                                {otcList.length === 0 && (
                                    <tr>
                                        <td colSpan={2} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                            No medicines found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrescriptionAnalyzerPage;
