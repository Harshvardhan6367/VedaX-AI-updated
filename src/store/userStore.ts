import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, Doctor, MedicalReport } from '@/types';

export const MOCK_REPORTS: MedicalReport[] = [
  { id: '101', title: 'Complete Blood Count (CBC)', date: '2023-11-15', type: 'Lab Report', doctorName: 'City PathLabs', url: '#' },
  { id: '102', title: 'Eye Vision Prescription', date: '2023-08-10', type: 'Prescription', doctorName: 'Dr. Aditi Gupta', url: '#' },
  { id: '103', title: 'Discharge Summary - Surgery', date: '2022-12-08', type: 'Certificate', doctorName: 'Apollo Hospital', url: '#' },
  { id: '104', title: 'Allergy Test Panel', date: '2022-03-15', type: 'Lab Report', doctorName: 'Dr. Meera Reddy', url: '#' },
  { id: '105', title: 'COVID-19 Vaccination Cert', date: '2021-06-20', type: 'Certificate', doctorName: 'CoWin', url: '#' },
  { id: '106', title: 'Chest X-Ray PA View', date: '2020-09-12', type: 'Imaging', doctorName: 'City Imaging Center', url: '#' },
];

export const INITIAL_USER: UserProfile = {
  name: "",
  age: 0,
  gender: "",
  medicalHistory: "",
  medicalEvents: [],
  reports: [],
  allergies: [],
  medications: [],
  emergencyContact: { name: "", phone: "", relation: "" },
};

export type Role = 'patient' | 'doctor' | 'relative' | null;

interface UserState {
  user: UserProfile;
  doctorProfile: Doctor | null;
  role: Role;
  isAuthenticated: boolean;
  isDoctorMode: boolean;
  isCaregiverMode: boolean;

  // Actions
  login: (userData: UserProfile | Doctor, role: Role, token: string) => void;
  logout: () => void;
  setUserProfile: (profile: UserProfile) => void;
  setDoctorProfile: (profile: Doctor) => void;
  setReports: (reports: MedicalReport[]) => void;
  addReport: (report: MedicalReport) => void;
  addMedication: (medication: any) => void;
  removeMedication: (id: string) => void;
  markMedicationTaken: (id: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: INITIAL_USER,
      doctorProfile: null,
      role: null,
      isAuthenticated: false,
      isDoctorMode: false,
      isCaregiverMode: false,

      login: (userData, role, token) => {
        // Token logic could be handled via localStorage or cookies separately, 
        // but here we just update state.
        const isDoc = role === 'doctor';
        set({
          role,
          isAuthenticated: true,
          isDoctorMode: isDoc,
          isCaregiverMode: role === 'relative',
          user: isDoc ? INITIAL_USER : (userData as UserProfile),
          doctorProfile: isDoc ? (userData as Doctor) : null,
        });
      },

      logout: () => {
        set({
          user: INITIAL_USER,
          doctorProfile: null,
          role: null,
          isAuthenticated: false,
          isDoctorMode: false,
          isCaregiverMode: false,
        });
      },

      setUserProfile: (profile) => set({ user: profile }),
      
      setDoctorProfile: (profile) => set({ doctorProfile: profile }),

      setReports: (reports) => set((state) => ({ 
        user: { ...state.user, reports } 
      })),

      addReport: (report) => set((state) => ({
        user: { ...state.user, reports: [report, ...state.user.reports] }
      })),

      addMedication: (medication) => set((state) => ({
        user: { ...state.user, medications: [medication, ...state.user.medications] }
      })),

      removeMedication: (id) => set((state) => ({
        user: { ...state.user, medications: state.user.medications.filter(m => m.id !== id) }
      })),

      markMedicationTaken: (id) => set((state) => ({
        user: { 
          ...state.user, 
          medications: state.user.medications.map(m => m.id === id ? { ...m, taken: true } : m) 
        }
      })),
    }),
    {
      name: 'vedax-user-store',
      partialize: (state) => ({
        user: state.user,
        doctorProfile: state.doctorProfile,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        isDoctorMode: state.isDoctorMode,
        isCaregiverMode: state.isCaregiverMode
      }),
    }
  )
);
