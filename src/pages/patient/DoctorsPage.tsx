import React, { useState } from 'react';
import {
   Star, MapPin, Clock, Check, Video, Calendar, X, Briefcase, Award,
   CheckCircle, Search, Stethoscope, ChevronRight, BarChart3, TrendingUp, HelpCircle
} from 'lucide-react';
import { Doctor } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, Button, Badge } from '@/components/shared/ui';

interface DoctorsPageProps {
   doctors: Doctor[];
   filterSpecialty: string | null;
   onBook: (doctor: Doctor, date: string, time: string, type: 'video' | 'in-person') => void;
   userCity?: string;
}

const DoctorsPage: React.FC<DoctorsPageProps> = ({ doctors, filterSpecialty, onBook, userCity }) => {
   const { t } = useLanguage();
   const [selectedDate, setSelectedDate] = useState('Today');
   const [bookingDoctor, setBookingDoctor] = useState<string | null>(null);
   const [videoOnly, setVideoOnly] = useState(false);
   const [viewProfileDoctor, setViewProfileDoctor] = useState<Doctor | null>(null);
   const [showAnalytics, setShowAnalytics] = useState(false);

   const filteredDoctors = doctors.filter(d => {
      const matchesSpecialty = filterSpecialty
         ? d.specialty.toLowerCase().includes(filterSpecialty.toLowerCase()) || d.specialty === 'General Physician'
         : true;
      const matchesVideo = videoOnly ? d.isVideoEnabled : true;
      return matchesSpecialty && matchesVideo;
   });

   const handleBooking = (doctor: Doctor) => {
      setBookingDoctor(doctor.id);
      setTimeout(() => {
         onBook(doctor, selectedDate, doctor.nextAvailable.split(', ')[1] || '10:00 AM', videoOnly ? 'video' : 'in-person');
         setBookingDoctor(null);
         setViewProfileDoctor(null);
      }, 1500);
   };

   // Analytics Computation
   const analyticsData = React.useMemo(() => {
      if (filteredDoctors.length === 0) return null;

      // 1. Parse fees and calculate value scores
      const doctorsWithValue = filteredDoctors.map(doc => {
         const feeText = doc.price.replace(/[^0-9]/g, '');
         const feeNum = parseInt(feeText, 10) || 500; // default 500 if parsing fails

         // Value Formula: (Rating^2) / Fee. Multiply by 100 for readability
         const valueScore = ((Math.pow(doc.rating, 2)) / feeNum) * 100;

         return { ...doc, feeNum, valueScore };
      }).sort((a, b) => b.valueScore - a.valueScore);

      // 2. Aggregate Data
      const totalFee = doctorsWithValue.reduce((acc, curr) => acc + curr.feeNum, 0);
      const avgFee = Math.round(totalFee / doctorsWithValue.length);

      const totalRating = doctorsWithValue.reduce((acc, curr) => acc + curr.rating, 0);
      const avgRating = (totalRating / doctorsWithValue.length).toFixed(1);

      // 3. Top Picks
      const bestValueDoctor = doctorsWithValue[0];
      const top3 = doctorsWithValue.slice(0, 3);

      return { avgFee, avgRating, bestValueDoctor, top3 };
   }, [filteredDoctors]);

   return (
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* Header & Filter Info */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('find_doc.title')}</h2>
               <div className="flex items-center gap-3">
                  {filterSpecialty && (
                     <Badge variant="info" className="!py-1.5 !px-3">{t('find_doc.recommended')}: {filterSpecialty}</Badge>
                  )}
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                     Showing {filteredDoctors.length} specialists
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${showAnalytics
                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                     : 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                     }`}
               >
                  <BarChart3 size={18} />
                  <span className="hidden sm:inline">Analytics</span>
               </button>
               <button
                  onClick={() => setVideoOnly(!videoOnly)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${videoOnly
                     ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                     : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                     }`}
               >
                  <Video size={18} />
                  <span className="hidden sm:inline">{t('find_doc.video_consult')}</span>
               </button>
            </div>
         </div>

         {/* Analytics Dashboard Panel */}
         {showAnalytics && analyticsData && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/20 rounded-[2rem] p-6 md:p-8 border border-blue-100 dark:border-blue-900/30 shadow-inner animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-blue-800 dark:text-blue-300">
                     <TrendingUp size={24} />
                     <h3 className="text-xl font-black">Market Insights</h3>
                  </div>
                  <Badge variant="info" className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                     {filterSpecialty || 'All Specialties'}
                  </Badge>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Stats Column */}
                  <div className="space-y-4">
                     <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Average Fee</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white">₹{analyticsData.avgFee}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                           <Award size={24} />
                        </div>
                     </div>
                     <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Average Rating</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                              {analyticsData.avgRating} <Star size={20} className="text-amber-500" fill="currentColor" />
                           </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                           <Star size={24} />
                        </div>
                     </div>
                  </div>

                  {/* Best Value Recommendation */}
                  <div className="lg:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-1 shadow-xl shadow-blue-500/20 isolate relative overflow-hidden">
                     <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 blur-2xl rounded-full"></div>
                     <div className="bg-white dark:bg-slate-900 rounded-xl p-6 h-full flex flex-col sm:flex-row gap-6 items-center sm:items-start relative z-10">
                        <div className="relative shrink-0">
                           <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-70 animate-pulse"></div>
                           <img src={analyticsData.bestValueDoctor.image} alt={analyticsData.bestValueDoctor.name} className="relative w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 object-cover" />
                           <div className="absolute -bottom-2 lg:-left-2 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-slate-900 flex items-center gap-1">
                              <Check size={12} /> BEST VALUE
                           </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                           <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                              {analyticsData.bestValueDoctor.name}
                           </h4>
                           <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3">
                              {analyticsData.bestValueDoctor.specialty}
                           </p>

                           <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-4">
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm">
                                 <Star size={16} className="text-amber-500" fill="currentColor" />
                                 {analyticsData.bestValueDoctor.rating} Rating
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm">
                                 <Award size={16} className="text-emerald-500" />
                                 {analyticsData.bestValueDoctor.price} Fee
                              </div>
                           </div>

                           <div className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2 max-w-md">
                              <HelpCircle size={14} className="shrink-0 mt-0.5" />
                              <p>This doctor is recommended based on having an exceptional rating relative to their fee for this specialty.</p>
                           </div>
                        </div>

                        <div className="shrink-0 w-full sm:w-auto">
                           <Button onClick={() => handleBooking(analyticsData.bestValueDoctor)} className="w-full shadow-lg shadow-blue-500/25">
                              Book Now
                           </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Date Filters */}
         <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {[t('common.today'), t('common.tomorrow'), 'Oct 24', 'Oct 25'].map(date => (
               <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-6 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all duration-300 ${selectedDate === date
                     ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105'
                     : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-blue-400'
                     }`}
               >
                  {date}
               </button>
            ))}
         </div>

         {/* Doctors List */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDoctors.length === 0 ? (
               <div className="col-span-full text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                     <Search size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('find_doc.no_results')}</h3>
                  <button onClick={() => window.location.reload()} className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all">
                     {t('find_doc.clear_filters')}
                  </button>
               </div>
            ) : (
               filteredDoctors.map(doctor => (
                  <Card key={doctor.id} glass className="!p-0 overflow-hidden group flex flex-col h-full border-white/10">
                     <div className="p-6 flex gap-5 cursor-pointer flex-1" onClick={() => setViewProfileDoctor(doctor)}>
                        <div className="relative">
                           <img src={doctor.image} alt={doctor.name} className="w-24 h-24 rounded-2xl object-cover bg-slate-200 dark:bg-slate-800 group-hover:scale-105 transition-transform duration-500" />
                           {doctor.isVideoEnabled && (
                              <div className="absolute -bottom-2 -right-2 p-1.5 bg-purple-600 rounded-xl text-white shadow-lg">
                                 <Video size={14} />
                              </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                 <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-1.5 truncate">
                                    {doctor.name}
                                    {doctor.verified && <CheckCircle size={16} className="text-blue-500 shrink-0" />}
                                 </h3>
                                 <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{doctor.specialty}</p>
                              </div>
                              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg text-xs font-black">
                                 <Star size={12} fill="currentColor" />
                                 {doctor.rating}
                              </div>
                           </div>

                           <div className="mt-4 flex flex-wrap gap-y-2 gap-x-4 items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {doctor.experience && (
                                 <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200">
                                    <Briefcase size={14} className="text-slate-400" />
                                    <span>{doctor.experience}Y Exp</span>
                                 </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                 <MapPin size={14} className="text-slate-400" />
                                 <span className="truncate">{userCity || "Indiranagar"}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50">
                        <div className="space-y-0.5">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('find_doc.next_available')}</p>
                           <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{doctor.nextAvailable}</p>
                        </div>
                        <Button
                           onClick={() => handleBooking(doctor)}
                           isLoading={bookingDoctor === doctor.id}
                           className="min-w-[120px] !py-2.5 !px-4 !text-sm"
                        >
                           {doctor.price}
                        </Button>
                     </div>
                  </Card>
               ))
            )}
         </div>
      </div>
   );
};

export default DoctorsPage;
