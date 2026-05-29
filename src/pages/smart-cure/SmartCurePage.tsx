import React from 'react';
import {
    Stethoscope, FileText, Pill, ShieldCheck,
    Activity, MessageSquare, ChevronRight, Zap, Scan, Bot
} from 'lucide-react';
import { AppRoute } from '@/types';

interface SmartCurePageProps {
    onNavigate: (route: AppRoute) => void;
    userName: string;
}

const SmartCurePage: React.FC<SmartCurePageProps> = ({ onNavigate, userName }) => {
    const tools = [
        {
            id: 'triage',
            title: 'Smart Triage',
            description: 'Chat with AI Doctor for instant diagnosis.',
            icon: Stethoscope,
            color: 'emerald',
            route: AppRoute.TRIAGE
        },
        {
            id: 'prescription',
            title: 'Prescription Analysis',
            description: 'Chat with your medical documents contextually.',
            icon: Bot,
            color: 'amber',
            route: AppRoute.RAG_CHAT
        },
        {
            id: 'reports',
            title: 'Lab Reports',
            description: 'Upload Blood/Thyroid reports for simple analysis.',
            icon: FileText,
            color: 'blue',
            route: AppRoute.LAB_REPORTS
        },
        {
            id: 'mediscanner',
            title: 'Medi-Scanner',
            description: 'Identify pills instantly.',
            icon: Pill,
            color: 'indigo',
            route: AppRoute.MEDI_SCANNER
        },
        {
            id: 'dermcheck',
            title: 'Derm-Check',
            description: 'Scan skin issues for an instant verdict.',
            icon: Scan,
            color: 'rose',
            route: AppRoute.DERM_CHECK
        },
        {
            id: 'recovery',
            title: 'Burnout Reduction Tools',
            description: 'Diet plans & Live AI Coach.',
            icon: Activity,
            color: 'cyan',
            route: AppRoute.RECOVERY_COACH
        }
    ];

    const getColorClasses = (color: string) => {
        const maps: Record<string, string> = {
            emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:border-emerald-500/40',
            blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500 hover:border-blue-500/40',
            indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 hover:border-indigo-500/40',
            rose: 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:border-rose-500/40',
            cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500 hover:border-cyan-500/40',
            amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:border-amber-500/40',
        };
        return maps[color] || maps.blue;
    };

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-y-auto scrollbar-hide p-4 md:p-8 relative pb-24 md:pb-8">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -z-10"></div>

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="text-center space-y-2 pt-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 mx-auto animate-bounce">
                        <ShieldCheck size={14} />
                        Patient Dashboard
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                        Hello, {userName || 'harsh.work'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                        Instant triage, medication verification, and recovery coaching.
                    </p>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => onNavigate(tool.route)}
                            className={`group relative flex items-start gap-4 p-5 rounded-[1.5rem] border transition-all duration-500 text-left ${getColorClasses(tool.color)} bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl hover:scale-[1.02] hover:-translate-y-1 shadow-sm dark:shadow-none`}
                        >
                            <div className="bg-slate-100 dark:bg-slate-950/80 p-3 rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-white/10 group-hover:ring-slate-300 dark:group-hover:ring-white/20 transition-all duration-500">
                                <tool.icon size={28} />
                            </div>

                            <div className="flex-1 pr-8">
                                <h3 className="text-xl font-bold mb-1 group-hover:translate-x-1 transition-transform duration-500">
                                    {tool.title}
                                </h3>
                                <p className="text-sm opacity-70 font-medium leading-relaxed">
                                    {tool.description}
                                </p>
                            </div>

                            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                                <ChevronRight size={20} />
                            </div>

                            {/* Decorative corner glow */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${tool.color}-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100`}></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SmartCurePage;
