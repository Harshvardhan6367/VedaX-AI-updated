import React, { useState, useRef } from 'react';
import { ScanFace, AlertOctagon, Info, Upload, ArrowLeft, CheckCircle, AlertTriangle, RefreshCw, X, WifiOff } from 'lucide-react';
import { analyzeImage } from '@/api/geminiService';
import { analyzeWithMedGemma } from '@/api/medgemmaService';
import { UserProfile } from '@/types';

interface DermCheckProps {
    user?: UserProfile;
    onBack?: () => void;
    isOnline?: boolean;
}

export const DermCheck: React.FC<DermCheckProps> = ({ user, onBack, isOnline = true }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setResult(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            try {
                const profile = {
                    age: user?.age?.toString(),
                    gender: user?.gender || 'Unknown'
                };
                if (!isOnline) {
                    // ⚡ Offline mode: use local MedGemma backend
                    const extra = `Age: ${profile.age || '?'}, Gender: ${profile.gender}`;
                    const res = await analyzeWithMedGemma('DERM', base64String, extra);
                    setResult(res);
                } else {
                    const res = await analyzeImage(base64String, file.type, 'DERM', profile);
                    setResult(res);
                }
            } catch (err) {
                setResult({ error: "Could not analyze image. Try a clearer photo." });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {onBack && (
                <div className="flex items-center gap-2 mb-2">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Derm-Check</h2>
                    {!isOnline && (
                        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                            <WifiOff size={11} /> Offline · MedGemma
                        </span>
                    )}
                </div>
            )}

            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-5 flex gap-4 animate-in fade-in duration-500">
                <div className="bg-rose-500/10 p-2 rounded-lg h-fit">
                    <AlertOctagon className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                    <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm mb-1">Medical Disclaimer</h4>
                    <p className="text-xs text-rose-800/70 dark:text-rose-200/60 leading-relaxed">
                        This AI tool is for preliminary educational purposes only. It is NOT a substitute for professional clinical diagnosis. Always consult a certified Dermatologist for skin concerns.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all">
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-400/20 rounded-full -ml-12 -mb-12 blur-2xl" />

                    <div className="relative z-10">
                        <div className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
                            <ScanFace className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">VedaX Skin Scanner</h2>
                        <p className="text-rose-100 text-sm font-medium opacity-90">Advanced AI Dermatological Analysis</p>
                    </div>
                </div>

                <div className="p-8">
                    {!result && !loading && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/30 dark:hover:bg-rose-900/5 transition-all group relative overflow-hidden"
                        >
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full group-hover:scale-110 transition-transform mb-4 shadow-sm border dark:border-slate-700">
                                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-rose-500 transition-colors" />
                            </div>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">Snap or Upload Photo</span>
                            <span className="text-slate-500 text-sm mt-1">Acne, Rashes, Moles, or Lesions</span>
                        </div>
                    )}

                    {loading && (
                        <div className="h-64 flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                                <ScanFace className="w-6 h-6 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-slate-800 dark:text-slate-200 font-bold">Scanning Textures...</p>
                                <p className="text-slate-500 text-xs animate-pulse">Running neural analysis on pigmentation & redness</p>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {result.error ? (
                                <div className="text-center py-8">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-red-600 dark:text-red-400 font-medium border border-red-100 dark:border-red-900/30">
                                        {result.error}
                                    </div>
                                    <button onClick={() => setResult(null)} className="mt-4 text-slate-500 font-bold flex items-center gap-2 mx-auto"><RefreshCw className="w-4 h-4" /> Try Again</button>
                                </div>
                            ) : result.raw_text ? (
                                // MedGemma returned plain text (JSON parse failed) – display as-is
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 text-amber-700">⚡ MedGemma Offline Analysis</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">{result.raw_text}</p>
                                    <button onClick={() => setResult(null)} className="mt-2 text-slate-500 font-bold flex items-center gap-2 mx-auto"><RefreshCw className="w-4 h-4" /> Scan Another Area</button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {!isOnline && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 text-amber-700">⚡ MedGemma Offline Analysis</span>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{result.condition_name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${result.verdict === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Classification: {result.verdict}</p>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-2xl shadow-sm ${result.verdict === 'Good' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                result.verdict === 'Bad' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                            {result.verdict === 'Good' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-tight">
                                            <Info className="w-4 h-4 text-blue-500" /> Clinical Presentation
                                        </h4>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">{result.explanation}</p>
                                    </div>

                                    <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                                        <h4 className="font-black text-rose-900 dark:text-rose-200 mb-2 flex items-center gap-2 text-sm italic">Recommended Next Steps</h4>
                                        <p className="text-rose-800/80 dark:text-rose-200/70 text-sm leading-relaxed">{result.recommended_action}</p>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => setResult(null)}
                                            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Scan Another Area
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 px-8">
                By using VedaX-AI DermCheck, you acknowledge that this is a technological demonstration and not a clinical diagnosis service. Ensure lighting is bright for better results.
            </p>
        </div>
    );
};
