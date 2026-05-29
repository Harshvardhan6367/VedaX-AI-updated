import React, { useState, useEffect } from 'react';
import { 
  Droplets, MapPin, Search, PhoneCall, 
  Navigation, ChevronLeft, AlertTriangle 
} from 'lucide-react';
import { AppRoute, UserProfile, BloodBank } from '@/types';
import { EmergencyService } from '@/api/emergencyService';

interface BloodBankFinderProps {
  user: UserProfile;
  onNavigate: (route: AppRoute) => void;
}

const BloodBankFinder: React.FC<BloodBankFinderProps> = ({ user, onNavigate }) => {
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchType, setSearchType] = useState<string>(user.bloodGroup || 'O+');
  const [radius, setRadius] = useState<number>(20); // km

  const fetchBanks = async () => {
    setLoading(true);
    try {
      // Mock patient location
      const banks = await EmergencyService.findBloodBanks(searchType, 26.9124, 75.7873);
      setBloodBanks(banks);
    } catch (e) {
      console.error("Error fetching blood banks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, [searchType, radius]);

  return (
    <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => onNavigate(AppRoute.HOME)}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-transform"
        >
          <ChevronLeft className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Droplets className="text-red-500" fill="currentColor" size={28} />
            Blood Bank Network
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time blood inventory across state</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Search & List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Search Inventory</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Blood Group</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Search Radius: {radius}km</label>
                <input 
                  type="range" 
                  min="5" max="50" step="5"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <button 
                onClick={fetchBanks}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Search size={18} /> Update Results
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Emergency Broadcast</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              If inventory is critically low, you can broadcast an SOS to registered Hero Donors near the selected hospital.
            </p>
            <button 
              onClick={() => EmergencyService.broadcastDonorNeeded(searchType, 2, radius)}
              className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle size={18} /> Alert Local Donors
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-bold text-slate-900 dark:text-white">Live Inventory Results</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
              {bloodBanks.length} Banks Found
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 animate-pulse flex justify-between">
                   <div className="w-1/2 space-y-3">
                     <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                     <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {bloodBanks.map(bank => (
                <div key={bank.bankId} className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-red-500/30 transition-all group flex flex-col sm:flex-row justify-between gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">{bank.name}</h4>
                      {bank.openNow && <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">Open Now</span>}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2">
                      <MapPin size={14} /> {bank.address}
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                      {bank.distance.toFixed(1)} km away • {bank.eta} mins ETA
                    </p>
                    
                    <div className="flex gap-3 mt-auto">
                      <a href={`tel:${bank.phone}`} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                        <PhoneCall size={16} /> Call Bank
                      </a>
                      <button className="flex-1 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                        <Navigation size={16} /> Get Directions
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-slate-950 border border-red-100 dark:border-red-500/20 rounded-2xl p-4 sm:w-32 flex flex-col items-center justify-center text-center shrink-0">
                    <p className="text-3xl font-black text-red-500 mb-1">{bank.unitsAvailable}</p>
                    <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Units <br/> Available</p>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodBankFinder;
