import { useState } from 'react';
import { 
    Calendar,
    ChevronDown, 
    X, 
    Check,
    Plus,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface FilterBarProps {
    datePreset: string;
    setDatePreset: (val: string) => void;
    typeFilter: string;
    setTypeFilter: (val: string) => void;
    selectedCategories: string[];
    setSelectedCategories: (val: string[]) => void;
    selectedLocations: string[];
    setSelectedLocations: (val: string[]) => void;
    selectedAssets: string[];
    setSelectedAssets: (val: string[]) => void;
    selectedTeams: string[];
    setSelectedTeams: (val: string[]) => void;
    selectedWorker: string;
    setSelectedWorker: (val: string) => void;
    dateCompletedFilters: any[];
    dueDateFilters: any[];
    priorityFilter: string;
    setPriorityFilter: (val: string) => void;
    selectedAssetCategories: string[];
    setSelectedAssetCategories: (val: string[]) => void;
    downtimeCategoryFilter: string;
    setDowntimeCategoryFilter: (val: string) => void;
    assetStatusFilter: string;
    setAssetStatusFilter: (val: string) => void;
    warrantyDateFilter: string;
    setWarrantyDateFilter: (val: string) => void;
    meterNameFilter: string[];
    setMeterNameFilter: (val: string[]) => void;
    meterCategoryFilter: string[];
    setMeterCategoryFilter: (val: string[]) => void;
    partLocationFilter: string[];
    setPartLocationFilter: (val: string[]) => void;
    woLocationFilter: string[];
    setWoLocationFilter: (val: string[]) => void;
    partCategoryFilter: string[];
    setPartCategoryFilter: (val: string[]) => void;
    partNumberFilter: string;
    setPartNumberFilter: (val: string) => void;
    resetFilters: () => void;
    analytics: any;
    activeTab: string;
}
const DatePickerDropdown = ({ activePreset, onSelect }: { activePreset: string, onSelect: (val: string) => void }) => {
    const [activeTab, setActiveTab] = useState<'Presets' | 'Custom'>('Presets');
    const [isMoreExpanded, setIsMoreExpanded] = useState(false);

    const presetGroups = [
        {
            items: ['Today', 'Yesterday']
        },
        {
            items: ['Last 7 Days', 'Last 14 Days', 'Last 28 Days', 'Last 30 Days', 'Last 90 Days', 'Last 180 Days', 'Last 365 Days', 'Year To Date']
        }
    ];

    const moreGroups = [
        {
            items: ['This Week', 'This Month', 'This Quarter', 'This Year']
        },
        {
            items: ['Previous Week', 'Previous Month', 'Previous Quarter', 'Previous Year']
        }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-[280px] bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[1000] overflow-hidden"
        >
            <div className="flex border-b border-slate-100">
                {(['Presets', 'Custom'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-4 text-[13px] font-black uppercase tracking-widest italic transition-all relative",
                            activeTab === tab ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="tabLine" className="absolute bottom-0 left-6 right-6 h-1 bg-indigo-600 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'Presets' ? (
                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    {presetGroups.map((group, gIdx) => (
                        <div key={gIdx} className={cn("py-1", gIdx > 0 && "border-t border-slate-50")}>
                            {group.items.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => onSelect(item)}
                                    className={cn(
                                        "w-full px-6 py-2.5 flex items-center gap-3 text-[14px] font-medium transition-all group",
                                        activePreset === item ? "bg-slate-100/80 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="w-5 flex justify-center">
                                        {activePreset === item && <Check className="w-4 h-4 text-slate-500 stroke-[3]" />}
                                    </div>
                                    <span className={cn(activePreset === item && "font-bold")}>{item}</span>
                                </button>
                            ))}
                        </div>
                    ))}

                    <div className="border-t border-slate-100 bg-slate-50/50">
                        <button 
                            onClick={() => setIsMoreExpanded(!isMoreExpanded)}
                            className="w-full px-6 py-4 flex items-center justify-between text-[13px] font-black text-slate-700 hover:bg-slate-50 transition-all uppercase tracking-widest italic"
                        >
                            More
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isMoreExpanded && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                            {isMoreExpanded && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-white"
                                >
                                    {moreGroups.map((group, gIdx) => (
                                        <div key={gIdx} className={cn("py-1", gIdx > 0 && "border-t border-slate-100")}>
                                            {group.items.map((item) => (
                                                <button
                                                    key={item}
                                                    onClick={() => onSelect(item)}
                                                    className={cn(
                                                        "w-full px-6 py-2.5 flex items-center text-[14px] font-medium transition-all",
                                                        activePreset === item ? "bg-slate-50 text-indigo-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest italic">Custom Date Picker</p>
                    <p className="text-[11px] text-slate-400 font-medium">Define your own temporal parameters with precision.</p>
                </div>
            )}
        </motion.div>
    );
};
const SimpleDropdown = ({ options, onSelect }: { options: any[], onSelect: (val: string) => void }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute top-full left-0 mt-2 w-full min-w-[160px] bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[1000] overflow-hidden py-1"
    >
        {options.map((opt) => {
            const optValue = typeof opt === 'object' ? (opt.id || opt.name) : opt;
            const optLabel = typeof opt === 'object' ? opt.name : opt;
            return (
                <button
                    key={optValue}
                    onClick={() => onSelect(optValue)}
                    className="w-full px-6 py-3 text-left text-[14px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    {optLabel}
                </button>
            );
        })}
    </motion.div>
);

const MultiSelectDropdown = ({ 
    options = [], 
    selected, 
    onToggle, 
    onDeselectAll, 
    onClose 
}: { 
    options: any[], 
    selected: string[], 
    onToggle: (val: string) => void,
    onDeselectAll: () => void,
    onClose: () => void
}) => {
    const [search, setSearch] = useState('');
    const filteredOptions = options.filter(opt => {
        const label = typeof opt === 'object' ? opt.name : opt;
        return label.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-[400px] bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[1000] overflow-hidden flex flex-col"
        >
            <div className="p-4 bg-white border-b border-slate-100">
                <div className="relative group">
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="any value"
                        className="w-full px-4 py-2.5 bg-white border border-[#4285f4] rounded text-[15px] font-medium text-slate-700 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-500" />
                    </div>
                </div>
            </div>

            <div className="px-5 py-2.5 flex items-center justify-between border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-slate-400 flex items-center justify-center bg-white">
                        {/* Empty checkbox like in image */}
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[14px] font-bold text-slate-900">{selected.length} of {options.length} selected</span>
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center bg-white cursor-help">
                            <span className="text-[10px] text-slate-400 font-bold">i</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onDeselectAll}
                    className="text-[14px] font-medium text-[#c0ccda] hover:text-slate-400 transition-colors"
                >
                    Deselect all
                </button>
            </div>

            <div className="max-h-[300px] min-h-[100px] overflow-y-auto custom-scrollbar flex flex-col bg-white">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt: any) => {
                        const optValue = typeof opt === 'object' ? (opt.id || opt.name) : opt;
                        const optLabel = typeof opt === 'object' ? opt.name : opt;
                        const isSelected = selected.includes(optValue);
                        return (
                            <div 
                                key={optValue}
                                onClick={() => onToggle(optValue)}
                                className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                    isSelected ? "bg-white border-slate-400" : "bg-white border-slate-300"
                                )}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-600 stroke-[3]" />}
                                </div>
                                <span className={cn(
                                    "text-[14px] font-medium transition-colors",
                                    isSelected ? "text-slate-900" : "text-slate-600"
                                )}>
                                    {optLabel}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex-1 flex items-center justify-center py-10">
                        <span className="text-[14px] font-medium text-slate-400">No values found</span>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-10 bg-white">
                <button 
                    onClick={onClose}
                    className="text-[14px] font-bold text-[#4285f4] hover:opacity-80 transition-opacity"
                >
                    Cancel
                </button>
                <button 
                    onClick={onClose}
                    className="px-10 py-2 bg-[#4285f4] text-white rounded-[4px] font-bold text-[14px] hover:bg-[#3367d6] transition-all shadow-sm"
                >
                    Done
                </button>
            </div>
        </motion.div>
    );
};
const AdvancedFilterDropdown = ({ 
    options, 
    selected, 
    onToggle, 
    onClose,
    isText = false,
    textValue = '',
    onTextChange,
    hideBuilder = false
}: { 
    options: any[], 
    selected: string[], 
    onToggle: (val: string) => void, 
    onClose: () => void,
    isText?: boolean,
    textValue?: string,
    onTextChange?: (val: any) => void,
    hideBuilder?: boolean
}) => {
    const [isOperatorOpen, setIsOperatorOpen] = useState(false);
    const [isValueOpen, setIsValueOpen] = useState(hideBuilder || false);
    const [operator, setOperator] = useState('is');

    const operators = [
        'is', 'is not', 'contains', 'doesn\'t contain', 'starts with', 'doesn\'t start with',
        'ends with', 'doesn\'t end with', 'is blank', 'is not blank', 'is null', 'is not null',
        'matches a user attribute', 'matches (advanced)'
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={cn(
                "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[1000] flex flex-col gap-4",
                hideBuilder ? "w-[400px] p-0 overflow-hidden" : "w-[520px] p-6"
            )}
        >
            {!hideBuilder && (
                <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center border border-slate-300 rounded bg-white relative">
                        <button 
                            onClick={() => { setIsOperatorOpen(!isOperatorOpen); setIsValueOpen(false); }}
                            className={cn(
                                "px-4 py-3 flex items-center justify-between gap-4 border-r border-slate-200 hover:bg-slate-50 transition-all min-w-[90px]",
                                isOperatorOpen && "ring-2 ring-indigo-500 ring-inset z-10"
                            )}
                        >
                            <span className="text-[15px] font-medium text-slate-700">{operator}</span>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOperatorOpen && "rotate-180")} />
                        </button>
                    <AnimatePresence>
                        {isOperatorOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 mt-1 w-[300px] bg-white rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-slate-100 z-[2000] py-2 overflow-hidden"
                            >
                                {operators.map((op) => (
                                    <button
                                        key={op}
                                        onClick={() => { setOperator(op); setIsOperatorOpen(false); }}
                                        className={cn(
                                            "w-full px-5 py-2.5 text-left text-[14px] transition-colors",
                                            operator === op ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isText ? (
                        <div className="flex-1 px-4 py-2.5 flex items-center">
                            <input 
                                type="text"
                                value={textValue}
                                onChange={(e) => onTextChange?.(e.target.value)}
                                placeholder="any value"
                                className="w-full bg-transparent border-none focus:ring-0 text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                    ) : (
                        <button 
                            onClick={() => { setIsValueOpen(!isValueOpen); setIsOperatorOpen(false); }}
                            className={cn(
                                "flex-1 px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-all",
                                isValueOpen && "ring-2 ring-indigo-500 ring-inset z-10"
                            )}
                        >
                            <span className={cn("text-[15px] font-medium", selected.length > 0 ? "text-slate-700" : "text-slate-400")}>
                                {selected.length > 0 ? `${selected.length} selected` : 'any value'}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isValueOpen && "rotate-180")} />
                        </button>
                    )}
                </div>

                <button className="w-12 h-12 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-50 transition-all">
                    <Plus className="w-6 h-6 text-slate-400" />
                </button>
            </div>
            )}

            <AnimatePresence>
                {!isText && isValueOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className={cn(
                            "bg-white z-[2000] overflow-hidden flex flex-col",
                            hideBuilder ? "w-full" : "absolute top-full left-[90px] mt-1 w-[400px] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-slate-100"
                        )}
                    >
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border border-slate-300 bg-white flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                                    {selected.length === options.length && options.length > 0 && <Check className="w-3.5 h-3.5 text-slate-600 stroke-[3]" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[15px] font-medium text-slate-900">{selected.length} of {options.length} selected</span>
                                    <Info className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                            <button 
                                onClick={() => options.forEach(o => selected.includes(typeof o === 'object' ? (o.id || o.name) : o) && onToggle(typeof o === 'object' ? (o.id || o.name) : o))}
                                className="text-[15px] font-medium text-indigo-200 hover:text-indigo-600 transition-colors"
                            >
                                Deselect all
                            </button>
                        </div>
                        
                        <div className="max-h-[320px] overflow-y-auto py-2 bg-white">
                            {options.length > 0 ? (
                                options.map((opt) => {
                                    const optValue = typeof opt === 'object' ? (opt.id || opt.name) : opt;
                                    const optLabel = typeof opt === 'object' ? opt.name : opt;
                                    const isSelected = selected.includes(optValue);
                                    return (
                                        <button
                                            key={optValue}
                                            onClick={() => onToggle(optValue)}
                                            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                                isSelected ? "bg-white border-slate-600" : "bg-white border-slate-300 group-hover:border-slate-400"
                                            )}>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-slate-600 stroke-[3]" />}
                                            </div>
                                            <span className={cn(
                                                "text-[15px] font-medium transition-colors",
                                                isSelected ? "text-slate-900" : "text-slate-600"
                                            )}>
                                                {optLabel}
                                            </span>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                                    <span className="text-[18px] font-medium text-slate-600 italic">No values</span>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-6 bg-white">
                            <button 
                                onClick={() => setIsValueOpen(false)}
                                className="text-[16px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors px-4 py-2"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { setIsValueOpen(false); onClose(); }}
                                className="bg-indigo-600 text-white px-10 py-3 rounded-lg text-[16px] font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {isText && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-6 bg-white">
                    <button 
                        onClick={() => onClose()}
                        className="text-[16px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onClose()}
                        className="bg-indigo-600 text-white px-10 py-3 rounded-lg text-[16px] font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                        Done
                    </button>
                </div>
            )}
        </motion.div>
    );
};


export const FilterBar = ({
    datePreset,
    setDatePreset,
    typeFilter,
    setTypeFilter,
    selectedCategories,
    setSelectedCategories,
    selectedLocations,
    setSelectedLocations,
    selectedAssets,
    setSelectedAssets,
    selectedTeams,
    setSelectedTeams,
    selectedWorker,
    setSelectedWorker,
    dateCompletedFilters,
    dueDateFilters,
    priorityFilter,
    setPriorityFilter,
    selectedAssetCategories,
    setSelectedAssetCategories,
    downtimeCategoryFilter,
    setDowntimeCategoryFilter,
    assetStatusFilter,
    setAssetStatusFilter,
    warrantyDateFilter,
    setWarrantyDateFilter,
    meterNameFilter,
    setMeterNameFilter,
    meterCategoryFilter,
    setMeterCategoryFilter,
    partLocationFilter,
    setPartLocationFilter,
    woLocationFilter,
    setWoLocationFilter,
    partCategoryFilter,
    setPartCategoryFilter,
    partNumberFilter,
    setPartNumberFilter,
    resetFilters,
    analytics,
    activeTab
}: FilterBarProps) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const metadata = analytics?.metadata || {};

    const isReliability = activeTab === 'Reliability';
    const isTotalCost = activeTab === 'TotalCost';
    const isUsefulLife = activeTab === 'UsefulLife';
    const isMeters = activeTab === 'Meters';
    const isPartsConsumption = activeTab === 'PartsConsumption';
    const isPartsInventory = activeTab === 'PartsInventory';
    const isRequests = activeTab === 'Requests';

    const getLabelFromId = (id: string, options: any[]) => {
        if (id === 'any value' || !id) return 'is any value';
        const found = options?.find(opt => (opt.id || opt) === id);
        return typeof found === 'object' ? found.name : (found || id);
    };

    const filterItems = isReliability ? [
        { label: 'Available Date', value: datePreset, type: 'date' },
        { label: 'Asset Category', value: selectedAssetCategories.length > 0 ? `${selectedAssetCategories.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssetCategories || [] },
        { label: 'Location', value: selectedLocations.length > 0 ? `${selectedLocations.length} Selected` : 'is any value', type: 'multi', options: metadata.availableLocations || [] },
        { label: 'Asset Name', value: selectedAssets.length > 0 ? `${selectedAssets.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssets || [] },
        { label: 'Downtime Category', value: downtimeCategoryFilter, type: 'dropdown', options: ['Planned', 'Unplanned'] },
        { label: 'Asset Archival Status', value: assetStatusFilter, type: 'dropdown', options: ['is active', 'is archived', 'is any'] },
    ] : isTotalCost ? [
        { label: 'Date', value: datePreset, type: 'date' },
        { label: 'Asset Location', value: selectedLocations.length > 0 ? `${selectedLocations.length} Selected` : 'is any value', type: 'multi', options: metadata.availableLocations || [] },
        { label: 'Asset Name', value: selectedAssets.length > 0 ? `${selectedAssets.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssets || [] },
        { label: 'Category', value: selectedAssetCategories.length > 0 ? `${selectedAssetCategories.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssetCategories || [] },
    ] : isUsefulLife ? [
        { label: 'Category', value: selectedAssetCategories.length > 0 ? `${selectedAssetCategories.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssetCategories || [] },
        { label: 'Asset Location', value: selectedLocations.length > 0 ? `${selectedLocations.length} Selected` : 'is any value', type: 'multi', options: metadata.availableLocations || [] },
        { label: 'Warranty Expiration Date', value: warrantyDateFilter, type: 'date' },
    ] : isMeters ? [
        { label: 'Meter Location', value: selectedLocations.length > 0 ? `${selectedLocations.length} Selected` : 'is any value', type: 'multi', options: metadata.availableLocations || [] },
        { label: 'Meter Name', value: meterNameFilter.length > 0 ? `${meterNameFilter.length} Selected` : 'is any value', type: 'multi', options: metadata.availableMeters || [] },
        { label: 'Meter Reading Date', value: datePreset, type: 'date' },
        { label: 'Assigned Asset', value: selectedAssets.length > 0 ? `${selectedAssets.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssets || [] },
        { label: 'Asset Category', value: selectedAssetCategories.length > 0 ? `${selectedAssetCategories.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssetCategories || [] },
        { label: 'Meter Category', value: meterCategoryFilter.length > 0 ? `${meterCategoryFilter.length} Selected` : 'is any value', type: 'multi', options: metadata.availableMeterCategories || [] },
    ] : (isPartsConsumption || isPartsInventory) ? [
        ...(isPartsConsumption ? [{ label: 'WO Date Completed', value: datePreset, type: 'date' }] : []),
            { label: 'Part Location', value: partLocationFilter.length > 0 ? `${partLocationFilter.length} Selected` : 'is any value', type: 'multi', options: metadata.availableLocations || [] },
            { label: 'Part Category', value: partCategoryFilter.length > 0 ? `${partCategoryFilter.length} Selected` : 'is any value', type: 'multi', options: metadata.availablePartCategories || [] },
            ...(isPartsConsumption ? [
                { label: 'Work Order Location', value: woLocationFilter.length > 0 ? `${woLocationFilter.length} Selected` : 'is any value', type: 'multi', options: metadata.availableLocations || [] },
                { label: 'Part Number', value: partNumberFilter ? `is ${partNumberFilter}` : 'is any value', type: 'text' }
            ] : []),
        ] : isRequests ? [
            { label: 'Date Created', value: datePreset, type: 'date' },
            { label: 'Asset', value: selectedAssets.length > 0 ? `${selectedAssets.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssets || [] },
            { label: 'Location', value: selectedLocations.length > 0 ? `${selectedLocations.length} Selected` : 'is any value', type: 'multi', options: metadata.availableLocations || [] },
            { label: 'Category', value: selectedCategories.length > 0 ? `${selectedCategories.length} Selected` : 'is any value', type: 'multi', options: metadata.availableCategories || [] },
        ] : [
            { label: 'Completion Date', value: datePreset, type: 'date' },
        { label: 'Date Completed', value: dateCompletedFilters.length > 0 ? `${dateCompletedFilters.length} Active` : 'is any value', type: 'date' },
        { label: 'Due Date', value: dueDateFilters.length > 0 ? `${dueDateFilters.length} Active` : 'is any value', type: 'date' },
        { label: 'Worker Assigned', value: getLabelFromId(selectedWorker, metadata.availableWorkers), type: 'dropdown', options: metadata.availableWorkers || [] },
        { label: 'Maintenance Type', value: typeFilter === 'any value' ? 'is any value' : typeFilter, type: 'dropdown', options: ['REACTIVE', 'PREVENTIVE'] },
        { label: 'Priority', value: priorityFilter === 'any value' ? 'is any value' : priorityFilter, type: 'dropdown', options: ['HIGH', 'MEDIUM', 'LOW'] },
        { label: 'Work Order Category', value: selectedCategories.length > 0 ? `${selectedCategories.length} Selected` : 'is any value', type: 'multi', options: metadata.availableCategories || [] },
        { label: 'Location', value: selectedLocations.length > 0 ? `${selectedLocations.length} Selected` : 'is any value', type: 'multi', options: metadata.availableLocations || [] },
        { label: 'Asset', value: selectedAssets.length > 0 ? `${selectedAssets.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssets || [] },
        { label: 'Asset Category', value: selectedAssetCategories.length > 0 ? `${selectedAssetCategories.length} Selected` : 'is any value', type: 'multi', options: metadata.availableAssetCategories || [] },
        { label: 'Team', value: selectedTeams.length > 0 ? `${selectedTeams.length} Selected` : 'is any value', type: 'multi', options: metadata.availableTeams || [] },
    ];

    return (
        <div className="relative bg-white border-b border-slate-200 px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-4 shadow-sm z-[200]">
            {filterItems.map((item) => (
                <div key={item.label} className={cn("flex flex-col gap-1.5 relative", openDropdown === item.label ? "z-[50]" : "z-[10]")}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                    <button 
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg border text-[13px] font-medium transition-all min-w-[140px] justify-between",
                            item.value !== 'is any value' && item.value !== 'any value'
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
                            openDropdown === item.label && "border-indigo-400 ring-2 ring-indigo-500/10"
                        )}
                    >
                        <span className="truncate max-w-[180px]">{item.value}</span>
                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            <div className={cn(
                                "w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-500 transition-transform duration-200",
                                openDropdown === item.label && "rotate-180"
                            )} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {openDropdown === item.label && item.type === 'date' && (
                            <DatePickerDropdown 
                                activePreset={
                                    (item.label === 'Completion Date' || item.label === 'Date' || item.label === 'Available Date' || item.label === 'Meter Reading Date' || item.label === 'WO Date Completed' || item.label === 'Date Created') ? datePreset : 
                                    item.label === 'Warranty Expiration Date' ? warrantyDateFilter :
                                    'is any value'
                                } 
                                onSelect={(val) => {
                                    if (item.label === 'Completion Date' || item.label === 'Date' || item.label === 'Available Date' || item.label === 'Meter Reading Date' || item.label === 'WO Date Completed' || item.label === 'Date Created') setDatePreset(val);
                                    if (item.label === 'Warranty Expiration Date') setWarrantyDateFilter(val);
                                    setOpenDropdown(null);
                                }} 
                            />
                        )}
                        {openDropdown === item.label && item.type === 'dropdown' && (
                            <SimpleDropdown 
                                options={item.options || []} 
                                onSelect={(val) => {
                                    if (item.label === 'Worker Assigned') setSelectedWorker(val);
                                    if (item.label === 'Maintenance Type') setTypeFilter(val);
                                    if (item.label === 'Priority') setPriorityFilter(val);
                                    if (item.label === 'Downtime Category') setDowntimeCategoryFilter(val);
                                    if (item.label === 'Asset Archival Status') setAssetStatusFilter(val);
                                    setOpenDropdown(null);
                                }} 
                            />
                        )}
                        {openDropdown === item.label && item.type === 'text' && (
                            (isPartsConsumption || isPartsInventory) ? (
                                <AdvancedFilterDropdown 
                                    options={[]}
                                    selected={[]}
                                    onToggle={() => {}}
                                    onClose={() => setOpenDropdown(null)}
                                    isText={true}
                                    textValue={partNumberFilter}
                                    onTextChange={setPartNumberFilter}
                                />
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-2 w-[240px] bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[1000] p-4"
                                >
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Enter part number..." 
                                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-[13px] font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all mb-4"
                                        value={partNumberFilter === 'is any value' ? '' : partNumberFilter}
                                        onChange={(e) => setPartNumberFilter(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && setOpenDropdown(null)}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => { setPartNumberFilter(''); setOpenDropdown(null); }} className="text-[12px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Clear</button>
                                        <button onClick={() => setOpenDropdown(null)} className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700">Apply</button>
                                    </div>
                                </motion.div>
                            )
                        )}
                        {openDropdown === item.label && item.type === 'multi' && (
                            (item.label === 'Work Order Location' && (isPartsConsumption || isPartsInventory)) ||
                            (isRequests && ['Asset', 'Location', 'Category'].includes(item.label)) ? (
                                <AdvancedFilterDropdown 
                                    options={item.options || []}
                                    selected={
                                        item.label === 'Asset' ? selectedAssets :
                                        item.label === 'Location' ? selectedLocations :
                                        item.label === 'Category' ? selectedCategories :
                                        woLocationFilter
                                    }
                                    onToggle={
                                        item.label === 'Asset' ? (val) => setSelectedAssets(selectedAssets.includes(val) ? selectedAssets.filter(id => id !== val) : [...selectedAssets, val]) :
                                        item.label === 'Location' ? (val) => setSelectedLocations(selectedLocations.includes(val) ? selectedLocations.filter(id => id !== val) : [...selectedLocations, val]) :
                                        item.label === 'Category' ? (val) => setSelectedCategories(selectedCategories.includes(val) ? selectedCategories.filter(id => id !== val) : [...selectedCategories, val]) :
                                        setWoLocationFilter as any
                                    }
                                    onClose={() => setOpenDropdown(null)}
                                    hideBuilder={isRequests && item.label === 'Category'}
                                />
                            ) : (
                                <MultiSelectDropdown 
                                    options={item.options || []}
                                    selected={
                                        item.label === 'Work Order Category' ? selectedCategories :
                                        (item.label === 'Location' || item.label === 'Asset Location' || item.label === 'Meter Location') ? selectedLocations :
                                        item.label === 'Work Order Location' ? woLocationFilter :
                                        item.label === 'Part Location' ? partLocationFilter :
                                        (item.label === 'Asset' || item.label === 'Asset Name' || item.label === 'Assigned Asset') ? selectedAssets :
                                        item.label === 'Meter Name' ? meterNameFilter :
                                        (item.label === 'Asset Category' || item.label === 'Category') ? selectedAssetCategories :
                                        item.label === 'Part Category' ? partCategoryFilter :
                                        item.label === 'Meter Category' ? meterCategoryFilter :
                                        item.label === 'Team' ? selectedTeams : []
                                    }
                                    onToggle={(val) => {
                                        if (item.label === 'Work Order Category') {
                                            setSelectedCategories(selectedCategories.includes(val) ? selectedCategories.filter((c: string) => c !== val) : [...selectedCategories, val]);
                                        } else if (item.label === 'Location' || item.label === 'Asset Location' || item.label === 'Meter Location') {
                                            setSelectedLocations(selectedLocations.includes(val) ? selectedLocations.filter((c: string) => c !== val) : [...selectedLocations, val]);
                                        } else if (item.label === 'Work Order Location') {
                                            setWoLocationFilter(woLocationFilter.includes(val) ? woLocationFilter.filter((c: string) => c !== val) : [...woLocationFilter, val]);
                                        } else if (item.label === 'Part Location') {
                                            setPartLocationFilter(partLocationFilter.includes(val) ? partLocationFilter.filter((c: string) => c !== val) : [...partLocationFilter, val]);
                                        } else if (item.label === 'Asset' || item.label === 'Asset Name' || item.label === 'Assigned Asset') {
                                            setSelectedAssets(selectedAssets.includes(val) ? selectedAssets.filter((c: string) => c !== val) : [...selectedAssets, val]);
                                        } else if (item.label === 'Meter Name') {
                                            setMeterNameFilter(meterNameFilter.includes(val) ? meterNameFilter.filter((c: string) => c !== val) : [...meterNameFilter, val]);
                                        } else if (item.label === 'Asset Category' || item.label === 'Category') {
                                            setSelectedAssetCategories(selectedAssetCategories.includes(val) ? selectedAssetCategories.filter((c: string) => c !== val) : [...selectedAssetCategories, val]);
                                        } else if (item.label === 'Part Category') {
                                            setPartCategoryFilter(partCategoryFilter.includes(val) ? partCategoryFilter.filter((c: string) => c !== val) : [...partCategoryFilter, val]);
                                        } else if (item.label === 'Meter Category') {
                                            setMeterCategoryFilter(meterCategoryFilter.includes(val) ? meterCategoryFilter.filter((c: string) => c !== val) : [...meterCategoryFilter, val]);
                                        } else if (item.label === 'Team') {
                                            setSelectedTeams(selectedTeams.includes(val) ? selectedTeams.filter((t: string) => t !== val) : [...selectedTeams, val]);
                                        }
                                    }}
                                    onDeselectAll={() => {
                                        if (item.label === 'Work Order Category') setSelectedCategories([]);
                                        else if (item.label === 'Location' || item.label === 'Asset Location' || item.label === 'Meter Location') setSelectedLocations([]);
                                        else if (item.label === 'Work Order Location') setWoLocationFilter([]);
                                        else if (item.label === 'Part Location') setPartLocationFilter([]);
                                        else if (item.label === 'Asset' || item.label === 'Asset Name' || item.label === 'Assigned Asset') setSelectedAssets([]);
                                        else if (item.label === 'Meter Name') setMeterNameFilter([]);
                                        else if (item.label === 'Asset Category' || item.label === 'Category') setSelectedAssetCategories([]);
                                        else if (item.label === 'Part Category') setPartCategoryFilter([]);
                                        else if (item.label === 'Meter Category') setMeterCategoryFilter([]);
                                        else if (item.label === 'Team') setSelectedTeams([]);
                                    }}
                                    onClose={() => setOpenDropdown(null)}
                                />
                            )
                        )}
                    </AnimatePresence>
                </div>
            ))}

            <div className="flex-1" />

            <button 
                onClick={resetFilters}
                className="text-[11px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2 group"
            >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Clear all
            </button>
        </div>
    );
};
