import React, { useState } from 'react';
import { HeartPulse, ShieldCheck, ChevronLeft, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { AppRoute, UserProfile } from '@/types';

interface DonorRegistrationProps {
  user: UserProfile;
  onNavigate: (route: AppRoute) => void;
}

const DonorRegistration: React.FC<DonorRegistrationProps> = ({ user, onNavigate }) => {
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || 'O+');
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistered(true);
  };

  if (isRegistered) {
    return (
      <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-red-500/10 border border-red-100 dark:border-red-500/20 text-center max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
          
          <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <HeartPulse className="text-red-500" size={48} />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-4 border-white dark:border-slate-900">
              <CheckCircle2 size={24} />
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 relative z-10">You're a VedaX Hero!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed relative z-10">
            Thank you for registering as an emergency donor. You'll receive push notifications via Firebase if someone nearby urgently needs <strong className="text-red-500">{bloodGroup}</strong> blood.
          </p>
          
          <button 
            onClick={() => onNavigate(AppRoute.HOME)}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform relative z-10"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => onNavigate(AppRoute.PROFILE)}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-transform"
        >
          <ChevronLeft className="text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20 border border-red-500/20">
            <HeartPulse className="text-red-500" size={40} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Become a Hero Donor</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto text-lg leading-relaxed">
            Join the VedaX-AI Emergency Blood Network. Respond to life-saving requests near you.
          </p>
        </div>

        <form onSubmit={handleRegister} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 space-y-8">
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                 Blood Group Required
              </label>
              <select 
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-red-500/20 outline-none transition-all text-lg"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" /> Base Location
              </label>
              <input 
                type="text" 
                defaultValue="Jaipur, Rajasthan"
                readOnly
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed text-lg"
              />
              <p className="text-xs text-slate-400 font-medium mt-1">Fetched from device GPS</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
            <ShieldCheck className="text-blue-500 mt-1 shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-blue-100 mb-1">Privacy Guarantee</h4>
              <p className="text-sm text-slate-600 dark:text-blue-200/80 leading-relaxed font-medium">
                VedaX-AI complies with the DPDP Act 2023. Your identity is hidden from patients. You will only receive broadcast alerts through Firebase Cloud Messaging based on a 10km proximity threshold.
              </p>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-1 transition-all text-lg tracking-wide uppercase"
          >
            Agree & Register as Donor
          </button>

        </form>
      </div>
    </div>
  );
}

export default DonorRegistration;
