import { useState, useEffect } from 'react';
import { 
    X, ChevronDown, Check, Search, 
    Users, ShieldCheck, 
    FileText, 
    Barcode, UserPlus, Briefcase, 
    Package, Camera, Download, Link
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocations, useUsers, useTeams, useCategories, useAssets } from '../hooks/useData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AssetSelectionModal } from './AssetSelectionModal';
import { useAssetSettings } from '../hooks/useAssetSettings';
import toast from 'react-hot-toast';

interface CreateAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultLocationId?: string | null;
    asset?: any | null;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({ isOpen, onClose, defaultLocationId, asset }) => {
    const queryClient = useQueryClient();
    const { data: locations = [] } = useLocations();
    const { data: users = [] } = useUsers();
    const { data: teams = [] } = useTeams();
    const { data: categoryData = [] } = useCategories('ASSET');
    const { data: assets = [] } = useAssets();

    // 1. Asset Information
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [model, setModel] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [category, setCategory] = useState('');
    const [area, setArea] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(defaultLocationId || null);

    const updateAsset = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            return api.patch(`/assets/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Asset updated successfully');
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            console.error('Failed to update asset:', error);
            toast.error(error.response?.data?.message || 'Verification Error. Check required fields.');
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (asset) {
                setName(asset.name || '');
                setDescription(asset.description || '');
                setModel(asset.model || '');
                setManufacturer(asset.brand || '');
                setSerialNumber(asset.serialNumber || '');
                setCategory(asset.category || '');
                setArea(asset.specifications?.area || '');
                setSelectedLocationId(asset.locationId || null);
                setBarcode(asset.barCode || '');
                setImageUrl(asset.imageUrl || '');
                setPurchasePrice(asset.purchasePrice ? Number(asset.purchasePrice) : '');
                setPurchaseDate(asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '');
                setResidualValue(asset.residualValue ? Number(asset.residualValue) : '');
                setUsefulLife(asset.usefulLifeYears ? Number(asset.usefulLifeYears) : '');
                setAssignedToId(asset.assignedToId || null);
                setAdditionalWorkerIds(asset.additionalWorkerIds || []);
                setTeamId(asset.teamId || null);
                setVendors(asset.specifications?.vendors || '');
                setCustomers(asset.specifications?.customers || '');
                setPlacedInServiceDate(asset.placedInServiceDate ? asset.placedInServiceDate.split('T')[0] : '');
                setWarrantyExpiry(asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '');
                setNotes(asset.notes || '');
                setParentAssetId(asset.parentAssetId || null);
                setTrackCheckInOut(asset.isMobile || false);
                
                const customVals: Record<string, string> = {};
                customFields.forEach((field: any) => {
                    if (asset.specifications?.[field.name]) {
                        customVals[field.name] = asset.specifications[field.name];
                    }
                });
                setCustomFieldValues(customVals);
            } else {
                resetForm();
            }
        }
    }, [isOpen, asset, defaultLocationId]);
    const [barcode, setBarcode] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // 2. Depreciation
    const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [residualValue, setResidualValue] = useState<number | ''>('');
    const [usefulLife, setUsefulLife] = useState<number | ''>('');

    // 3. Assignment
    const [assignedToId, setAssignedToId] = useState<string | null>(null);
    const [additionalWorkerIds, setAdditionalWorkerIds] = useState<string[]>([]);
    const [teamId, setTeamId] = useState<string | null>(null);

    // 4. More Information
    const [vendors, setVendors] = useState('');
    const [customers, setCustomers] = useState('');
    const [placedInServiceDate, setPlacedInServiceDate] = useState('');
    const [warrantyExpiry, setWarrantyExpiry] = useState('');
    const [notes, setNotes] = useState('');

    // Custom Fields (from Asset Settings)
    const { fields: customFieldsQuery } = useAssetSettings('ASSET');
    const customFields = customFieldsQuery.data || [];
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

    // Right Sidebar States
    const [parentAssetId, setParentAssetId] = useState<string | null>(null);
    const [operatingHours, setOperatingHours] = useState<string[]>([]);
    const [trackCheckInOut, setTrackCheckInOut] = useState(false);

    // UI State
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [dropdowns, setDropdowns] = useState<Record<string, boolean>>({
        location: false, assignee: false, team: false, workers: false, category: false, parent: false
    });
    const [locationSearch, setLocationSearch] = useState('');

    const createAsset = useMutation({
        mutationFn: async (data: any) => {
            return api.post('/assets', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Asset synchronized with registry');
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            console.error('Failed to create asset:', error);
            toast.error(error.response?.data?.message || 'Verification Error. Check required fields.');
        }
    });

    const resetForm = () => {
        setName(''); setDescription(''); setModel(''); setManufacturer(''); setSerialNumber(''); setCategory('');
        setSelectedLocationId(defaultLocationId || null); setBarcode(''); setPurchasePrice(''); setPurchaseDate('');
        setResidualValue(''); setUsefulLife(''); setAssignedToId(null); setAdditionalWorkerIds([]);
        setTeamId(null); setVendors(''); setCustomers(''); setPlacedInServiceDate(''); setWarrantyExpiry(''); setNotes('');
        setImageUrl(''); setParentAssetId(null); setOperatingHours([]); setTrackCheckInOut(false);
        setCustomFieldValues({});
    };

    const toggleDropdown = (key: keyof typeof dropdowns) => {
        setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const generateBarcode = () => {
        const gen = Math.random().toString(36).substring(2, 12).toUpperCase();
        setBarcode(gen);
    };

    const handleSubmit = () => {
        if (!name) {
            toast.error('Asset Name is required');
            return;
        }
        const payload = {
            name, 
            description, 
            model, 
            brand: manufacturer, 
            serialNumber, 
            category,
            locationId: selectedLocationId || undefined,
            barCode: barcode,
            imageUrl: imageUrl || undefined,
            purchasePrice: Number(purchasePrice) || undefined,
            purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : undefined,
            residualValue: Number(residualValue) || undefined,
            expectedLifeYears: Number(usefulLife) || undefined,
            assignedToId: assignedToId || null,
            teamId: teamId || null,
            additionalWorkerIds,
            placedInServiceDate: placedInServiceDate ? new Date(placedInServiceDate).toISOString() : null,
            warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,
            notes,
            specifications: { vendors, customers, area, ...customFieldValues },
            parentAssetId: parentAssetId || null,
            isMobile: trackCheckInOut
        };

        if (asset) {
            updateAsset.mutate({ id: asset.id, data: payload });
        } else {
            createAsset.mutate(payload);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in fade-in duration-300">
            {/* Immersive Header */}
            <header className="h-16 md:h-[80px] border-b border-slate-100 flex items-center justify-between px-4 md:px-10 bg-white sticky top-0 z-[100]">
                <div className="flex items-center gap-2 md:gap-6">
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-[16px] md:text-[20px] font-black text-slate-800 tracking-tight">{asset ? 'Edit Asset' : 'Create Asset'}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="px-6 py-2.5 text-[14px] font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={createAsset.isPending || updateAsset.isPending}
                        className={cn(
                            "px-8 py-2.5 rounded-xl bg-[#3B82F6] text-white text-[14px] font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2",
                            (createAsset.isPending || updateAsset.isPending) && "opacity-50 grayscale cursor-not-allowed"
                        )}
                    >
                        {createAsset.isPending || updateAsset.isPending ? "Validating..." : asset ? "Save Changes" : "Create Asset"}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-visible md:overflow-y-auto scrollbar-hide bg-white px-5 py-6 md:px-[120px] md:py-[80px]">
                    <div className="max-w-[800px] space-y-[50px] md:space-y-[100px]">
                        
                        {/* Section: Asset Information */}
                        <section className="space-y-12">
                            <div className="space-y-2">
                                <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Asset Information</h3>
                                <p className="text-[14px] text-slate-400 font-medium">Core telemetry and identity parameters for the new asset node.</p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Name *</label>
                                        {!name && <span className="text-[11px] font-bold text-rose-500 italic">This field is required</span>}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        className={cn(
                                            "w-full h-14 bg-white border rounded-2xl px-6 text-[15px] font-bold outline-none transition-all",
                                            !name ? "border-rose-100 bg-rose-50/20 focus:border-rose-300" : "border-slate-100 focus:border-blue-400"
                                        )}
                                        placeholder="e.g. Centrifugal Pump CP-01"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full min-h-[120px] bg-white border border-slate-100 rounded-2xl p-6 text-[15px] font-bold outline-none focus:border-blue-400 resize-none"
                                        placeholder="Operational context or identification notes..."
                                    />
                                    <div className="flex justify-end">
                                        <span className="text-[11px] font-black text-slate-300">{description.length}/1000</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-6 md:mt-12">
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Model</label>
                                        <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Manufacturer</label>
                                        <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Serial Number</label>
                                        <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                                        <div className="relative">
                                            <button onClick={() => toggleDropdown('category')} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between text-[15px] font-bold text-slate-700">
                                                <span>{category || "Select Category"}</span>
                                                <ChevronDown className="w-5 h-5 text-slate-300" />
                                            </button>
                                            {dropdowns.category && (
                                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 py-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[50] max-h-[250px] overflow-y-auto overflow-x-hidden">
                                                    {categoryData.map((c: any) => (
                                                        <button key={c.id} onClick={() => { setCategory(c.name); toggleDropdown('category'); }} className="w-full text-left px-6 py-4 hover:bg-slate-50 text-[14px] font-bold text-slate-600 transition-all flex items-center justify-between group">
                                                            {c.name}
                                                            {category === c.name && <Check className="w-4 h-4 text-blue-500" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] gap-4 md:gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest uppercase tracking-widest">Barcode</label>
                                            <div className="flex gap-4">
                                                <button onClick={() => setBarcode('')} className="text-[11px] font-black text-slate-300 uppercase underline">Clear</button>
                                                <button onClick={generateBarcode} className="text-[11px] font-black text-blue-500 uppercase">Generate Random</button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Barcode className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-200" />
                                            <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-16 pr-6 text-[15px] font-mono font-black" placeholder="SCAN OR TYPE BARCODE" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Area</label>
                                        <input type="text" value={area} onChange={(e) => setArea(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Image */}
                        <section className="space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Main Image</h3>
                                <p className="text-[14px] text-slate-400 font-medium italic">High-fidelity visual blueprint for Field ID.</p>
                            </div>

                            <input 
                                type="file" 
                                id="asset-image-raw" 
                                className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImageUrl(`https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80`);
                                        toast.success('Blueprint captured internally');
                                    }
                                }}
                            />
                            <label 
                                htmlFor="asset-image-raw"
                                className="w-full h-[280px] border-4 border-dashed border-slate-50 rounded-[40px] bg-slate-50/30 flex flex-col items-center justify-center group hover:bg-white hover:border-blue-100 transition-all cursor-pointer overflow-hidden relative"
                            >
                                {imageUrl ? (
                                    <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <Camera className="w-12 h-12 text-slate-200 group-hover:text-blue-300 transition-all mb-4" />
                                        <p className="text-[14px] font-bold text-slate-400">
                                            <span className="text-blue-500 font-black">Browse Blueprints</span> or Drop Internal Files
                                        </p>
                                    </>
                                )}
                            </label>
                        </section>

                        {/* Section: Depreciation */}
                        <section className="space-y-10">
                            <div className="space-y-2">
                                <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Depreciation</h3>
                                <p className="text-[14px] text-slate-400 font-medium">Lifecycle valuation data for procurement synchronization.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Purchase Price</label>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">$</span>
                                        <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Purchase Date</label>
                                    <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Residual Value</label>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">$</span>
                                        <input type="number" value={residualValue} onChange={(e) => setResidualValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Useful Life</label>
                                    <div className="grid grid-cols-[1fr,100px] gap-2 h-14">
                                        <input type="number" value={usefulLife} onChange={(e) => setUsefulLife(e.target.value === '' ? '' : Number(e.target.value))} className="h-full bg-white border border-slate-100 rounded-l-2xl rounded-r-none px-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                        <div className="h-full bg-slate-50 border border-l-0 border-slate-100 rounded-r-2xl flex items-center justify-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Years</div>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="flex items-center gap-2 text-[12px] font-bold text-blue-500 hover:scale-[1.02] transition-all">
                                <Download className="w-4 h-4" /> Upload purchase receipt
                            </button>
                        </section>

                        {/* Section: Assigned To */}
                        <section className="space-y-10">
                            <div className="space-y-2">
                                <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Assigned To</h3>
                                <p className="text-[14px] text-slate-400 font-medium">Mission specialists and tactical teams maintaining the asset node.</p>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-3 relative">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Worker (Owner)</label>
                                    <button onClick={() => toggleDropdown('assignee')} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between text-[15px] font-bold text-slate-700">
                                        <div className="flex items-center gap-4">
                                            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-blue-500" /></div>
                                            <span className={cn(!assignedToId && "text-slate-300")}>{users.find(u => u.userOrgId === assignedToId)?.name || "Select Technician"}</span>
                                        </div>
                                        <ChevronDown className="w-5 h-5 text-slate-300" />
                                    </button>
                                    {dropdowns.assignee && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 py-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[70] max-h-[300px] overflow-y-auto">
                                            <button onClick={() => { setAssignedToId(null); toggleDropdown('assignee'); }} className="w-full text-left px-8 py-4 hover:bg-slate-50 text-[14px] font-bold text-slate-400 transition-all">Unassigned</button>
                                            {users.map(u => (
                                                <button key={u.userOrgId} onClick={() => { setAssignedToId(u.userOrgId); toggleDropdown('assignee'); }} className="w-full text-left px-8 py-4 hover:bg-slate-50 flex items-center justify-between transition-all font-bold text-slate-600">
                                                    {u.name}
                                                    {assignedToId === u.userOrgId && <Check className="w-4 h-4 text-blue-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 relative">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Additional Workers</label>
                                    <button onClick={() => toggleDropdown('workers')} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between text-[15px] font-bold text-slate-300 group">
                                        <span>{additionalWorkerIds.length > 0 ? `${additionalWorkerIds.length} Workers Chosen` : "Select Workers"}</span>
                                        <UserPlus className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                    </button>
                                    {dropdowns.workers && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 py-4 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[60] max-h-[350px] overflow-y-auto px-4 space-y-2">
                                            {users.map(u => (
                                                <div 
                                                    key={u.userOrgId} 
                                                    onClick={() => setAdditionalWorkerIds(prev => prev.includes(u.userOrgId) ? prev.filter(i => i !== u.userOrgId) : [...prev, u.userOrgId])}
                                                    className={cn(
                                                        "w-full px-6 py-4 rounded-xl transition-all cursor-pointer flex items-center justify-between font-bold text-[14px]",
                                                        additionalWorkerIds.includes(u.userOrgId) ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-600"
                                                    )}
                                                >
                                                    {u.name}
                                                    {additionalWorkerIds.includes(u.userOrgId) && <Check className="w-4 h-4" />}
                                                </div>
                                            ))}
                                            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-50">
                                                <button onClick={() => toggleDropdown('workers')} className="w-full py-3 bg-[#3B82F6] text-white rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg shadow-blue-200">Synchronize Selection</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 relative">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Teams</label>
                                    <button onClick={() => toggleDropdown('team')} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between text-[15px] font-bold text-slate-700">
                                        <div className="flex items-center gap-4">
                                            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center"><Briefcase className="w-3.5 h-3.5 text-indigo-500" /></div>
                                            <span className={cn(!teamId && "text-slate-300")}>{teams.find(t => t.id === teamId)?.name || "Select Team"}</span>
                                        </div>
                                        <ChevronDown className="w-5 h-5 text-slate-300" />
                                    </button>
                                    {dropdowns.team && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 py-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[50]">
                                            {teams.map(t => (
                                                <button key={t.id} onClick={() => { setTeamId(t.id); toggleDropdown('team'); }} className="w-full text-left px-8 py-4 hover:bg-slate-50 flex items-center justify-between transition-all font-bold text-slate-600">
                                                    {t.name}
                                                    {teamId === t.id && <Check className="w-4 h-4 text-blue-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Section: More Information */}
                        <section className="space-y-12">
                            <div className="space-y-2">
                                <h3 className="text-[20px] font-black text-slate-900 tracking-tight">More Information</h3>
                                <p className="text-[14px] text-slate-400 font-medium">Extended telemetry and third-party entity associations.</p>
                            </div>

                            <div className="space-y-[60px]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Vendors</label>
                                        <input type="text" value={vendors} onChange={(e) => setVendors(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" placeholder="Associations..." />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Customers</label>
                                        <input type="text" value={customers} onChange={(e) => setCustomers(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" placeholder="Associations..." />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest font-black text-slate-400 uppercase tracking-widest">Placed in Service Date</label>
                                        <input type="date" value={placedInServiceDate} onChange={(e) => setPlacedInServiceDate(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest font-black text-slate-400 uppercase tracking-widest">Warranty Expiration Date</label>
                                        <input type="date" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[15px] font-bold outline-none focus:border-blue-400" />
                                    </div>
                                </div>

                                {/* Dynamic Custom Fields from Asset Settings */}
                                {customFields.length > 0 && (
                                    <div className="space-y-8 pt-4 border-t border-slate-100">
                                        <div className="space-y-1">
                                            <h4 className="text-[14px] font-black text-slate-700">Custom Fields</h4>
                                            <p className="text-[12px] text-slate-400 font-medium">Fields configured in Asset Settings.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                            {customFields.map((field: any) => (
                                                <div key={field.id} className="space-y-3">
                                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                                                    {field.type === 'Multi-Line Text' ? (
                                                        <textarea
                                                            value={customFieldValues[field.label] || ''}
                                                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.label]: e.target.value }))}
                                                            rows={3}
                                                            className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-[14px] font-bold outline-none focus:border-blue-400 resize-none"
                                                            placeholder={`Enter ${field.label}...`}
                                                        />
                                                    ) : field.type === 'Dropdown' && field.options?.length > 0 ? (
                                                        <select
                                                            value={customFieldValues[field.label] || ''}
                                                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.label]: e.target.value }))}
                                                            className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[14px] font-bold outline-none focus:border-blue-400 appearance-none cursor-pointer"
                                                        >
                                                            <option value="">Select {field.label}...</option>
                                                            {field.options.map((opt: string) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : field.type === 'Date' ? (
                                                        <input
                                                            type="date"
                                                            value={customFieldValues[field.label] || ''}
                                                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.label]: e.target.value }))}
                                                            className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[14px] font-bold outline-none focus:border-blue-400"
                                                        />
                                                    ) : field.type === 'Number' || field.type === 'Currency' ? (
                                                        <input
                                                            type="number"
                                                            value={customFieldValues[field.label] || ''}
                                                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.label]: e.target.value }))}
                                                            className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[14px] font-bold outline-none focus:border-blue-400"
                                                            placeholder={field.type === 'Currency' ? '0.00' : '0'}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={customFieldValues[field.label] || ''}
                                                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.label]: e.target.value }))}
                                                            className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[14px] font-bold outline-none focus:border-blue-400"
                                                            placeholder={`Enter ${field.label}...`}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Add Internal Documentation</label>
                                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} className="w-full bg-white border border-slate-100 rounded-[32px] p-8 text-[15px] font-bold outline-none focus:border-blue-400 resize-none" placeholder="Extended tactical specifications..." />
                                </div>

                                <button className="flex items-center gap-2 text-[12px] font-bold text-orange-500 hover:scale-[1.02] transition-all bg-orange-50/50 p-6 rounded-[24px] border border-orange-100/50 w-full justify-center">
                                    <ShieldCheck className="w-5 h-5" /> Add warranty file
                                </button>
                            </div>
                        </section>

                        {/* Section: Parts */}
                        <section className="space-y-[40px]">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                <div className="space-y-1">
                                    <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Parts</h3>
                                    <p className="text-[13px] text-slate-400 font-medium">BOM associations for technical maintenance.</p>
                                </div>
                                <button className="h-10 px-6 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-black uppercase tracking-widest text-slate-600 hover:bg-white transition-all">Add Parts</button>
                            </div>
                            <div className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/20 rounded-[40px] border-4 border-dotted border-slate-50">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center"><Package className="w-7 h-7 text-slate-200" /></div>
                                <p className="text-[14px] font-bold text-slate-300 italic uppercase tracking-[0.2em]">No parts added yet</p>
                            </div>
                        </section>

                        {/* Section: Files */}
                        <section className="space-y-[40px] pb-[100px]">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                <div className="space-y-1">
                                    <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Files</h3>
                                    <p className="text-[13px] text-slate-400 font-medium">External technical documentation and tactical blueprints.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 min-h-[120px] md:min-h-[160px]">
                                <div className="border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center justify-center gap-2 group hover:bg-slate-50/50 transition-all cursor-pointer">
                                    <FileText className="w-8 h-8 text-slate-200 group-hover:text-blue-300 transition-all" />
                                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest"><span className="text-blue-400">Upload</span> or Drop Files</p>
                                </div>
                                <div className="border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center justify-center gap-2 group hover:bg-slate-50/50 transition-all cursor-pointer">
                                    <Link className="w-8 h-8 text-slate-200 group-hover:text-indigo-300 transition-all" />
                                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Add from Saved Files</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>

                {/* Right Sidebar: Structure And Settings */}
                <aside className="w-full md:w-[360px] border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/30 flex flex-col p-6 md:p-10 overflow-y-visible md:overflow-y-auto h-auto md:h-full space-y-8 md:space-y-12">
                    <div className="space-y-1">
                        <h4 className="text-[16px] font-black text-slate-900 tracking-tight">Structure And Settings</h4>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.05em] leading-relaxed">Topographical logic and environmental parameters.</p>
                    </div>

                    {/* Sub-Section: Asset Hierarchy */}
                    <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div className="space-y-2">
                            <h5 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Asset Hierarchy</h5>
                            <p className="text-[12px] text-slate-400 font-medium">Organize assets top-down to map organizational relationships.</p>
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setIsAssetModalOpen(true)} 
                                className="w-full flex items-center justify-center py-4 bg-white border border-slate-100 rounded-2xl text-[12px] font-black text-slate-500 hover:text-blue-500 hover:border-blue-200 transition-all hover:bg-blue-50/10"
                            >
                                <span>{parentAssetId ? "Parent: " + (assets as any[]).find(a => a.id === parentAssetId)?.name : "Set Parent Asset..."}</span>
                            </button>
                            
                            <AssetSelectionModal 
                                isOpen={isAssetModalOpen}
                                onClose={() => setIsAssetModalOpen(false)}
                                assets={assets}
                                selectedAssetId={parentAssetId}
                                onConfirm={(asset) => {
                                    setParentAssetId(asset.id);
                                    setIsAssetModalOpen(false);
                                }}
                            />
                        </div>
                    </div>

                    {/* Sub-Section: Location */}
                    <div className="space-y-6 pt-10 border-t border-slate-100">
                         <div className="space-y-2">
                            <h5 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Location</h5>
                         </div>
                         <div className="relative">
                            <button onClick={() => toggleDropdown('location')} className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between text-[12px] font-black text-slate-600 hover:border-blue-200 transition-all">
                                <span className={cn(!selectedLocationId && "text-slate-400")}>{locations.find(l => l.id === selectedLocationId)?.name || "Set Location..."}</span>
                                <ChevronDown className="w-4 h-4 text-slate-300" />
                            </button>
                            {dropdowns.location && (
                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 py-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[80] overflow-hidden flex flex-col animate-in slide-in-from-top-2">
                                    <div className="p-3 bg-slate-50 border-b border-slate-100">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-bold outline-none" placeholder="Filter Area..." value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} autoFocus />
                                        </div>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto">
                                        <button onClick={() => { setSelectedLocationId(null); toggleDropdown('location'); }} className="w-full text-left px-6 py-4 hover:bg-slate-50 text-[12px] font-bold text-slate-400 italic">Global / Mobile</button>
                                        {locations.filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase())).map(l => (
                                            <button key={l.id} onClick={() => { setSelectedLocationId(l.id); toggleDropdown('location'); }} className="w-full text-left px-6 py-4 hover:bg-slate-50 text-[12px] font-bold text-slate-600 transition-all flex items-center justify-between">
                                                {l.name}
                                                {selectedLocationId === l.id && <Check className="w-4 h-4 text-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Sub-Section: Operating Hours */}
                    <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div className="space-y-2">
                            <h5 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Operating Hours</h5>
                            <p className="text-[11px] text-slate-400 font-medium italic">Asset-specific operational availability windows.</p>
                        </div>
                        <button className="w-full h-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-between px-6 text-[12px] font-black text-slate-600 group hover:border-slate-300 transition-all">
                            <span>{operatingHours.length > 0 ? `${operatingHours.length} Schedules Selected` : "Select Schedules..."}</span>
                            <ChevronDown className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
                        </button>
                    </div>

                    {/* Sub-Section: Check In/Out */}
                    <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div className="space-y-2">
                            <h5 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Check In/Out</h5>
                        </div>
                        <label className="flex items-center gap-4 cursor-pointer group">
                             <div 
                                onClick={() => setTrackCheckInOut(!trackCheckInOut)}
                                className={cn(
                                    "w-12 h-6 rounded-full relative transition-all duration-300",
                                    trackCheckInOut ? "bg-blue-500" : "bg-slate-200"
                                )}
                             >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                                    trackCheckInOut ? "left-7 shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "left-1"
                                )} />
                             </div>
                             <span className="text-[12px] font-black text-slate-600 uppercase tracking-[0.05em] group-hover:text-slate-900 transition-colors">Track Check Ins/Outs</span>
                        </label>
                    </div>
                </aside>
            </div>
        </div>
    );
};
