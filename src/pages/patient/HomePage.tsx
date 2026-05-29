import React, { useState } from 'react';
import {
   Calendar, Clock, MessageSquare, Video, X, Sparkles, Loader2, Zap,
   ChevronRight, FileText, Star, MapPin, Search, Activity, Wind,
   Thermometer, Apple, CheckCircle, Users, Stethoscope, Home, User, Pill
} from 'lucide-react';
import { UserProfile, Appointment, AppRoute, OngoingTreatment, MedicalEvent, Medication } from '@/types';
import { generateHealthSummary, generateHealthTip } from '@/api/geminiService';
import RateDoctorModal from '@/components/patient/RateDoctorModal';
import OngoingTreatmentCard from '@/components/patient/OngoingTreatmentCard';
import TreatmentDetailsModal from '@/components/patient/TreatmentDetailsModal';
import ImageCarousel from '@/components/patient/ImageCarousel';
import { Card, Button, Badge } from '@/components/shared/ui';
import { useLanguage } from '@/contexts/LanguageContext';

interface HomePageProps {
   user: UserProfile;
   appointments: Appointment[];
   onNavigate: (route: AppRoute) => void;
   onRateDoctor: (appointmentId: string, rating: number, review: string) => void;
   onStartVideoCall: (treatment: OngoingTreatment) => void;
   onStartChat: (treatment: OngoingTreatment) => void;
   onOpenReports?: () => void;
   onOpenVFamily?: () => void;
   onOpenMeds: () => void;
   onAddMedOpen: () => void;
}

const MOCK_ONGOING_TREATMENTS: OngoingTreatment[] = [
   {
      id: 't1',
      title: 'Diabetes Management',
      doctorName: 'Dr. Anjali Gupta',
      doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop',
      progress: 65,
      totalDuration: 'Month 4 of 6',
      nextStep: 'HbA1c Test next week',
      doctorSpecialty: 'Endocrinologist'
   },
   {
      id: 't2',
      title: 'Physical Therapy',
      doctorName: 'Dr. Ravi Kumar',
      doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop',
      progress: 30,
      totalDuration: 'Week 5 of 12',
      nextStep: 'Range of Motion Assessment',
      doctorSpecialty: 'Physiotherapist'
   }
];

const HomePage: React.FC<HomePageProps> = ({ user, appointments, onNavigate, onRateDoctor, onStartVideoCall, onStartChat, onOpenReports, onOpenVFamily, onOpenMeds, onAddMedOpen }) => {
   const { t } = useLanguage();
   const [selectedTreatment, setSelectedTreatment] = useState<OngoingTreatment | null>(null);

   const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');
   const completedAppointments = appointments.filter(a => a.status === 'completed');

   return (
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <ImageCarousel />

         {/* Welcome Hero Section */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
            <div>
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t('home.welcome')}, <span className="text-blue-600 dark:text-blue-400">{user.name.split(' ')[0]}</span>!
               </h2>
               <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Here's your health overview for today.</p>
            </div>
            <div className="flex items-center gap-3">
               <Button variant="secondary" icon={Search} onClick={() => onNavigate(AppRoute.DOCTORS)}>
                  Find Doctor
               </Button>
               <Button icon={Calendar} onClick={() => onNavigate(AppRoute.DOCTORS)}>
                  New Appointment
               </Button>
            </div>
         </div>

         {/* Dashboard Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Stats / AI Summary */}
            <div className="lg:col-span-2 space-y-8">


               {/* Ongoing Treatments / Consultations */}
               <div>
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ongoing Care</h3>
                     <button className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">View History</button>
                  </div>

                  {/* VedaX-AI MedGemma Special Tile */}
                  <div className="mb-6 group relative rounded-3xl overflow-hidden cursor-pointer shadow-lg shadow-[#39ff14]/10 border border-[#39ff14]/20 hover:border-[#39ff14]/50 transition-all duration-300" onClick={() => onNavigate(AppRoute.MEDGEMMA)}>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f12] to-[#121c21] z-0"></div>
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#39ff14]/10 blur-3xl rounded-full z-0 pointer-events-none group-hover:bg-[#39ff14]/20 transition-all"></div>
                      
                      <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
                          <div className="flex items-start sm:items-center gap-5 sm:gap-6 flex-col sm:flex-row">
                              <div className="w-16 h-16 rounded-2xl bg-black border border-[#39ff14]/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(57,255,20,0.15)]">
                                  {/* Minimal ECG Logo */}
                                  <svg width="30" height="20" viewBox="0 0 60 40">
                                    <polyline fill="none" stroke="#39ff14" strokeWidth="3" points="0,20 15,20 20,5 25,35 30,20 40,20 45,10 50,30 55,20 60,20" />
                                  </svg>
                              </div>
                              <div>
                                  <div className="flex items-center gap-3 mb-1">
                                      <h4 className="text-xl font-bold text-gray-100 tracking-wide">MedGemma</h4>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30 tracking-wider">OFFLINE</span>
                                  </div>
                                  <p className="text-sm font-medium text-gray-400">Private, local AI for symptom & scan analysis</p>
                              </div>
                          </div>
                          <div className="hidden sm:flex w-10 h-10 rounded-full bg-[#39ff14]/10 items-center justify-center group-hover:bg-[#39ff14]/20 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4">
                              <ChevronRight className="w-5 h-5 text-[#39ff14]" />
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {MOCK_ONGOING_TREATMENTS.map(treatment => (
                        <div key={treatment.id} className="group relative">
                           <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
                           <OngoingTreatmentCard
                              treatment={treatment}
                              onVideoCall={onStartVideoCall}
                              onChat={onStartChat}
                              onShowDetails={setSelectedTreatment}
                           />
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Sidebar Dash Column */}
            <div className="space-y-8">
               {/* Quick Actions */}
               <Card className="space-y-4">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                     <Zap size={20} className="text-amber-500" /> Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { icon: Pill, label: "Meds", color: "blue", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-800/50", text: "text-blue-600 dark:text-blue-400", onClick: onAddMedOpen },
                        { icon: FileText, label: "Reports", color: "emerald", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-800/50", text: "text-emerald-600 dark:text-emerald-400", onClick: onOpenReports },
                        { icon: Video, label: "Consult", color: "purple", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-100 dark:border-purple-800/50", text: "text-purple-600 dark:text-purple-400", onClick: () => onStartVideoCall(MOCK_ONGOING_TREATMENTS[0]) },
                        { icon: Users, label: "V-Family", color: "amber", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800/50", text: "text-amber-600 dark:text-amber-400", onClick: onOpenVFamily }
                     ].map((action, i) => (
                        <button key={i} onClick={action.onClick} className={`p-4 rounded-2xl ${action.bg} border ${action.border} ${action.text} flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all`}>
                           <action.icon size={22} />
                           <span className="text-xs font-black tracking-tight">{action.label}</span>
                        </button>
                     ))}
                  </div>
               </Card>

               {/* Appointments Timeline */}
               <Card className="!p-0 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                     <h3 className="font-extrabold text-slate-900 dark:text-white">Appointments</h3>
                     <Badge variant="info">{upcomingAppointments.length}</Badge>
                  </div>
                  <div className="p-2 space-y-1">
                     {upcomingAppointments.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm">No upcoming visits.</div>
                     ) : (
                        upcomingAppointments.map(appt => (
                           <button key={appt.id} className="w-full p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-4 group text-left" onClick={() => onNavigate(AppRoute.DOCTORS)}>
                              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                 <p className="text-[10px] font-black uppercase">Oct</p>
                                 <p className="text-lg font-black leading-none">24</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{appt.doctorName}</p>
                                 <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{appt.time} • {appt.type}</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                           </button>
                        ))
                     )}
                  </div>
               </Card>
            </div>

            {selectedTreatment && (
               <TreatmentDetailsModal
                  treatment={selectedTreatment}
                  onClose={() => setSelectedTreatment(null)}
                  onChat={onStartChat}
                  onVideoCall={onStartVideoCall}
               />
            )}
         </div>
      </div>
   );
};

export default HomePage;
