
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  hi: '\u0939\u093f\u0928\u094d\u0926\u0940', // Hindi
  ta: '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd', // Tamil
  te: '\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41', // Telugu
  kn: '\u0c95\u0ca8\u0ccd\u0ca8\u0ca1', // Kannada
  ml: '\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02', // Malayalam
  bn: '\u09ac\u09be\u0982\u09b2\u09be', // Bengali
  mr: '\u092e\u0930\u093e\u0920\u0940', // Marathi
  gu: '\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0' // Gujarati
};

const translations: Record<string, Partial<Record<Language, string>>> = {
  // App name
  'app.name': {
    en: 'VedaX-AI',
    hi: 'VedaX-AI',
    ta: 'VedaX-AI',
    te: 'VedaX-AI',
    kn: 'VedaX-AI',
    ml: 'VedaX-AI',
    bn: 'VedaX-AI',
    mr: 'VedaX-AI',
    gu: 'VedaX-AI'
  },
  'nav.home': { en: 'Home', hi: 'होम', ta: 'முகப்பு', te: 'హోమ్', kn: 'ಮುಖಪುಟ', ml: 'ഹോം', bn: 'হোম', mr: 'होम', gu: 'હોમ' },

  'nav.doctors': { en: 'Doctors', hi: 'डॉक्टर्स', ta: 'மருத்துவர்கள்', te: 'వైద్యులు', kn: 'ವೈದ್ಯರು', ml: 'ഡോക്ടർമാർ', bn: 'ডাক্তারগণ', mr: 'डॉक्टर', gu: 'ડૉક્ટર' },
  'nav.profile': { en: 'Profile', hi: 'प्रोफाइल', ta: 'சுயவிவரம்', te: 'ಪ್ರೊಫೈಲ್', kn: 'ಪ್ರೊಫೈಲ್', ml: 'പ്രൊഫൈൽ', bn: 'প্রফাইল', mr: 'प्रोफाइल', gu: 'પ્રોફાઇલ' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड', ta: 'டாஷ்போர்டு', te: 'డాష్‌బోర్డ్', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', ml: 'ഡാഷ്ബോർഡ്', bn: 'ড্যাশবোর্ড', mr: 'डॅशबोर्ड', gu: 'ડેશબೋರ್ડ' },
  'header.welcome': { en: 'Welcome Back', hi: 'स्वागत है', ta: 'மீண்டும் வரவேற்கிறோம்', te: 'స్వాగతం', kn: 'ಸ್ವಾಗತ', ml: 'ಸ್വാഗതം', bn: 'স্বাগতম', mr: 'स्वागत', gu: 'સ્વાગત' },

  // Home page
  'home.symptoms_title': { en: 'SYMPTOMS?', hi: 'लक्षण?', ta: 'அறிகுறிகள்?', te: 'లక్షణాలు?', kn: 'ಲಕ್ಷಣಗಳು?', ml: 'ലക്ഷണങ്ങൾ?', bn: 'লক্ষণ?', mr: 'लक्षणे?', gu: 'લક્ષણો?' },
  'home.chat_vaidya': { en: 'Chat with Swasthya Setu', hi: 'स्वास्थ्य सेतु से चैट करें', ta: 'சுவஸ்தியா சேதுவுடன் அரட்டை', te: 'స్వస్థ్య సేతుతో చాట్', kn: 'ಸ್ವಸ್ಥ್ಯ ಸೇತು ಜೊತೆ ಚಾಟ್', ml: 'സ്വസ്ഥ്യ സേതുവുമായി ചാറ്റ്', bn: 'স্বাস্থ্য সেতুর সাথে চ্যাট', mr: 'स्वास्थ्य सेतुशी चॅट करा', gu: 'સ્વસ્થ્ય સેતુ સાથે ચેટ' },
  'home.daily_health_tip': { en: 'DAILY HEALTH TIP', hi: 'दैनिक स्वास्थ्य टिप', ta: 'தினசரி சுகாதார உதவிக்குறிப்பு', te: 'రోజువారీ ఆరోగ్య చిట్కా', kn: 'ದೈನಂದಿನ ಆರೋಗ್ಯ ಸಲಹೆ', ml: 'ദൈനംദിന ആരോഗ്യ നುറുങ്ങ്', bn: 'দৈনিক স্বাস্থ্য টিপস', mr: 'दैनिक आरोग्य टीप', gu: 'દૈનિક આરોગ્ય ટીપ' },
  'home.ongoing_treatments': { en: 'Ongoing Treatments', hi: 'चल रहे उपचार', ta: 'தொடரும் சிகிச்சைகள்', te: 'కొనసాగుతున్న చికిత్సలు', kn: 'ನಡೆಯುತ್ತಿರುವ ಚಿಕಿತ್ಸೆಗಳು', ml: 'നടന്നുകൊണ്ടിരിക്കുന്ന ചികിത്സകൾ', bn: 'চলমান চিকিৎসা', mr: 'सुरू असलेली उपचार', gu: 'ચાલુ સારવાર' },
  'home.view_all': { en: 'VIEW ALL', hi: 'सभी देखें', ta: 'அனைத்தையும் காண்க', te: 'అన్నీ చూడండి', kn: 'ಎಲ್ಲವನ್ನು ವೀಕ್ಷಿಸಿ', ml: 'എല്ലാം കാണുക', bn: 'সব দেখুন', mr: 'सरळ पहा', gu: 'બધા જુઓ' },

  // Common buttons
  'common.chat': { en: 'Chat', hi: 'चैट', ta: 'அரட்டை', te: 'చాట్', kn: 'ಚಾಟ್', ml: 'ചാറ്റ്', bn: 'চ্যাট', mr: 'चॅट', gu: 'ચેટ' },
  'common.video': { en: 'Video', hi: 'वीडियो', ta: 'வீடியோ', te: 'వీడియో', kn: 'ವಿಡಿಯೋ', ml: 'വീಡಿಯോ', bn: 'ভিডিও', mr: 'व्हिडिओ', gu: 'વિડીયો' },

  // Auth (Login/Signup)
  'auth.welcome': { en: 'Welcome Back', hi: 'स्वागत है' },
  'auth.signin_subtitle': { en: 'Sign in to VedaX-AI', hi: 'VedaX-AI में साइन इन करें' },
  'auth.patient': { en: 'Patient', hi: 'रोगी' },
  'auth.doctor': { en: 'Doctor', hi: 'डॉक्टर' },
  'auth.email_placeholder': { en: 'Email Address', hi: 'ईमेल पता' },
  'auth.password_placeholder': { en: 'Password', hi: 'पासवर्ड' },
  'auth.forgot_password': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
  'auth.sign_in': { en: 'Sign In', hi: 'साइन इन करें' },
  'auth.new_user': { en: 'New to VedaX-AI?', hi: 'VedaX-AI पर नए हैं?' },
  'auth.create_account': { en: 'Create Account', hi: 'खाता बनाएं' },
  'auth.create_title': { en: 'Create Account', hi: 'नया खाता बनाएं' },
  'auth.join_subtitle': { en: 'Join VedaX-AI today.', hi: 'आज ही VedaX-AI से जुड़ें।' },
  'auth.back_login': { en: 'Back to Login', hi: 'लॉगिन पर वापस जाएं' },
  'auth.full_name': { en: 'Full Name', hi: 'पूरा नाम' },
  'auth.iam': { en: 'I am a:', hi: 'मैं एक हूँ:' },
  'auth.sign_up': { en: 'Sign Up', hi: 'साइन अप करें' },
  'auth.terms': { en: 'By joining, you agree to our Terms of Service.', hi: 'शामिल होकर, आप हमारी सेवा की शर्तों से सहमत होते हैं।' },
  'auth.demo_creds': { en: 'DEMO CREDENTIALS', hi: 'डेमो क्रेडेंशियल्स' },

  // Onboarding
  'onboarding.step1_title': { en: 'Namaste! Let\'s get to know you.', hi: 'नमस्ते! आइए आपको जानते हैं।' },
  'onboarding.step1_desc': { en: 'Basic details help us personalize your care.', hi: 'बुनियादी विवरण हमें आपकी देखभाल को निजीकृत करने में मदद करते हैं।' },
  'onboarding.step2_title': { en: 'Medical Profile', hi: 'चिकित्सा प्रोफाइल' },
  'onboarding.step2_desc': { en: 'Tell us about your health history.', hi: 'हमें अपने स्वास्थ्य इतिहास के बारे में बताएं।' },
  'onboarding.step3_title': { en: 'Safety First', hi: 'सुरक्षा पहले' },
  'onboarding.step3_desc': { en: 'Emergency contact for SOS alerts.', hi: 'SOS अलर्ट के लिए आपातकालीन संपर्क।' },
  'onboarding.name': { en: 'Full Name', hi: 'पूरा नाम' },
  'onboarding.age': { en: 'Age', hi: 'उम्र' },
  'onboarding.gender': { en: 'Gender', hi: 'लिंग' },
  'onboarding.conditions': { en: 'Medical Conditions', hi: 'चिकित्सा स्थितियां' },
  'onboarding.allergies': { en: 'Allergies', hi: 'एलर्जी' },
  'onboarding.meds': { en: 'Current Medications', hi: 'वर्तमान दवाएं' },
  'onboarding.contact_name': { en: 'Contact Name', hi: 'संपर्क नाम' },
  'onboarding.relation': { en: 'Relationship', hi: 'संबंध' },
  'onboarding.phone': { en: 'Phone Number (+91)', hi: 'फोन नंबर (+91)' },
  'onboarding.next': { en: 'Next Step', hi: 'अगला चरण' },
  'onboarding.finish': { en: 'Complete Setup', hi: 'सेटअप पूरा करें' },
  'onboarding.add': { en: 'Add', hi: 'जोड़ें' },

  // App Tour
  'tour.welcome_title': { en: 'Welcome to VedaX-AI', hi: 'VedaX-AI में आपका स्वागत है' },
  'tour.welcome_desc': { en: 'Your personal AI healthcare companion. Let\'s take a quick tour.', hi: 'आपका व्यक्तिगत AI स्वास्थ्य साथी। आइए एक त्वरित दौरा करें।' },

  'tour.doctors_title': { en: 'Find Doctors', hi: 'डॉक्टर खोजें' },
  'tour.doctors_desc': { en: 'Book video or in-clinic appointments with specialists.', hi: 'विशेषज्ञों के साथ वीडियो या क्लिनिक अपॉइंटमेंट बुक करें।' },
  'tour.sos_title': { en: 'Emergency SOS', hi: 'आपातकालीन SOS' },
  'tour.sos_desc': { en: 'In a crisis, use the SOS button to alert contacts immediately.', hi: 'संकट में, संपर्कों को तुरंत सचेत करने के लिए SOS बटन का उपयोग करें।' },
  'tour.profile_title': { en: 'Your Health Profile', hi: 'आपकी स्वास्थ्य प्रोफाइल' },
  'tour.profile_desc': { en: 'Keep all your medical history and reports in one place.', hi: 'अपने सभी चिकित्सा इतिहास और रिपोर्ट को एक जगह रखें।' },
  'tour.skip': { en: 'Skip', hi: 'छोड़ें' },
  'tour.get_started': { en: 'Get Started', hi: 'शुरू करें' },
  'tour.next': { en: 'Next', hi: 'अगला' },

  // Home Page
  'home.chat_title': { en: 'Chat with VedaX-AI', hi: 'VedaX-AI से बात करें' },
  'home.welcome': { en: 'Welcome back', hi: 'स्वागत है', ta: 'மீண்டும் வரவேற்கிறோம்', te: 'స్వాగతం', kn: 'ಸ್ವಾಗತ', ml: 'സ്വാഗതം', bn: 'স্বাগতম', mr: 'स्वागत', gu: 'સ્વાગત' },
  'home.chat_desc': { en: 'Symptoms?', hi: 'लक्षण?' },
  'home.find_doc_title': { en: 'Find a Doctor', hi: 'डॉक्टर खोजें' },
  'home.find_doc_desc': { en: 'Need Help?', hi: 'मदद चाहिए?' },
  'home.health_tip': { en: 'Daily Health Tip', hi: 'दैनिक स्वास्थ्य सुझाव' },
  'home.health_snapshot': { en: 'Health Snapshot', hi: 'स्वास्थ्य सारांश' },
  'home.switch_tip': { en: 'Switch to Tip', hi: 'सुझाव देखें' },
  'home.switch_snapshot': { en: 'Switch to Snapshot', hi: 'सारांश देखें' },
  'home.tab.upcoming': { en: 'Upcoming', hi: 'आगामी' },
  'home.tab.history': { en: 'History', hi: 'इतिहास' },
  'home.no_upcoming': { en: 'No upcoming appointments.', hi: 'कोई आगामी अपॉइंटमेंट नहीं।' },
  'home.no_history': { en: 'No past appointments.', hi: 'कोई पिछले अपॉइंटमेंट नहीं।' },
  'home.book_now': { en: 'Book Now', hi: 'बुक करें' },
  'home.rate_doctor': { en: 'Rate Doctor', hi: 'रेट करें' },
  'home.reveal_tip': { en: 'Reveal today\'s tip', hi: 'आज का सुझाव देखें' },
  'home.gen_summary': { en: 'Generate Profile Summary', hi: 'प्रोफाइल सारांश बनाएं' },
  'home.appt_details': { en: 'Appointment Details', hi: 'अपॉइंटमेंट विवरण' },
  'home.diagnosis': { en: 'Diagnosis', hi: 'निदान' },
  'home.prescribed_meds': { en: 'Prescribed Medications', hi: 'निर्धारित दवाएं' },
  'home.your_rating': { en: 'Your Rating', hi: 'आपकी रेटिंग' },
  'home.book_again': { en: 'Book Again', hi: 'फिर से बुक करें' },
  'home.view_report': { en: 'View Report', hi: 'रिपोर्ट देखें' },
  'home.clinic': { en: 'Clinic', hi: 'क्लिनिक' },
  'home.video': { en: 'Video', hi: 'वीडियो' },

  // Triage


  // Doctor Dashboard
  'doctor.schedule': { en: 'Schedule', hi: 'अनुसूची' },
  'doctor.requests': { en: 'Requests', hi: 'अनुरोध' },
  'doctor.patients': { en: 'Patients', hi: 'रोगी' },
  'doctor.consults': { en: 'Consults', hi: 'परामर्श' },
  'doctor.score': { en: 'Score', hi: 'स्कोर' },
  'doctor.accepting': { en: 'Accepting Patients', hi: 'नए मरीज स्वीकार्य' },
  'doctor.not_available': { en: 'Not Available', hi: 'उपलब्ध नहीं' },
  'doctor.no_schedule': { en: 'No appointments scheduled.', hi: 'कोई अपॉइंटमेंट निर्धारित नहीं है।' },
  'doctor.no_requests': { en: 'No new requests.', hi: 'कोई नया अनुरोध नहीं।' },
  'doctor.view_profile': { en: 'View Profile', hi: 'प्रोफाइल देखें' },
  'doctor.accept': { en: 'Accept', hi: 'स्वीकार करें' },
  'doctor.decline': { en: 'Decline', hi: 'अस्वीकार करें' },
  'doctor.reviews': { en: 'Reviews', hi: 'समीक्षाएं' },
  'doctor.scheduled': { en: 'Scheduled', hi: 'निर्धारित' },
  'doctor.response_rate': { en: 'Response Rate', hi: 'प्रतिक्रिया दर' },
  'doctor.video': { en: 'Video', hi: 'वीडियो' },
  'doctor.clinic': { en: 'In-Clinic', hi: 'क्लिनिक में' },
  'doctor.new_patient': { en: 'New Patient', hi: 'नया रोगी' },

  // Doctor Patient View
  'dpv.preview_mode': { en: 'Patient Preview Mode (Pending Request)', hi: 'रोगी पूर्वावलोकन (लंबित अनुरोध)' },
  'dpv.tab.consult': { en: 'Consultation', hi: 'परामर्श' },
  'dpv.tab.history': { en: 'Medical History', hi: 'चिकित्सा इतिहास' },
  'dpv.tab.reports': { en: 'Reports', hi: 'रिपोर्ट्स' },

  'dpv.allergies': { en: 'Allergies', hi: 'एलर्जी' },
  'dpv.current_meds': { en: 'Current Meds', hi: 'वर्तमान दवाएं' },
  'dpv.rx_notes': { en: 'Rx & Notes', hi: 'पर्चे और नोट्स' },
  'dpv.scan_rx': { en: 'Scan Rx', hi: 'स्कैन पर्चा' },
  'dpv.diagnosis': { en: 'Diagnosis', hi: 'निदान' },
  'dpv.medications': { en: 'Medications', hi: 'दवाएं' },
  'dpv.follow_up': { en: 'Follow Up', hi: 'अगली जांच' },
  'dpv.add_med_placeholder': { en: 'Add medication (e.g. Augmentin 625mg)', hi: 'दवा जोड़ें (जैसे: Augmentin 625mg)' },
  'dpv.patient_timeline': { en: 'Patient Timeline', hi: 'रोगी समयरेखा' },
  'dpv.no_history': { en: 'No medical history available.', hi: 'कोई चिकित्सा इतिहास उपलब्ध नहीं है।' },
  'dpv.medical_docs': { en: 'Medical Documents', hi: 'चिकित्सा दस्तावेज' },
  'dpv.no_reports': { en: 'No reports on file.', hi: 'कोई रिपोर्ट उपलब्ध नहीं है।' },
  'dpv.complete_consult': { en: 'Complete Consultation', hi: 'परामर्श पूरा करें' },

  // Doctor Profile
  'doc_profile.edit': { en: 'Edit Profile', hi: 'प्रोफाइल संपादित करें' },
  'doc_profile.logout': { en: 'Logout', hi: 'लॉग आउट' },
  'doc_profile.full_name': { en: 'Full Name', hi: 'पूरा नाम' },
  'doc_profile.specialty': { en: 'Specialty', hi: 'विशेषज्ञता' },
  'doc_profile.experience': { en: 'Experience (Yrs)', hi: 'अनुभव (वर्ष)' },
  'doc_profile.fee': { en: 'Consultation Fee', hi: 'परामर्श शुल्क' },
  'doc_profile.about': { en: 'About Me', hi: 'मेरे बारे में' },
  'doc_profile.qualifications': { en: 'Qualifications & Certifications', hi: 'योग्यता और प्रमाणपत्र' },
  'doc_profile.no_qual': { en: 'No qualifications added.', hi: 'कोई योग्यता नहीं जोड़ी गई।' },
  'doc_profile.upload_evidence': { en: 'Upload Evidence Documents', hi: 'प्रमाण दस्तावेज अपलोड करें' },
  'doc_profile.save': { en: 'Save Changes', hi: 'परिवर्तन सहेजें' },

  // Patient Profile
  'profile.overview': { en: 'Overview', hi: 'अवलोकन' },
  'profile.history': { en: 'History', hi: 'इतिहास' },
  'profile.documents': { en: 'Documents', hi: 'दस्तावेज़' },
  'profile.medications': { en: 'Current Medications', hi: 'वर्तमान दवाएं' },
  'profile.no_meds': { en: 'No active medications.', hi: 'कोई सक्रिय दवा नहीं।' },
  'profile.add_med': { en: 'Add Medication', hi: 'दवा जोड़ें' },
  'profile.allergies': { en: 'Allergies', hi: 'एलर्जी' },
  'profile.no_allergies': { en: 'No known allergies.', hi: 'कोई ज्ञात एलर्जी नहीं।' },
  'profile.clinical_timeline': { en: 'Clinical Timeline', hi: 'नैदानिक समयरेखा' },
  'profile.add_event': { en: 'Add Event', hi: 'इवेंट जोड़ें' },
  'profile.save_event': { en: 'Save Event', hi: 'इवेंट सहेजें' },
  'profile.new_event': { en: 'New Clinical Event', hi: 'नया नैदानिक इवेंट' },
  'profile.medical_reports': { en: 'Medical Reports', hi: 'चिकित्सा रिपोर्ट' },
  'profile.upload': { en: 'Upload', hi: 'अपलोड' },
  'profile.no_docs': { en: 'No documents found.', hi: 'कोई दस्तावेज़ नहीं मिला।' },
  'profile.emergency_contact': { en: 'Emergency Contact', hi: 'आपातकालीन संपर्क' },
  'profile.call': { en: 'CALL', hi: 'कॉल करें' },

  // Doctors Page
  'find_doc.title': { en: 'Find a Doctor', hi: 'डॉक्टर खोजें' },
  'find_doc.recommended': { en: 'Recommended', hi: 'अनुशंसित' },
  'find_doc.video_consult': { en: 'Video Consult', hi: 'वीडियो परामर्श' },
  'find_doc.no_results': { en: 'No doctors found matching filters.', hi: 'कोई डॉक्टर नहीं मिला।' },
  'find_doc.clear_filters': { en: 'Clear Filters', hi: 'फ़िल्टर साफ़ करें' },
  'find_doc.next_available': { en: 'Next Available', hi: 'अगला उपलब्ध' },
  'find_doc.book': { en: 'Book', hi: 'बुक' },
  'find_doc.booking': { en: 'Booking...', hi: 'बुकिंग...' },
  'find_doc.book_appointment': { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें' },
  'find_doc.about_doctor': { en: 'About Doctor', hi: 'डॉक्टर के बारे में' },

  // Medication Panel
  'meds.my_meds': { en: 'My Meds', hi: 'मेरी दवाएं' },
  'meds.no_active': { en: 'No active medications.', hi: 'कोई सक्रिय दवा नहीं।' },
  'meds.manage': { en: 'Manage Medications', hi: 'दवाएं प्रबंधित करें' },

  // Booking Modal
  'booking.confirmed': { en: 'Booking Confirmed!', hi: 'बुकिंग की पुष्टि!' },
  'booking.msg': { en: 'Your appointment has been successfully scheduled.', hi: 'आपकी अपॉइंटमेंट सफलतापूर्वक निर्धारित कर दी गई है।' },
  'booking.doctor': { en: 'Doctor', hi: 'डॉक्टर' },
  'booking.date': { en: 'Date', hi: 'दिनांक' },
  'booking.time': { en: 'Time', hi: 'समय' },
  'booking.type': { en: 'Type', hi: 'प्रकार' },
  'booking.done': { en: 'Done', hi: 'हो गया' },

  // Rate Modal
  'rate.title': { en: 'Rate Your Experience', hi: 'अपने अनुभव को रेट करें' },
  'rate.subtitle': { en: 'How was your appointment with', hi: 'आपका अपॉइंटमेंट कैसा रहा' },
  'rate.placeholder': { en: 'Write a review (optional)...', hi: 'समीक्षा लिखें (वैकल्पिक)...' },
  'rate.submit': { en: 'Submit Review', hi: 'समीक्षा भेजें' },

  // General
  'gen.loading': { en: 'Generating...', hi: 'जनरेट हो रहा है...' },
  'gen.analyzing': { en: 'Analyzing...', hi: 'विश्लेषण हो रहा है...' },
  'common.today': { en: 'Today', hi: 'आज' },
  'common.tomorrow': { en: 'Tomorrow', hi: 'कल' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },

  // Triage
  'triage.analyzing': { en: 'Analyzing symptoms...', hi: 'लक्षणों का विश्लेषण कर रहे हैं...' },
  'triage.find_specialist': { en: 'Find Specialists', hi: 'विशेषज्ञों को खोजें' },
  'triage.complete': { en: 'Consultation Complete', hi: 'परामर्श पूरा हुआ' },
  'triage.placeholder': { en: 'Describe your symptoms...', hi: 'अपने लक्षणों का वर्णन करें...' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
