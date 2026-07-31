import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface ImportChecklistsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ImportChecklistsModal: React.FC<ImportChecklistsModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ checklistsCreated: number; errors: string[] } | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDownloadTemplate = () => {
        window.open('http://localhost:3000/api/import/download-checklists-template', '_blank');
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await api.post('/import/checklists', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            setResult(response.data);
            if (response.data.errors && response.data.errors.length > 0) {
                toast.error(`Import completed with ${response.data.errors.length} errors`);
            } else {
                toast.success(`Successfully imported ${response.data.checklistsCreated} checklists`);
            }
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to import file');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Import Checklists</h2>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {!result && (
                        <div className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                                    Upload your Excel/CSV file containing your checklists and tasks.
                                </p>
                                <button 
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-bold hover:bg-blue-100 transition-all shrink-0"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Template
                                </button>
                            </div>

                            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-slate-50/50 relative">
                                <Upload className="w-10 h-10 text-slate-300 mb-3" />
                                <span className="text-[14px] font-bold text-slate-600 mb-1">
                                    {file ? file.name : 'Choose file or drag & drop'}
                                </span>
                                <span className="text-[12px] text-slate-400 font-medium">
                                    Supports .xlsx, .csv (Max 10MB)
                                </span>
                                <input 
                                    type="file" 
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    disabled={isUploading}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-2">
                                <button 
                                    onClick={onClose}
                                    className="px-6 py-3 text-slate-500 text-[14px] font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                    disabled={isUploading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={!file || isUploading}
                                    onClick={handleUpload}
                                    className="px-8 py-3 bg-blue-600 text-white text-[14px] font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        'Upload & Import'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                <div>
                                    <h4 className="text-[14px] font-bold text-emerald-800">Successfully Imported</h4>
                                    <p className="text-[13px] text-emerald-600 font-medium">{result.checklistsCreated} checklists added.</p>
                                </div>
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-rose-600 text-[13px] font-bold">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Warnings & Errors ({result.errors.length})</span>
                                    </div>
                                    <div className="max-h-[180px] overflow-y-auto border border-rose-100 bg-rose-50/20 rounded-xl p-4 space-y-2 text-[12px] font-medium text-rose-700 font-mono">
                                        {result.errors.map((err, idx) => (
                                            <div key={idx} className="border-b border-rose-100/50 pb-1.5 last:border-none last:pb-0">
                                                {err}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={onClose}
                                    className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white text-[14px] font-black rounded-2xl transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
