import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Globe } from 'lucide-react';
import { useCreateLocation, useUpdateLocation, useLocations, useUsers, useTeams, useVendors, useCustomers } from '../hooks/useData';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}


const SectionHeader = ({ title }: { title: string }) => (
    <div className="mb-6">
        <h3 className="text-[16px] font-bold text-foreground border-b border-slate-100 pb-2">{title}</h3>
    </div>
);

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label className="block text-[13px] font-semibold text-foreground/90 mb-1.5">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className="w-full h-10 px-3 bg-card border border-border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/80 transition-all placeholder:text-slate-400"
    />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
        {...props}
        className="w-full h-10 px-3 bg-card border border-border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/80 transition-all appearance-none"
    />
);

interface CreateLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialParentId?: string;
    location?: any;
}

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({ isOpen, onClose, initialParentId, location }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        parentId: initialParentId || '',
        type: 'SITE',
        description: '',
        workerIds: [] as string[],
        teamIds: [] as string[],
        vendorIds: [] as string[],
        customerId: '',
        timezone: 'Asia/Kolkata',
        latitude: '',
        longitude: '',
        includeMap: false
    });

    // Handle initialParentId updates when modal re-opens
    React.useEffect(() => {
        if (isOpen) {
            if (location) {
                const hasCoords = location.latitude !== null && location.latitude !== undefined;
                setFormData({
                    name: location.name || '',
                    address: location.address || '',
                    parentId: location.parentId || '',
                    type: location.type || 'SITE',
                    description: location.description || '',
                    workerIds: location.workers ? location.workers.map((w: any) => w.id) : [],
                    teamIds: location.teams ? location.teams.map((t: any) => t.id) : [],
                    vendorIds: location.vendors ? location.vendors.map((v: any) => v.id) : [],
                    customerId: location.customers && location.customers.length > 0 ? location.customers[0].id : '',
                    timezone: location.timezone || 'Asia/Kolkata',
                    latitude: hasCoords ? String(location.latitude) : '',
                    longitude: hasCoords ? String(location.longitude) : '',
                    includeMap: hasCoords
                });
            } else {
                setFormData({
                    name: '',
                    address: '',
                    parentId: initialParentId || '',
                    type: 'SITE',
                    description: '',
                    workerIds: [],
                    teamIds: [],
                    vendorIds: [],
                    customerId: '',
                    timezone: 'Asia/Kolkata',
                    latitude: '',
                    longitude: '',
                    includeMap: false
                });
            }
        }
    }, [isOpen, initialParentId, location]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createLocation = useCreateLocation();
    const updateLocation = useUpdateLocation();
    const { data: parentLocations } = useLocations();
    const { data: workers } = useUsers();
    const { data: teams } = useTeams();
    const { data: vendors } = useVendors();
    const { data: customers } = useCustomers();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error('Location name is required');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const payload: any = {
                name: formData.name,
                address: formData.address,
                parentId: formData.parentId || undefined,
                type: formData.type,
                description: formData.description,
                workerIds: formData.workerIds,
                teamIds: formData.teamIds,
                vendorIds: formData.vendorIds,
                customerId: formData.customerId || undefined,
                timezone: formData.timezone,
                latitude: formData.includeMap && formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.includeMap && formData.longitude ? parseFloat(formData.longitude) : undefined
            };

            if (location?.id) {
                await updateLocation.mutateAsync({ id: location.id, data: payload });
                toast.success('Location updated successfully');
            } else {
                await createLocation.mutateAsync(payload);
                toast.success('Location created successfully');
            }
            onClose();
        } catch (error) {
            toast.error(location?.id ? 'Failed to update location' : 'Failed to create location');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const COMMON_TIMEZONES = [
        { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
        { value: 'America/New_York', label: 'America - New York (EST/EDT)' },
        { value: 'America/Chicago', label: 'America - Chicago (CST/CDT)' },
        { value: 'America/Denver', label: 'America - Denver (MST/MDT)' },
        { value: 'America/Los_Angeles', label: 'America - Los Angeles (PST/PDT)' },
        { value: 'America/Sao_Paulo', label: 'America - Sao Paulo (BRT)' },
        { value: 'Europe/London', label: 'Europe - London (GMT/BST)' },
        { value: 'Europe/Paris', label: 'Europe - Paris (CET/CEST)' },
        { value: 'Europe/Moscow', label: 'Europe - Moscow (MSK)' },
        { value: 'Africa/Johannesburg', label: 'Africa - Johannesburg (SAST)' },
        { value: 'Africa/Cairo', label: 'Africa - Cairo (EET)' },
        { value: 'Asia/Kolkata', label: 'Asia - Kolkata (IST)' },
        { value: 'Asia/Dubai', label: 'Asia - Dubai (GST)' },
        { value: 'Asia/Singapore', label: 'Asia - Singapore (SGT)' },
        { value: 'Asia/Tokyo', label: 'Asia - Tokyo (JST)' },
        { value: 'Australia/Sydney', label: 'Australia - Sydney (AEST/AEDT)' },
        { value: 'Pacific/Auckland', label: 'Pacific - Auckland (NZST/NZDT)' }
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-card flex flex-col animate-in slide-in-from-right duration-300">
            {/* Top Bar */}
            <header className="h-14 border-b border-slate-100 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                    <h2 className="text-[15px] font-bold text-foreground">{location ? 'Edit Location' : 'Create Location'}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onClose}
                        className="h-9 px-4 text-[13px] font-semibold text-slate-600 hover:text-foreground"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || createLocation.isPending || updateLocation.isPending}
                        className="px-6 py-2.5 bg-primary text-white text-[13px] font-black rounded-xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting || createLocation.isPending || updateLocation.isPending ? 'Saving...' : (location?.id ? 'Save Changes' : 'Create Location')}
                    </button>
                </div>
            </header>
 
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 py-12 px-4 scroll-smooth">
                <div className="max-w-[560px] mx-auto space-y-12">
                    
                    {/* Location Information */}
                    <section>
                        <SectionHeader title="Location Information" />
                        <div className="space-y-6">
                            <div>
                                <Label required>Name</Label>
                                <Input 
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Address</Label>
                                <div className="space-y-4">
                                    <Input 
                                        placeholder="Enter a location"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            id="includeMap"
                                            checked={formData.includeMap}
                                            onChange={e => setFormData({ ...formData, includeMap: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="includeMap" className="text-[13px] text-slate-600">Include Map Coordinates</label>
                                    </div>
                                    {formData.includeMap && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Latitude</Label>
                                                    <Input 
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. 40.7128"
                                                        value={formData.latitude}
                                                        onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Longitude</Label>
                                                    <Input 
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. -74.0060"
                                                        value={formData.longitude}
                                                        onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="relative aspect-[16/9] bg-slate-100 rounded-lg overflow-hidden border border-border group z-0">
                                                <MapContainer 
                                                    center={formData.latitude && formData.longitude ? [parseFloat(formData.latitude), parseFloat(formData.longitude)] : [40.7128, -74.0060]} 
                                                    zoom={13} 
                                                    style={{ height: '100%', width: '100%' }}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <LocationMarker 
                                                        position={formData.latitude && formData.longitude ? [parseFloat(formData.latitude), parseFloat(formData.longitude)] : null} 
                                                        setPosition={([lat, lng]) => {
                                                            setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
                                                        }} 
                                                    />
                                                </MapContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label>Select Parent Location</Label>
                                <Select 
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                >
                                    <option value="">None</option>
                                    {parentLocations?.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label>Location Timezone</Label>
                                <Select 
                                    value={formData.timezone}
                                    onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                                >
                                    {COMMON_TIMEZONES.map(tz => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </section>

                    {/* Assigned To */}
                    <section>
                        <SectionHeader title="Assigned To" />
                        <div className="space-y-6">
                            <div>
                                <Label>Workers</Label>
                                <Select 
                                    value={formData.workerIds[0] || ''}
                                    onChange={e => setFormData({ ...formData, workerIds: e.target.value ? [e.target.value] : [] })}
                                >
                                    <option value="">Select workers</option>
                                    {workers?.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label>Team</Label>
                                <Select 
                                    value={formData.teamIds[0] || ''}
                                    onChange={e => setFormData({ ...formData, teamIds: e.target.value ? [e.target.value] : [] })}
                                >
                                    <option value="">Select teams</option>
                                    {teams?.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </section>

                    {/* More Information */}
                    <section>
                        <SectionHeader title="More Information" />
                        <div className="space-y-6">
                            <div>
                                <Label>Vendors</Label>
                                <Select 
                                    value={formData.vendorIds[0] || ''}
                                    onChange={e => setFormData({ ...formData, vendorIds: e.target.value ? [e.target.value] : [] })}
                                >
                                    <option value="">Select vendors</option>
                                    {vendors?.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label>Customers</Label>
                                <Select 
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">Select customers</option>
                                    {customers?.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
