import React, { useState } from 'react';
import { ChevronRight, Stethoscope, Shield, User, Activity, CheckCircle2, Heart, Award, ShieldAlert, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { UserProfile, Medication } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, Input, Badge } from '@/components/shared/ui';

interface OnboardingPageProps {
  onComplete: (user: UserProfile) => void;
  initialName?: string;
  initialEmail?: string;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete, initialName, initialEmail }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: initialName || "",
    age: 0,
    gender: "Male",
    medicalHistory: "",
    medicalEvents: [],
    reports: [],
    allergies: [],
    medications: [],
    emergencyContact: {
      name: "",
      phone: "",
      relation: ""
    }
  });

  const [allergyInput, setAllergyInput] = useState("");
  const [medInput, setMedInput] = useState("");

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleFinish = () => {
    setIsFinishing(true);
    const finalProfile: UserProfile = {
      name: formData.name || "User",
      age: formData.age || 25,
      gender: formData.gender || "Male",
      medicalHistory: formData.medicalHistory || "None",
      medicalEvents: [],
      reports: [],
      allergies: formData.allergies || [],
      medications: formData.medications || [],
      emergencyContact: {
        name: formData.emergencyContact?.name || "Emergency Contact",
        phone: formData.emergencyContact?.phone || "112",
        relation: formData.emergencyContact?.relation || "Family"
      }
    };

    // Simulate a slight save delay for premium feel
    setTimeout(() => {
      onComplete(finalProfile);
    }, 1500);
  };

  const addMedication = () => {
    if (medInput.trim()) {
      const newMed: Medication = {
        id: Date.now().toString(),
        name: medInput.trim(),
        dosage: "As prescribed",
        frequency: "Daily",
        taken: false
      };
      setFormData({ ...formData, medications: [...(formData.medications || []), newMed] });
      setMedInput("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-6 items-center justify-center font-sans overflow-hidden">

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-2xl space-y-8">

        {/* Progress System */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Stethoscope className="text-white w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">VedaX-AI Onboarding</h2>
          </div>
          <div className="flex gap-3 w-full max-w-[400px]">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 space-y-2">
                <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= i ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                <p className={`text-[10px] font-black uppercase text-center tracking-widest ${step >= i ? 'text-blue-600' : 'text-slate-400'}`}>
                  Step {i}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-8 md:p-12 relative overflow-hidden shadow-2xl border-white/20 dark:border-slate-800/50">

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('onboarding.step1_title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{t('onboarding.step1_desc')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.name')}</label>
                  <Input
                    placeholder="e.g. Harshvardhan"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    icon={User}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.age')}</label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={formData.age === 0 ? '' : formData.age}
                    onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    icon={Activity}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.gender')}</label>
                  <select
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold text-slate-700 dark:text-slate-200"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('onboarding.step2_title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{t('onboarding.step2_desc')}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.conditions')}</label>
                  <textarea
                    placeholder="e.g. Diabetes, Hypertension, Asthma..."
                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold text-slate-700 dark:text-slate-300 h-28 resize-none"
                    value={formData.medicalHistory}
                    onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.allergies')}</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add allergy..."
                        value={allergyInput}
                        onChange={e => setAllergyInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (setFormData({ ...formData, allergies: [...(formData.allergies || []), allergyInput] }), setAllergyInput(""))}
                      />
                      <Button className="px-4 text-xl" onClick={() => allergyInput && (setFormData({ ...formData, allergies: [...(formData.allergies || []), allergyInput] }), setAllergyInput(""))}>+</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.allergies?.map((a, i) => (
                        <Badge key={i} variant="warning" className="animate-in zoom-in-50">{a}</Badge>
                      ))}
                      {formData.allergies?.length === 0 && <p className="text-xs text-slate-400 italic font-medium ml-1">No allergies added</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.meds')}</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search meds..."
                        value={medInput}
                        onChange={e => setMedInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addMedication()}
                      />
                      <Button className="px-4 text-xl" onClick={addMedication}>+</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.medications?.map((m, i) => (
                        <Badge key={i} variant="info" className="animate-in zoom-in-50">{m.name}</Badge>
                      ))}
                      {formData.medications?.length === 0 && <p className="text-xs text-slate-400 italic font-medium ml-1">No medications added</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('onboarding.step3_title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{t('onboarding.step3_desc')}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.contact_name')}</label>
                  <Input
                    placeholder="e.g. Vikram Sharma"
                    value={formData.emergencyContact?.name}
                    onChange={e => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact!, name: e.target.value }
                    })}
                    icon={User}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.relation')}</label>
                    <Input
                      placeholder="e.g. Brother"
                      value={formData.emergencyContact?.relation}
                      onChange={e => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact!, relation: e.target.value }
                      })}
                      icon={Heart}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('onboarding.phone')}</label>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.emergencyContact?.phone}
                      onChange={e => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact!, phone: e.target.value }
                      })}
                      icon={Phone}
                    />
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Data Encrypted & Secure</p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold leading-tight mt-0.5">Your medical records are protected with bank-grade security protocols.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 flex gap-4">
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={() => setStep(step - 1)}
                className="px-8"
              >
                Back
              </Button>
            )}
            <Button
              onClick={step === 3 ? handleFinish : handleNext}
              isLoading={isFinishing}
              className="flex-1 py-4 text-lg shadow-xl shadow-blue-500/20 group"
            >
              {step === 3 ? t('onboarding.finish') : t('onboarding.next')}
              {step !== 3 && <ChevronRight size={22} className="transition-transform group-hover:translate-x-1" />}
              {step === 3 && !isFinishing && <CheckCircle2 size={22} className="animate-in zoom-in" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
