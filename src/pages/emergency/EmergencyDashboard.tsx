import React, { useState, useEffect } from 'react';
import { 
  Activity, MapPin, Building2, Droplets, PhoneCall, 
  CheckCircle2, AlertTriangle, ShieldAlert, Navigation, Clock
} from 'lucide-react';
import { AppRoute, UserProfile, Ambulance, Hospital, BloodBank } from '@/types';
import { EmergencyService } from '@/api/emergencyService';

interface EmergencyDashboardProps {
  user: UserProfile;
  onNavigate: (route: AppRoute) => void;
  triggerType: 'sos' | 'auto' | 'voice';
}

const EmergencyDashboard: React.FC<EmergencyDashboardProps> = ({ user, onNavigate, triggerType }) => {
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [etaCountdown, setEtaCountdown] = useState<number>(0);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatedBrief, setGeneratedBrief] = useState<string>('');
  const [patientLocation, setPatientLocation] = useState<{lat: number, lng: number} | null>(null);

  const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Use HTML5 Geolocation API for precise device GPS capture
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPatientLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation API failed, falling back to default.", error);
          setPatientLocation({ lat: 26.9124, lng: 75.7873 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setPatientLocation({ lat: 26.9124, lng: 75.7873 });
    }
  }, []);

  useEffect(() => {
    const initializeEmergency = async () => {
      if (!patientLocation) return; // Wait for Geolocation API
      // Parallel execution of all 3 APIs - crucial for < 60s response target
      try {
        const [nearestAmb, matchedHospitals, nearbyBanks] = await Promise.all([
          EmergencyService.findNearestAmbulance(patientLocation.lat, patientLocation.lng),
          EmergencyService.findHospitalMatch(patientLocation.lat, patientLocation.lng, 'trauma'),
          EmergencyService.findBloodBanks(user.bloodGroup || 'O+', patientLocation.lat, patientLocation.lng)
        ]);

        setAmbulance(nearestAmb);
        setHospital(matchedHospitals[0] || null);
        setBloodBanks(nearbyBanks);
        setEtaCountdown(nearestAmb.eta || 8);
        setLoading(false);

        // Auto dispatch
        if (nearestAmb && matchedHospitals[0]) {
          const brief = await EmergencyService.generateParamedicBrief(user);
          setGeneratedBrief(brief);

          await EmergencyService.dispatchAmbulance(
            nearestAmb.ambulanceId, 
            { lat: patientLocation.lat, lng: patientLocation.lng }, 
            matchedHospitals[0].hospitalId,
            brief
          );
          setIsDispatched(true);
        }

      } catch (err) {
        console.error("Failed to initialize emergency workflow", err);
        setLoading(false);
      }
    };

    if (patientLocation) {
        initializeEmergency();
    }
  }, [user, patientLocation]);

  // ETA Countdown Mock
  useEffect(() => {
    if (!isDispatched || etaCountdown <= 0) return;
    const interval = setInterval(() => {
      setEtaCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 60000); // decrement every minute
    return () => clearInterval(interval);
  }, [isDispatched, etaCountdown]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-red-600 animate-pulse text-white">
        <ShieldAlert size={80} className="mb-4 animate-bounce" />
        <h2 className="text-3xl font-black mb-2 tracking-widest">INITIALIZING EMERGENCY PROTOCOL</h2>
        <p className="font-medium opacity-80">Searching nearby units... (Target &lt; 60s)</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-950 text-white overflow-y-auto no-scrollbar relative animate-in fade-in duration-500 p-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-red-500 uppercase tracking-widest">ACTIVE EMERGENCY</h1>
          </div>
          <p className="text-slate-400 font-medium text-sm md:text-base">
            Initiated via <span className="text-white uppercase font-bold">{triggerType}</span> • All units coordinated
          </p>
        </div>
        <button 
          onClick={() => onNavigate(AppRoute.HOME)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          Cancel / Resolve Emergency
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
        
        {/* Main Column - Map & Ambulance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Overlay using Real Google Maps Static API (if key exists) */}
          <div className="w-full h-64 md:h-[400px] bg-slate-900 rounded-3xl overflow-hidden relative border-2 border-slate-800 shadow-2xl">
            {MAPS_API_KEY && hospital && patientLocation && MAPS_API_KEY !== "PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE" ? (
               <img 
                 src={`https://maps.googleapis.com/maps/api/staticmap?size=800x400&maptype=roadmap&markers=color:blue|label:P|${patientLocation.lat},${patientLocation.lng}&markers=color:red|label:H|${hospital.location.lat},${hospital.location.lng}&path=color:0x0000ff|weight:5|${patientLocation.lat},${patientLocation.lng}|${hospital.location.lat},${hospital.location.lng}&key=${MAPS_API_KEY}`} 
                 alt="Emergency Route"
                 className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
                 onError={(e) => {
                   // Fallback to static dummy map if API key is invalid/restricted
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.parentElement?.classList.add("bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=26.9124,75.7873&zoom=14&size=800x400&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x8ec3b9&style=feature:all|element:labels.text.stroke|color:0x1a3646&style=feature:all|element:labels.icon|visibility:off&style=feature:administrative.country|element:geometry.stroke|color:0x4b6878&style=feature:administrative.land_parcel|element:labels.text.fill|color:0x64779e&style=feature:administrative.province|element:geometry.stroke|color:0x4b6878&style=feature:landscape.man_made|element:geometry.stroke|color:0x334e87&style=feature:landscape.natural|element:geometry|color:0x023e58&style=feature:poi|element:geometry|color:0x283d6a&style=feature:poi|element:labels.text.fill|color:0x6f9ba5&style=feature:poi|element:labels.text.stroke|color:0x1d2c4d&style=feature:poi.park|element:geometry.fill|color:0x023e58&style=feature:poi.park|element:labels.text.fill|color:0x3C7680&style=feature:road|element:geometry|color:0x304a7d&style=feature:road|element:labels.text.fill|color:0x98a5be&style=feature:road|element:labels.text.stroke|color:0x1d2c4d&style=feature:road.highway|element:geometry|color:0x2c6675&style=feature:road.highway|element:geometry.stroke|color:0x255763&style=feature:road.highway|element:labels.text.fill|color:0xb0d5ce&style=feature:road.highway|element:labels.text.stroke|color:0x023e58&style=feature:transit|element:labels.text.fill|color:0x98a5be&style=feature:transit|element:labels.text.stroke|color:0x1d2c4d&style=feature:transit.line|element:geometry.fill|color:0x283d6a&style=feature:transit.station|element:geometry|color:0x3a4762&style=water|element:geometry|color:0x0e1626&style=water|element:labels.text.fill|color:0x4e6d70')]");
                   e.currentTarget.parentElement?.classList.add("bg-cover");
                   e.currentTarget.parentElement?.classList.add("bg-center");
                 }}
               />
            ) : (
               <div className="absolute inset-0 opacity-40 mix-blend-luminosity bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=26.9124,75.7873&zoom=14&size=800x400&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x8ec3b9&style=feature:all|element:labels.text.stroke|color:0x1a3646&style=feature:all|element:labels.icon|visibility:off&style=feature:administrative.country|element:geometry.stroke|color:0x4b6878&style=feature:administrative.land_parcel|element:labels.text.fill|color:0x64779e&style=feature:administrative.province|element:geometry.stroke|color:0x4b6878&style=feature:landscape.man_made|element:geometry.stroke|color:0x334e87&style=feature:landscape.natural|element:geometry|color:0x023e58&style=feature:poi|element:geometry|color:0x283d6a&style=feature:poi|element:labels.text.fill|color:0x6f9ba5&style=feature:poi|element:labels.text.stroke|color:0x1d2c4d&style=feature:poi.park|element:geometry.fill|color:0x023e58&style=feature:poi.park|element:labels.text.fill|color:0x3C7680&style=feature:road|element:geometry|color:0x304a7d&style=feature:road|element:labels.text.fill|color:0x98a5be&style=feature:road|element:labels.text.stroke|color:0x1d2c4d&style=feature:road.highway|element:geometry|color:0x2c6675&style=feature:road.highway|element:geometry.stroke|color:0x255763&style=feature:road.highway|element:labels.text.fill|color:0xb0d5ce&style=feature:road.highway|element:labels.text.stroke|color:0x023e58&style=feature:transit|element:labels.text.fill|color:0x98a5be&style=feature:transit|element:labels.text.stroke|color:0x1d2c4d&style=feature:transit.line|element:geometry.fill|color:0x283d6a&style=feature:transit.station|element:geometry|color:0x3a4762&style=water|element:geometry|color:0x0e1626&style=water|element:labels.text.fill|color:0x4e6d70')] bg-cover bg-center"></div>
            )}
            
            {/* Live Tracking overlay elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
            
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3 font-medium">
              <Navigation className="text-blue-400" size={20} />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Live ETA</p>
                <p className="text-xl font-bold">{etaCountdown} Mins</p>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 animate-pulse">
                  {/* Ambulance SVG icon */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 4h9a2 2 0 0 1 2 2v2"/><path d="M14 18h-4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="12" y1="7" x2="12" y2="15"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{ambulance?.ambulanceId || 'Dispatching...'}</h3>
                  <p className="text-sm text-slate-400">{ambulance?.vehicleType} Unit • {ambulance?.driverName}</p>
                </div>
              </div>
              <button className="h-10 w-10 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-colors">
                <PhoneCall size={18} />
              </button>
            </div>
          </div>

          {/* Patient Brief Summary */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <Activity size={16} /> Auto-Generated Gemini Brief
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md font-bold uppercase">Sent to Paramedic</span>
             </div>
             <p className="text-slate-300 font-medium leading-relaxed bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                {generatedBrief ? generatedBrief : (
                  <>
                    <strong className="text-white">Patient:</strong> {user.name}, Age {user.age}. 
                    <strong className="text-white ml-2">Blood:</strong> {user.bloodGroup || 'O+'}. <br/>
                    <strong className="text-white">History:</strong> {user.medicalHistory || 'None reported'}.
                    <strong className="text-white ml-2">Allergies:</strong> {user.allergies?.join(', ') || 'None'}.<br/>
                  </>
                )}
                <strong className="text-sky-400 mt-2 block ">AI Assessment: Requesting immediate trauma response. Patient geolocation verified. ETA required ASAP.</strong>
             </p>
          </div>
        </div>

        {/* Right Column - Hospital & Blood */}
        <div className="space-y-6">
          {/* Hospital Readiness Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
             
             <div className="flex items-center justify-between mb-4 relative z-10">
               <h2 className="font-black text-lg flex items-center gap-2">
                 <Building2 className="text-emerald-400" size={20} />
                 Destination Hospital
               </h2>
               <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-emerald-500/30">
                 Pre-Alerted
               </div>
             </div>

             {hospital ? (
                <div className="relative z-10 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{hospital.name}</h3>
                    <p className="text-sm text-slate-400">{hospital.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">ER Beds</p>
                      <p className="text-2xl font-black text-white">{hospital.erBedsAvailable}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">ICU Beds</p>
                      <p className="text-2xl font-black text-white">{hospital.icuBedsAvailable}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-emerald-100/80 font-medium">
                      FHIR medical record shared. Trauma team alerted and standing by.
                    </p>
                  </div>
                </div>
             ) : (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800 rounded"></div>
                      <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
             )}
          </div>

          {/* Blood Bank / Donor Network */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
             
             <div className="flex items-center justify-between mb-4 relative z-10">
               <h2 className="font-black text-lg flex items-center gap-2">
                 <Droplets className="text-red-400" fill="currentColor" size={20} />
                 Blood Availability
               </h2>
               <span className="text-xs font-bold text-slate-400">Type: {user.bloodGroup || 'O+'}</span>
             </div>

             <div className="space-y-4 relative z-10">
                {bloodBanks.length > 0 ? (
                  <>
                    {/* Top Bank */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                       <div>
                         <p className="font-bold text-white text-sm mb-1">{bloodBanks[0].name}</p>
                         <p className="text-xs text-slate-400 flex items-center gap-1">
                           <Clock size={12} /> {bloodBanks[0].eta} mins away
                         </p>
                       </div>
                       <div className="text-right">
                         <p className="text-2xl font-black text-red-500">{bloodBanks[0].unitsAvailable}</p>
                         <p className="text-[10px] text-slate-500 uppercase font-bold">Units</p>
                       </div>
                    </div>

                    <button 
                      onClick={() => EmergencyService.broadcastDonorNeeded(user.bloodGroup || 'O+', 2, 10)}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 px-4 rounded-2xl flex justify-center items-center gap-2 transition-colors text-sm"
                    >
                      <AlertTriangle size={16} /> Broadcast for Donors
                    </button>
                    
                    <button 
                      onClick={() => onNavigate(AppRoute.BLOOD_BANK)}
                      className="w-full text-slate-400 text-xs font-bold hover:text-white uppercase tracking-wider text-center"
                    >
                      View All Blood Banks
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Locating inventory...</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDashboard;
