import React, { useState, useRef } from 'react';
import {
   ArrowLeft, User, Activity, FileText, Camera,
   Upload, Check, Loader2, Plus, X, Calendar,
   Clock, MapPin, Download, Stethoscope, Lock, Award, Save, ChevronRight
} from 'lucide-react';
import { UserProfile, Appointment, PrescriptionData } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, Badge, Input } from '@/components/shared/ui';

interface DoctorPatientViewProps {
   user: UserProfile;
   appointment: Appointment | null;
   onBack: () => void;
   onComplete: (data: PrescriptionData) => void;
}

const DoctorPatientView: React.FC<DoctorPatientViewProps> = ({ user, appointment, onBack, onComplete }) => {
   const { t } = useLanguage();
   const isPending = appointment?.status === 'pending';
   const [activeTab, setActiveTab] = useState<'consult' | 'history' | 'reports'>(isPending ? 'history' : 'consult');

   const [diagnosis, setDiagnosis] = useState('');
   const [medications, setMedications] = useState<string[]>([]);
   const [newMed, setNewMed] = useState('');
   const [followUp, setFollowUp] = useState('');
   const [isSaving, setIsSaving] = useState(false);

   const fileInputRef = useRef<HTMLInputElement>(null);


   const handleAddMed = () => {
      if (newMed.trim()) {
         setMedications([...medications, newMed.trim()]);
         setNewMed('');
      }
   };

   const handleComplete = () => {
      setIsSaving(true);
      setTimeout(() => {
         onComplete({ diagnosis, medications, followUp });
         setIsSaving(false);
      }, 1000);
   };

   return (
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* Patient Context Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-5">
               <button onClick={onBack} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                  <ArrowLeft size={20} />
               </button>
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl">
                     {user.name.charAt(0)}
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
                     <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">#{user.id?.slice(-6) || 'VX-2941'} • {user.age}Y • {user.gender}</p>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="success">Active Session</Badge>
               {isPending && <Badge variant="warning">Preview Only</Badge>}
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit">
            {[
               { id: 'consult' as const, label: t('dpv.tab.consult'), icon: Stethoscope, locked: isPending },
               { id: 'history' as const, label: t('dpv.tab.history'), icon: Activity },
               { id: 'reports' as const, label: t('dpv.tab.reports'), icon: FileText }
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => !tab.locked && setActiveTab(tab.id)}
                  disabled={tab.locked}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === tab.id
                     ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                     : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                     } ${tab.locked ? 'opacity-40 cursor-not-allowed' : ''}`}
               >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.locked && <Lock size={12} />}
               </button>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
               {activeTab === 'consult' && (
                  <Card className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Consultation Form</h3>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Initial Diagnosis</label>
                           <Input
                              placeholder="Clinical findings..."
                              value={diagnosis}
                              onChange={e => setDiagnosis(e.target.value)}
                           />
                        </div>

                        <div className="space-y-4">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Medications & Dosage</label>
                           <div className="space-y-2">
                              {medications.map((med, i) => (
                                 <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <span className="text-sm font-bold text-slate-700 dark:text-white">{med}</span>
                                    <button onClick={() => setMedications(medications.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500"><X size={16} /></button>
                                 </div>
                              ))}
                           </div>
                           <div className="flex gap-2">
                              <Input
                                 placeholder="Add medication..."
                                 className="flex-1"
                                 value={newMed}
                                 onChange={e => setNewMed(e.target.value)}
                                 onKeyDown={e => e.key === 'Enter' && handleAddMed()}
                              />
                              <Button icon={Plus} onClick={handleAddMed} />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Follow-up Instructions</label>
                           <textarea
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                              placeholder="Advice for patient..."
                              value={followUp}
                              onChange={e => setFollowUp(e.target.value)}
                           ></textarea>
                        </div>
                     </div>

                     <div className="pt-4 flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={onBack}>Save Draft</Button>
                        <Button
                           variant="primary"
                           className="flex-1 shadow-lg shadow-blue-500/20"
                           icon={Save}
                           isLoading={isSaving}
                           disabled={!diagnosis}
                           onClick={handleComplete}
                        >
                           Complete Consultation
                        </Button>
                     </div>
                  </Card>
               )}

               {activeTab === 'history' && (
                  <div className="space-y-4">
                     {user.medicalEvents.map((event, i) => (
                        <Card key={i} className="flex gap-5 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                 <Activity size={20} />
                              </div>
                              <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800 last:hidden"></div>
                           </div>
                           <div className="flex-1 pb-4">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h4 className="font-extrabold text-slate-900 dark:text-white">{event.title}</h4>
                                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">{event.date}</p>
                                 </div>
                                 <Badge variant="info">{event.type}</Badge>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{event.description}</p>
                           </div>
                        </Card>
                     ))}
                  </div>
               )}

               {activeTab === 'reports' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {user.reports.map((report, i) => (
                        <Card key={i} className="flex items-center justify-between group hover:border-blue-500 transition-all cursor-pointer">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center">
                                 <FileText size={22} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-900 dark:text-white text-sm">{report.title}</h4>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.date}</p>
                              </div>
                           </div>
                           <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition" />
                        </Card>
                     ))}
                  </div>
               )}
            </div>

            {/* Patient Context Sidebar */}
            <div className="space-y-8">
               <Card className="space-y-6">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-widest">Vital Bio</h4>
                  <div className="space-y-4">
                     <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Critical Allergies</p>
                        <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{user.allergies.join(', ') || 'No known allergies'}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Blood Group</p>
                           <p className="font-black text-blue-700 dark:text-blue-300 text-lg">{user.bloodGroup || 'A+'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50">
                           <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">H-Rate (Avg)</p>
                           <p className="font-black text-purple-700 dark:text-purple-300 text-lg">74 bpm</p>
                        </div>
                     </div>
                  </div>
               </Card>

               <Card className="space-y-4">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-widest">Current Medications</h4>
                  <div className="space-y-3">
                     {user.medications.map((med, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                           <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                              <Activity size={16} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-white">{med.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{med.dosage}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         </div>
      </div>
   );
};

export default DoctorPatientView;
