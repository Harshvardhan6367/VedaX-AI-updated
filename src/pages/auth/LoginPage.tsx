import React, { useState } from 'react';
import { Stethoscope, User, ArrowRight, Loader2, Lock, ShieldCheck, Mail } from 'lucide-react';
import { AppRoute } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, Input } from '@/components/shared/ui';
import { AuthService } from '@/api/authService';

interface LoginPageProps {
  onLogin: (response: any) => void;
  onNavigate: (route: AppRoute) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const { t } = useLanguage();
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [email, setEmail] = useState('Harshvardhan@gmail.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.login(email, password, role);
      onLogin(response);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-md p-8 md:p-10 space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl border-white/20 dark:border-slate-800/50">

        {/* Branding Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform hover:scale-110 transition-transform duration-300">
            <Stethoscope className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-1">
              VEDAX<span className="text-blue-600">-AI</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('auth.signin_subtitle')}</p>
          </div>
        </div>

        {/* Role Multi-Toggle */}
        <div className="bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl flex relative">
          <button
            onClick={() => setRole('patient')}
            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 z-10 ${role === 'patient'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-500'
              }`}
          >
            <User size={18} /> {t('auth.patient')}
          </button>
          <button
            onClick={() => setRole('doctor')}
            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 z-10 ${role === 'doctor'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-500'
              }`}
          >
            <ShieldCheck size={18} /> {t('auth.doctor')}
          </button>

          {/* Animated Slider */}
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-xl shadow-lg transition-all duration-300 ease-out ${role === 'doctor' ? 'translate-x-[calc(100%+3px)]' : 'translate-x-[3px]'
              }`}
          ></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email Address</label>
              <Input
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Password</label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline">
                  {t('auth.forgot_password')}
                </button>
              </div>
              <Input
                type="password"
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl text-center animate-shake">
              {error}
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-4 text-lg shadow-xl shadow-blue-500/20 group"
          >
            {t('auth.sign_in')}
            {!isLoading && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />}
          </Button>
        </form>


        <div className="space-y-6 pt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider scale-90">
                {t('auth.new_user')}
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => onNavigate(AppRoute.SIGNUP)}
            className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transform hover:-translate-y-0.5"
          >
            {t('auth.create_account')}
          </Button>
        </div>

        {/* Demo Credentials Alert */}
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Demo Note</p>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1">
              Use your registered email and password to log in.
            </p>
          </div>
        </div>

      </Card>
    </div >
  );
};

export default LoginPage;
