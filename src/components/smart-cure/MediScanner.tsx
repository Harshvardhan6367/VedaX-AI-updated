import React, { useState, useRef } from 'react';
import { Camera, Pill, CheckCircle, AlertTriangle, Loader2, FileText, ClipboardList, Activity, ArrowLeft, Check, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { analyzeImage, generateTTS } from '@/api/geminiService';
import { analyzeWithMedGemma } from '@/api/medgemmaService';
import { decodeBase64Audio, decodeAudioData } from '@/utils/audioUtils';
import { getActiveLanguage } from '@/utils/languageUtils';
import { UserProfile } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface MediScannerProps {
    user?: UserProfile;
    defaultMode?: 'ID' | 'REPORT';
    hideTabs?: boolean;
    onBack?: () => void;
    isOnline?: boolean;
}

export const MediScanner: React.FC<MediScannerProps> = ({ user, defaultMode = 'ID', hideTabs = false, onBack, isOnline = true }) => {
    const { language } = useLanguage();
    const [mode, setMode] = useState<'ID' | 'REPORT'>(defaultMode);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    const stopAudio = () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) {}
            sourceRef.current = null;
        }
        setIsSpeaking(false);
    };

    const playSynthesis = async () => {
        if (isSpeaking) {
            stopAudio();
            return;
        }
        if (!result || result.error) return;
        
        setLoadingAudio(true);
        let speechText = "";
        
        if (result.raw_text) {
            speechText = result.raw_text;
        } else if (mode === 'ID') {
            speechText = `This is ${result.name || "an unknown medicine"}. Its purpose is: ${result.purpose || "Not specified"}. Warnings: ${result.warnings || result.dosage_warning || "None mentioned"}. Dosage: ${result.dosage || "Not mentioned"}.`;
        } else {
            speechText = `This is a ${result.report_type || "Health Report"}. Summary: ${result.summary || "No summary provided"}. Overall status is ${result.overall_status}. `;
            if (result.findings && result.findings.length > 0) {
                const keyFindings = result.findings.filter((f: any) => f.status !== 'Normal');
                if (keyFindings.length > 0) {
                    speechText += `Abnormal findings: ${keyFindings.map((f: any) => `${f.parameter} is ${f.status}`).join(", ")}.`;
                } else {
                    speechText += "All findings are normal.";
                }
            }
        }

        try {
            const activeLang = getActiveLanguage(language);
            const audioBase64 = await generateTTS(speechText, activeLang);
            if (audioBase64) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const ctx = audioContextRef.current;
                const audioBuffer = await decodeAudioData(decodeBase64Audio(audioBase64), ctx, 24000, 1);
                
                stopAudio(); 
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.onended = () => setIsSpeaking(false);
                
                sourceRef.current = source;
                setIsSpeaking(true);
                setLoadingAudio(false);
                source.start();
            } else {
                setLoadingAudio(false);
            }
        } catch (e) {
            console.error("Audio playback error:", e);
            setLoadingAudio(false);
            setIsSpeaking(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setResult(null);
        stopAudio();

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const mimeType = file.type;

            try {
                const profile = user ? {
                    age: user.age?.toString(),
                    allergies: (user.allergies || []).join(', '),
                    gender: user.gender || 'Unknown'
                } : undefined;

                if (!isOnline) {
                    // ⚡ Offline mode: use local MedGemma backend
                    const analysisType = mode === 'ID' ? 'MEDICINE' : 'REPORT';
                    const extra = profile
                        ? `Age: ${profile.age || '?'}, Gender: ${profile.gender || '?'}, Allergies: ${profile.allergies || 'None'}`
                        : undefined;
                    const res = await analyzeWithMedGemma(analysisType, base64String, extra);
                    setResult(res);
                } else if (mode === 'ID') {
                    const res = await analyzeImage(base64String, mimeType, 'MEDICINE', profile);
                    setResult(res);
                } else if (mode === 'REPORT') {
                    const res = await analyzeImage(base64String, mimeType, 'REPORT', profile);
                    setResult(res);
                }
            } catch (err) {
                console.error(err);
                setResult({ error: "Failed to analyze. Please ensure the media is clear." });
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
            {onBack && (
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {mode === 'ID' ? 'Medi-Scanner' : 'Lab Reports'}
                    </h2>
                    {!isOnline && (
                        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                            <WifiOff size={11} /> Offline · MedGemma
                        </span>
                    )}
                </div>
            )}

            {!hideTabs && (
                <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-x-auto">
                    <button
                        onClick={() => { setMode('ID'); setResult(null); stopAudio(); }}
                        className={`flex-1 py-2 px-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 ${mode === 'ID' ? 'bg-white dark:bg-slate-700 shadow text-teal-700 dark:text-teal-300' : 'text-slate-500'}`}
                    >
                        <Pill className="w-4 h-4" /> Identify Medicine
                    </button>
                    <button
                        onClick={() => { setMode('REPORT'); setResult(null); stopAudio(); }}
                        className={`flex-1 py-2 px-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 ${mode === 'REPORT' ? 'bg-white dark:bg-slate-700 shadow text-purple-700 dark:text-purple-300' : 'text-slate-500'}`}
                    >
                        <FileText className="w-4 h-4" /> Lab Reports
                    </button>
                </div>
            )}

            {!result && !loading && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-opacity-50 transition-all relative overflow-hidden group 
              ${mode === 'REPORT' ? 'border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20' : 'border-teal-200 dark:border-teal-900/30 bg-teal-50 dark:bg-teal-900/10 hover:bg-teal-100 dark:hover:bg-teal-900/20'}
            `}
                >
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                    <div className={`p-6 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform ${mode === 'ID' ? 'bg-white dark:bg-slate-800' : 'bg-white dark:bg-slate-800'}`}>
                        {mode === 'ID' ? <Camera className="w-10 h-10 text-teal-600" /> : <ClipboardList className="w-10 h-10 text-purple-600" />}
                    </div>

                    <p className="text-slate-800 dark:text-slate-200 font-bold text-lg text-center">
                        {mode === 'ID' ? "Tap to snap medicine photo" : "Upload Lab Report (Photo)"}
                    </p>
                    <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">
                        {mode === 'ID' ? "Identify name, purpose and safety instantly." : "Analyze CBC, Thyroid, and more with AI."}
                    </p>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-teal-600">
                    <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                        <div className={`absolute inset-0 border-4 rounded-full animate-spin border-t-transparent ${mode === 'ID' ? 'border-teal-500' : 'border-purple-500'}`}></div>
                    </div>
                    <p className="animate-pulse font-bold tracking-wide uppercase text-xs">Analyzing with Health-Sense AI...</p>
                </div>
            )}

            {result && !loading && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className={`p-4 text-white font-bold flex items-center justify-between
                            ${result.error ? 'bg-red-500' : mode === 'REPORT' ? 'bg-purple-600' : 'bg-teal-600'}`}>
                            <h3 className="flex items-center gap-2">
                                {result.error ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                {mode === 'ID' ? "Medicine Identified" : "Report Results"}
                            </h3>
                            <div className="flex items-center gap-2">
                                {!result.error && (
                                    <button 
                                        onClick={playSynthesis} 
                                        disabled={loadingAudio}
                                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors relative"
                                        title={isSpeaking ? "Stop Voice Over" : "Listen to Result"}
                                    >
                                        {loadingAudio ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : isSpeaking ? (
                                            <VolumeX className="w-4 h-4 animate-pulse text-red-100" />
                                        ) : (
                                            <Volume2 className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                                {!result.error && (
                                    <span className="text-[10px] uppercase tracking-widest bg-white/20 px-2 py-1 rounded hidden sm:inline-block">
                                        {isOnline ? 'VedaX-AI Verified' : '⚡ MedGemma Offline'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {result.error ? (
                                <div className="text-center py-6">
                                    <p className="text-red-600 font-medium mb-4">{result.error}</p>
                                    <button onClick={() => setResult(null)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold hover:bg-slate-200 transition-colors">Try Again</button>
                                </div>
                            ) : result.raw_text ? (
                                // MedGemma returned plain text (JSON parse failed) – display as-is
                                <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap p-2">
                                    {result.raw_text}
                                </div>
                            ) : mode === 'REPORT' ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b dark:border-slate-800">
                                        <div>
                                            <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white">{result.report_type || "Health Report"}</h3>
                                            <p className="text-sm text-slate-500 mt-1">{result.summary}</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-tight shadow-sm ${result.overall_status?.includes('Normal') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            Status: {result.overall_status}
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-xl border dark:border-slate-800">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                                <tr><th className="p-4">Biomarker</th><th className="p-4">Value</th><th className="p-4">Clinical Insight</th></tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-slate-800">
                                                {result.findings?.map((item: any, idx: number) => (
                                                    <tr key={idx} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${item.status !== 'Normal' ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                                                        <td className="p-4 font-bold text-slate-800 dark:text-white">{item.parameter}</td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-slate-900 dark:text-white">{item.value}</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.status === 'Normal' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{item.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-xs italic">"{item.meaning || item.interpretation || item.observation}"</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {(result.health_tips || result.recommendations) && (
                                        <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-800">
                                            <h4 className="font-black text-purple-900 dark:text-purple-300 mb-3 text-xs uppercase tracking-widest flex items-center gap-2">
                                                <Activity className="w-4 h-4" /> AI Recommendations
                                            </h4>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {(result.health_tips || result.recommendations).map((t: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" /> {t}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start pb-6 border-b dark:border-slate-800">
                                        <div>
                                            <h3 className="font-black text-3xl text-slate-800 dark:text-white">{result.name || "Unknown Medicine"}</h3>
                                            <p className="text-teal-600 font-bold text-sm uppercase mt-1 tracking-tighter">{result.type || "Medication"}</p>
                                        </div>
                                        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl"><Pill className="w-8 h-8 text-teal-600" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border dark:border-slate-800">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Usage & Purpose</h4>
                                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{result.purpose}</p>
                                        </div>
                                        <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Safety Warnings</h4>
                                            <p className="text-rose-800/80 dark:text-rose-200/80 text-sm font-medium">{result.warnings || result.dosage_warning}</p>
                                        </div>
                                    </div>

                                    {result.dosage && (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Standard Dosage</h4>
                                            <p className="text-blue-800 dark:text-blue-200 text-sm">{result.dosage}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setResult(null)}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
                    >
                        Try Another Scan
                    </button>
                </div>
            )}
        </div>
    );
};
