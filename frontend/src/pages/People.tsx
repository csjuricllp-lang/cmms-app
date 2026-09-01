import { useState } from 'react';
import { 
    Plus, Search, Users2, MoreHorizontal,
    ArrowUpDown, Columns, LayoutGrid, List, Filter, X, SlidersHorizontal
} from 'lucide-react';
import { useUsers, useTeams } from '../hooks/useData';
import { useRoles } from '../hooks/useRoles';
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
        companyName: true,
        lastLogin: true,
        dateCreated: true,
        companyDetails: true,
        status: true,
        accountType: true,
        categories: true
    });

    const [includeDeactivated, setIncludeDeactivated] = useState(false);
    const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>([]);
    const [isAccountTypePopoverOpen, setIsAccountTypePopoverOpen] = useState(false);
    const [accountTypeAnchor, setAccountTypeAnchor] = useState<HTMLButtonElement | null>(null);

    const { data: usersData, isLoading: usersLoading } = useUsers({ status: includeDeactivated ? 'all' : 'active' });
    const { data: rolesData } = useRoles();
    const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as User[];

    const { data: teamsData, isLoading: teamsLoading } = useTeams();
    const teams = (Array.isArray(teamsData) ? teamsData : (teamsData as any)?.items || []) as Team[];

    const filteredUsers = users.filter((user: any) => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAccountType = selectedAccountTypes.length === 0 || selectedAccountTypes.includes(user.accountType);
        return matchesSearch && matchesAccountType;
    });

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
        <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
            {/* Page Header (Matching Image 1 EXACTLY) */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-card z-20">
                <div className="flex items-center gap-10">
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight">Teams</h1>
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
                        <div className="flex gap-4">
                            <button 
                                onClick={exportToExcel}
                                className="px-4 py-1.5 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-teal-400 to-blue-500 shadow-[0_4px_15px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] hover:-translate-y-0.5"
                            >
                                Export
                            </button>
                            {canManageUsers && (
                                <>
                                    <button 
                                        onClick={() => activeTab === 'people' ? setShowInviteModal(true) : setShowCreateTeamModal(true)}
                                        className="px-4 py-1.5 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_4px_15px_rgba(236,72,153,0.4)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.6)] hover:-translate-y-0.5"
                                    >
                                        {activeTab === 'people' ? 'Create Person' : 'Create Team'}
                                    </button>
                                    <button 
                                        onClick={() => setShowImportTeamsModal(true)}
                                        className="px-4 py-1.5 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-orange-400 to-rose-400 shadow-[0_4px_15px_rgba(251,146,60,0.4)] hover:shadow-[0_6px_20px_rgba(251,146,60,0.6)] hover:-translate-y-0.5"
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
                            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-[10px] text-[15px] font-bold transition-all shadow-sm active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            {activeTab === 'people' ? 'Add Person' : 'Add Team'}
                        </button>
                    )}
                    <button className="p-2.5 hover:bg-muted/50 rounded-lg text-gray-400">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Toolbar Area (Image 1 style) */}
            <div className="flex items-center justify-end px-8 py-3 bg-card border-b border-gray-100">
                <div className="flex items-center gap-10">
                    <button className="flex items-center gap-2 text-[14px] font-bold text-foreground/90 hover:text-foreground transition-colors">
                        <ArrowUpDown className="w-4 h-4" />
                        Sort: Date Created
                    </button>
                    <div className="flex items-center gap-2 text-[14px] font-bold text-foreground/90 hover:text-foreground transition-colors cursor-pointer" onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)}>
                        <Columns className="w-4 h-4" />
                        Columns
                    </div >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-gray-100/60 border-transparent rounded-xl text-[14px] font-bold w-72 focus:bg-card focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                    </div>
                    {activeTab === 'teams' && (
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
                            <button 
                                onClick={() => setTeamsViewMode('table')}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    teamsViewMode === 'table' ? "bg-card text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setTeamsViewMode('gallery')}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    teamsViewMode === 'gallery' ? "bg-card text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-card p-0">
                {activeTab === 'people' ? (
                    <div className="h-full flex flex-col">
                        {usersLoading ? (
                            <div className="animate-pulse p-10 space-y-4">
                                {Array(5).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-xl" />)}
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
                                                    className="px-5 py-2 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_4px_15px_rgba(236,72,153,0.4)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.6)] hover:-translate-y-0.5"
                                                >
                                                    Create Person
                                                </button>
                                                <button 
                                                    onClick={() => setShowImportTeamsModal(true)}
                                                    className="px-5 py-2 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-orange-400 to-rose-400 shadow-[0_4px_15px_rgba(251,146,60,0.4)] hover:shadow-[0_6px_20px_rgba(251,146,60,0.6)] hover:-translate-y-0.5"
                                                >
                                                    Import People
                                                </button>
                                            </div>
                                        ) : undefined
                                    }
                                />
                            </div>
                        ) : (
                            <div className="flex-1 w-full p-4 bg-gray-50/10 flex flex-col gap-4">
                                <div className="flex items-center gap-6 px-2">
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => {
                                                setAccountTypeAnchor(e.currentTarget);
                                                setIsAccountTypePopoverOpen(true);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all border",
                                                selectedAccountTypes.length > 0 
                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            <SlidersHorizontal className="w-4 h-4" />
                                            Account Type: {selectedAccountTypes.length > 0 ? selectedAccountTypes.join(', ') : 'All'}
                                        </button>
                                        {isAccountTypePopoverOpen && accountTypeAnchor && (
                                            <>
                                                <div className="fixed inset-0 z-[100]" onClick={() => setIsAccountTypePopoverOpen(false)} />
                                                <div 
                                                    className="fixed z-[110] w-64 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden py-2"
                                                    style={{
                                                        top: accountTypeAnchor.getBoundingClientRect().bottom + 8,
                                                        left: accountTypeAnchor.getBoundingClientRect().left
                                                    }}
                                                >
                                                    <div className="px-4 py-2 text-[14px] font-bold text-gray-800 flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                                                        Account Type
                                                        <button onClick={() => setIsAccountTypePopoverOpen(false)} className="text-gray-400 hover:text-gray-600">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-col max-h-[300px] overflow-y-auto">
                                                        {rolesData?.map((role) => (
                                                            <label key={role.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                                                    checked={selectedAccountTypes.includes(role.name)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedAccountTypes([...selectedAccountTypes, role.name]);
                                                                        } else {
                                                                            setSelectedAccountTypes(selectedAccountTypes.filter(t => t !== role.name));
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-[14px] font-medium text-gray-700">{role.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between items-center px-4 pt-3 mt-2 border-t border-gray-100">
                                                        <button 
                                                            onClick={() => setSelectedAccountTypes([])}
                                                            className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700"
                                                        >
                                                            Clear
                                                        </button>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => setIsAccountTypePopoverOpen(false)}
                                                                className="px-4 py-1.5 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-orange-400 to-yellow-400 shadow-[0_4px_15px_rgba(249,115,22,0.4)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.6)] hover:-translate-y-0.5"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button 
                                                                onClick={() => setIsAccountTypePopoverOpen(false)}
                                                                className="px-4 py-1.5 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-blue-400 to-teal-400 shadow-[0_4px_15px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] hover:-translate-y-0.5"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={includeDeactivated}
                                            onChange={(e) => setIncludeDeactivated(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 group-hover:border-indigo-400 transition-colors cursor-pointer"
                                        />
                                        <span className="text-[14px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Include Deactivated</span>
                                    </label>

                                    {(selectedAccountTypes.length > 0 || includeDeactivated) && (
                                        <button 
                                            onClick={() => {
                                                setSelectedAccountTypes([]);
                                                setIncludeDeactivated(false);
                                            }}
                                            className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700"
                                        >
                                            Reset Filters
                                        </button>
                                    )}
                                </div>
                                <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="w-full overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="bg-[#FCFDFF]">
                                        <tr className="border-b border-gray-100">
                                            <th className="px-6 py-4 w-14 text-center">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                                            </th>
                                            <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Name</th>
                                            {visibleColumns.status && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Status</th>}
                                            {visibleColumns.accountType && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Account Type</th>}
                                            {visibleColumns.email && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Email</th>}
                                            {visibleColumns.phone && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Phone Number</th>}
                                            {visibleColumns.jobTitle && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Job Title</th>}
                                            {visibleColumns.hourlyRate && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Hourly Rate</th>}
                                            {visibleColumns.companyName && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Company Name</th>}
                                            {visibleColumns.lastLogin && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Last Active</th>}
                                            {visibleColumns.dateCreated && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Date Created</th>}
                                            {visibleColumns.categories && <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">Categories</th>}
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
                                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[13px] font-black shadow-lg shadow-primary/20">
                                                            {user.name?.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">{user.name}</span>
                                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{user.roleName || user.role || 'NO ROLE'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {visibleColumns.status && (
                                                    <td className="px-6 py-5">
                                                        <div className={cn("px-2 py-1 rounded text-[11px] font-bold w-fit tracking-wide uppercase", user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-gray-100 text-gray-600 border border-gray-200/50')}>
                                                            {user.status || 'Active'}
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.accountType && <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{user.accountType || 'N/A'}</td>}
                                                {visibleColumns.email && <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{user.email}</td>}
                                                {visibleColumns.phone && <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{user.phone || 'N/A'}</td>}
                                                {visibleColumns.jobTitle && <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{user.jobTitle || 'n/a'}</td>}
                                                {visibleColumns.hourlyRate && <td className="px-6 py-5 text-[13px] font-bold text-emerald-600">${Number(user.hourlyRate || 0).toFixed(2)}</td>}
                                                {visibleColumns.companyName && <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{user.companyName || 'N/A'}</td>}
                                                {visibleColumns.lastLogin && <td className="px-6 py-5 text-[13px] font-bold text-muted-foreground">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</td>}
                                                {visibleColumns.dateCreated && <td className="px-6 py-5 text-[13px] font-bold text-muted-foreground">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>}
                                                {visibleColumns.categories && (
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.categories?.length > 0 ? user.categories.map((cat: string, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded font-medium">{cat}</span>
                                                            )) : <span className="text-gray-400 text-[13px]">None</span>}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-20">
                        {teamsLoading ? (
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="w-16 h-16 bg-muted rounded-full mb-4" />
                                <div className="h-6 w-48 bg-muted rounded mb-2" />
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
                                            className="px-5 py-2 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_4px_15px_rgba(236,72,153,0.4)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.6)] hover:-translate-y-0.5"
                                        >
                                            Create Team
                                        </button>
                                        <button 
                                            onClick={() => setShowImportTeamsModal(true)}
                                            className="px-5 py-2 rounded-full text-[12px] font-bold text-white uppercase tracking-wide transition-all duration-300 active:scale-95 bg-gradient-to-r from-orange-400 to-rose-400 shadow-[0_4px_15px_rgba(251,146,60,0.4)] hover:shadow-[0_6px_20px_rgba(251,146,60,0.6)] hover:-translate-y-0.5"
                                        >
                                            Import Teams
                                        </button>
                                    </div>
                                }
                            />
                        ) : teamsViewMode === 'table' ? (
                            <div className="flex-1 w-full p-4 bg-gray-50/10">
                                <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="w-full overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="bg-[#FCFDFF]">
                                        <tr className="border-b border-gray-100 select-none">
                                            <th className="px-8 py-4 w-14 text-center cursor-default">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                                            </th>
                                            <th className="px-8 py-4 text-[13px] font-semibold text-slate-500 cursor-default">Name</th>
                                            <th className="px-8 py-4 text-[13px] font-semibold text-slate-500 cursor-default">Description</th>
                                            <th className="px-8 py-4 text-[13px] font-semibold text-slate-500 cursor-default">Number of People</th>
                                            <th className="px-8 py-4 text-[13px] font-semibold text-slate-500 cursor-default">Date Created</th>
                                            <th className="px-8 py-4 w-20 cursor-default"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-card">
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
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                                                            <Users2 className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{team.name}</span>
                                                            {team.isActive === false && (
                                                                <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-black uppercase">Inactive</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-[13px] font-medium text-muted-foreground max-w-md truncate">
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
                                                    <button className="p-2 hover:bg-muted rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10 bg-gray-50/30">
                                {filteredTeams.map((team: any) => (
                                    <div 
                                        key={team.id} 
                                        onClick={() => setSelectedTeam(team)}
                                        className="bg-card p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden text-left"
                                    >
                                        <div className="absolute top-0 right-0 p-12 -mr-8 -mt-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                                            <Users2 className="w-32 h-32 text-primary" />
                                        </div>
                                        <div className="flex flex-col gap-4 relative z-10">
                                            <h3 className="text-[20px] font-black text-foreground group-hover:text-primary transition-colors tracking-tight flex items-center gap-2">
                                                {team.name}
                                                {team.isActive === false && (
                                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-black uppercase">Inactive</span>
                                                )}
                                            </h3>
                                            <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">
                                                {team.description || "Mission-critical maintenance division."}
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 text-primary flex items-center justify-center text-[10px] font-black">T</div>
                                                </div>
                                                <span className="text-[12px] font-black text-primary uppercase tracking-widest">{team._count?.users || 0} Members</span>
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
