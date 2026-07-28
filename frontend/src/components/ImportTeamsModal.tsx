import React, { useState, useRef } from 'react';
import { X, ChevronDown, Download, ExternalLink, Paperclip, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface ImportTeamsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ImportTeamsModal: React.FC<ImportTeamsModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [dataSet, setDataSet] = useState('Teams');
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [results, setResults] = useState<{ teamsCreated: number, usersCreated: number, errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleImportStart = async () => {
        if (!file) {
            toast.error('Please select an Excel or CSV file first');
            return;
        }

        setIsImporting(true);
        const loadingToast = toast.loading('Processing migration data...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/import/teams-personnel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResults(response.data);
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Migration successful', { id: loadingToast });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Migration engine failed', { id: loadingToast });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-6 border-b border-gray-100 bg-white">
                    <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Data Migration Hub</h2>
                    <button onClick={onClose} className="p-2.5 hover:bg-gray-50 rounded-full transition-all text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-16">
                    {!results ? (
                        <div className="max-w-md mx-auto space-y-10">
                            <div className="space-y-2">
                                <h3 className="text-[24px] font-black text-gray-900 text-center mb-10 tracking-tight italic">Bulk Import</h3>
                                
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-black text-gray-500 uppercase tracking-widest leading-none">Data Target</label>
                                        <div className="relative group">
                                            <select 
                                                className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[15px] font-bold focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer group-hover:border-slate-300"
                                                value={dataSet}
                                                onChange={(e) => setDataSet(e.target.value)}
                                            >
                                                <option>Teams & Personnel (Unified)</option>
                                            </select>
                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[13px] font-black text-gray-500 uppercase tracking-widest leading-none">Source File</label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className={cn(
                                                "w-full px-6 py-8 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                                                file ? "bg-emerald-50/50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-white"
                                            )}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept=".csv,.xlsx,.xls"
                                            />
                                            {file ? <Check className="w-8 h-8" /> : <Paperclip className="w-8 h-8 text-gray-400" />}
                                            <span className="text-[14px] font-bold">
                                                {file ? file.name : "Select CSV or Excel file"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col items-center gap-12">
                                <button 
                                    onClick={handleImportStart}
                                    disabled={isImporting || !file}
                                    className={cn(
                                        "w-full py-5 rounded-[24px] text-[15px] font-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3",
                                        isImporting || !file 
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                            : "bg-gray-950 text-white hover:bg-gray-800 shadow-gray-500/20"
                                    )}
                                >
                                    {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                    {isImporting ? "Processing..." : "Initiate Import Engine"}
                                </button>

                                <div className="flex items-center gap-8 py-4 border-t border-gray-50 w-full justify-center">
                                    <button 
                                        onClick={async () => {
                                            const response = await api.post('/import/download-template', {}, { responseType: 'blob' });
                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.setAttribute('download', 'migration_template.xlsx');
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                        }}
                                        className="flex items-center gap-2 text-[12px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                                    >
                                        <Download className="w-4 h-4" />
                                        Template
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-200" />
                                    <button 
                                        onClick={async () => {
                                            const response = await api.post('/import/export-teams', {}, { responseType: 'blob' });
                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.setAttribute('download', 'teams_export.xlsx');
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                        }}
                                        className="flex items-center gap-2 text-[12px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                                    >
                                        Export Current Teams
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-200" />
                                    <button className="flex items-center gap-2 text-[12px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">
                                        See Examples & Tutorials
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto text-center space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-[24px] font-black text-gray-900 tracking-tight italic mb-2">Migration Completed</h3>
                                <p className="text-[15px] font-medium text-gray-500">The high-density data ingestion has finished.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-6 rounded-3xl">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Teams</p>
                                    <p className="text-[24px] font-black text-gray-900">+{results.teamsCreated}</p>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-3xl">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Personnel</p>
                                    <p className="text-[24px] font-black text-gray-900">+{results.usersCreated}</p>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="bg-amber-50 p-6 rounded-3xl text-left border border-amber-100">
                                    <div className="flex items-center gap-2 mb-3 text-amber-700">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-[13px] font-black uppercase tracking-widest">Anomaly Report ({results.errors.length})</span>
                                    </div>
                                    <ul className="text-[12px] font-medium text-amber-600 space-y-1 max-h-32 overflow-y-auto">
                                        {results.errors.slice(0, 5).map((err, i) => (
                                            <li key={i}>• {err}</li>
                                        ))}
                                        {results.errors.length > 5 && <li>... and {results.errors.length - 5} more</li>}
                                    </ul>
                                </div>
                            )}

                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-gray-950 text-white rounded-[20px] text-[15px] font-black transition-all shadow-xl active:scale-[0.98]"
                            >
                                Finish & View Registry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
