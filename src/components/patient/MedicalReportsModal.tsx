import React, { useState, useMemo, useRef } from 'react';
import { X, FileText, Upload, Calendar, User, Download, FilePlus, Search, Filter } from 'lucide-react';
import { UserProfile, MedicalReport } from '@/types';
import { Badge } from '@/components/shared/ui';

interface MedicalReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
    onAddReport: (report: MedicalReport) => void;
    isCaregiverMode?: boolean;
}

const MedicalReportsModal: React.FC<MedicalReportsModalProps> = ({ isOpen, onClose, user, onAddReport, isCaregiverMode = false }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [reportName, setReportName] = useState('');
    const [reportType, setReportType] = useState<'Lab Report' | 'Prescription' | 'Certificate' | 'Imaging'>('Lab Report');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [previewReport, setPreviewReport] = useState<MedicalReport | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = ['All', 'Lab Report', 'Prescription', 'Certificate', 'Imaging'];

    const filteredReports = useMemo(() => {
        if (!user.reports) return [];
        return user.reports.filter(report => {
            const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || report.type === selectedCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [user.reports, searchTerm, selectedCategory]);

    if (!isOpen) return null;

    const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Pre-fill the report name if it's currently empty
            if (!reportName.trim()) {
                // Remove file extension for default name
                const defaultName = file.name.replace(/\.[^/.]+$/, "");
                setReportName(defaultName);
            }
        }
    };

    const handleUploadSubmit = () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onloadend = () => {
            const base64Data = reader.result as string;

            const newReport: MedicalReport = {
                id: Date.now().toString(),
                title: reportName.trim() || selectedFile.name,
                date: new Date().toISOString().split('T')[0],
                type: reportType,
                doctorName: isCaregiverMode ? 'Uploaded by Relative' : 'Self Uploaded',
                url: base64Data
            };

            // Mount file data onto object so App.tsx can pull it out easily
            (newReport as any).fileData = base64Data;

            onAddReport(newReport);
            setIsUploading(false);
            setReportName('');
            setReportType('Lab Report');
            setSelectedFile(null);

            // Reset input so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };

        reader.onerror = () => {
            console.error("Failed to read file.");
            setIsUploading(false);
        };

        // Read the file as a Data URL (base64 string)
        reader.readAsDataURL(selectedFile);
    };



    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden border border-slate-200 dark:border-slate-800">

                {/* Document Preview Overlay */}
                {previewReport && (
                    <div className="absolute inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-300">
                        <div className="p-4 flex justify-between items-center bg-black/50 border-b border-white/10">
                            <h3 className="text-white font-bold">{previewReport.title}</h3>
                            <button onClick={() => setPreviewReport(null)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                            {previewReport.url && previewReport.url.startsWith('data:image') ? (
                                <img src={previewReport.url} alt={previewReport.title} className="max-w-full max-h-full object-contain rounded-lg" />
                            ) : previewReport.url && previewReport.url.startsWith('data:application/pdf') ? (
                                <iframe src={previewReport.url} title={previewReport.title} className="w-full h-full bg-white rounded-lg" />
                            ) : (
                                <div className="text-center text-white/50">
                                    <FileText size={64} className="mx-auto mb-4 opacity-50" />
                                    <p>File preview not available for this simulated document.</p>
                                    <a
                                        href={previewReport.url !== '#' ? previewReport.url : undefined}
                                        download={previewReport.url !== '#' ? previewReport.title : undefined}
                                        className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                                        onClick={() => { if (previewReport.url === '#') alert('Simulated download') }}
                                    >
                                        Download Instead
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="shrink-0 p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Medical Reports</h2>
                            <p className="text-sm font-bold text-slate-500">Your health document repository</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
                    <div className="space-y-6">

                        {/* Upload Section */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Upload New Document</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Report Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={reportName}
                                        onChange={(e) => setReportName(e.target.value)}
                                        placeholder="e.g., Blood Test Results"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Document Type</label>
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value as any)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 dark:text-white appearance-none"
                                    >
                                        <option value="Lab Report">Lab Report</option>
                                        <option value="Prescription">Prescription</option>
                                        <option value="Imaging">Imaging</option>
                                        <option value="Certificate">Certificate</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                {!selectedFile ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group"
                                    >
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleSimulatedUpload} accept=".pdf,.png,.jpg,.jpeg" />
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <FilePlus size={24} />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                                            Select File to Upload
                                        </h4>
                                        <p className="text-xs text-slate-500 max-w-xs font-medium mx-auto">
                                            PDF, PNG, or JPG up to 10MB.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 bg-blue-50 dark:bg-blue-900/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="truncate pr-2">
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{selectedFile.name}</p>
                                                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
                                                disabled={isUploading}
                                                title="Remove file"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleUploadSubmit}
                                            disabled={isUploading}
                                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all
                                                ${isUploading
                                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                                                }`}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Upload size={18} className="animate-bounce" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={18} />
                                                    Upload Document
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search reports by name or doctor..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div className="flex overflow-x-auto scrollbar-hide py-1 gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Reports List */}
                        <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-slate-400" /> Recent Documents
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report) => (
                                        <div
                                            key={report.id}
                                            onClick={() => setPreviewReport(report)}
                                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-blue-500 hover:shadow-md transition-all cursor-pointer shadow-sm relative overflow-hidden"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-base truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{report.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={report.type === 'Lab Report' ? 'info' : report.type === 'Prescription' ? 'success' : report.type === 'Imaging' ? 'warning' : 'info'}>{report.type}</Badge>
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{report.date}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-none border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                    <User size={14} />
                                                    <span className="truncate max-w-[120px]">{report.doctorName}</span>
                                                </div>
                                                <a
                                                    href={report.url !== '#' ? report.url : undefined}
                                                    download={report.url !== '#' ? report.title : undefined}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (report.url === '#') {
                                                            e.preventDefault();
                                                            alert(`Simulated download for mock report: ${report.title}`);
                                                        }
                                                    }}
                                                    target={report.url !== '#' ? "_blank" : undefined}
                                                    rel="noreferrer"
                                                    className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                        <p className="text-slate-500 font-bold">No medical reports found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalReportsModal;
