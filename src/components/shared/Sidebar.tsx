import React, { useState } from 'react';
import {
    Home,
    MessageSquare,
    Stethoscope,
    User,
    LogOut,
    Briefcase,
    ShieldAlert,
    Settings,
    ChevronLeft,
    Menu,
    Activity,
    ShieldCheck
} from 'lucide-react';
import { AppRoute, UserProfile, Doctor } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface SidebarProps {
    currentRoute: AppRoute;
    onNavigate: (route: AppRoute) => void;
    isDoctorMode: boolean;
    user?: UserProfile;
    doctor?: Doctor;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentRoute,
    onNavigate,
    isDoctorMode,
    user,
    doctor,
    onLogout
}) => {
    const { t } = useLanguage();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const patientLinks = [
        { icon: Home, label: t('nav.home'), route: AppRoute.HOME },
        { icon: ShieldCheck, label: 'Smart Cure', route: AppRoute.SMART_CURE },
        { icon: Stethoscope, label: t('nav.doctors'), route: AppRoute.DOCTORS },
        { icon: User, label: t('nav.profile'), route: AppRoute.PROFILE },
    ];

    const doctorLinks = [
        { icon: Home, label: t('nav.dashboard'), route: AppRoute.DOCTOR_HOME },
        { icon: Briefcase, label: t('nav.profile'), route: AppRoute.DOCTOR_PROFILE },
    ];

    const links = isDoctorMode ? doctorLinks : patientLinks;

    return (
        <div className={`hidden md:flex flex-col h-full glass border-r border-white/10 transition-all duration-500 z-50 relative ${isCollapsed ? 'w-24' : 'w-72'}`}>

            {/* Brand Header */}
            <div className={`p-8 pb-10 transition-all duration-500 ${isCollapsed ? 'px-4' : 'px-8'}`}>
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300 shrink-0">
                        <Stethoscope className="text-white w-7 h-7" />
                    </div>
                    {!isCollapsed && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                            <h1 className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tighter shadow-sm">
                                {isDoctorMode ? 'VedaX-AI Pro' : 'VedaX-AI'}
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                                <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">Status: Active</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
                {!isCollapsed && (
                    <p className="px-5 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60 animate-in fade-in duration-500">System Menu</p>
                )}

                {links.map((link: any, idx) => {
                    const isActive = link.route && currentRoute === link.route;

                    const LinkContent = (
                        <>
                            <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {!isCollapsed && (
                                <span className="text-sm font-bold tracking-tight uppercase tracking-widest text-[11px] scale-y-110 translate-y-0.5 animate-in fade-in slide-in-from-left-4">{link.label}</span>
                            )}
                            {isActive && !isCollapsed && (
                                <div className="absolute left-0 w-1 h-6 bg-white rounded-full -translate-x-1" />
                            )}
                        </>
                    );

                    const className = `w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${isActive
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 font-bold translate-x-1'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`;

                    if (link.href) {
                        return (
                            <a
                                key={`link-${idx}`}
                                href={link.href}
                                target="_self"
                                className={className}
                                title={isCollapsed ? link.label : ''}
                            >
                                {LinkContent}
                            </a>
                        );
                    }

                    return (
                        <button
                            key={`btn-${idx}`}
                            onClick={() => link.route && onNavigate(link.route)}
                            className={className}
                            title={isCollapsed ? link.label : ''}
                        >
                            {LinkContent}
                        </button>
                    );
                })}
            </div>

        </div>
    );
};

export default Sidebar;
