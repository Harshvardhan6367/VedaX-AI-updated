import React, { useState } from 'react';
import {
  User, Mail, Phone, Calendar, Shield, LogOut, Camera,
  MapPin, Heart, Activity, FileText, ChevronRight, Edit3, Save, ShieldAlert,
  Trash2, Plus, Pill
} from 'lucide-react';
import { UserProfile, Medication } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, Badge, Input } from '@/components/shared/ui';

interface ProfilePageProps {
  user: UserProfile;
  isCaregiverMode?: boolean;
  onUpdate: (user: UserProfile) => void;
  onLogout: () => void;
  onAddMed: () => void;
  onRemoveMed: (medId: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  isCaregiverMode = false,
  onUpdate,
  onLogout,
  onAddMed,
  onRemoveMed
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('nav.profile')}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage your medical profile and security settings.</p>
        </div>
        <div className="flex gap-3">
          {!isCaregiverMode && (
            isEditing ? (
              <Button variant="primary" icon={Save} onClick={handleSave}>
                Save Changes
              </Button>
            ) : (
              <Button variant="secondary" icon={Edit3} onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )
          )}
          <Button variant="danger" icon={LogOut} onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - ID Card */}
        <div className="space-y-6">
          <Card glass className="!p-0 overflow-hidden relative group">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <div className="px-6 pb-6 text-center">
              <div className="relative inline-block -mt-12 mb-4">
                <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1.5 shadow-2xl relative">
                  <div className="w-full h-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    <User size={40} className="text-slate-300" />
                  </div>
                  <button className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all">
                    <Camera size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{user.name}</h3>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">Patient ID: VX-AI-2024</p>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</p>
                  <p className="font-bold text-slate-800 dark:text-white">{user.age || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                  <p className="font-bold text-slate-800 dark:text-white">{user.gender || 'N/A'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-widest">Emergency Contact</h4>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
              <div>
                <p className="font-black text-rose-600 dark:text-rose-400 text-sm">{user.emergencyContact?.name || 'Not Set'}</p>
                <p className="text-xs text-rose-500/80 font-medium">{user.emergencyContact?.relation || 'Guardian'}</p>
              </div>
              <a href={`tel:${user.emergencyContact?.phone}`} className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 transition-colors">
                <Phone size={16} />
              </a>
            </div>
          </Card>
        </div>

        {/* Right Column - Info Tabs / Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="!p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Personal Information</h3>
              <Badge variant="info">Verified Profile</Badge>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <Input
                    icon={User}
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <Input
                    icon={Mail}
                    disabled={!isEditing}
                    value={formData.email || 'user@example.com'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                  <Input
                    icon={Calendar}
                    disabled={!isEditing}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Gender</label>
                  <Input
                    disabled={!isEditing}
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Blood Group</label>
                  <Input
                    icon={Activity}
                    disabled={!isEditing}
                    placeholder="e.g. O+"
                    value={formData.bloodGroup || ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Address</label>
                <Input
                  icon={MapPin}
                  disabled={!isEditing}
                  placeholder="Your full home address"
                />
              </div>
            </div>
          </Card>

          {/* Medication Management Section */}
          <Card className="!p-0 overflow-hidden mt-8 border-blue-200 dark:border-blue-900 shadow-lg shadow-blue-500/5">
            <div className="p-6 border-b border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 flex justify-between items-center">
              <h3 className="font-extrabold text-blue-900 dark:text-blue-400 flex items-center gap-2 uppercase tracking-tighter text-lg">
                <Pill size={20} /> Medications Management
              </h3>
              <Button
                variant="primary"
                className="!py-2 !px-4 !text-xs"
                icon={Plus}
                onClick={onAddMed}
              >
                Add Medicine
              </Button>
            </div>

            <div className="p-8">
              {user.medications.length === 0 ? (
                <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                  <Pill size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No medications added yet.</p>
                  <button
                    onClick={onAddMed}
                    className="text-blue-600 dark:text-blue-400 text-sm font-bold mt-2 hover:underline"
                  >
                    Click here to add your first medicine
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.medications.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                          <Pill size={24} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-tight">{med.name}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{med.dosage}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                            <Badge variant="info" className="!py-0.5 !px-2 !lowercase !text-[11px] first-letter:uppercase">{med.frequency}</Badge>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveMed(med.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-95 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50"
                        title="Remove Medication"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Caregiver Access Management Section */}
          <Card className="!p-0 overflow-hidden mt-8 border-amber-200 dark:border-amber-900 shadow-lg shadow-amber-500/5">
            <div className="p-6 border-b border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10 flex justify-between items-center">
              <h3 className="font-extrabold text-amber-900 dark:text-amber-500 flex items-center gap-2">
                <ShieldAlert size={20} /> Access Management
              </h3>
              {isCaregiverMode && <Badge variant="warning">Read Only</Badge>}
            </div>

            <div className="p-8 space-y-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                You can grant a relative or caregiver restricted access to monitor your profile and upload medical reports on your behalf. They will use their own email to log in to VedaX-AI.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Caregiver Name</label>
                  <Input
                    icon={User}
                    disabled={!isEditing || isCaregiverMode}
                    placeholder="e.g. Ramesh Singh"
                    value={formData.caregiver?.name || ''}
                    onChange={e => setFormData({
                      ...formData,
                      caregiver: { ...formData.caregiver, name: e.target.value, email: formData.caregiver?.email || '' }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Caregiver Email (Login Id)</label>
                  <Input
                    icon={Mail}
                    type="email"
                    disabled={!isEditing || isCaregiverMode}
                    placeholder="e.g. relative@demo.com"
                    value={formData.caregiver?.email || ''}
                    onChange={e => setFormData({
                      ...formData,
                      caregiver: { ...formData.caregiver, name: formData.caregiver?.name || '', email: e.target.value }
                    })}
                  />
                </div>
              </div>

              {formData.caregiver?.email && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-800/30">
                  <Shield size={18} />
                  Access granted to {formData.caregiver.name} ({formData.caregiver.email})
                </div>
              )}
            </div>
          </Card>

          <Card className="!p-0 overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={20} className="text-blue-500" /> Medical Overview
              </h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Known Allergies</h4>
                <div className="flex flex-wrap gap-2 text-wrap break-words">
                  {user.allergies && user.allergies.length > 0 ? (
                    user.allergies.map((allergy, i) => (
                      <Badge key={i} variant="error" className="!normal-case !text-sm !py-1.5 !px-3 font-semibold">{allergy}</Badge>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm italic">No allergies recorded</p>
                  )}
                  {isEditing && (
                    <button className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs font-bold hover:border-blue-500 hover:text-blue-500 transition-all">+ Add Allergy</button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Medical History</h4>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  {isEditing ? (
                    <textarea
                      className="w-full bg-transparent outline-none text-sm text-slate-600 dark:text-slate-300 min-h-[100px]"
                      value={formData.medicalHistory}
                      onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {user.medicalHistory || 'No medical history reported yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
