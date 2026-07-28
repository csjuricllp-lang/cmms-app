import React, { useState } from 'react';
import { X, Search, Check, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { SuccessModal } from './SuccessModal';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamToEdit?: any;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, teamToEdit }) => {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const [showSuccess, setShowSuccess] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        if (teamToEdit) {
            setName(teamToEdit.name);
            setDescription(teamToEdit.description || '');
            setSelectedUserIds(teamToEdit.users?.map((u: any) => u.userOrgId || u.id) || []);
        } else {
            resetForm();
        }
    }, [teamToEdit, isOpen]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        };

        const updateCoords = () => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const dropdownHeight = 320; // Approx height of the user list
                const shouldOpenUp = rect.bottom + dropdownHeight > window.innerHeight;
                
                setCoords({
                    top: shouldOpenUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
                    left: rect.left,
                    width: rect.width
                });
            }
        };

        if (isUserDropdownOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isUserDropdownOpen]);

    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });

    const createOrUpdateTeam = useMutation({
        mutationFn: async (data: any) => {
            if (teamToEdit) {
                return api.patch(`/teams/${teamToEdit.id}`, data);
            }
            return api.post('/teams', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            setShowSuccess(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to process team request');
        }
    });

    const resetForm = () => {
        setName('');
        setDescription('');
        setSelectedUserIds([]);
    };

    const handleCreate = () => {
        if (!name) {
            toast.error('Unit name is mandatory');
            return;
        }
        createOrUpdateTeam.mutate({
            name,
            description,
            userIds: selectedUserIds
        });
    };

    if (!isOpen) return null;

    const filteredUsers = usersData?.filter((u: any) => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden border border-slate-200">
                {/* Header (Image 2 style) */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-lg transition-all text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-[22px] font-black text-gray-900 tracking-tight">
                            {teamToEdit ? 'Edit Team' : 'Add Team'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[14px] font-black hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleCreate}
                            disabled={createOrUpdateTeam.isPending || !name}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[14px] font-black transition-all shadow-lg active:scale-95",
                                name ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {createOrUpdateTeam.isPending ? 'Saving...' : teamToEdit ? 'Update Team' : 'Create Team'}
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-10 space-y-10">
                    {/* Team Information */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Team Information</h3>
                        
                        <div className="space-y-2">
                            <label className="text-[13px] font-black text-gray-600 uppercase tracking-widest">Name <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                placeholder="e.g. Mechanical Reliability Unit"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-black text-gray-600 uppercase tracking-widest">Description</label>
                            <input 
                                type="text"
                                placeholder="Describe the team's primary objectives..."
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Assigned To */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Assigned To</h3>
                        
                        <div className="space-y-2 relative">
                            <label className="text-[13px] font-black text-gray-600 uppercase tracking-widest">Workers</label>
                            <button 
                                ref={triggerRef}
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-white hover:border-blue-500 transition-all group"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {selectedUserIds.length === 0 ? (
                                        <span className="text-gray-400 font-bold">Select personnel for this unit</span>
                                    ) : (
                                        <div className="flex gap-1 text-sm font-bold text-gray-700">
                                            {selectedUserIds.length} members selected
                                        </div>
                                    )}
                                </div>
                                <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isUserDropdownOpen && "rotate-180")} />
                            </button>

                            {isUserDropdownOpen && (
                                <div 
                                    ref={dropdownRef}
                                    style={{ 
                                        position: 'fixed',
                                        top: coords.top,
                                        left: coords.left,
                                        width: coords.width,
                                        maxHeight: '300px',
                                        zIndex: 9999
                                    }}
                                    className="bg-white border border-gray-100 rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col"
                                >
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="text"
                                                placeholder="Sift through personnel..."
                                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {filteredUsers?.map((user: any) => (
                                            <button 
                                                key={user.id}
                                                onClick={() => {
                                                    const userId = user.userOrgId || user.id;
                                                    setSelectedUserIds(prev => 
                                                        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
                                                    );
                                                }}
                                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-50 transition-all border-b border-gray-50 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black uppercase">
                                                        {user.name[0]}
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-sm font-black text-gray-900">{user.name}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{user.jobTitle || 'Technician'}</span>
                                                    </div>
                                                </div>
                                                {selectedUserIds.includes(user.userOrgId || user.id) && (
                                                    <Check className="w-5 h-5 text-blue-600 stroke-[3px]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <SuccessModal 
                isOpen={showSuccess}
                onClose={() => {
                    setShowSuccess(false);
                    onClose();
                    if (!teamToEdit) resetForm();
                }}
                title={teamToEdit ? "Team Updated" : "Team Created"}
                message={teamToEdit ? "The team's operational parameters have been successfully synchronized with the system." : "A new operational unit has been initialized and is ready for assignment."}
            />
        </div>
    );
};
