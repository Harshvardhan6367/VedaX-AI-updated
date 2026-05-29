import React from 'react';
import { X, Users, User, ShieldAlert, Shield, ArrowRight } from 'lucide-react';
import { UserProfile, AppRoute } from '@/types';
import { Button, Card, Badge } from '@/components/shared/ui';

interface VFamilyModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
    isCaregiverMode: boolean;
    onNavigate: (route: AppRoute) => void;
}

const VFamilyModal: React.FC<VFamilyModalProps> = ({ isOpen, onClose, user, isCaregiverMode, onNavigate }) => {
    if (!isOpen) return null;

    const handleManageAccess = () => {
        onClose();
        onNavigate(AppRoute.PROFILE);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="text-amber-500" />
                            V-Family Access
                        </h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                            {isCaregiverMode ? 'Monitored Profiles' : 'Caregiver Management'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {isCaregiverMode ? (
                        // Caregiver View (Monitoring someone else)
                        <div className="space-y-6">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 text-sm font-medium rounded-2xl border border-amber-200 dark:border-amber-800/30 flex gap-3">
                                <ShieldAlert className="shrink-0" size={20} />
                                <p>You are currently monitoring the following patient profiles with restricted Caregiver Access.</p>
                            </div>

                            <Card className="flex flex-col gap-4 border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <User size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white">{user.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Patient ID: VX-AI-2024</p>
                                    </div>
                                    <Badge variant="warning">Active</Badge>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="primary" className="flex-1" onClick={() => { onClose(); onNavigate(AppRoute.HOME); }}>
                                        View Dashboard
                                    </Button>
                                    <Button variant="secondary" className="flex-1" onClick={() => { onClose(); onNavigate(AppRoute.PROFILE); }}>
                                        Profile Settings
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        // Standard Patient View
                        <div className="space-y-6">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Grant a trusted relative access to monitor your health records and assist in managing your care.
                            </p>

                            {user.caregiver?.email ? (
                                <div className="space-y-4">
                                    <Card className="flex items-center gap-4 border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10">
                                        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <Shield size={24} />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{user.caregiver.name}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.caregiver.email}</p>
                                        </div>
                                        <Badge variant="success">Active</Badge>
                                    </Card>

                                    <Button variant="secondary" className="w-full" onClick={handleManageAccess}>
                                        Manage or Revoke Access <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6 space-y-4">
                                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2">
                                        <User size={32} />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">No Caregiver Assigned</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        You haven't granted V-Family access to anyone yet.
                                    </p>
                                    <Button variant="primary" className="mx-auto" onClick={handleManageAccess}>
                                        Invite a Relative <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VFamilyModal;
