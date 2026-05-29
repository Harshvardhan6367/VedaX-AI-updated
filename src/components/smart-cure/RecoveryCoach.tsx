import React, { useState, useRef, useEffect } from 'react';
import { generateDietPlan, findYoutubeVideo, analyzeExerciseVideo } from '@/api/geminiService';
import { Play, Activity, Salad, Youtube, Loader2, Search, ExternalLink, Dumbbell, StopCircle, Video, CheckCircle, ArrowLeft, RefreshCw, X, ArrowRight } from 'lucide-react';

interface RecoveryCoachProps {
    onBack?: () => void;
}

export const RecoveryCoach: React.FC<RecoveryCoachProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'PLAN' | 'VIDEO' | 'COACH'>('PLAN');

    // Diet State
    const [condition, setCondition] = useState('');
    const [dietPlan, setDietPlan] = useState<any>(null);
    const [dietLoading, setDietLoading] = useState(false);
    const [dietError, setDietError] = useState<string | null>(null);

    // Video Search State
    const [videoQuery, setVideoQuery] = useState('');
    const [videoResults, setVideoResults] = useState<any[]>([]);
    const [videoLoading, setVideoLoading] = useState(false);

    // AI Coach State
    const [coachForm, setCoachForm] = useState({ ailment: '', exerciseName: '' });
    const [isCoachSetupDone, setIsCoachSetupDone] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [coachResult, setCoachResult] = useState<any>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const handleGetDiet = async () => {
        if (!condition) return;
        setDietLoading(true);
        setDietError(null);
        setDietPlan(null);
        try {
            const plan = await generateDietPlan(condition);
            if (plan?.error) {
                setDietError(plan.error);
            } else if (!plan?.advice && !plan?.meals) {
                setDietError('The AI returned an empty plan. Your API key may be expired — please update it in the .env file.');
            } else {
                setDietPlan(plan);
            }
        } catch (e: any) {
            setDietError(e?.message || 'Failed to generate diet plan. Please check your API key.');
        } finally {
            setDietLoading(false);
        }
    };

    const handleVideoSearch = async (query?: string) => {
        const q = query || videoQuery;
        if (!q) return;
        setVideoLoading(true);
        setVideoResults([]);
        try {
            const videos = await findYoutubeVideo(q);
            if (videos && videos.length > 0) setVideoResults(videos);
        } catch (e) {
            console.error(e);
        } finally {
            setVideoLoading(false);
        }
    };

    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false
            });
            streamRef.current = stream;
            setIsCoachSetupDone(true);
            setCoachResult(null);
        } catch (err) {
            console.error("Camera Error:", err);
            alert("Could not access camera.");
        }
    };

    useEffect(() => {
        if (isCoachSetupDone && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(e => console.error("Play Error:", e));
        }
    }, [isCoachSetupDone]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = () => {
        if (!streamRef.current) return;
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = async () => {
            setIsAnalyzing(true);
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                try {
                    const result = await analyzeExerciseVideo(base64, 'video/webm', coachForm.ailment, coachForm.exerciseName);
                    setCoachResult(result);
                } catch (e) {
                    alert("Analysis failed.");
                } finally {
                    setIsAnalyzing(false);
                }
            };
        };
        recorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const resetCoach = () => {
        setIsCoachSetupDone(false);
        setCoachResult(null);
        setCoachForm({ ailment: '', exerciseName: '' });
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4">
            {onBack && (
                <div className="flex items-center gap-2 mb-2">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Burnout Reduction Tools</h2>
                </div>
            )}

            <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-x-auto">
                <button
                    onClick={() => setActiveTab('PLAN')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'PLAN' ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}
                >
                    <Salad className="w-4 h-4" /> Diet Plan
                </button>
                <button
                    onClick={() => setActiveTab('VIDEO')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'VIDEO' ? 'bg-white dark:bg-slate-700 shadow text-red-600 dark:text-red-400' : 'text-slate-500'}`}
                >
                    <Youtube className="w-4 h-4" /> Videos
                </button>
                <button
                    onClick={() => setActiveTab('COACH')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'COACH' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                >
                    <Activity className="w-4 h-4" /> AI Coach
                </button>
            </div>

            {activeTab === 'PLAN' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Recovery Diet Generator</h3>
                        <p className="text-sm text-slate-500 mb-6">Enter your condition to get a customized nutrition plan.</p>

                        <div className="flex flex-col md:flex-row gap-2 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Condition (e.g. Broken Arm, Viral Fever, Post-Surgery)"
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGetDiet()}
                                    className="w-full pl-10 pr-4 py-3 border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-200"
                                />
                            </div>
                            <button
                                onClick={handleGetDiet}
                                disabled={dietLoading || !condition}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {dietLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Plan"}
                            </button>
                        </div>

                        {dietError && (
                            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm animate-in fade-in">
                                <X className="w-5 h-5 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold mb-1">Could not generate plan</p>
                                    <p>{dietError}</p>
                                    <p className="mt-2 text-xs opacity-80">💡 If your API key expired, get a new one at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline font-semibold">aistudio.google.com/apikey</a> and update <code>.env</code></p>
                                </div>
                            </div>
                        )}
                    </div>

                    {dietPlan && !dietLoading && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden animate-in slide-in-from-bottom-4">
                            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
                                <h4 className="font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Customized Recovery Plan</h4>
                                <button onClick={() => setDietPlan(null)} className="p-1 hover:bg-emerald-500 rounded"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                    <h5 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">Dietary Advice</h5>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{dietPlan.advice}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {dietPlan.meals?.map((meal: any, i: number) => (
                                        <div key={i} className="border dark:border-slate-800 p-4 rounded-xl hover:shadow-md transition-shadow">
                                            <h6 className="font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b dark:border-slate-800 flex items-center gap-2 uppercase text-xs tracking-wider">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> {meal.name}
                                            </h6>
                                            <ul className="space-y-1">
                                                {meal.items?.map((item: string, j: number) => (
                                                    <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                        <span>•</span> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-400 uppercase w-full mb-2">Recommended Exercises</span>
                                    {dietPlan.youtube_queries?.map((q: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => { setActiveTab('VIDEO'); setVideoQuery(q); handleVideoSearch(q); }}
                                            className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-slate-600 dark:text-slate-300"
                                        >
                                            <Youtube className="w-3 h-3 text-red-500" /> {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'VIDEO' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Physio Video Search</h3>
                        <p className="text-sm text-slate-500 mb-6">Find certified exercises and recovery tutorials.</p>

                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="e.g. Shoulder rehab exercises"
                                value={videoQuery}
                                onChange={(e) => setVideoQuery(e.target.value)}
                                className="flex-1 p-3 border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleVideoSearch()}
                            />
                            <button
                                onClick={() => handleVideoSearch()}
                                disabled={videoLoading || !videoQuery}
                                className="bg-red-600 text-white px-6 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {videoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {videoResults.map((v, i) => (
                                <a
                                    key={i}
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.search_term)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative flex items-center gap-4 p-4 border dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-l-4 border-l-red-500"
                                >
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full group-hover:scale-110 transition-transform">
                                        <Youtube className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1">{v.title}</h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> youtube.com</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'COACH' && (
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 overflow-hidden relative animate-in zoom-in-95 duration-500">
                    {!isCoachSetupDone ? (
                        <div className="space-y-8 max-w-md mx-auto py-10 text-center">
                            <div className="inline-flex p-5 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                                <Dumbbell className="w-12 h-12 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Pose Correct AI</h3>
                                <p className="text-slate-400 text-sm">Real-time kinematic analysis for safer exercises.</p>
                            </div>

                            <div className="space-y-4 text-left">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Current Ailment</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. Lower back pain"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:ring-2 ring-blue-500/50 transition-all"
                                        value={coachForm.ailment}
                                        onChange={e => setCoachForm({ ...coachForm, ailment: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Exercise to Perform</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. Squat, Push-up, Yoga Stretch"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:ring-2 ring-blue-500/50 transition-all"
                                        value={coachForm.exerciseName}
                                        onChange={e => setCoachForm({ ...coachForm, exerciseName: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={openCamera}
                                    disabled={!coachForm.ailment || !coachForm.exerciseName}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                >
                                    Enable Camera <Play className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="relative aspect-video bg-black rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden group">
                                {!coachResult && !isAnalyzing ? (
                                    <>
                                        <video ref={videoRef} muted autoPlay playsInline className="w-full h-full object-cover" />
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <div className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1 uppercase tracking-tight">
                                                <div className="w-2 h-2 rounded-full bg-white" /> Live Studio
                                            </div>
                                            <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-300">
                                                {coachForm.exerciseName}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-8 text-center animate-in fade-in duration-500">
                                        {isAnalyzing ? (
                                            <div className="space-y-4">
                                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                                                <div className="space-y-1">
                                                    <h4 className="text-xl font-bold">Physio-Node Analysis</h4>
                                                    <p className="text-slate-400 text-sm">Evaluating joints and spinal alignment...</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-w-md space-y-6">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="text-5xl font-black text-blue-500">{coachResult.score}<span className="text-xl text-slate-500">/10</span></div>
                                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Recovery Score</span>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                                    <h5 className="font-bold text-lg mb-2 flex items-center justify-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Verdict</h5>
                                                    <p className="text-slate-300 leading-relaxed italic">"{coachResult.feedback}"</p>
                                                </div>
                                                <div className="text-left space-y-2">
                                                    <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Physio Tips</h5>
                                                    <ul className="space-y-1.5">{coachResult.tips?.map((tip: string, idx: number) => <li key={idx} className="text-sm text-slate-400 flex items-start gap-2"><span>•</span> {tip}</li>)}</ul>
                                                </div>
                                                <button onClick={() => setCoachResult(null)} className="flex items-center gap-2 mx-auto text-blue-400 font-bold hover:text-blue-300 transition-all"><RefreshCw className="w-4 h-4" /> Try Again</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!coachResult && !isAnalyzing && (
                                    <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-white shadow-sm">{isRecording ? "Stop to analyze form" : "Start 10s recording"}</p>
                                        {!isRecording ? (
                                            <button
                                                onClick={startRecording}
                                                className="group/btn w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-1 transition-all active:scale-95"
                                            >
                                                <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center group-hover/btn:scale-90 transition-transform">
                                                    <div className="w-6 h-6 bg-white rounded-full" />
                                                </div>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopRecording}
                                                className="group/btn w-16 h-16 bg-white/20 backdrop-blur-md rounded-full p-1 transition-all"
                                            >
                                                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                                    <StopCircle className="w-8 h-8 text-black" />
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 rounded-xl"><Activity className="w-5 h-5 text-blue-400" /></div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase line-clamp-1">{coachForm.exerciseName} Analysis</p>
                                        <p className="text-sm font-bold text-slate-200">{coachForm.ailment}</p>
                                    </div>
                                </div>
                                <button onClick={resetCoach} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-400 transition-all"><X /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
