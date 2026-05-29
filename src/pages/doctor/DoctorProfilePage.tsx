import React, { useState } from 'react';
import {
   User, Mail, Phone, Calendar, Shield, LogOut, Camera,
   MapPin, Heart, Activity, FileText, ChevronRight, Edit3, Save,
   Award, Briefcase, Star, CheckCircle, Video, Stethoscope, Users
} from 'lucide-react';
import { Doctor } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, Badge, Input } from '@/components/shared/ui';

interface DoctorProfilePageProps {
   doctor: Doctor;
   onUpdate: (doctor: Doctor) => void;
   onLogout: () => void;
}

const DoctorProfilePage: React.FC<DoctorProfilePageProps> = ({ doctor, onUpdate, onLogout }) => {
   const { t } = useLanguage();
   const [isEditing, setIsEditing] = useState(false);
   const [formData, setFormData] = useState({ ...doctor });

   const handleSave = () => {
      onUpdate(formData);
      setIsEditing(false);
   };

   return (
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('doc_profile.title')}</h2>
               <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage your professional profile and availability.</p>
            </div>
            <div className="flex gap-3">
               {isEditing ? (
                  <Button variant="primary" icon={Save} onClick={handleSave}>
                     Save Professional Profile
                  </Button>
               ) : (
                  <Button variant="secondary" icon={Edit3} onClick={() => setIsEditing(true)}>
                     Edit Profile
                  </Button>
               )}
               <Button variant="danger" icon={LogOut} onClick={onLogout}>
                  Logout
               </Button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Professional Card */}
            <div className="space-y-6">
               <Card glass className="!p-0 overflow-hidden relative group">
                  <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                     {doctor.verified && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                           <CheckCircle size={12} /> Verified Expert
                        </div>
                     )}
                  </div>
                  <div className="px-6 pb-6 text-center">
                     <div className="relative inline-block -mt-16 mb-4">
                        <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-900 p-2 shadow-2xl relative">
                           <img src={doctor.image} alt={doctor.name} className="w-full h-full rounded-2xl object-cover bg-slate-100 dark:bg-slate-800" />
                           <button className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all">
                              <Camera size={16} />
                           </button>
                        </div>
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white">{doctor.name}</h3>
                     <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">{doctor.specialty}</p>

                     <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4">
                        <div className="text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                           <p className="font-bold text-slate-800 dark:text-white">{doctor.experience}Y+</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</p>
                           <div className="flex items-center justify-center gap-1 font-bold text-slate-800 dark:text-white">
                              {doctor.rating} <Star size={12} className="text-amber-500 fill-amber-500" />
                           </div>
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Video</p>
                           <p className="font-bold text-slate-800 dark:text-white">{doctor.isVideoEnabled ? 'Yes' : 'No'}</p>
                        </div>
                     </div>
                  </div>
               </Card>

               <Card className="space-y-4">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-widest">Account Status</h4>
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                           <Shield size={20} />
                        </div>
                        <div>
                           <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">Active</p>
                           <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider">Online Profile Visibility</p>
                        </div>
                     </div>
                     <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                  </div>
               </Card>
            </div>

            {/* Right Column - Professional Details */}
            <div className="lg:col-span-2 space-y-8">
               <Card className="!p-0 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                     <h3 className="font-extrabold text-slate-900 dark:text-white">Credentials & Information</h3>
                     <Badge variant="success">Level 4 Tier</Badge>
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Professional Name</label>
                           <Input
                              icon={User}
                              disabled={!isEditing}
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Specialization</label>
                           <Input
                              icon={Stethoscope}
                              disabled={!isEditing}
                              value={formData.specialty}
                              onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Qualifications</label>
                           <div className="flex flex-wrap gap-2">
                              {doctor.qualifications?.map((qual, i) => (
                                 <Badge key={i} variant="info" className="!normal-case !text-sm !py-1.5 !px-3">{qual}</Badge>
                              ))}
                              {isEditing && (
                                 <button className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs font-bold hover:border-blue-500 hover:text-blue-500 transition-all">+ Add Degree</button>
                              )}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Consultation Fee</label>
                           <Input
                              disabled={!isEditing}
                              value={formData.price}
                              onChange={e => setFormData({ ...formData, price: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Professional Bio</label>
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                           {isEditing ? (
                              <textarea
                                 className="w-full bg-transparent outline-none text-sm text-slate-600 dark:text-slate-300 min-h-[120px]"
                                 value={formData.about}
                                 onChange={e => setFormData({ ...formData, about: e.target.value })}
                              />
                           ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                 {doctor.about || 'Provide a brief summary of your medical career and areas of expertise.'}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>
               </Card>

               <Card className="!p-0 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                     <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Award size={20} className="text-blue-500" /> Statistics & Performance
                     </h3>
                     <button className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline">Full Analytics</button>
                  </div>
                  <div className="p-8">
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                           { label: "Total Patients", value: "1,248", icon: Users, color: "blue" },
                           { label: "Total Consults", value: "3,892", icon: Briefcase, color: "purple" },
                           { label: "Overall Rating", value: "4.9/5", icon: Star, color: "amber" },
                           { label: "Video Calls", value: "842", icon: Video, color: "emerald" }
                        ].map((stat, i) => (
                           <div key={i} className="space-y-2 p-4 rounded-2xl border border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <div className={`p-2 w-fit rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 mb-2`}>
                                 <stat.icon size={20} />
                              </div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</h4>
                              <p className="text-xl font-black text-slate-800 dark:text-white">{stat.value}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </Card>
            </div>
         </div>
      </div>
   );
};

export default DoctorProfilePage;
