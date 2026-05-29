import React, { Suspense } from 'react';
import { AppRoute } from '@/types';

// Auth Pages
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = React.lazy(() => import('@/pages/auth/SignupPage'));
const OnboardingPage = React.lazy(() => import('@/pages/auth/OnboardingPage'));

// Patient Pages
const HomePage = React.lazy(() => import('@/pages/patient/HomePage'));
const ProfilePage = React.lazy(() => import('@/pages/patient/ProfilePage'));
const DoctorsPage = React.lazy(() => import('@/pages/patient/DoctorsPage'));
const ChatbotPage = React.lazy(() => import('@/pages/patient/ChatbotPage'));

// Doctor Pages
const DoctorDashboard = React.lazy(() => import('@/pages/doctor/DoctorDashboard'));
const DoctorPatientView = React.lazy(() => import('@/pages/doctor/DoctorPatientView'));
const DoctorProfilePage = React.lazy(() => import('@/pages/doctor/DoctorProfilePage'));

// Smart Cure Pages
const SmartCurePage = React.lazy(() => import('@/pages/smart-cure/SmartCurePage'));
const TriagePage = React.lazy(() => import('@/pages/smart-cure/TriagePage'));
const PrescriptionAnalyzerPage = React.lazy(() => import('@/pages/smart-cure/PrescriptionAnalyzerPage'));
const DermCheck = React.lazy(() => import('@/components/smart-cure/DermCheck').then(m => ({ default: m.DermCheck })));
const MediScanner = React.lazy(() => import('@/components/smart-cure/MediScanner').then(m => ({ default: m.MediScanner })));
const RecoveryCoach = React.lazy(() => import('@/components/smart-cure/RecoveryCoach').then(m => ({ default: m.RecoveryCoach })));
const MedGemmaInterface = React.lazy(() => import('@/components/smart-cure/MedGemmaInterface'));

// Emergency Pages
const EmergencyDashboard = React.lazy(() => import('@/pages/emergency/EmergencyDashboard'));
const BloodBankFinder = React.lazy(() => import('@/pages/emergency/BloodBankFinder'));
const DonorRegistration = React.lazy(() => import('@/pages/emergency/DonorRegistration'));

export const AppRoutes = ({ 
  currentRoute, 
  props 
}: { 
  currentRoute: AppRoute, 
  props: any 
}) => {
  const LoadingSplash = () => (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const renderComponent = () => {
    switch (currentRoute) {
      case AppRoute.LOGIN: return <LoginPage {...props} />;
      case AppRoute.SIGNUP: return <SignupPage {...props} />;
      case AppRoute.ONBOARDING: return <OnboardingPage {...props} />;
      
      case AppRoute.HOME: return <HomePage {...props} />;
      case AppRoute.DOCTORS: return <DoctorsPage {...props} />;
      case AppRoute.PROFILE: return <ProfilePage {...props} />;
      case AppRoute.CHATBOT: return <ChatbotPage {...props} />;
      
      case AppRoute.DOCTOR_HOME: return <DoctorDashboard {...props} />;
      case AppRoute.DOCTOR_CONSULT: return <DoctorPatientView {...props} />;
      case AppRoute.DOCTOR_PROFILE: return <DoctorProfilePage {...props} />;
      
      case AppRoute.SMART_CURE: return <SmartCurePage {...props} />;
      case AppRoute.TRIAGE: return <TriagePage {...props} />;
      case AppRoute.RAG_CHAT: return <PrescriptionAnalyzerPage {...props} />;
      case AppRoute.DERM_CHECK: return <DermCheck {...props} />;
      case AppRoute.MEDI_SCANNER: return <MediScanner {...props} defaultMode="ID" hideTabs={true} />;
      case AppRoute.LAB_REPORTS: return <MediScanner {...props} defaultMode="REPORT" hideTabs={true} />;
      case AppRoute.RECOVERY_COACH: return <RecoveryCoach {...props} />;
      case AppRoute.MEDGEMMA: return <MedGemmaInterface {...props} />;
      
      case AppRoute.EMERGENCY_ACTIVE: return <EmergencyDashboard {...props} triggerType="sos" />;
      case AppRoute.BLOOD_BANK: return <BloodBankFinder {...props} />;
      case AppRoute.DONOR_REGISTER: return <DonorRegistration {...props} />;
      
      default: return <HomePage {...props} />;
    }
  };

  return (
    <Suspense fallback={<LoadingSplash />}>
      {renderComponent()}
    </Suspense>
  );
};
