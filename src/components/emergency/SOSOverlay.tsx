import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, X, MapPin, ShieldAlert, HeartPulse, Activity } from 'lucide-react';
import { Button, Card } from '@/components/shared/ui';
import { AppRoute } from '@/types';

interface SOSOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  onNavigate?: (route: AppRoute) => void;
  autoStart?: boolean;
}

const SOSOverlay: React.FC<SOSOverlayProps> = ({ isOpen, onClose, contactName, onNavigate, autoStart }) => {
  const [countdown, setCountdown] = useState(5);
  // 'confirm' -> 'counting' -> 'active'
  const [status, setStatus] = useState<'confirm' | 'counting' | 'active'>('confirm');

  useEffect(() => {
    if (isOpen && autoStart && status === 'confirm') {
      setStatus('counting');
    }
  }, [isOpen, autoStart, status]);

  useEffect(() => {
    let timer: any;
    if (isOpen) {
      if (status === 'counting') {
        setCountdown(5);
        timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setStatus('active');
              clearInterval(timer);
              if (onNavigate) {
                onNavigate(AppRoute.EMERGENCY_ACTIVE);
                onClose();
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      setStatus('confirm');
      setCountdown(5);
    }
    return () => clearInterval(timer);
  }, [isOpen, status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center font-sans overflow-hidden">

      {/* Dynamic Blood-Red Gradient Background */}
      <div className="absolute inset-0 bg-rose-600 dark:bg-rose-950 transition-colors duration-1000 animate-in fade-in duration-500">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]"></div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all hover:scale-110 z-50 text-white"
      >
        <X size={24} />
      </button>

      <div className="relative z-10 text-center space-y-8 max-w-lg w-full px-6">

        {/* CONFIRMATION STATE */}
        {status === 'confirm' && (
          <div className="space-y-8 animate-in zoom-in-95 fade-in duration-500">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-white/20 backdrop-blur-2xl p-8 rounded-full border border-white/30 flex items-center justify-center shadow-2xl">
                <ShieldAlert size={64} className="text-white animate-pulse" />
              </div>
            </div>

            <div>
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4 scale-y-110">
                SOS <span className="text-rose-200">Emergency</span>
              </h1>
              <p className="text-rose-100 font-bold text-lg opacity-80">Do you need immediate assistance?</p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-6">
              <button
                onClick={() => setStatus('counting')}
                className="w-full bg-white text-rose-600 py-6 rounded-[2rem] font-black text-2xl shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-tight"
              >
                Yes, Activate SOS
              </button>
              <button
                onClick={onClose}
                className="w-full bg-rose-800/40 backdrop-blur-md text-white py-5 rounded-[2rem] font-black text-sm hover:bg-rose-800/60 transition-all uppercase tracking-widest border border-white/10"
              >
                I'm Safe, Cancel
              </button>
            </div>
          </div>
        )}

        {/* COUNTDOWN STATE */}
        {status === 'counting' && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-2">
              <Activity size={48} className="text-white/50 animate-pulse" />
              <h1 className="text-sm font-black text-white/60 uppercase tracking-[0.3em]">Deploying Alert</h1>
            </div>

            <div className="relative py-12">
              <div className="text-[12rem] font-black tabular-nums text-white leading-none scale-y-110 drop-shadow-2xl animate-in zoom-in duration-300">
                {countdown}
              </div>
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <div className="w-64 h-64 bg-white/10 rounded-full animate-ping"></div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-white/10 backdrop-blur-xl text-white px-12 py-4 rounded-full font-black text-sm hover:bg-rose-500 transition-all border border-white/20 uppercase tracking-widest"
            >
              Hold to Stop
            </button>
          </div>
        )}

        {/* ACTIVE STATE */}
        {status === 'active' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-700">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Help is on the way</h1>
              <p className="text-rose-100 font-medium">Professional emergency responders have been notified.</p>
            </div>

            <Card className="bg-white/10 p-1 border-white/10 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-5 bg-rose-500/20 p-5 rounded-3xl border border-white/10 transition-transform hover:scale-[1.02]">
                  <div className="bg-white p-3 rounded-2xl shadow-xl shadow-white/10">
                    <Phone size={24} className="text-rose-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black text-rose-200 uppercase tracking-widest">Ambulance Services</div>
                    <div className="text-xl font-black text-white tracking-tight">Connected to 108...</div>
                  </div>
                </div>

                <div className="flex items-center gap-5 bg-rose-500/20 p-5 rounded-3xl border border-white/10 transition-transform hover:scale-[1.02]">
                  <div className="bg-white p-3 rounded-2xl shadow-xl shadow-white/10">
                    <MapPin size={24} className="text-rose-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black text-rose-200 uppercase tracking-widest">Geolocation Active</div>
                    <div className="text-xl font-black text-white tracking-tight italic">Position shared with <span className="text-white border-b-2 border-white/30">{contactName}</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 flex items-center justify-center gap-3">
                <HeartPulse size={18} className="text-white/60 animate-pulse" />
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                  VedaX-AI Emergency Protocol Active
                </p>
              </div>
            </Card>

            <button
              onClick={onClose}
              className="mt-6 text-xs font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
            >
              Exit Emergency Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSOverlay;
