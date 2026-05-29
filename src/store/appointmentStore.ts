import { create } from 'zustand';
import { Appointment, Doctor } from '@/types';

export const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: '1', name: 'Dr. Anita Desai', specialty: 'Cardiologist', rating: 4.9, image: 'https://picsum.photos/100/100?random=1', nextAvailable: 'Today, 2:30 PM', price: '₹1200', isVideoEnabled: true,
    about: 'Dr. Anita Desai is a senior Cardiologist with over 15 years of experience. She specializes in preventive cardiology and heart failure management.',
    experience: 15, qualifications: ['MBBS', 'MD (Medicine)', 'DM (Cardiology)'], verified: true
  },
  {
    id: '2', name: 'Dr. Rajesh Kumar', specialty: 'General Physician', rating: 4.7, image: 'https://picsum.photos/100/100?random=2', nextAvailable: 'Tomorrow, 9:00 AM', price: '₹600', isVideoEnabled: false,
    about: 'Friendly neighborhood physician focusing on holistic health and chronic disease management.',
    experience: 8, qualifications: ['MBBS', 'DNB (Family Medicine)']
  },
  {
    id: '3', name: 'Dr. Meera Reddy', specialty: 'Dermatologist', rating: 4.8, image: 'https://picsum.photos/100/100?random=3', nextAvailable: 'Today, 4:15 PM', price: '₹900', isVideoEnabled: true,
    experience: 10, qualifications: ['MBBS', 'MD (Dermatology)']
  },
  {
    id: '4', name: 'Dr. Vikram Singh', specialty: 'Neurologist', rating: 4.9, image: 'https://picsum.photos/100/100?random=4', nextAvailable: 'Wed, 11:00 AM', price: '₹1500', isVideoEnabled: true,
    about: 'Expert in treating migraines, epilepsy, and stroke rehabilitation. Passionate about leveraging technology for patient care.',
    experience: 12, qualifications: ['MBBS', 'MD', 'DM (Neurology)'], verified: true
  },
  {
    id: '5', name: 'Dr. Arjun Gupta', specialty: 'Orthopedist', rating: 4.6, image: 'https://picsum.photos/100/100?random=5', nextAvailable: 'Thu, 10:30 AM', price: '₹1000', isVideoEnabled: true,
    experience: 14, qualifications: ['MBBS', 'MS (Orthopedics)']
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  // Upcoming
  { id: '201', userId: 'dummy-patient-id', doctorId: '1', doctorName: 'Dr. Anita Desai', date: 'Today', time: '2:30 PM', notes: 'Routine check', type: 'video', status: 'upcoming' },
  { id: '204', userId: 'dummy-patient-id', doctorId: '4', doctorName: 'Dr. Vikram Singh', date: 'Tomorrow', time: '11:00 AM', notes: 'Follow up on migraine', type: 'video', status: 'upcoming' },

  // Pending Requests (For Doctor Dashboard Demo)
  { id: '207', userId: 'dummy-patient-id', doctorId: '4', doctorName: 'Dr. Vikram Singh', date: 'Today', time: '04:00 PM', notes: 'New Patient: Frequent headaches', type: 'video', status: 'pending' },
  { id: '208', userId: 'dummy-patient-id', doctorId: '4', doctorName: 'Dr. Vikram Singh', date: 'Tomorrow', time: '12:30 PM', notes: 'Review MRI Scan', type: 'in-person', status: 'pending' },

  // History - Enriched for Demo
  { id: '202', userId: 'dummy-patient-id', doctorId: '2', doctorName: 'Dr. Rajesh Kumar', date: '2023-11-15', time: '10:00 AM', notes: 'Annual Physical', type: 'in-person', status: 'completed', diagnosis: 'Healthy', prescription: ['Multivitamins'], userRating: 5 },
  { id: '205', userId: 'dummy-patient-id', doctorId: '6', doctorName: 'Dr. Aditi Gupta', date: '2023-08-10', time: '11:30 AM', notes: 'Eye Exam', type: 'in-person', status: 'completed', diagnosis: 'Mild Myopia', prescription: ['Eye Drops', 'Corrective Lenses'] },
  { id: '203', userId: 'dummy-patient-id', doctorId: '3', doctorName: 'Dr. Meera Reddy', date: '2023-03-15', time: '4:00 PM', notes: 'Skin rash', type: 'video', status: 'completed', diagnosis: 'Contact Dermatitis', prescription: ['Hydrocortisone Cream', 'Levocetirizine'], userRating: 4, userReview: "Good doctor, but video lagged a bit." },
  { id: '206', userId: 'dummy-patient-id', doctorId: '2', doctorName: 'Dr. Rajesh Kumar', date: '2023-05-22', time: '09:30 AM', notes: 'High Fever', type: 'in-person', status: 'completed', diagnosis: 'Viral Fever', prescription: ['Paracetamol 650mg', 'Rest'] },
  { id: '211', userId: 'dummy-patient-id', doctorId: '5', doctorName: 'Dr. Arjun Gupta', date: '2022-11-20', time: '05:00 PM', notes: 'Ankle Sprain', type: 'in-person', status: 'completed', diagnosis: 'Grade 1 Ligament Tear', prescription: ['Volini Spray', 'Aceclofenac'], userRating: 5 },
];

interface AppointmentState {
  appointments: Appointment[];
  doctors: Doctor[];
  
  // Actions
  setAppointments: (appointments: Appointment[]) => void;
  setDoctors: (doctors: Doctor[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, partial: Partial<Appointment>) => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: INITIAL_APPOINTMENTS,
  doctors: DEFAULT_DOCTORS,

  setAppointments: (appointments) => set({ appointments }),
  
  setDoctors: (doctors) => set({ doctors }),
  
  addAppointment: (appointment) => set((state) => ({ 
    appointments: [appointment, ...state.appointments] 
  })),

  updateAppointment: (id, partial) => set((state) => ({
    appointments: state.appointments.map(a => 
      a.id === id ? { ...a, ...partial } : a
    )
  })),
}));
