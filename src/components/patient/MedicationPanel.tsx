import React, { useState } from 'react';
import { X, Pill, CheckCircle, ChevronRight, ShoppingBag, Plus } from 'lucide-react';
import { UserProfile, Medication } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, Badge } from '@/components/shared/ui';

interface MedicationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onMarkTaken: (medId: string) => void;
  onAddMed: () => void;
  onNavigateProfile: () => void;
}

const MedicationPanel: React.FC<MedicationPanelProps> = ({
  isOpen,
  onClose,
  user,
  onMarkTaken,
  onAddMed,
  onNavigateProfile
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const sortedMeds = [...user.medications].sort((a, b) => {
    return (a.taken === b.taken) ? 0 : a.taken ? 1 : -1;
  });

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={onClose}
      ></div>

      <div className="w-[380px] h-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl relative animate-in slide-in-from-right duration-500 flex flex-col border-l border-white/20 dark:border-slate-800/50 shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center transition-all">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-2.5 shadow-lg shadow-blue-500/20">
              <Pill size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter">
                {t('meds.my_meds')}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Daily Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onAddMed}
              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors group"
              title="Add Medication"
            >
              <Plus size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
            >
              <X size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {user.medications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60%] text-center p-8 space-y-4 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-3xl">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300">
                <ShoppingBag size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{t('meds.no_active')}</p>
                <p className="text-xs text-slate-400 mt-1">Start your recovery by adding your first medication.</p>
              </div>
              <Button
                variant="primary"
                onClick={onAddMed}
                className="mt-2 text-xs"
                icon={Plus}
              >
                {t('profile.add_med')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Today's Schedule</label>
              {sortedMeds.map((med, index) => (
                <div
                  key={med.id}
                  className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${med.taken
                    ? 'bg-slate-50 dark:bg-slate-900/30 border-transparent opacity-60'
                    : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md'
                    }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner transition-colors ${med.taken
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      }`}>
                      {med.dosage}
                    </div>
                    <div>
                      <p className={`font-bold text-sm transition-all ${med.taken ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {med.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={med.taken ? 'success' : 'info'} className="text-[9px] px-1.5 py-0">
                          {med.frequency}
                        </Badge>
                        {med.taken && <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Taken</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onMarkTaken(med.id)}
                    disabled={med.taken}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${med.taken
                      ? 'text-emerald-500 scale-110'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-500 hover:text-white hover:scale-110 group-hover:bg-blue-500 group-hover:text-white'
                      }`}
                  >
                    <CheckCircle size={22} className={med.taken ? 'animate-in zoom-in' : ''} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Overlay */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm">
          <Button
            variant="secondary"
            onClick={() => { onClose(); onNavigateProfile(); }}
            className="w-full text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-black uppercase tracking-widest"
            icon={ChevronRight}
          >
            {t('meds.manage')}
          </Button>
          <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">
            Swasthya Setu Health Monitor • v1.0
          </p>
        </div>
      </div>

    </div>
  );
};

export default MedicationPanel;
