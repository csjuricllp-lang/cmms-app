import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { parsePMImportFile, downloadPMTemplate } from '../utils/pm-export-utils';
import { usePreventiveMaintenance } from '../hooks/useData';
import { toast } from 'react-hot-toast';

interface ImportPMModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ImportPMModal: React.FC<ImportPMModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const { bulkCreatePM } = usePreventiveMaintenance();

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error("Please select a file to import");
            return;
        }

        setIsParsing(true);
        try {
            const data = await parsePMImportFile(file);
            if (!data || data.length === 0) {
                toast.error("The selected file is empty or invalid");
                return;
            }

            // Let the backend handle mapping strings to UUIDs
            await bulkCreatePM.mutateAsync(data);
            onClose();
        } catch (error) {
            console.error("Error importing file", error);
            toast.error("Failed to parse the file. Please ensure it matches the template format.");
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-card rounded-[24px] shadow-2xl flex flex-col overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <h3 className="text-[18px] font-black text-foreground">Import Preventive Maintenance</h3>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                                <div className="text-[13px] text-primary/80">
                                    <p className="font-bold mb-1">Need a template?</p>
                                    <p>Download our standard template to ensure your columns match exactly what the system expects.</p>
                                    <button 
                                        onClick={downloadPMTemplate}
                                        className="mt-2 text-primary font-black hover:underline"
                                    >
                                        Download Template
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-black uppercase text-muted-foreground mb-2">Upload Excel File</label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors rounded-2xl cursor-pointer group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {file ? (
                                            <>
                                                <FileSpreadsheet className="w-8 h-8 text-primary mb-2" />
                                                <p className="text-[13px] font-bold text-foreground">{file.name}</p>
                                                <p className="text-[11px] text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                                                <p className="text-[13px] font-bold text-foreground">Click to upload or drag and drop</p>
                                                <p className="text-[11px] text-muted-foreground mt-1">.xlsx or .csv files up to 10MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept=".xlsx, .xls, .csv" 
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                            <button 
                                onClick={onClose}
                                className="px-4 py-2 text-[13px] font-black text-muted-foreground hover:text-foreground transition-colors"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={handleImport}
                                disabled={!file || isParsing || bulkCreatePM.isPending}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-xl text-[13px] font-black hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isParsing || bulkCreatePM.isPending ? 'IMPORTING...' : 'IMPORT PMs'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
