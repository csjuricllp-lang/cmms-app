import { useState } from 'react';
import { 
    Plus, Search, Users2, MoreHorizontal,
    ArrowUpDown, Columns, LayoutGrid, List
} from 'lucide-react';
import { useUsers, useTeams } from '../hooks/useData';
import { useUserRole } from '../hooks/useUserRole';
import type { User, Team } from '../types';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'framer-motion';

import { InviteModal } from '../components/InviteModal';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { ImportTeamsModal } from '../components/ImportTeamsModal';
import { TeamDetail } from '../components/TeamDetail';
import { UserInspector } from '../components/UserInspector';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

type Tab = 'people' | 'teams';

export const PeoplePage = () => {
    const { canManageUsers } = useUserRole();
    const [activeTab, setActiveTab] = useState<Tab>('people');
    const [searchTerm, setSearchTerm] = useState('');
    const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [showImportTeamsModal, setShowImportTeamsModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [teamsViewMode, setTeamsViewMode] = useState<'table' | 'gallery'>('table');
    
    // Table Columns State
    const [visibleColumns] = useState({
        email: true,
        phone: true,
        jobTitle: true,
        hourlyRate: true,
        companyRate: true,
        lastLogin: true,
        dateCreated: true,
        companyDetails: true
    });

    const { data: usersData, isLoading: usersLoading } = useUsers({ status: 'all' });
    const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as User[];

    const { data: teamsData, isLoading: teamsLoading } = useTeams();
    const teams = (Array.isArray(teamsData) ? teamsData : (teamsData as any)?.items || []) as Team[];

    const filteredUsers = users.filter((user: any) => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTeams = teams.filter((team: any) =>
        team.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToExcel = () => {
        const dataToExport = activeTab === 'people' ? filteredUsers : filteredTeams;
        if (!dataToExport || dataToExport.length === 0) {
            toast.error(`No ${activeTab} to export`);
            return;
        }

        const data = activeTab === 'people' 
            ? (dataToExport as any[]).map((user: any) => ({
                ID: user.id,
                Name: user.name,
                Email: user.email,
                Phone: user.phone,
                Role: user.role,
                JobTitle: user.jobTitle,
                Status: user.status,
                HourlyRate: user.hourlyRate,
                CompanyRate: user.companyRate,
                DateCreated: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
            }))
            : (dataToExport as any[]).map((team: any) => ({
                ID: team.id,
                Name: team.name,
                Description: team.description,
                MemberCount: team.users?.length || 0,
                DateCreated: team.createdAt ? new Date(team.createdAt).toLocaleDateString() : ''
            }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'people' ? 'People' : 'Teams');
        XLSX.writeFile(workbook, `CMMS_${activeTab === 'people' ? 'People' : 'Teams'}_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success(`${activeTab === 'people' ? 'People' : 'Teams'} exported successfully`);
    };

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            {/* Page Header (Matching Image 1 EXACTLY) */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white z-20">
                <div className="flex items-center gap-10">
                    <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">Teams</h1>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-8 border-r border-gray-100 pr-8">
                            <button 
                                onClick={() => setActiveTab('people')}
                                className={cn(
                                    "text-[15px] font-bold transition-all relative py-1",
                                    activeTab === 'people' ? "text-primary after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[3px] after:bg-primary after:rounded-t-full" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                People
                            </button>
                            <button 
                                onClick={() => setActiveTab('teams')}
                                className={cn(
                                    "text-[15px] font-bold transition-all relative py-1",
                                    activeTab === 'teams' ? "text-primary after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[3px] after:bg-primary after:rounded-t-full" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                Teams
                            </button>
                        </div>
                        
                        {/* THE TWO BUTTONS next to the Team tab as requested */}
                        <div className="flex gap-3">
                            <button 
                                onClick={exportToExcel}
                                className="px-4 py-1.5 border border-gray-300 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                            >
                                Export
                            </button>
                            {canManageUsers && (
                                <>
                                    <button 
                                        onClick={() => activeTab === 'people' ? setShowInviteModal(true) : setShowCreateTeamModal(true)}
                                        className="px-4 py-1.5 border border-gray-300 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                    >
                                        {activeTab === 'people' ? 'Create Person' : 'Create Team'}
                                    </button>
                                    <button 
                                        onClick={() => setShowImportTeamsModal(true)}
                                        className="px-4 py-1.5 border border-gray-300 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                    >
                                        {activeTab === 'people' ? 'Import People' : 'Import Teams'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canManageUsers && (
                        <button 
                            onClick={() => activeTab === 'people' ? setShowInviteModal(true) : setShowCreateTeamModal(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[10px] text-[15px] font-bold transition-all shadow-sm active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            {activeTab === 'people' ? 'Add Person' : 'Add Team'}
                        </button>
                    )}
                    <button className="p-2.5 hover:bg-gray-50 rounded-lg text-gray-400">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Toolbar Area (Image 1 style) */}
            <div className="flex items-center justify-end px-8 py-3 bg-white border-b border-gray-100">
                <div className="flex items-center gap-10">
                    <button className="flex items-center gap-2 text-[14px] font-bold text-gray-700 hover:text-gray-900 transition-colors">
                        <ArrowUpDown className="w-4 h-4" />
                        Sort: Date Created
                    </button>
                    <div className="flex items-center gap-2 text-[14px] font-bold text-gray-700 hover:text-gray-900 transition-colors cursor-pointer" onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)}>
                        <Columns className="w-4 h-4" />
                        Columns
                    </div >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-gray-100/60 border-transparent rounded-xl text-[14px] font-bold w-72 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                    {activeTab === 'teams' && (
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                            <button 
                                onClick={() => setTeamsViewMode('table')}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    teamsViewMode === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setTeamsViewMode('gallery')}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    teamsViewMode === 'gallery' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-white p-0">
                {activeTab === 'people' ? (
                    <div className="h-full flex flex-col">
                        {usersLoading ? (
                            <div className="animate-pulse p-10 space-y-4">
                                {Array(5).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl" />)}
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center h-full">
                                <EmptyState
                                    variant="person"
                                    title="No People"
                                    description="You can begin by adding or inviting personnel to your organization."
                                    size="lg"
                                    action={
                                        canManageUsers ? (
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => setShowInviteModal(true)}
                                                    className="px-8 py-3 bg-white border border-gray-300 rounded-xl text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                                >
                                                    Create Person
                                                </button>
                                                <button 
                                                    onClick={() => setShowImportTeamsModal(true)}
                                                    className="px-8 py-3 bg-white border border-gray-300 rounded-xl text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                                >
                                                    Import People
                                                </button>
                                            </div>
                                        ) : undefined
                                    }
                                />
                            </div>
                        ) : (
                            <div className="min-w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-[#FCFDFF]">
                                            <th className="px-6 py-5 w-14 text-center">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                            </th>
                                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Personnel Candidate</th>
                                            {visibleColumns.email && <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Corporate Identity</th>}
                                            {visibleColumns.phone && <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Mobile Relay</th>}
                                            {visibleColumns.jobTitle && <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Assignment Role</th>}
                                            {visibleColumns.hourlyRate && <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Labor Cost (H)</th>}
                                            {visibleColumns.companyRate && <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Billing Rate (H)</th>}
                                            {visibleColumns.lastLogin && <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Last Ingress</th>}
                                            {visibleColumns.dateCreated && <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Onboarded</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredUsers.map((user: any) => (
                                            <tr 
                                                key={user.id} 
                                                onClick={() => setSelectedUser(user)}
                                                className="hover:bg-[#F8FAFF] transition-all group cursor-pointer border-b border-gray-50"
                                            >
                                                <td className="px-6 py-5 text-center">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[13px] font-black shadow-lg shadow-blue-200">
                                                            {user.name?.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</span>
                                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{user.roleName || user.role || 'NO ROLE'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {visibleColumns.email && <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{user.email}</td>}
                                                {visibleColumns.phone && <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{user.phone}</td>}
                                                {visibleColumns.jobTitle && <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{user.jobTitle}</td>}
                                                {visibleColumns.hourlyRate && <td className="px-6 py-5 text-[13px] font-bold text-emerald-600">${Number(user.hourlyRate || 0).toFixed(2)}</td>}
                                                {visibleColumns.companyRate && <td className="px-6 py-5 text-[13px] font-bold text-blue-600">${Number(user.companyRate || 0).toFixed(2)}</td>}
                                                {visibleColumns.lastLogin && <td className="px-6 py-5 text-[13px] font-bold text-gray-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</td>}
                                                {visibleColumns.dateCreated && <td className="px-6 py-5 text-[13px] font-bold text-gray-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-20">
                        {teamsLoading ? (
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full mb-4" />
                                <div className="h-6 w-48 bg-gray-100 rounded mb-2" />
                            </div>
                        ) : filteredTeams.length === 0 ? (
                            <EmptyState
                                variant="generic"
                                title="No Teams"
                                description="You can begin by creating or importing teams."
                                size="lg"
                                action={
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setShowCreateTeamModal(true)}
                                            className="px-8 py-3 bg-white border border-gray-300 rounded-xl text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                        >
                                            Create Team
                                        </button>
                                        <button 
                                            onClick={() => setShowImportTeamsModal(true)}
                                            className="px-8 py-3 bg-white border border-gray-300 rounded-xl text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                        >
                                            Import Teams
                                        </button>
                                    </div>
                                }
                            />
                        ) : teamsViewMode === 'table' ? (
                            <div className="w-full h-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-[#FCFDFF] select-none">
                                            <th className="px-8 py-5 w-14 text-center cursor-default">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                                            </th>
                                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-default">Name</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-default">Description</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-default">Number of People</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-default">Date Created</th>
                                            <th className="px-8 py-5 w-20 cursor-default"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-white">
                                        {filteredTeams.map((team: any) => (
                                            <tr 
                                                key={team.id} 
                                                onClick={() => setSelectedTeam(team)}
                                                className="hover:bg-[#F8FAFF] transition-all group cursor-pointer border-b border-gray-50"
                                            >
                                                <td className="px-8 py-5 text-center">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" onClick={(e) => e.stopPropagation()} />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                            <Users2 className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">{team.name}</span>
                                                            {team.isActive === false && (
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase">Inactive</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-[13px] font-medium text-gray-500 max-w-md truncate">
                                                    {team.description || "Mission-critical maintenance division."}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[12px] font-black uppercase tracking-tighter">
                                                        {team._count?.users || 0} Personnel Deployed
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-[13px] font-bold text-gray-400">
                                                    {new Date(team.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10 bg-gray-50/30">
                                {filteredTeams.map((team: any) => (
                                    <div 
                                        key={team.id} 
                                        onClick={() => setSelectedTeam(team)}
                                        className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden text-left"
                                    >
                                        <div className="absolute top-0 right-0 p-12 -mr-8 -mt-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                                            <Users2 className="w-32 h-32 text-blue-600" />
                                        </div>
                                        <div className="flex flex-col gap-4 relative z-10">
                                            <h3 className="text-[20px] font-black text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight flex items-center gap-2">
                                                {team.name}
                                                {team.isActive === false && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase">Inactive</span>
                                                )}
                                            </h3>
                                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                                {team.description || "Mission-critical maintenance division."}
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">T</div>
                                                </div>
                                                <span className="text-[12px] font-black text-blue-600 uppercase tracking-widest">{team._count?.users || 0} Members</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
            <CreateTeamModal 
                isOpen={showCreateTeamModal} 
                onClose={() => {
                    setShowCreateTeamModal(false);
                    setTeamToEdit(null);
                }} 
                teamToEdit={teamToEdit}
            />
            <ImportTeamsModal isOpen={showImportTeamsModal} onClose={() => setShowImportTeamsModal(false)} />

            <AnimatePresence>
                {selectedUser && (
                    <UserInspector
                        user={selectedUser}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedTeam && (
                    <TeamDetail 
                        team={selectedTeam} 
                        onClose={() => setSelectedTeam(null)} 
                        onEdit={(team) => {
                            setTeamToEdit(team);
                            setShowCreateTeamModal(true);
                            setSelectedTeam(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
