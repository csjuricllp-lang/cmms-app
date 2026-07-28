import { useState, useRef } from 'react';
import { 
    Upload, 
    X, 
    FileText, 
    CheckCircle2, 
    ChevronRight,
    Download,
    Loader2,
    Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ImportWorkOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ImportWorkOrdersModal = ({ isOpen, onClose }: ImportWorkOrdersModalProps) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
            const bstr = event.target?.result;
            const workbook = XLSX.read(bstr, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            setData(json);
            setStep(2);
        };
        reader.readAsBinaryString(uploadedFile);
    };

    const startImport = async () => {
        setIsImporting(true);
        let completed = 0;

        for (const item of data) {
            try {
                await api.post('/work-orders', {
                    title: item.Title || item.title || 'Untitled Work Order',
                    description: item.Description || item.description || '',
                    status: item.Status || item.status || 'Open',
                    priority: item.Priority || item.priority || 'Medium',
                    dueDate: item['Due Date'] || item.dueDate || null,
                });
                completed++;
                setProgress(Math.round((completed / data.length) * 100));
            } catch (err) {
                console.error('Import error for item:', item, err);
            }
        }

        setIsImporting(false);
        setStep(3);
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        toast.success(`Successfully imported ${completed} work orders`);
    };

    const downloadTemplate = () => {
        const template = [
            { Title: 'Fix HVAC Unit', Description: 'Check filters and coolant levels', Status: 'Open', Priority: 'High', 'Due Date': '2024-12-31' },
            { Title: 'Monthly Inspection', Description: 'Standard safety walk-through', Status: 'Open', Priority: 'Medium', 'Due Date': '2024-12-15' },
        ];
        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'WorkOrders_Import_Template.xlsx');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white w-full max-w-[600px] rounded-[32px] shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-slate-900 px-8 py-10 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-50">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black">Data Importer</h2>
                                <p className="text-white/50 text-[13px] font-bold uppercase tracking-widest">Enterprise Migration Hub</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
                </div>

                <div className="p-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 rounded-[32px] p-12 hover:border-primary/50 hover:bg-primary/[0.02] transition-all cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <FileText className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <h3 className="text-[18px] font-black text-slate-900">Click to upload or drag and drop</h3>
                                        <p className="text-slate-500 font-medium mt-1">Supports CSV, XLS, XLSX files</p>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="hidden" 
                                            accept=".csv,.xlsx,.xls"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[14px] font-black text-slate-900 leading-tight">Need a template?</p>
                                        <p className="text-[12px] font-medium text-slate-500">Download our pre-formatted file to ensure perfect data mapping.</p>
                                    </div>
                                    <button 
                                        onClick={downloadTemplate}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-black hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        Download
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[16px] font-black text-slate-900 truncate">{file?.name}</h3>
                                        <p className="text-[13px] font-bold text-emerald-600 uppercase tracking-widest">{data.length} records detected</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Field Mapping</h4>
                                        <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Auto-matched</span>
                                    </div>
                                    <div className="space-y-2">
                                        {['Title', 'Description', 'Status', 'Priority'].map((field) => (
                                            <div key={field} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[14px] font-bold text-slate-700">{field}</span>
                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                                <span className="text-[14px] font-black text-primary italic">Column: {field}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={startImport}
                                    disabled={isImporting}
                                    className="w-full h-14 bg-primary text-white rounded-2xl font-black text-[16px] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isImporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
                                    {isImporting ? `Importing ${progress}%` : 'Execute Import'}
                                </button>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 relative">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black text-white"
                                    >
                                        OK
                                    </motion.div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Import Complete</h3>
                                <p className="text-slate-500 font-medium mt-2 max-w-[300px] mx-auto">Your work orders have been successfully synchronized with the main database.</p>
                                
                                <button 
                                    onClick={onClose}
                                    className="mt-10 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[14px] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                                >
                                    Return to Dashboard
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
