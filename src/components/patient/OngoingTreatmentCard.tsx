import React from 'react';
import { Info, Video, MessageSquare, Zap, Clock } from 'lucide-react';
import { OngoingTreatment } from '@/types';
import { Button, Card, Badge } from '@/components/shared/ui';

interface OngoingTreatmentCardProps {
    treatment: OngoingTreatment;
    onVideoCall: (treatment: OngoingTreatment) => void;
    onShowDetails: (treatment: OngoingTreatment) => void;
    onChat: (treatment: OngoingTreatment) => void;
}

const OngoingTreatmentCard: React.FC<OngoingTreatmentCardProps> = ({
    treatment,
    onVideoCall,
    onShowDetails,
    onChat
}) => {
    return (
        <Card className="min-w-[320px] w-full max-w-sm flex-shrink-0 snap-center p-6 space-y-6 group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border-white/20 dark:border-slate-800/50">
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="relative">
                        <img
                            src={treatment.doctorImage}
                            alt={treatment.doctorName}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/50 dark:ring-slate-800/50 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight text-lg group-hover:text-blue-600 transition-colors">
                            {treatment.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                            {treatment.doctorName}
                        </p>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onShowDetails(treatment); }}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                >
                    <Info size={20} />
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</span>
                    </div>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{treatment.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                        style={{ width: `${treatment.progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center gap-3 group/step transition-colors hover:border-blue-200 dark:hover:border-blue-900/30">
                <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-xl group-hover/step:animate-bounce">
                    <Zap size={16} className="text-amber-500 fill-amber-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Next Action</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        {treatment.nextStep}
                    </p>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    variant="glass"
                    onClick={() => onChat(treatment)}
                    className="flex-1 py-3 text-xs font-black uppercase tracking-widest border-slate-200 dark:border-slate-700 hover:text-blue-600"
                    icon={MessageSquare}
                >
                    Chat
                </Button>
                <Button
                    onClick={() => onVideoCall(treatment)}
                    className="flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                    icon={Video}
                >
                    Connect
                </Button>
            </div>
        </Card>
    );
};

export default OngoingTreatmentCard;
