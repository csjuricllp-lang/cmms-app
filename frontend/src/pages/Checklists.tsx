import { useState } from 'react';
import { 
    Search, MoreHorizontal, Filter, 
    Tag, ChevronDown, ListChecks, 
    CheckSquare
} from 'lucide-react';
import { useChecklists } from '../hooks/useData';
import { CreateChecklistModal } from '../components/CreateChecklistModal';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileChecklists } from './MobileChecklists';
import { TemplateLibrary } from './Checklists/components/TemplateLibrary';

type Tab = 'your' | 'library';

export const ChecklistsPage = () => {
    const [activeTab, setActiveTab] = useState<Tab>('your');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const { data: checklists, isLoading } = useChecklists();

    const filteredChecklists = (checklists || []).filter((c: any) =>
        (c.title || c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleResetFilters = () => {
        setSearchTerm('');
        toast.success('Filters reset to procedural defaults');
    };

    const isMobile = useMediaQuery('(max-width: 768px)');
    if (isMobile) return <MobileChecklists />;

    return (
        <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
            {/* Page Header (Matching Reference Image) */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-card z-20">
                <div className="flex items-center gap-12">
                    <h1 className="text-[22px] font-bold text-foreground tracking-tight">Checklists</h1>
                </div>
            </div>

            {/* Sub Header / Tabs (Matching Reference Image) */}
            <div className="px-8 border-b border-gray-100 bg-card">
                <div className="flex gap-10">
                    <button 
                        onClick={() => setActiveTab('your')}
                        className={cn(
                            "text-[14px] font-bold py-4 transition-all relative",
                            activeTab === 'your' ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Your Checklists
                    </button>
                    <button 
                        onClick={() => setActiveTab('library')}
                        className={cn(
                            "text-[14px] font-bold py-4 transition-all relative",
                            activeTab === 'library' ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Template Library
                    </button>
                </div>
            </div>

            {activeTab === 'library' ? (
                <div className="flex-1 overflow-hidden">
                    <TemplateLibrary onChecklistCreated={() => setActiveTab('your')} />
                </div>
            ) : (
                <>
                    {/* Action Bar 1 (Count & Search & Add) */}
                    <div className="flex items-center justify-between px-8 py-3 bg-card border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-muted-foreground">
                        {filteredChecklists.length} {filteredChecklists.length === 1 ? 'Checklist' : 'Checklists'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Search by Name" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-5 pr-10 py-2 border border-blue-100/30 bg-gray-50/50 rounded-lg text-[13px] font-bold w-64 focus:bg-card focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-gray-300"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                    </div>
                    <button className="p-2 hover:bg-muted/50 rounded-lg text-gray-400">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-[14px] font-bold transition-all shadow-sm active:scale-95"
                    >
                        Add Checklist
                    </button>
                </div>
            </div>

            {/* Action Bar 2 (Filters & Tags) */}
            <div className="flex items-center gap-4 px-8 py-3 bg-card border-b border-gray-100">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[15px] font-black text-emerald-500 hover:bg-emerald-100/50 transition-all">
                    <Filter className="w-5 h-5 text-emerald-400" />
                    Filters
                </button>
                <div className="relative group">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 border border-sky-200 rounded-2xl text-[15px] font-black text-sky-500 hover:bg-sky-100/50 transition-all">
                        <Tag className="w-5 h-5 text-sky-400" />
                        Tags
                        <ChevronDown className="w-4 h-4 text-sky-400 ml-1 stroke-[3]" />
                    </button>
                </div>
                <button 
                    onClick={handleResetFilters}
                    className="text-[13px] font-bold text-primary hover:text-primary/90 ml-4 transition-colors"
                >
                    Reset Filters
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50/10">
                <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-primary">
                            <tr className="border-b border-primary/20">
                                <th className="px-6 py-4 w-14 text-center">
                                    <input type="checkbox" className="w-4 h-4 rounded border-white/50 text-white focus:ring-white/50 cursor-pointer" />
                                </th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white/90">Name</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white/90 border-l border-primary/20">Description</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white/90 border-l border-primary/20 text-center">Tasks</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white/90 border-l border-primary/20">Tags</th>
                                <th className="w-14"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse bg-card">
                                        <td colSpan={6} className="p-8">
                                            <div className="h-4 bg-muted/50 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredChecklists.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center bg-card">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-primary mb-4">
                                                <ListChecks className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-[18px] font-bold text-foreground">No checklists detected</h3>
                                            <p className="text-[14px] text-muted-foreground mt-1 max-w-xs text-center">Standardize safety and maintenance procedures by creating your first template.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredChecklists.map((checklist: any) => (
                                    <tr key={checklist.id} className="hover:bg-blue-50/30 transition-all group cursor-pointer bg-card">
                                        <td className="px-6 py-5 text-center">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:bg-blue-100 transition-colors">
                                                    <CheckSquare className="w-4 h-4" />
                                                </div>
                                                <span className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {checklist.title || checklist.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-[14px] font-medium text-muted-foreground border-l border-gray-100/50">
                                            <div className="flex items-center justify-between">
                                                <span className="line-clamp-1 italic text-gray-400">
                                                    {checklist.description || "These tasks and checks should be performed for standardized operations..."}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center border-l border-gray-100/50">
                                            <span className="px-3 py-1 bg-blue-50 text-primary rounded-full text-[12px] font-black">
                                                {checklist.items?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 border-l border-gray-100/50">
                                            <div className="flex flex-wrap gap-2">
                                                {(checklist.tags || ['Safety', 'Audit']).map((tag: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-bold uppercase tracking-wider">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 hover:bg-muted rounded-lg text-gray-300 hover:text-gray-600 transition-all">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            )}

            {/* Template Creation Modal */}
            <CreateChecklistModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
