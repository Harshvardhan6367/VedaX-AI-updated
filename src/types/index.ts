

export interface MedicalEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'diagnosis' | 'surgery' | 'lab' | 'general';
  doctorName?: string;
  location?: string;
  reportUrl?: string;
}

export interface Ambulance {
  ambulanceId: string;
  driverName: string;
  phone: string;
  currentLocation: { lat: number, lng: number };
  status: 'available' | 'dispatched' | 'at_scene' | 'en_route_hospital' | 'offline';
  vehicleType: 'ALS' | 'BLS' | 'patient_transport';
  equippedWith: string[];
  hospitalAssignment?: string;
  eta?: number; // minutes
}

export interface Hospital {
  hospitalId: string;
  name: string;
  address: string;
  location: { lat: number, lng: number };
  erBedsAvailable: number;
  icuBedsAvailable: number;
  specialties: string[];
  distance?: number;
  eta?: number;
  score?: number; // Match score
}

export interface BloodBank {
  bankId: string;
  name: string;
  address: string;
  phone: string;
  location: { lat: number, lng: number };
  distance: number;
  eta: number;
  bloodType: string;
  unitsAvailable: number;
  openNow: boolean;
}

export interface Donor {
  donorId: string;
  userId: string;
  bloodType: string;
  lastDonationDate?: string;
  location: { lat: number, lng: number };
  availability: { isAvailable: boolean, schedule: string[] };
}

export interface MedicalReport {
  id: string;
  title: string;
  date: string;
  type: 'Lab Report' | 'Prescription' | 'Certificate' | 'Imaging';
  doctorName: string;
  url?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'info' | 'reminder';
  read: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "Morning", "Night", "2x Daily"
  taken: boolean; // Reset daily
}

export interface UserProfile {
  id?: string;
  email?: string;
  name: string;
  age: number;
  gender: string;
  medicalHistory: string; // Summary
  medicalEvents: MedicalEvent[]; // Detailed Timeline
  reports: MedicalReport[];
  allergies: string[];
  medications: Medication[];
  bloodGroup?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  caregiver?: {
    name: string;
    email: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string; // Base64 string for image
  options?: string[]; // Quick reply options
  time?: string; // Timestamp for chat view
  isFinal?: boolean; // If true, the triage is complete
  triageResult?: TriageResult;
}



export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  image: string;
  nextAvailable: string;
  price: string;
  isVideoEnabled: boolean;
  // Extended Profile Fields
  about?: string;
  experience?: number; // Years
  qualifications?: string[];
  verified?: boolean;
  userId?: string;
}

export interface Appointment {
  id: string;
  userId: string; // Added to identify the patient
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  notes: string;
  type: 'video' | 'in-person' | 'chat';
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  diagnosis?: string;
  prescription?: string[];
  userRating?: number; // 1-5
  userReview?: string;
}

export interface OngoingTreatment {
  id: string;
  title: string;
  doctorName: string;
  doctorImage: string;
  progress: number; // 0-100
  totalDuration: string; // e.g., "Month 4 of 6"
  nextStep: string; // e.g., "Hba1c Test next week"
  doctorSpecialty?: string;
  history?: MedicalEvent[]; // For details view
}

export interface PrescriptionData {
  diagnosis: string;
  medications: string[];
  followUp: string;
}

export interface AuthResponse {
  user: UserProfile | Doctor;
  role: 'patient' | 'doctor' | 'relative';
  token: string;
  isNewUser?: boolean;
}

export interface TriageResult {
  level: 'Green' | 'Yellow' | 'Red';
  specialty: string;
  summary: string;
}


export interface PatientProfile {
  full_name: string;
  title?: string;
  age: string;
  gender: string;
  height?: string;
  weight?: string;
  allergies?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isThinking?: boolean;
}

export interface TriageState {
  step: number; // 0: Start, 1: Q1, 2: Q2, 3: Verdict
  history: ChatMessage[];
}

export interface AnalysisResult {
  title: string;
  verdict: 'Good' | 'Bad' | 'Very Bad' | 'Neutral' | 'Unknown';
  description: string;
  confidence?: string;
  actions?: string[];
  groundingUrls?: Array<{ title: string; uri: string }>;
}

export interface DietPlan {
  condition: string;
  meals: Array<{ name: string; items: string[] }>;
  youtubeQueries: string[];
}

export enum AppRoute {
  LOGIN = 'login',
  SIGNUP = 'signup',
  ONBOARDING = 'onboarding',
  HOME = 'home',
  SMART_CURE = 'smart_cure',
  TRIAGE = 'triage',
  DOCTORS = 'doctors',
  PROFILE = 'profile',
  SOS = 'sos',
  CHATBOT = 'chatbot',
  DOCTOR_HOME = 'doctor_home',
  DOCTOR_CONSULT = 'doctor_consult',
  DOCTOR_PROFILE = 'doctor_profile',
  // HW Integrated Features
  DERM_CHECK = 'hw_derm_check',
  RECOVERY_COACH = 'hw_recovery_coach',
  MEDI_SCANNER = 'hw_medi_scanner',
  LAB_REPORTS = 'hw_lab_reports',
  RAG_CHAT = 'hw_rag_chat',
  MEDGEMMA = 'medgemma_offline',
  EMERGENCY_ACTIVE = 'emergency_active',
  BLOOD_BANK = 'emergency_blood',
  DONOR_REGISTER = 'profile_donor'
}