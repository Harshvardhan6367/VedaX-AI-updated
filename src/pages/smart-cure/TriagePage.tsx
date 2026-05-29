import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, User as UserIcon, Stethoscope, Mic, StopCircle, Loader2, RefreshCcw, Navigation, ChevronRight, Volume2, VolumeX, Bot } from 'lucide-react';
import { ChatMessage, UserProfile, AppRoute } from '@/types';
import { runTriageTurn, transcribeUserAudio, generateTTS } from '@/api/geminiService';
import { getReverseGeocode } from '@/api/maps';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/contexts/LanguageContext';

import { decodeBase64Audio, decodeAudioData } from '@/utils/audioUtils';

interface TriagePageProps {
    user: UserProfile;
    onComplete: (specialty: string) => void;
    onNavigate: (route: AppRoute) => void;
    onEmergency?: () => void;
}

const TriagePage: React.FC<TriagePageProps> = ({ user, onComplete, onNavigate, onEmergency }) => {
    const { language } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '0',
            role: 'model',
            text: language === 'hi'
                ? `नमस्ते ${user.name.split(' ')[0]}! मैं आपका AI डॉक्टर असिस्टेंट हूँ। बताइए, आज आपको क्या स्वास्थ्य समस्या हो रही है? (जैसे: पेट दर्द, बुखार)`
                : `Namaste ${user.name.split(' ')[0]}! I am your AI Doctor Assistant. Tell me, what health problem are you facing today? (e.g., Stomach pain, Fever)`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [step, setStep] = useState(0);
    const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
    const [userAddress, setUserAddress] = useState<string | undefined>();
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);

    // VAD Refs
    const vadAudioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const checkSilenceRef = useRef<number | null>(null);

    const requestLocation = () => {
        setLocationError(null);
        setLocationLoading(true);

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            setLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ lat: latitude, lng: longitude });
                setLocationError(null);
                setLocationLoading(false);

                try {
                    const addressData = await getReverseGeocode(latitude, longitude);
                    if (addressData) {
                        setUserAddress(addressData.city);
                    }
                } catch (e) {
                    console.error("Geocoding failed", e);
                }
            },
            (err) => {
                console.error("Location Error:", err);
                let errorMsg = "Location access needed for finding nearby doctors.";
                if (err.code === 1) errorMsg = "⚠️ Location denied. Please enable permission.";
                setLocationError(errorMsg);
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        requestLocation();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const playResponseAudio = async (base64Audio: string) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const ctx = audioContextRef.current;
            const audioBuffer = await decodeAudioData(decodeBase64Audio(base64Audio), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => setIsSpeaking(false);
            setIsSpeaking(true);
            source.start();
        } catch (e) {
            console.error("Audio Playback Error", e);
            setIsSpeaking(false);
        }
    };

    const handleMicClick = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    // Clean up VAD
                    if (checkSilenceRef.current) cancelAnimationFrame(checkSilenceRef.current);
                    if (vadAudioContextRef.current && vadAudioContextRef.current.state !== 'closed') {
                        vadAudioContextRef.current.close().catch(console.error);
                    }

                    setIsRecording(false);
                    setLoading(true);
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64String = (reader.result as string).split(',')[1];
                        try {
                            const text = await transcribeUserAudio(base64String, 'audio/webm');
                            setInput(text);
                            handleSend(text);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setLoading(false);
                        }
                    };
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);

                // --- VAD (Silence Detection) Implementation ---
                try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    vadAudioContextRef.current = ctx;
                    const source = ctx.createMediaStreamSource(stream);
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);
                    analyserRef.current = analyser;

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    let silenceStart = Date.now();
                    let hasSpoken = false;

                    const SILENCE_THRESHOLD = 5;   // Minimal volume to consider as speech
                    const SILENCE_DURATION = 2000; // Auto-stop after 2 seconds of silence

                    const checkSilence = () => {
                        if (!analyserRef.current) return;
                        analyserRef.current.getByteFrequencyData(dataArray);

                        let sum = 0;
                        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                        const averageVolume = sum / dataArray.length;

                        // Reset silence timer if user speaks
                        if (averageVolume > SILENCE_THRESHOLD) {
                            hasSpoken = true;
                            silenceStart = Date.now();
                        } else {
                            // If user already spoke and has been silent for the duration
                            if (hasSpoken && (Date.now() - silenceStart > SILENCE_DURATION)) {
                                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                                    mediaRecorderRef.current.stop(); // This triggers onstop above
                                }
                                return;
                            }
                        }

                        checkSilenceRef.current = requestAnimationFrame(checkSilence);
                    };

                    checkSilence();
                } catch (e) {
                    console.error("VAD initialization failed:", e);
                }
                // --- End VAD ---

            } catch (err) {
                console.error("Mic Error:", err);
            }
        }
    };

    const handleSend = async (textToSubmit?: string) => {
        const finalInput = textToSubmit || input;
        if (!finalInput.trim() || loading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: finalInput };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, text: m.text }));
            const result = await runTriageTurn(history, finalInput, step, location, { age: user.age?.toString(), allergies: user.allergies?.join(', ') || 'None' }, userAddress);

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: result.text
            };

            setMessages(prev => [...prev, botMsg]);

            if (result.text.match(/\[RISK_LEVEL:\s*RED\s*\]/i) && onEmergency) {
                setTimeout(() => {
                    onEmergency();
                }, 1500);
            }

            if (result.groundingUrls && result.groundingUrls.length > 0) {
                const linksMsg: ChatMessage = {
                    id: (Date.now() + 2).toString(),
                    role: 'system',
                    text: JSON.stringify(result.groundingUrls)
                };
                setMessages(prev => [...prev, linksMsg]);
            }

            setStep(prev => prev + 1);

            if (isAutoPlayEnabled) {
                generateTTS(result.text).then(audioData => {
                    if (audioData) playResponseAudio(audioData);
                });
            }

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'system', text: 'Error connecting to AI Assistant.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-all duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate(AppRoute.SMART_CURE)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition group">
                        <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white leading-tight">Smart Triage</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">AI Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {locationLoading ? (
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Locating...</span>
                        </div>
                    ) : location ? (
                        <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full text-[10px] font-bold text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800">
                            <MapPin className="w-3 h-3" />
                            <span>GPS Active</span>
                        </div>
                    ) : (
                        <button onClick={requestLocation} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                            <Navigation size={16} />
                        </button>
                    )}
                    
                    {/* Auto-Play Toggle */}
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAutoPlayEnabled(prev => !prev); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all duration-200 shadow-sm"
                        style={{
                            backgroundColor: isAutoPlayEnabled ? 'rgba(0, 200, 100, 0.1)' : 'rgba(255, 75, 75, 0.1)',
                            color: isAutoPlayEnabled ? '#00c864' : '#FF4B4B',
                            borderColor: isAutoPlayEnabled ? '#00c864' : '#FF4B4B',
                            whiteSpace: 'nowrap'
                        }}
                        title={isAutoPlayEnabled ? "Turn off Auto-Play" : "Turn on Auto-Play"}
                    >
                        <span style={{ display: isAutoPlayEnabled ? 'flex' : 'none', alignItems: 'center' }}>
                            <Volume2 size={14} color="#00c864" />
                        </span>
                        <span style={{ display: isAutoPlayEnabled ? 'none' : 'flex', alignItems: 'center' }}>
                            <VolumeX size={14} color="#FF4B4B" />
                        </span>
                        <span className="hidden sm:inline">{isAutoPlayEnabled ? "Auto-Play ON" : "Auto-Play OFF"}</span>
                    </button>

                    {isSpeaking && (
                        <div className="bg-blue-600 p-2 rounded-full text-white animate-bounce-slow">
                            <Volume2 size={16} />
                        </div>
                    )}
                    <div className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-500 uppercase tracking-wider">
                        Step {Math.min(step, 3)}/3
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide pb-48">
                {messages.map((m) => {
                    if (m.role === 'system') {
                        let links = null;
                        try { links = JSON.parse(m.text); } catch { }

                        if (Array.isArray(links)) {
                            return (
                                <div key={m.id} className="flex flex-col gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-xl">
                                            <MapPin size={20} />
                                        </div>
                                        <span className="font-bold text-blue-900 dark:text-blue-200 text-sm uppercase tracking-wide">
                                            Recommended Nearby Clinics
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {links.map((link: any, idx: number) => (
                                            <div key={idx} className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-blue-50 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                                                <div className="p-4 flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-xl text-slate-400 group-hover:text-blue-500 transition-colors">
                                                            <Stethoscope className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-1">{link.title}</h4>
                                                            <p className="text-[11px] text-slate-400 mt-0.5">Medical Professional • Nearby</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <a
                                                    href={link.uri}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 px-4 flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
                                                >
                                                    <span>Get Directions</span>
                                                    <Navigation className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <div key={m.id} className="flex justify-center my-2 animate-in fade-in">
                                <div className="bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-[11px] px-4 py-1.5 rounded-full font-bold uppercase tracking-tight">
                                    {m.text}
                                </div>
                            </div>
                        );
                    }

                    // Extract Risk Level if present in AI message
                    let displayText = m.text;
                    let riskLevel = null;
                    let riskReason = null;
                    
                    const riskMatch = displayText.match(/\[RISK_LEVEL:\s*(RED|YELLOW|GREEN)\s*\]/i);
                    if (riskMatch && m.role === 'model') {
                        riskLevel = riskMatch[1].toUpperCase();
                        displayText = displayText.replace(riskMatch[0], '').trim();
                    }

                    const reasonMatch = displayText.match(/\[RISK_REASON:\s*(.*?)\s*\]/is);
                    if (reasonMatch && m.role === 'model') {
                        riskReason = reasonMatch[1].trim();
                        displayText = displayText.replace(reasonMatch[0], '').trim();
                    }

                    return (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 flex-col gap-4`}>
                            <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${m.role === 'user' ? 'flex-row-reverse self-end' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-white dark:bg-slate-800' : 'bg-blue-600 text-white'}`}>
                                    {m.role === 'user' ? <UserIcon size={16} className="text-slate-400" /> : <Bot size={18} />}
                                </div>
                                <div className={`rounded-2xl p-4 shadow-sm w-full ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                                    }`}>
                                    
                                    {m.role === 'user' ? (
                                        <div className="text-sm leading-relaxed">
                                            <ReactMarkdown
                                                components={{
                                                    strong: ({ node, ...props }) => <span className="font-bold text-inherit" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    a: ({ node, ...props }) => <a className="text-blue-500 underline" target="_blank" {...props} />
                                                }}
                                            >
                                                {displayText}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4 w-full">
                                            {/* Top Text (Verdict) */}
                                            <div className="text-sm leading-relaxed">
                                                <ReactMarkdown
                                                    components={{
                                                        strong: ({ node, ...props }) => <span className="font-bold text-inherit" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        a: ({ node, ...props }) => <a className="text-blue-500 underline" target="_blank" {...props} />
                                                    }}
                                                >
                                                    {displayText.split('Here are 3 clinics')[0]}
                                                </ReactMarkdown>
                                            </div>

                                            {/* Risk Visualization Block Injected Inline */}
                                            {riskLevel && (
                                                <div className={`w-full rounded-2xl border p-4 shadow-sm overflow-hidden transition-all duration-300
                                                    ${riskLevel === 'RED' ? 'bg-red-50/80 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                                                    riskLevel === 'YELLOW' ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                                                    'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}
                                                `}>
                                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                        
                                                        {/* Badge Area */}
                                                        <div className="shrink-0 flex flex-col gap-1 min-w-[120px]">
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Identified Risk</span>
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black tracking-widest uppercase w-fit text-xs shadow-sm
                                                                ${riskLevel === 'RED' ? 'bg-[#d73a36] text-white shadow-red-200' :
                                                                riskLevel === 'YELLOW' ? 'bg-[#ea9b21] text-white shadow-amber-200' :
                                                                'bg-[#48a96d] text-white shadow-emerald-200'}
                                                            `}>
                                                                <div className="w-1.5 h-1.5 rounded-full border border-white/60 bg-white" />
                                                                {riskLevel === 'RED' ? 'HIGH / RED' : riskLevel === 'YELLOW' ? 'MED / YELLOW' : 'LOW / GREEN'}
                                                            </div>
                                                        </div>

                                                        {/* Divider */}
                                                        <div className={`hidden sm:block w-px h-10 
                                                            ${riskLevel === 'RED' ? 'bg-red-200 dark:bg-red-800' :
                                                            riskLevel === 'YELLOW' ? 'bg-amber-200 dark:bg-amber-800' :
                                                            'bg-emerald-200 dark:bg-emerald-800'}
                                                        `} />

                                                        {/* Content Area */}
                                                        <div className="flex flex-col gap-1.5 flex-1 w-full">
                                                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
                                                                <div className="flex-1">
                                                                    <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-0.5
                                                                        ${riskLevel === 'RED' ? 'text-red-800 dark:text-red-400' :
                                                                        riskLevel === 'YELLOW' ? 'text-amber-800 dark:text-amber-400' :
                                                                        'text-emerald-800 dark:text-emerald-400'}
                                                                    `}>
                                                                        AI Assessment
                                                                    </h4>
                                                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                                                                        {riskReason || (
                                                                            riskLevel === 'RED' ? "Possible life-threatening symptoms (e.g., severe pain, trauma)." :
                                                                            riskLevel === 'YELLOW' ? "Urgent but not immediately life-threatening (e.g., high fever, infection)." :
                                                                            "Non-urgent symptoms. Likely routine or mild illness."
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                
                                                                <div className={`flex-1 p-2 rounded-lg border
                                                                    ${riskLevel === 'RED' ? 'bg-white/60 border-red-100 dark:bg-slate-900/50 dark:border-red-900/50' :
                                                                    riskLevel === 'YELLOW' ? 'bg-white/60 border-amber-100 dark:bg-slate-900/50 dark:border-amber-900/50' :
                                                                    'bg-white/60 border-emerald-100 dark:bg-slate-900/50 dark:border-emerald-900/50'}
                                                                `}>
                                                                    <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-0.5
                                                                        ${riskLevel === 'RED' ? 'text-red-700 dark:text-red-500' :
                                                                        riskLevel === 'YELLOW' ? 'text-amber-700 dark:text-amber-500' :
                                                                        'text-emerald-700 dark:text-emerald-500'}
                                                                    `}>
                                                                        Recommended Action
                                                                    </h4>
                                                                    <p className={`text-[11px] font-semibold
                                                                        ${riskLevel === 'RED' ? 'text-[#b92c28] dark:text-[#f87171]' :
                                                                        riskLevel === 'YELLOW' ? 'text-[#c97500] dark:text-[#fbbf24]' :
                                                                        'text-[#208a49] dark:text-[#4ade80]'}
                                                                    `}>
                                                                        {riskLevel === 'RED' && "Go to the nearest ER immediately or call emergency services."}
                                                                        {riskLevel === 'YELLOW' && "Book a same-day appointment with the recommended specialist."}
                                                                        {riskLevel === 'GREEN' && "Rest, monitor symptoms, and book a standard appointment if needed."}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            )}

                                            {/* Bottom Text (Clinics) */}
                                            {displayText.includes('Here are 3 clinics') && (
                                                <div className="text-sm leading-relaxed mt-1">
                                                    <ReactMarkdown
                                                        components={{
                                                            strong: ({ node, ...props }) => <span className="font-bold text-inherit" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            a: ({ node, ...props }) => <a className="text-blue-500 underline" target="_blank" {...props} />
                                                        }}
                                                    >
                                                        {`Here are 3 clinics${displayText.split('Here are 3 clinics')[1]}`}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                <Bot size={18} />
                            </div>
                            <div className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 rounded-tl-none flex items-center gap-2 shadow-sm">
                                {isRecording ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                        <span className="text-xs text-red-500 font-bold uppercase tracking-wider">Listening...</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950 pt-10 z-10">
                <div className="max-w-3xl mx-auto flex gap-3 items-center">
                    <button
                        onClick={handleMicClick}
                        disabled={loading}
                        className={`p-4 rounded-2xl transition-all shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 active:scale-95 border border-slate-100 dark:border-slate-800'}`}
                    >
                        {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isRecording ? "Listening..." : (step >= 3 ? "Ask follow-up questions..." : "Describe symptoms or speak...")}
                            disabled={isRecording || loading}
                            className="w-full pl-5 pr-14 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-none placeholder:text-slate-400 text-sm transition-all"
                        />

                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim() || isRecording}
                            className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-0 disabled:scale-90 transition-all flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>

                    {step >= 3 && (
                        <button onClick={() => window.location.reload()} title="Restart Triage" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg">
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TriagePage;
