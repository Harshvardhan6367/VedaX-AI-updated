import { Ambulance, Hospital, BloodBank, Donor } from '@/types';

// Mock Data for Hackathon
export const MOCK_AMBULANCES: Ambulance[] = [
  {
    ambulanceId: 'AMB-JPN-042',
    driverName: 'Ramesh Singh',
    phone: '+91-9876543210',
    currentLocation: { lat: 26.9124, lng: 75.7873 },
    status: 'available',
    vehicleType: 'ALS',
    equippedWith: ['Defibrillator', 'Oxygen', 'IV Kit', 'Ventilator']
  },
  {
    ambulanceId: 'AMB-JPN-088',
    driverName: 'Suresh Kumar',
    phone: '+91-9876543211',
    currentLocation: { lat: 26.9200, lng: 75.8000 },
    status: 'available',
    vehicleType: 'BLS',
    equippedWith: ['Oxygen', 'First Aid']
  }
];

export const MOCK_HOSPITALS: Hospital[] = [
  {
    hospitalId: 'HOSP-001',
    name: 'SMS Hospital',
    address: 'JLN Marg, Jaipur',
    location: { lat: 26.8920, lng: 75.8150 },
    erBedsAvailable: 4,
    icuBedsAvailable: 2,
    specialties: ['trauma', 'cardiology', 'neurology']
  },
  {
    hospitalId: 'HOSP-002',
    name: 'Fortis Escorts',
    address: 'Malviya Nagar, Jaipur',
    location: { lat: 26.8500, lng: 75.8200 },
    erBedsAvailable: 8,
    icuBedsAvailable: 5,
    specialties: ['cardiology', 'orthopedics']
  }
];

export const MOCK_BLOOD_BANKS: BloodBank[] = [
  {
    bankId: 'BB-JPN-001',
    name: 'SMS Hospital Blood Bank',
    address: 'JLN Marg, Jaipur',
    phone: '+91-141-2560291',
    location: { lat: 26.8920, lng: 75.8150 },
    distance: 3.2, // km
    eta: 8, // minutes
    bloodType: 'O+',
    unitsAvailable: 6,
    openNow: true
  },
  {
    bankId: 'BB-JPN-002',
    name: 'Sanjeevani Blood Bank',
    address: 'Tonk Road, Jaipur',
    phone: '+91-141-2700101',
    location: { lat: 26.8700, lng: 75.8000 },
    distance: 5.5,
    eta: 12,
    bloodType: 'O+',
    unitsAvailable: 2,
    openNow: true
  }
];

export const EmergencyService = {
  // Real Google Maps Distance Matrix Integration
  async getRealDistanceAndETA(originLat: number, originLng: number, destLat: number, destLng: number): Promise<{ distance: number, eta: number } | null> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      // For browser side Google Maps API requests
      const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: originLat, longitude: originLng }}},
          destination: { location: { latLng: { latitude: destLat, longitude: destLng }}},
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const durationSeconds = parseInt(route.duration.replace('s', ''));
        return {
          distance: route.distanceMeters / 1000, // km
          eta: Math.ceil(durationSeconds / 60) // minutes
        };
      }
    } catch (e) {
      console.warn("Maps API fallback", e);
    }
    return null;
  },

  async generateParamedicBrief(user: any): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return `Patient: ${user.name}, Age ${user.age}. Blood: ${user.bloodGroup || 'O+'}. History: ${user.medicalHistory || 'None reported'}. Allergies: ${user.allergies?.join(', ') || 'None'}.`;
    }

    try {
      // Dynamic import to avoid breaking changes if not needed
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey, dangerouslyAllowBrowser: true } as any);
      
      // Gemini Pro: 120-word paramedic brief specification
      const prompt = `You are a medical AI assistant (Gemini Pro). Generate a highly detailed but structured paramedic brief (approximately 120 words) from this patient data for an ambulance crew responding to a trauma emergency. 
      Include critical sections: Vitals summary projection, exact blood type, known allergies, chronic conditions, and immediate recommended trauma protocols.
      Patient Data: Name: ${user.name}, Age: ${user.age}, Blood string: ${user.bloodGroup || 'unknown'}, Allergies: ${user.allergies?.join(',') || 'none'}, History: ${user.medicalHistory || 'none'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro', // Using Gemini Pro as requested
        contents: prompt,
      });

      return response.text || "Summary generation failed. " + prompt;
    } catch (e) {
      console.warn("Gemini AI fallback", e);
      return `Patient: ${user.name}, Age ${user.age}. Blood: ${user.bloodGroup || 'O+'}. History: ${user.medicalHistory || 'None reported'}. Allergies: ${user.allergies?.join(', ') || 'None'}.`;
    }
  },

  async findNearestAmbulance(lat: number, lng: number): Promise<Ambulance> {
    let bestAmbulance = MOCK_AMBULANCES[0];
    let bestETA = 999;

    for (const amb of MOCK_AMBULANCES) {
      const realData = await this.getRealDistanceAndETA(amb.currentLocation.lat, amb.currentLocation.lng, lat, lng);
      const eta = realData ? realData.eta : Math.floor(Math.random() * 5) + 3;
      
      if (eta < bestETA) {
        bestETA = eta;
        bestAmbulance = { ...amb, eta };
      }
    }
    return bestAmbulance;
  },

  async findHospitalMatch(lat: number, lng: number, specialty?: string): Promise<Hospital[]> {
    const scoredHospitals = await Promise.all(MOCK_HOSPITALS.map(async (h) => {
      const realData = await this.getRealDistanceAndETA(lat, lng, h.location.lat, h.location.lng);
      
      const distance = realData ? realData.distance : Math.random() * 10 + 2;
      const eta = realData ? realData.eta : Math.floor(Math.random() * 10) + 5;
      
      // Simple heuristic score: lower ETA and more ICU beds -> better score
      const score = 100 - (eta * 2) + (h.icuBedsAvailable * 5); 

      return { ...h, distance, eta, score };
    }));

    return scoredHospitals.sort((a, b) => (b.score || 0) - (a.score || 0));
  },

  async findBloodBanks(bloodType: string, lat: number, lng: number): Promise<BloodBank[]> {
    const updatedBanks = await Promise.all(MOCK_BLOOD_BANKS.map(async (b) => {
      const realData = await this.getRealDistanceAndETA(lat, lng, b.location.lat, b.location.lng);
      return { 
        ...b, 
        bloodType,
        distance: realData ? realData.distance : b.distance,
        eta: realData ? realData.eta : b.eta
      };
    }));
    return updatedBanks.sort((a, b) => a.eta - b.eta);
  },

  async dispatchAmbulance(ambulanceId: string, location: any, destinationId: string, brief: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Dispatched ${ambulanceId} to destination ${destinationId} with brief: ${brief}`);
    return true;
  },

  async broadcastDonorNeeded(bloodType: string, units: number, radius: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const donorsAlerted = Math.floor(Math.random() * 10) + 5; // 5-14 donors alerted
    console.log(`Broadcasted to ${donorsAlerted} donors for ${units} units of ${bloodType}`);
    return donorsAlerted;
  }
};
