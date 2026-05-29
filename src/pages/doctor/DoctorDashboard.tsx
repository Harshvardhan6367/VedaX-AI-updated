import React from 'react';
import {
  Users, Calendar, Clock, ChevronRight, Video,
  MessageSquare, Search, Filter, Star, Activity,
  Stethoscope, TrendingUp, AlertCircle, Check, X
} from 'lucide-react';
import { Doctor, Appointment, AppRoute, OngoingTreatment } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, Badge, Input } from '@/components/shared/ui';

interface DoctorDashboardProps {
  appointments: Appointment[];
  onSelectPatient: (appointmentId: string) => void;
  onAccept: (appointmentId: string) => void;
  onDecline: (appointmentId: string) => void;
  onStartChat?: (treatment: OngoingTreatment) => void;
  onStartVideoCall?: (treatment: OngoingTreatment) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  appointments,
  onSelectPatient,
  onAccept,
  onDecline,
  onStartChat,
  onStartVideoCall
}) => {
  const { t } = useLanguage();

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');
  const completedToday = appointments.filter(a => a.status === 'completed' && a.date === 'Today').length;

  // Helper to convert appointment to mock treatment for communication overlays
  const getTreatmentFromAppt = (appt: Appointment): OngoingTreatment => ({
    id: appt.userId || appt.id, // Use userId as the "Patient ID" for the conversation
    title: 'Consultation',
    doctorName: 'Vikram Singh',
    doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop',
    progress: 0,
    totalDuration: 'Today',
    nextStep: 'Active Session'
  });

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ... (rest of the component) ... */}
      {/* Search/Availability buttons remain same */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, <span className="text-blue-600 dark:text-blue-400">Dr. Vikram</span>!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">You have {pendingAppointments.length} pending requests today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={Search}>
            Search Patients
          </Button>
          <Button icon={Calendar}>
            Availability
          </Button>
        </div>
      </div>

      {/* Stats Row remains same */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Consults", value: upcomingAppointments.length + completedToday, icon: Stethoscope, color: "blue" },
          { label: "Pending Requests", value: pendingAppointments.length, icon: Clock, color: "amber" },
          { label: "Patient Satisfaction", value: "4.9/5.0", icon: Star, color: "purple" },
          { label: "Week Growth", value: "+12%", icon: TrendingUp, color: "emerald" }
        ].map((stat, i) => (
          <Card key={i} className="flex items-center gap-5 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 shadow-sm shadow-${stat.color}-100 dark:shadow-none`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointment Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Appointment Queue</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"><Filter size={18} /></button>
              <button className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">View All</button>
            </div>
          </div>

          <div className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <Card glass className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-dashed">
                <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300">
                  <Activity size={48} />
                </div>
                <p className="text-slate-400 font-medium">Your queue is empty for now.</p>
                <Button variant="ghost">Manage Schedule</Button>
              </Card>
            ) : (
              upcomingAppointments.map((appt, i) => (
                <Card key={appt.id} className="!p-0 overflow-hidden group hover:translate-x-1 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <div className="p-6 flex-1 flex items-center gap-5 cursor-pointer" onClick={() => onSelectPatient(appt.id)}>
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <Users size={28} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-900 dark:text-white text-lg truncate">Patient #{appt.id.slice(-4)}</h4>
                          <Badge variant={appt.type === 'video' ? 'info' : 'warning'}>{appt.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Clock size={14} /> {appt.time}</span>
                          <span className="flex items-center gap-1.5"><AlertCircle size={14} /> Follow-up</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <button
                        onClick={() => onStartChat?.(getTreatmentFromAppt(appt))}
                        className="flex-1 sm:flex-none p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <Button
                        className="flex-1 sm:flex-none !px-8"
                        icon={appt.type === 'video' ? Video : ChevronRight}
                        onClick={() => {
                          if (appt.type === 'video') {
                            onStartVideoCall?.(getTreatmentFromAppt(appt));
                          } else {
                            onSelectPatient(appt.id);
                          }
                        }}
                      >
                        {appt.type === 'video' ? 'Join Call' : 'Begin View'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Pending Requests */}
          <Card className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">New Requests</h3>
              <Badge variant="error">{pendingAppointments.length}</Badge>
            </div>
            <div className="space-y-4">
              {pendingAppointments.map(req => (
                <div key={req.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Patient #{req.id.slice(-4)}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">{req.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onDecline(req.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"><X size={18} /></button>
                    <button onClick={() => onAccept(req.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"><Check size={18} /></button>
                  </div>
                </div>
              ))}
              {pendingAppointments.length === 0 && <p className="text-center text-slate-400 text-sm italic">No pending requests.</p>}
            </div>
            <Button variant="secondary" className="w-full text-xs" onClick={() => onSelectPatient(pendingAppointments[0]?.id)}>Verify Requests</Button>
          </Card>

          {/* Medical Insights Tip */}
          <Card glass className="bg-blue-600 !text-white border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <h4 className="text-xl font-black leading-tight">VedaX-AI Insight</h4>
              <p className="text-sm text-blue-50 opacity-90 leading-relaxed font-medium">
                Patient trends show an increased demand for <span className="font-bold underline">Tele-Neurology</span> sessions this week.
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">System Recommendation</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
