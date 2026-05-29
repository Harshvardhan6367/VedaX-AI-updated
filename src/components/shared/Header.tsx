import React, { useState } from 'react';
import {
    Stethoscope, Pill, Bell, Languages, Moon, Sun, ShieldAlert,
    User, Settings, LogOut, ChevronDown, CheckCircle, ShieldCheck
} from 'lucide-react';
import { AppRoute, UserProfile, Doctor } from '@/types';
import { useLanguage, LANGUAGE_NAMES } from '@/contexts/LanguageContext';
import { Badge } from '@/components/shared/ui';

interface HeaderProps {
    currentRoute: AppRoute;
    isDoctorMode: boolean;
    user: UserProfile;
    doctor: Doctor;
    t: (key: string) => string;
    language: string;
    setLanguage: (lang: any) => void;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    showToast: (msg: string, type: any) => void;
    onNavigate: (route: AppRoute) => void;
    setIsSOSOpen: (open: boolean) => void;
    setIsNotificationsOpen: (open: boolean) => void;
    setIsMedicationPanelOpen: (open: boolean) => void;
    onLogout: () => void;
    hasPendingMeds: boolean;
}

const Header: React.FC<HeaderProps> = ({
    currentRoute,
    isDoctorMode,
    user,
    doctor,
    t,
    language,
    setLanguage,
    darkMode,
    setDarkMode,
    showToast,
    onNavigate,
    setIsSOSOpen,
    setIsNotificationsOpen,
    setIsMedicationPanelOpen,
    onLogout,
    hasPendingMeds
}) => {
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const displayName = isDoctorMode ? `Dr. ${doctor.name}` : user.name || "Guest User";
    const displayRole = isDoctorMode ? doctor.specialty : "Verified Patient";

    return (
        <header className="glass px-8 py-4 flex items-center justify-between sticky top-0 z-[100] transition-all duration-300 border-b border-white/10">
            <div className="flex items-center gap-4">
                <div className="md:hidden bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-blue-600/20">
                    <Stethoscope className="text-white w-5 h-5" />
                </div>
                <div>
                    <h1 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight md:hidden">
                        {isDoctorMode ? 'VedaX-AI Pro' : 'VedaX-AI'}
                    </h1>
                    <div className="hidden md:flex flex-col">
                        <h1 className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter uppercase italic leading-none">
                            {currentRoute.replace(/_/g, ' ')}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isDoctorMode ? 'Pulse Monitoring Active' : 'Real-time Health Sync'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Secondary Icons */}
                <div className="hidden sm:flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                    {!isDoctorMode && (
                        <button
                            onClick={() => setIsMedicationPanelOpen(true)}
                            className="p-2.5 rounded-xl text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800 transition-all relative group"
                        >
                            <Pill size={18} className="group-hover:scale-110 transition-transform" />
                            {hasPendingMeds && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}
                        </button>
                    )}

                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="p-2.5 rounded-xl text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800 transition-all relative group"
                    >
                        <Bell size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    </button>

                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                        {darkMode ? (
                            <Sun size={18} className="text-amber-400 group-hover:rotate-45 transition-transform" />
                        ) : (
                            <Moon size={18} className="text-slate-600 group-hover:-rotate-12 transition-transform" />
                        )}
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 pl-3 pr-4 py-2 bg-white/40 dark:bg-slate-900/40 border border-white/10 rounded-[1.5rem] hover:bg-white/60 dark:hover:bg-slate-800 transition-all active:scale-95 group shadow-lg shadow-slate-200/50 dark:shadow-none"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md border border-white/10">
                            {displayName.charAt(0)}
                        </div>
                        <div className="hidden lg:block text-left">
                            <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none mb-0.5 tracking-tight">{displayName}</p>
                            <div className="flex items-center gap-1">
                                <ShieldCheck size={10} className="text-blue-500" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isDoctorMode ? 'Pro' : 'Level 4'}</span>
                            </div>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-4 w-64 glass rounded-[2rem] shadow-2xl z-[100] border border-white/20 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-white/10 mb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white italic">{displayName}</p>
                            </div>

                            <div className="space-y-1">
                                <button
                                    onClick={() => { onNavigate(isDoctorMode ? AppRoute.DOCTOR_PROFILE : AppRoute.PROFILE); setShowProfileMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group/item"
                                >
                                    <User size={18} className="text-slate-400 group-hover/item:text-white transition-colors" />
                                    <span className="text-xs font-bold tracking-tight">View Profile</span>
                                </button>

                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-700 dark:text-slate-200"
                                >
                                    <Settings size={18} className="text-slate-400" />
                                    <span className="text-xs font-bold tracking-tight">Account Settings</span>
                                </button>
                            </div>

                            <div className="mt-2 pt-2 border-t border-white/10">
                                <button
                                    onClick={() => { onLogout(); setShowProfileMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    <LogOut size={18} />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}


                </div>

                {!isDoctorMode && (
                    <button
                        onClick={() => setIsSOSOpen(true)}
                        className="ml-2 btn-sos text-white px-5 py-2.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs group"
                    >
                        <ShieldAlert size={16} className="group-hover:animate-shake" />
                        <span className="hidden sm:inline">Emergency</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
