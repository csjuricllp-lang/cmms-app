import React from 'react';
import { 
    ArrowLeft, 
    MoreHorizontal, 
    Shield, 
    ChevronRight,
    Trash2,
    Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { SuccessModal } from './SuccessModal';
import { AssetSelectionModal } from './AssetSelectionModal';

interface TeamDetailProps {
    team: any;
    onClose: () => void;
    onEdit: (team: any) => void;
}

export const TeamDetail: React.FC<TeamDetailProps> = ({ team, onClose, onEdit }) => {
    const queryClient = useQueryClient();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'details' | 'resources'>('details');
    const [showAssetPicker, setShowAssetPicker] = React.useState(false);

    // Fetch all available assets for assignment
    const { data: allAssets = [] } = useQuery({
        queryKey: ['assets'],
        queryFn: async () => {
            const response = await api.get('/assets');
            // Handle both plain array and paginated response { items: [], meta: {} }
            return Array.isArray(response.data) ? response.data : (response.data.items || []);
        }
    });

    const assignAsset = useMutation({
        mutationFn: async (assetId: string) => {
            return api.patch(`/assets/${assetId}`, { teamId: team.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Equipment linked successfully');
            setShowAssetPicker(false);
        }
    });

    const deleteTeam = useMutation({
        mutationFn: async () => {
            return api.delete(`/teams/${team.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            setShowDeleteConfirm(false);
            setShowDeleteSuccess(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove unit');
            setShowDeleteConfirm(false);
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async () => {
            return api.patch(`/teams/${team.id}`, { isActive: !team.isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            toast.success(`Team ${team.isActive ? 'deactivated' : 'activated'} successfully`);
            setIsMenuOpen(false);
            onClose();
        },
        onError: () => {
            toast.error(`Failed to ${team.isActive ? 'deactivate' : 'activate'} team`);
        }
    });

    if (!team) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute inset-0 bg-gray-50/50 backdrop-blur-xl z-[50] flex flex-col"
        >
            {/* Header (Matching Image Exactly) */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="px-4 border-r border-gray-200">
                        <div className="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center">
                            <div className="w-1 h-4 bg-gray-300 rounded-full" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6 px-6">
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">
                            {team.name}
                        </h2>
                        {team.isActive ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onEdit(team)}
                        className="flex items-center gap-2 px-5 py-2 border border-gray-200 rounded-xl text-[14px] font-black text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    >
                        Edit
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={cn(
                                "p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors active:scale-95",
                                isMenuOpen && "bg-gray-50 text-gray-900"
                            )}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <button 
                                    onClick={() => toggleStatusMutation.mutate()}
                                    disabled={toggleStatusMutation.isPending}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-left text-gray-700 hover:bg-gray-50 transition-all font-black text-[13px] border-b border-gray-100"
                                >
                                    <Power className="w-4 h-4" />
                                    {team.isActive ? 'Deactivate Team' : 'Activate Team'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowDeleteConfirm(true);
                                        setIsMenuOpen(false);
                                    }}
                                    disabled={deleteTeam.isPending}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-left text-red-600 hover:bg-red-50 transition-all font-black text-[13px]"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Team
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <ConfirmationModal 
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={() => deleteTeam.mutate()}
                    title="Decommission Team?"
                    message={`Are you sure you want to decommission "${team.name}"? This action will remove the team and its operational assignments from the system.`}
                    confirmText="Delete Team"
                    isLoading={deleteTeam.isPending}
                />

                <SuccessModal 
                    isOpen={showDeleteSuccess}
                    onClose={() => {
                        setShowDeleteSuccess(false);
                        onClose();
                    }}
                    title="Team Decommissioned"
                    message="The operational unit has been successfully removed from the system registry."
                />
            </div>

            {/* Tab Bar */}
            <div className="bg-white border-b border-gray-100 px-8">
                <div className="flex gap-8">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={cn(
                            "text-[13px] font-black py-4 uppercase tracking-widest transition-all",
                            activeTab === 'details' ? "text-gray-900 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Details
                    </button>
                    <button 
                        onClick={() => setActiveTab('resources')}
                        className={cn(
                            "text-[13px] font-black py-4 uppercase tracking-widest transition-all",
                            activeTab === 'resources' ? "text-gray-900 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Resources
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-gray-50/30">
                <AnimatePresence mode="wait">
                    {activeTab === 'details' ? (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-6xl mx-auto space-y-8"
                        >
                            {/* Team Information Card */}
                            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                                <div className="px-10 py-8 border-b border-gray-50">
                                    <h3 className="text-[17px] font-black text-gray-900 tracking-tight flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        Team Information
                                    </h3>
                                </div>
                                
                                <div className="divide-y divide-gray-50">
                                    <InfoRow label="Name" value={team.name} />
                                    <InfoRow label="Description" value={team.description || "Mission-critical maintenance division."} />
                                    <InfoRow 
                                        label="Members" 
                                        value={team.users?.map((u: any) => u.userOrg?.user?.name || u.user?.name || "Unknown Member").join(', ') || "No members assigned"} 
                                    />
                                    <InfoRow label="Added by" value={team.organization?.name || "System Administrator"} />
                                    <InfoRow label="Date created" value={new Date(team.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                                </div>
                            </div>

                            {/* Member Avatars Quick View */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-lg shadow-gray-200/40">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[15px] font-black text-gray-800 uppercase tracking-widest">Personnel List</h4>
                                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[11px] font-black">{team.users?.length || 0} Members</span>
                                    </div>
                                    <div className="space-y-4">
                                        {team.users?.map((user: any, i: number) => {
                                            const userData = user.userOrg?.user || user.user || {};
                                            return (
                                                <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-[12px] font-black text-gray-500">
                                                            {userData.name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] font-bold text-gray-900">{userData.name || "Unknown Member"}</p>
                                                            <p className="text-[11px] font-medium text-gray-400 lowercase">{userData.email || "no-email@organization.com"}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-xl shadow-blue-200">
                                    <h4 className="text-[15px] font-black uppercase tracking-widest opacity-80 mb-2">Operational Status</h4>
                                    <p className="text-3xl font-black italic tracking-tighter mb-6">DEPLOYED</p>
                                    <div className="space-y-4">
                                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Active Work Orders</p>
                                            <p className="text-2xl font-black italic">14</p>
                                        </div>
                                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Response Velocity</p>
                                            <p className="text-2xl font-black italic">2.4 hrs</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="resources"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-6xl mx-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[17px] font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    Managed Assets & Equipment
                                </h3>
                                <button 
                                    onClick={() => setShowAssetPicker(true)}
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[12px] font-black hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Link New Resource
                                </button>
                            </div>

                            {team.assets && team.assets.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {team.assets.map((asset: any) => (
                                        <div key={asset.id} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                    <div className="w-6 h-6 border-2 border-current rounded" />
                                                </div>
                                                <div>
                                                    <p className="text-[15px] font-black text-gray-900">{asset.name}</p>
                                                    <p className="text-[12px] font-medium text-gray-400">{asset.description || "Industrial equipment"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                        asset.status === 'OPERATIONAL' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                                    )}>
                                                        {asset.status || 'OPERATIONAL'}
                                                    </span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-24 h-24 bg-gray-100 rounded-[32px] flex items-center justify-center text-gray-400">
                                        <Shield className="w-12 h-12 opacity-20" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-[20px] font-black text-gray-900 tracking-tight uppercase tracking-widest">No Resources Assigned</h3>
                                        <p className="text-[15px] font-medium text-gray-500 max-w-sm mx-auto">
                                            Link this team to assets, specialized tools, or service vehicles to track their operational equipment.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowAssetPicker(true)}
                                        className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[14px] font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        Assign Equipment
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AssetSelectionModal 
                    isOpen={showAssetPicker}
                    onClose={() => setShowAssetPicker(false)}
                    assets={allAssets}
                    onConfirm={(asset) => assignAsset.mutate(asset.id)}
                />
            </div>
        </motion.div>
    );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <div className="px-10 py-6 flex items-center hover:bg-gray-50/50 transition-colors">
        <div className="w-1/3">
            <span className="text-[14px] font-bold text-gray-400">{label}</span>
        </div>
        <div className="w-2/3">
            <span className="text-[15px] font-bold text-gray-800">{value}</span>
        </div>
    </div>
);
