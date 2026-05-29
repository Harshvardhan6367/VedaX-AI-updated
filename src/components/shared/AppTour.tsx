
import React, { useState, useMemo } from 'react';
import { ChevronRight, X, MessageSquare, Stethoscope, ShieldAlert, User, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppTourProps {
  isOpen: boolean;
  onComplete: () => void;
}

const AppTour: React.FC<AppTourProps> = ({ isOpen, onComplete }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => [
    {
      title: t('tour.welcome_title'),
      description: t('tour.welcome_desc'),
      icon: <Activity size={48} className="text-blue-600 dark:text-blue-400" />,
      color: "bg-blue-100 dark:bg-blue-900/30"
    },

    {
      title: t('tour.doctors_title'),
      description: t('tour.doctors_desc'),
      icon: <Stethoscope size={48} className="text-emerald-600 dark:text-emerald-400" />,
      color: "bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
      title: t('tour.sos_title'),
      description: t('tour.sos_desc'),
      icon: <ShieldAlert size={48} className="text-red-600 dark:text-red-400" />,
      color: "bg-red-100 dark:bg-red-900/30"
    },
    {
      title: t('tour.profile_title'),
      description: t('tour.profile_desc'),
      icon: <User size={48} className="text-amber-600 dark:text-amber-400" />,
      color: "bg-amber-100 dark:bg-amber-900/30"
    }
  ], [t]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const stepData = steps[currentStep];

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 text-xs font-bold uppercase tracking-wider"
        >
          {t('tour.skip')}
        </button>

        <div className="flex flex-col items-center text-center mt-6">
          <div className={`${stepData.color} w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner transition-colors duration-300`}>
            {stepData.icon}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-all duration-300">{stepData.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8 min-h-[80px] transition-all duration-300">
            {stepData.description}
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-700'
                  }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"
          >
            {currentStep === steps.length - 1 ? t('tour.get_started') : t('tour.next')}
            {currentStep !== steps.length - 1 && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppTour;
