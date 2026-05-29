import React from 'react';
import { X, Calendar, MessageSquare, Video, Info, CheckCircle2, Star, Clock, Activity, Zap } from 'lucide-react';
import { OngoingTreatment } from '@/types';
import { Button, Card, Badge } from '@/components/shared/ui';

interface TreatmentDetailsModalProps {
    treatment: OngoingTreatment;
    onClose: () => void;
    onChat: (treatment: OngoingTreatment) => void;
    onVideoCall: (treatment: OngoingTreatment) => void;
}

const TreatmentDetailsModal: React.FC<TreatmentDetailsModalProps> = ({
    treatment,
    onClose,
    onChat,
    onVideoCall
}) => {
    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6 font-sans">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>

            <Card className="bg-white dark:bg-slate-950 w-full max-w-lg sm:h-[80vh] h-[90vh] rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl relative animate-in slide-in-from-bottom-20 duration-500 border-white/20 dark:border-slate-800/50 flex flex-col overflow-hidden">

                {/* Header Section */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 pb-16 relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all hover:rotate-90"
                    >
                        <X size={20} />
                    </button>
                    <div className="space-y-4">
                        <Badge variant="info" className="bg-white/20 text-white border-white/20 uppercase tracking-[0.2em] text-[10px]">
                            Swasthya Setu Care Plan
                        </Badge>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{treatment.title}</h2>
                        <div className="flex items-center gap-2 text-blue-100/70 text-xs font-bold uppercase tracking-widest">
                            <Info size={14} />
                            <span>Managed by Specialized Team</span>
                        </div>
                    </div>

                    {/* Decorative Element */}
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
                </div>

                {/* Floating Doctor Card */}
                <div className="px-8 -mt-10 relative z-20 shrink-0">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-5 rounded-[2rem] shadow-2xl border border-white dark:border-slate-800/50 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={treatment.doctorImage} alt={treatment.doctorName} className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Lead Specialist</p>
                                <h3 className="font-black text-slate-900 dark:text-white tracking-tight">{treatment.doctorName}</h3>
                                <div className="flex items-center gap-1 mt-0.5">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onChat(treatment)} className="p-3.5 bg-blue-600 text-white rounded-2xl hover:scale-110 active:scale-95 shadow-lg shadow-blue-500/20 transition-all">
                                <MessageSquare size={20} />
                            </button>
                            <button onClick={() => onVideoCall(treatment)} className="p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl hover:scale-110 active:scale-95 shadow-xl border border-slate-100 dark:border-slate-700 transition-all">
                                <Video size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">

                    {/* Progress Analytics */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Treatment Journey</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{treatment.progress}% Complete</h3>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant="success" className="px-3 py-1 font-black text-[10px] tracking-widest">{treatment.totalDuration}</Badge>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Estimated Time</span>
                            </div>
                        </div>
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden p-1 border border-slate-100 dark:border-slate-800 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" style={{ width: `${treatment.progress}%` }}></div>
                        </div>
                    </div>

                    {/* Timeline History */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xl flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Clock className="text-blue-600" size={18} />
                                </div>
                                Timeline
                            </h3>
                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View Full Logs</button>
                        </div>

                        <div className="space-y-8 relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 ml-4 py-2">
                            {/* Milestone 1 */}
                            <div className="relative group/item">
                                <div className="absolute -left-[35px] top-1 w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-slate-950 ring-4 ring-blue-500/10 group-hover/item:scale-150 transition-transform"></div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 font-mono">SEP 01, 2023</span>
                                        <Badge className="bg-blue-50 text-blue-600 border-blue-100 scale-75 origin-left">DIAGNOSIS</Badge>
                                    </div>
                                    <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Initial Consultation & Strategy</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Comprehensive metabolic evaluation completed. Patient protocol established and medication line defined.</p>
                                </div>
                            </div>

                            {/* Milestone 2 */}
                            <div className="relative group/item">
                                <div className="absolute -left-[35px] top-1 w-4 h-4 bg-slate-300 dark:bg-slate-700 rounded-full border-4 border-white dark:border-slate-950 transition-transform"></div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 font-mono">OCT 12, 2023</span>
                                        <Badge className="bg-slate-50 text-slate-600 border-slate-100 scale-75 origin-left tracking-widest">CHECKUP</Badge>
                                    </div>
                                    <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Bi-Weekly Optimization</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Glucose levels stabilizing effectively. Dosage adjustments applied for nocturnal maintenance.</p>
                                </div>
                            </div>

                            {/* Active/Next Step */}
                            <div className="relative group/item">
                                <div className="absolute -left-[35px] top-1 w-4 h-4 bg-amber-500 rounded-full border-4 border-white dark:border-slate-950 animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-amber-600 font-mono">UPCOMING</span>
                                        <Badge variant="warning" className="scale-75 origin-left">LAB REQUIRED</Badge>
                                    </div>
                                    <h4 className="font-black text-slate-800 dark:text-slate-white uppercase tracking-tight text-sm">Quarterly HbA1c Lab Panel</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-bold italic">Critical milestone. Book your local collection for Tuesday morning.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Swasthya Setu Insights */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                                <Activity size={18} className="text-white" />
                            </div>
                            <h4 className="font-black text-white uppercase tracking-widest text-[10px]">Swasthya Setu Insight</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Based on your recent glucose logs, your <span className="text-blue-400 font-black">Metabolic Efficiency</span> has improved by 14%. Adhere to the current fasting window for optimal results.
                        </p>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-4 shrink-0">
                    <Button
                        variant="glass"
                        onClick={onClose}
                        className="flex-1 text-[10px] font-black uppercase tracking-[0.2em] border-slate-200 dark:border-slate-700"
                    >
                        Dismiss
                    </Button>
                    <Button
                        onClick={() => onVideoCall(treatment)}
                        className="flex-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20"
                        icon={Video}
                    >
                        Consult Now
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default TreatmentDetailsModal;
