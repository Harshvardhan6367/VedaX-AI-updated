import React, { useState } from 'react';
import { X, Pill, Clock, Plus, Info } from 'lucide-react';
import { Button, Card, Input } from '@/components/shared/ui';
import { Medication } from '@/types';

interface AddMedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (medication: Omit<Medication, 'id' | 'taken'>) => void;
}

const AddMedicationModal: React.FC<AddMedicationModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: '',
        dosage: '',
        frequency: 'Daily'
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.dosage) {
            onAdd(formData);
            setFormData({ name: '', dosage: '', frequency: 'Daily' });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 font-sans">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="w-full max-w-lg relative animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <Card className="!p-0 overflow-hidden shadow-2xl border-white/20">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 rounded-xl p-2.5 shadow-lg shadow-blue-500/20">
                                <Plus size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tighter uppercase">
                                    Add Medication
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">New Prescription</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                        >
                            <X size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medicine Name</label>
                            <Input
                                placeholder="e.g. Amoxicillin"
                                icon={Pill}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="bg-slate-50 dark:bg-slate-900/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosage</label>
                                <Input
                                    placeholder="e.g. 1 Tablet"
                                    icon={Info}
                                    value={formData.dosage}
                                    onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                                    required
                                    className="bg-slate-50 dark:bg-slate-900/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Clock size={18} />
                                    </div>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="Daily">Daily</option>
                                        <option value="Morning">Morning</option>
                                        <option value="Night">Night</option>
                                        <option value="TWICE A DAY">Twice a day</option>
                                        <option value="AS NEEDED">As needed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-4">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full py-4 shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest"
                            >
                                Add Medication
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="w-full text-xs font-bold uppercase tracking-widest text-slate-400"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default AddMedicationModal;
