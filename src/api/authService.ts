import { UserProfile, Doctor, AuthResponse } from '@/types';

export const MOCK_PATIENT_DATA: UserProfile = {
  id: 'p1',
  email: 'Harshvardhan@gmail.com',
  name: 'Harshvardhan',
  age: 28,
  gender: 'Male',
  medicalHistory: 'Asthma (Mild), Seasonal Allergies',
  medicalEvents: [
    {
      id: '1',
      date: '2023-11-15',
      title: 'Annual Physical Checkup',
      description: 'Blood pressure 120/80. Weight 72kg. All vitals normal. Patient advised to maintain regular exercise regime.',
      type: 'general',
      doctorName: 'Dr. Rajesh Kumar',
      location: 'City General Hospital',
    },
    {
      id: '2',
      date: '2023-08-10',
      title: 'Eye Examination',
      description: 'Routine vision test. Mild myopia diagnosed in left eye (-0.5D). Anti-glare glasses prescribed.',
      type: 'general',
      doctorName: 'Dr. Aditi Gupta',
      location: 'Vision Care Center',
    },
    {
      id: '3',
      date: '2023-05-22',
      title: 'Viral Fever Treatment',
      description: 'Patient presented with high fever (102F) and body ache. Tested negative for Dengue/Malaria. Prescribed Paracetamol and rest.',
      type: 'diagnosis',
      doctorName: 'Dr. Rajesh Kumar',
      location: 'City General Hospital',
    },
    {
      id: '4',
      date: '2022-12-05',
      title: 'Appendectomy',
      description: 'Emergency laparoscopic appendectomy performed. Surgery successful. No post-operative complications.',
      type: 'surgery',
      doctorName: 'Dr. Suresh Menon',
      location: 'Apollo Hospital',
    },
    {
      id: '5',
      date: '2022-03-15',
      title: 'Dermatology Consult',
      description: 'Allergic reaction to dust mites causing skin rash on forearm. Prescribed antihistamines and topical corticosteroid cream.',
      type: 'diagnosis',
      doctorName: 'Dr. Meera Reddy',
      location: 'Skin & Glow Clinic',
    },
  ],
  reports: [
    { id: 'r1', title: 'Complete Blood Count (CBC)', date: '2023-11-15', type: 'Lab Report', doctorName: 'City PathLabs', url: '#' },
    { id: 'r5', title: 'Medical Fitness Certificate', date: '2023-11-16', type: 'Certificate', doctorName: 'Dr. Rajesh Kumar', url: '#' },
    { id: 'r2', title: 'Eye Vision Prescription', date: '2023-08-10', type: 'Prescription', doctorName: 'Dr. Aditi Gupta', url: '#' },
    { id: 'r3', title: 'Discharge Summary - Surgery', date: '2022-12-08', type: 'Certificate', doctorName: 'Apollo Hospital', url: '#' },
    { id: 'r7', title: 'Sick Leave Certificate (3 Days)', date: '2023-05-22', type: 'Certificate', doctorName: 'Dr. Rajesh Kumar', url: '#' },
    { id: 'r4', title: 'Allergy Test Panel', date: '2022-03-15', type: 'Lab Report', doctorName: 'Dr. Meera Reddy', url: '#' },
    { id: 'r6', title: 'Chest X-Ray PA View', date: '2020-09-12', type: 'Imaging', doctorName: 'City Imaging Center', url: '#' },
  ],
  allergies: ['Penicillin', 'Dust Mites'],
  medications: [
    { id: 'm1', name: 'Albuterol Inhaler', dosage: '2 puffs', frequency: 'As needed', taken: false },
    { id: 'm2', name: 'Multivitamins', dosage: '1 Tablet', frequency: 'Morning', taken: true },
    { id: 'm3', name: 'Cetirizine', dosage: '10mg', frequency: 'Night', taken: false },
  ],
  emergencyContact: {
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    relation: 'Spouse',
  },
};

const MOCK_DOCTOR: Doctor = {
  id: 'd1',
  name: 'Dr. Vikram Singh',
  specialty: 'Neurologist',
  rating: 4.9,
  image: 'https://picsum.photos/100/100?random=4',
  nextAvailable: 'Wed, 11:00 AM',
  price: '₹1500',
  isVideoEnabled: true,
  about: 'Expert in treating migraines, epilepsy, and stroke rehabilitation.',
  experience: 12,
  qualifications: ['MBBS', 'MD', 'DM (Neurology)'],
  verified: true,
};

const STORAGE_KEY = 'mediguard_auth_session';

const DEMO_CREDENTIALS: Record<string, { role: 'patient' | 'doctor' | 'relative'; user: UserProfile | Doctor }> = {
  'Harshvardhan@gmail.com': { role: 'patient', user: MOCK_PATIENT_DATA },
  'vikram@demo.com': { role: 'doctor', user: MOCK_DOCTOR },
  'relative@demo.com': { role: 'relative', user: MOCK_PATIENT_DATA }, // Mock relative accessing Harshvardhan's data
};

/** Safely read & parse a JSON string; returns null on any error. */
function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Simulate a realistic network delay (ms). */
const simulateDelay = (ms = 1000) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const AuthService = {
  login: async (email: string, password: string, roleParam: 'patient' | 'doctor' | 'relative'): Promise<AuthResponse> => {
    try {
      // 1) Fallback for testing: mock relative email
      if (email === 'relative@demo.com') {
        await simulateDelay(800);
        const session: AuthResponse = { user: MOCK_PATIENT_DATA, token: 'mock-relative-token', role: 'relative' };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return session;
      }

      // Check if this is an actual invited caregiver logging in
      if (MOCK_PATIENT_DATA.caregiver && email === MOCK_PATIENT_DATA.caregiver.email) {
        await simulateDelay(800);
        const session: AuthResponse = { user: MOCK_PATIENT_DATA, token: 'mock-invited-relative-token', role: 'relative' };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return session;
      }

      // Demo override (Skip backend if using demo accounts)
      if (DEMO_CREDENTIALS[email]) {
        await simulateDelay(800); // UI feedback
        const found = DEMO_CREDENTIALS[email];
        // Allow patient portal logic for both standard patients and relatives attempting regular logins incorrectly mapped
        if (found.role !== roleParam && !(found.role === 'relative' && roleParam === 'patient')) {
          throw new Error(`Account registered as ${found.role}, but tried logging in as ${roleParam}.`);
        }
        if (password !== 'password') throw new Error('Invalid demo password (use "password")');

        const session: AuthResponse = { user: found.user, token: `mock-token-${email}`, role: found.role };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return session;
      }

      // 2) Actual Backend Call
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: roleParam })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const session: AuthResponse = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return session;
    } catch (err: any) {
      console.error("AuthService Login Error:", err);
      throw err;
    }
  },

  /**
   * Register a new account.
   */
  signup: async (name: string, email: string, password: string, role: 'patient' | 'doctor'): Promise<AuthResponse> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      const session: AuthResponse = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return session;
    } catch (err: any) {
      console.error("AuthService Signup Error:", err);
      throw err;
    }
  },

  logout: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  /** Returns the stored session, or null if missing / corrupt. */
  getSession: (): AuthResponse | null => {
    return safeJsonParse<AuthResponse>(localStorage.getItem(STORAGE_KEY));
  },
};
