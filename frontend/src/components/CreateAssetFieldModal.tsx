import React, { useState } from 'react';
import { X, GripVertical, Plus, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

import { useAssetSettings } from '../hooks/useAssetSettings';

interface CreateAssetFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    fieldType: string;
    entityType?: string;
}

export const CreateAssetFieldModal: React.FC<CreateAssetFieldModalProps> = ({ isOpen, onClose, fieldType, entityType = 'ASSET' }) => {
    const [fieldName, setFieldName] = useState('');
    const [options, setOptions] = useState<string[]>(['']);
    const [precision, setPrecision] = useState('1');

    const { createField } = useAssetSettings(entityType);

    const handleSubmit = () => {
        createField.mutate({
            label: fieldName,
            type: fieldType,
            entityType,
            options: fieldType === 'Dropdown' ? options : [],
            precision: (fieldType === 'Number' || fieldType === 'Currency') ? parseInt(precision) : undefined,
        }, {
            onSuccess: () => {
                setFieldName('');
                setOptions(['']);
                onClose();
            }
        });
    };
    const addOption = () => setOptions([...options, '']);
    const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    if (!isOpen) return null;

    const isDropdown = fieldType === 'Dropdown';
    const isNumber = fieldType === 'Number' || fieldType === 'Currency';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#000000]/30 backdrop-blur-[1px]" 
                onClick={onClose} 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="relative w-full max-w-[480px] bg-white rounded-xl shadow-2xl overflow-hidden p-8 space-y-8"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-bold text-slate-800">Create {fieldType} Field</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    {(fieldType === 'Multi-Line Text' || fieldType === 'Single Line Text') && (
                        fieldType === 'Multi-Line Text' ? (
                            <p className="text-[16px] text-slate-400 font-medium leading-relaxed">
                                Multi-line text fields <span className="text-slate-600 font-bold">aren't filterable or reportable</span>, and they have a 32,000 character limit.
                            </p>
                        ) : (
                            <p className="text-[16px] text-slate-400 font-medium leading-relaxed">
                                Single line text fields have a 255 character limit.
                            </p>
                        )
                    )}

                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-slate-700 ml-1">Field Name</label>
                        <input 
                            autoFocus
                            type="text"
                            value={fieldName}
                            onChange={(e) => setFieldName(e.target.value)}
                            className="w-full px-5 py-3.5 bg-white border-2 border-gray-100 rounded-xl text-[16px] font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        />
                    </div>

                    {isNumber && (
                        <div className="space-y-3 pt-2">
                            <label className="text-[14px] font-bold text-slate-700 ml-1">Decimal Precision</label>
                            <div className="relative group">
                                <select 
                                    value={precision}
                                    onChange={(e) => setPrecision(e.target.value)}
                                    className="w-full appearance-none px-5 py-3.5 bg-white border-2 border-gray-100 rounded-xl text-[16px] font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer"
                                >
                                    <option value="0">0</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                        </div>
                    )}

                    {isDropdown && (
                        <div className="space-y-6 pt-4">
                            <div className="h-[1px] bg-gray-100 w-full" />
                            
                            <div className="space-y-4">
                                <label className="text-[14px] font-bold text-slate-700 ml-1">Options</label>
                                <div className="space-y-4">
                                    {options.map((option, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <GripVertical className="w-5 h-5 text-slate-300" />
                                            <input 
                                                type="text"
                                                value={option}
                                                onChange={(e) => updateOption(index, e.target.value)}
                                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] font-medium focus:border-indigo-600 outline-none transition-all"
                                            />
                                            {options.length > 1 && (
                                                <button onClick={() => removeOption(index)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={addOption}
                                    className="flex items-center gap-2 px-4 py-2 text-[14px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add Option</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-gray-200 text-slate-600 text-[14px] font-bold rounded-xl hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={createField.isPending || !fieldName.trim() || (isDropdown && options.some(o => !o.trim()))}
                        className={cn(
                            "px-8 py-3 text-[14px] font-bold rounded-xl transition-all",
                            fieldName.trim() && (!isDropdown || options.every(o => o.trim()))
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700" 
                                : "bg-slate-50 text-slate-300 cursor-not-allowed"
                        )}
                    >
                        {createField.isPending ? 'Creating...' : 'Create Field'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
