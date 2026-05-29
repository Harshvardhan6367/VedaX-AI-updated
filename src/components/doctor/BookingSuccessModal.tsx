import React from 'react';
import { CheckCircle, Calendar, Clock, MapPin, Video, X, PartyPopper } from 'lucide-react';
import { Appointment } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, Badge } from '@/components/shared/ui';

interface BookingSuccessModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({ appointment, onClose }) => {
  const { t } = useLanguage();
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-500 font-sans">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      ></div>

      <Card className="w-full max-w-sm p-8 relative animate-in zoom-in-95 duration-500 shadow-2xl border-white/20 dark:border-slate-800/50 overflow-hidden">

        {/* Background Sparkle Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors group"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30 transform rotate-12 hover:rotate-0 transition-transform duration-500">
              <CheckCircle size={48} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic underline decoration-emerald-500 decoration-4 underline-offset-4">
              {t('booking.confirmed')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-tight px-4">
              {t('booking.msg')}
            </p>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 w-full space-y-5 mb-8 text-left transition-all hover:border-emerald-200 dark:hover:border-emerald-900/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl">
                {appointment.doctorName.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{t('booking.doctor')}</p>
                <p className="font-black text-slate-900 dark:text-white tracking-tight">{appointment.doctorName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{t('booking.date')}</span>
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm italic">{appointment.date}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{t('booking.time')}</span>
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm italic">{appointment.time}</p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <Badge variant="info" className="px-3 py-1 text-[9px]">
                  {appointment.type === 'video' ? 'Video' : 'In-Person'}
                </Badge>
              </div>
              <PartyPopper size={16} className="text-emerald-500 animate-bounce" />
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.97]"
          >
            {t('booking.done')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BookingSuccessModal;
