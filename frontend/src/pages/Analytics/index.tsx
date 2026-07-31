// Ad-Hoc Report Builder Enabled
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
    LayoutGrid, 
    Plus, 
    RefreshCcw, 
    Filter, 
    MoreVertical, 
    ChevronDown,
    TrendingUp,
    Download,
    Globe,
    Pin,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useAnalytics } from '../../hooks/useData';

// Types & Constants
import { ALL_DASHBOARDS } from './dashboards';
import type { DateFilter } from './types';

// Components
import { EditPinnedItemsModal } from './components/EditPinnedItemsModal';
import { TeamPerformance } from './components/TeamPerformance';
import { CostMaintenance } from './components/CostMaintenance';
import { AssetDowntime } from './components/AssetDowntime';
import { JuricAdoption } from './components/JuricAdoption';
import { MaintenanceCompliance } from './components/MaintenanceCompliance';
import { TimeAndCostDashboard } from './components/TimeAndCostDashboard';
import { StatusReport } from './components/StatusReport';
import { FilterBar } from './components/FilterBar';
import { WOAging } from './components/WOAging';
import { Reliability } from './components/Reliability';
import { PartsConsumption } from './components/PartsConsumption';
import { WorkOrderAnalysis } from './components/WorkOrderAnalysis';
import { TotalMaintenanceCost } from './components/TotalMaintenanceCost';
import { UsefulLife } from './components/UsefulLife';
import { MetersAnalysis } from './components/MetersAnalysis';
import { RequestsAnalysis } from './components/RequestsAnalysis';
import { ItemizedTimeReport } from './components/ItemizedTimeReport';
import { PartsInventory } from './components/PartsInventory';
import { AnalyticsSidebar } from './components/AnalyticsSidebar';
import { UserLoginReport } from './components/UserLoginReport';
import { AssetAuditLog } from './components/AssetAuditLog';
import { CustomReportBuilder } from './components/CustomReportBuilder';
import { Home } from 'lucide-react';

export const AnalyticsPage = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const getTenantCompany = () => {
        try {
            const orgStr = localStorage.getItem('organization');
            if (orgStr) {
                const org = JSON.parse(orgStr);
                if (org && org.name) return org.name;
            }
            if (user && user.organizations && user.organizations.length > 0) {
                return user.organizations[0].name;
            }
        } catch (e) {
            console.error("Error reading tenant organization", e);
        }
        return 'Juric';
    };
    const companyName = getTenantCompany();

    const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('juric_pinned_dashboards');
        const initialIds = saved ? JSON.parse(saved) : ['Performance', 'Cost', 'Uptime'];
        return initialIds.slice(0, 3);
    });

    const savePinnedIds = (ids: string[]) => {
        setPinnedIds(ids);
        localStorage.setItem('juric_pinned_dashboards', JSON.stringify(ids));
    };

    const [activeTab, setActiveTab] = useState<string>(pinnedIds[0]);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showAnalyticsSidebar, setShowAnalyticsSidebar] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    // Filter States
    const [typeFilter, setTypeFilter] = useState('any value');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [selectedWorker, setSelectedWorker] = useState<string>('any value');
    
    // Status Report Advanced Filters
    const [dateCompletedFilters, setDateCompletedFilters] = useState<DateFilter[]>([{ id: 1, operator: 'is in the last', value: '30', unit: 'days' }]);
    const [dueDateFilters, setDueDateFilters] = useState<DateFilter[]>([{ id: 1, operator: 'is in the last', value: '30', unit: 'days' }]);
    const [priorityFilter, setPriorityFilter] = useState('any value');
    const [selectedAssetCategories, setSelectedAssetCategories] = useState<string[]>([]);
    const [isRecurringFilter, setIsRecurringFilter] = useState('any value');
    const [downtimeCategoryFilter, setDowntimeCategoryFilter] = useState('is any value');
    const [assetStatusFilter, setAssetStatusFilter] = useState('is active');
    const [warrantyDateFilter, setWarrantyDateFilter] = useState('Last 30 Days');
    const [meterNameFilter, setMeterNameFilter] = useState<string[]>([]);
    const [meterCategoryFilter, setMeterCategoryFilter] = useState<string[]>([]);
    
    // Parts Consumption Filters
    const [partLocationFilter, setPartLocationFilter] = useState<string[]>([]);
    const [woLocationFilter, setWoLocationFilter] = useState<string[]>([]);
    const [partCategoryFilter, setPartCategoryFilter] = useState<string[]>([]);
    const [partNumberFilter, setPartNumberFilter] = useState<string>('');
    
    const [datePreset, setDatePreset] = useState('Last 30 Days');

    const resetFilters = () => {
        setTypeFilter('any value');
        setSelectedCategories([]);
        setSelectedLocations([]);
        setSelectedAssets([]);
        setSelectedTeams([]);
        setSelectedWorker('any value');
        setDateCompletedFilters([{ id: 1, operator: 'is in the last', value: '30', unit: 'days' }]);
        setDueDateFilters([{ id: 1, operator: 'is in the last', value: '30', unit: 'days' }]);
        setPriorityFilter('any value');
        setSelectedAssetCategories([]);
        setIsRecurringFilter('any value');
        setDowntimeCategoryFilter('is any value');
        setAssetStatusFilter('is active');
        setWarrantyDateFilter('Last 30 Days');
        setMeterNameFilter([]);
        setMeterCategoryFilter([]);
        setPartLocationFilter([]);
        setWoLocationFilter([]);
        setPartCategoryFilter([]);
        setPartNumberFilter('');
        setDatePreset('Last 30 Days');
        setShowMoreMenu(false);
    };

    const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

    const { data: analytics, isLoading, refetch, isFetching } = useAnalytics({
        dateRange: datePreset,
        type: typeFilter,
        categories: selectedCategories,
        locations: selectedLocations,
        assets: selectedAssets,
        teams: selectedTeams,
        worker: selectedWorker,
        dateCompletedFilters: JSON.stringify(dateCompletedFilters),
        dueDateFilters: JSON.stringify(dueDateFilters),
        priority: priorityFilter,
        assetCategory: selectedAssetCategories,
        isRecurring: isRecurringFilter,
        warrantyDate: warrantyDateFilter,
        meterName: meterNameFilter,
        meterCategory: meterCategoryFilter,
        partLocation: partLocationFilter,
        woLocation: woLocationFilter,
        partCategory: partCategoryFilter,
        partNumber: partNumberFilter,
        assetStatus: assetStatusFilter,
        downtimeCategory: downtimeCategoryFilter
    });

    // Update last synced whenever data changes
    useEffect(() => {
        if (analytics) setLastSyncedAt(new Date());
    }, [analytics]);

    const lastSyncedText = useMemo(() => {
        const diff = Math.floor((new Date().getTime() - lastSyncedAt.getTime()) / 60000);
        if (diff === 0) return 'Just now';
        return `${diff}m ago`;
    }, [lastSyncedAt, isFetching]);

    const activeTabs = useMemo(() => 
        ALL_DASHBOARDS.filter(d => pinnedIds.includes(d.id)),
    [pinnedIds]);

    const handleTogglePin = (id: string) => {
        const isPinned = pinnedIds.includes(id);
        if (!isPinned && pinnedIds.length >= 3) {
            toast.error('You can only pin up to 3 dashboards at a time.');
            return;
        }
        const newPinned = isPinned 
            ? pinnedIds.filter(pid => pid !== id)
            : [...pinnedIds, id];
        savePinnedIds(newPinned);
    };

    const downloadFullDashboard = () => {
        if (!analytics) return;
        window.print();
        setShowMoreMenu(false);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin shadow-lg" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Computing Dimensional Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#FAFBFC] font-inter relative">
            <AnalyticsSidebar 
                isOpen={showAnalyticsSidebar}
                onClose={() => setShowAnalyticsSidebar(false)}
                pinnedIds={pinnedIds}
                onTogglePin={handleTogglePin}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
            />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-2.5 flex items-center justify-between shadow-sm relative z-20 print:hidden">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowAnalyticsSidebar(true)}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 shadow-sm"
                    >
                        <LayoutGrid className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200"><TrendingUp className="w-4 h-4 text-white" /></div>
                        <h1 className="text-[16px] font-black text-slate-800 tracking-tight italic uppercase">{companyName} Analytics</h1>
                        {/* Live badge */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">
                            <span className={`w-1.5 h-1.5 rounded-full ${isFetching ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                {isFetching ? 'Updating...' : 'Live'}
                            </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Updated {lastSyncedText}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => setActiveTab('CustomReport')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[12px] font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus className="w-3.5 h-3.5" /> Create Custom Dashboard
                </button>
            </div>

            {/* Tab Bar */}
            <div className="bg-white border-b border-slate-200 px-8 flex items-center justify-between">
                <div className="flex items-center gap-2">

                    {activeTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-4 py-2.5 text-[12px] font-black uppercase italic tracking-widest transition-all relative group",
                                activeTab === tab.id ? "text-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setShowPinModal(true)} 
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors py-2.5 group"
                    >
                        <Pin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-black uppercase italic tracking-widest">Manage Pins</span>
                    </button>
                    <div className="h-4 w-[1px] bg-slate-100" />
                    <button 
                        onClick={() => setShowAnalyticsSidebar(true)}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors py-2.5 group"
                    >
                        <LayoutGrid className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-black uppercase italic tracking-widest">All Dashboards</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && activeTab !== 'ItemizedTime' && activeTab !== 'UserLogin' && (
                <div className="print:hidden">
                    <FilterBar 
                        analytics={analytics}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        selectedLocations={selectedLocations}
                        setSelectedLocations={setSelectedLocations}
                        selectedAssets={selectedAssets}
                        setSelectedAssets={setSelectedAssets}
                        selectedTeams={selectedTeams}
                        setSelectedTeams={setSelectedTeams}
                        selectedWorker={selectedWorker}
                        setSelectedWorker={setSelectedWorker}
                        datePreset={datePreset}
                        setDatePreset={setDatePreset}
                        dateCompletedFilters={dateCompletedFilters}
                        dueDateFilters={dueDateFilters}
                        priorityFilter={priorityFilter}
                        setPriorityFilter={setPriorityFilter}
                        selectedAssetCategories={selectedAssetCategories}
                        setSelectedAssetCategories={setSelectedAssetCategories}
                        downtimeCategoryFilter={downtimeCategoryFilter}
                        setDowntimeCategoryFilter={setDowntimeCategoryFilter}
                        assetStatusFilter={assetStatusFilter}
                        setAssetStatusFilter={setAssetStatusFilter}
                        warrantyDateFilter={warrantyDateFilter}
                        setWarrantyDateFilter={setWarrantyDateFilter}
                        meterNameFilter={meterNameFilter}
                        setMeterNameFilter={setMeterNameFilter}
                        meterCategoryFilter={meterCategoryFilter}
                        setMeterCategoryFilter={setMeterCategoryFilter}
                        partLocationFilter={partLocationFilter}
                        setPartLocationFilter={setPartLocationFilter}
                        woLocationFilter={woLocationFilter}
                        setWoLocationFilter={setWoLocationFilter}
                        partCategoryFilter={partCategoryFilter}
                        setPartCategoryFilter={setPartCategoryFilter}
                        partNumberFilter={partNumberFilter}
                        setPartNumberFilter={setPartNumberFilter}
                        resetFilters={resetFilters}
                        activeTab={activeTab}
                    />
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
                <div className="max-w-[1600px] mx-auto p-10 space-y-10">
                    <div className="flex items-center justify-between">
                        {activeTab !== 'ItemizedTime' && activeTab !== 'UserLogin' && (
                            <div className="flex flex-col gap-1">
                                <h2 className="text-[28px] font-black text-slate-800 tracking-tight italic uppercase">{activeTabs.find(t => t.id === activeTab)?.label}</h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">System synthesized analytics • Real-time update</p>
                            </div>
                        )}
                        <div className="flex items-center gap-3 print:hidden">
                            <div className="flex flex-col items-end mr-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last synced</span>
                                <span className="text-[12px] font-black text-slate-600">{lastSyncedText}</span>
                            </div>
                            <button 
                                onClick={() => refetch()}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                                <motion.div animate={{ rotate: isFetching ? 360 : 0 }} transition={{ repeat: isFetching ? Infinity : 0, duration: 1, ease: "linear" }}>
                                    <RefreshCcw className="w-5 h-5 text-slate-600" />
                                </motion.div>
                            </button>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all shadow-sm", 
                                    showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="text-[13px] font-bold">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                            </button>
                            <div className="relative">
                                <button 
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                    className={cn("p-2.5 rounded-xl border transition-all shadow-sm", showMoreMenu ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                <AnimatePresence>
                                    {showMoreMenu && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute top-full right-0 mt-3 w-[320px] bg-white rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-slate-100 py-3 z-[1500]">
                                            <button onClick={() => { refetch(); setShowMoreMenu(false); }} className="w-full px-6 py-3 flex items-center justify-between text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4"><RefreshCcw className="w-4 h-4 opacity-70" /> Clear cache and refresh</div>
                                                <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase px-2 py-0.5 border border-slate-100 rounded">⇧ctrl↵</span>
                                            </button>
                                            <div className="h-px bg-slate-50 my-2 mx-4" />
                                            <button onClick={downloadFullDashboard} className="w-full px-6 py-3 flex items-center justify-between text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4"><Download className="w-4 h-4 opacity-70" /> Export to PDF</div>
                                                <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase px-2 py-0.5 border border-slate-100 rounded">alt⇧D</span>
                                            </button>
                                            <button className="w-full px-6 py-3 flex items-center justify-between text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors opacity-50">
                                                <div className="flex items-center gap-4 text-transparent pointer-events-none w-4" /> Schedule delivery
                                                <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase px-2 py-0.5 border border-slate-100 rounded">alt⇧S</span>
                                            </button>
                                            <div className="h-px bg-slate-50 my-2 mx-4" />
                                            <button onClick={resetFilters} className="w-full px-6 py-3 flex items-center justify-between text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4"><Filter className="w-4 h-4 opacity-70" /> Reset filters</div>
                                                <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase px-2 py-0.5 border border-slate-100 rounded">ctrlaltR</span>
                                            </button>
                                            <div className="h-px bg-slate-50 my-2 mx-4" />
                                            <div className="px-6 py-3 flex items-center gap-4 group">
                                                <Globe className="w-4 h-4 text-slate-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-slate-700">Viewer time zone</span>
                                                    <span className="text-[12px] font-medium text-slate-400">Asia - Calcutta</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* FilterBar moved outside the scroll container — see above the body div */}


                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                            {activeTab === 'Performance' && <TeamPerformance data={analytics} />}
                            {activeTab === 'ItemizedTime' && (
                                <ItemizedTimeReport 
                                    data={analytics} 
                                    datePreset={datePreset}
                                    setDatePreset={setDatePreset}
                                    showFilters={showFilters}
                                />
                            )}
                            {activeTab === 'UserLogin' && (
                                <UserLoginReport 
                                    data={analytics} 
                                    showFilters={showFilters}
                                />
                            )}
                            {activeTab === 'AssetAudit' && (
                                <AssetAuditLog 
                                    data={analytics} 
                                    showFilters={showFilters}
                                />
                            )}
                            {activeTab === 'Cost' && <CostMaintenance data={analytics} />}
                            {activeTab === 'Uptime' && <AssetDowntime data={analytics} />}
                            {activeTab === 'Adoption' && <JuricAdoption data={analytics} />}
                            {activeTab === 'TimeAndCost' && (
                                <TimeAndCostDashboard data={analytics} />
                            )}
                            {activeTab === 'StatusReport' && (
                                <StatusReport data={analytics} />
                            )}
                            {activeTab === 'Compliance' && (
                                <MaintenanceCompliance data={analytics} />
                            )}
                            {activeTab === 'WOAging' && (
                                <WOAging data={analytics} />
                            )}
                            {activeTab === 'Reliability' && (
                                <Reliability data={analytics} />
                            )}
                            {activeTab === 'PartsConsumption' && (
                                <PartsConsumption data={analytics} />
                            )}
                            {activeTab === 'PartsInventory' && (
                                <PartsInventory data={analytics} />
                            )}
                            {activeTab === 'WOAnalysis' && (
                                <WorkOrderAnalysis data={analytics} />
                            )}
                            {activeTab === 'TotalCost' && (
                                <TotalMaintenanceCost data={analytics} />
                            )}
                            {activeTab === 'UsefulLife' && (
                                <UsefulLife data={analytics} />
                            )}
                            {activeTab === 'Meters' && (
                                <MetersAnalysis data={analytics} />
                            )}
                            {activeTab === 'Requests' && (
                                <RequestsAnalysis data={analytics} />
                            )}
                            {activeTab === 'CustomReport' && (
                                <CustomReportBuilder data={analytics} />
                            )}
                            {!['Performance', 'Cost', 'Uptime', 'Adoption', 'Compliance', 'StatusReport', 'TimeAndCost', 'WOAging', 'Reliability', 'PartsConsumption', 'PartsInventory', 'Requests', 'WOAnalysis', 'TotalCost', 'UsefulLife', 'Meters', 'ItemizedTime', 'CustomReport'].includes(activeTab) && (
                                <div className="h-[400px] flex items-center justify-center p-12 bg-white rounded-[40px] border-2 border-dashed border-slate-100 mt-8">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100"><Clock className="w-8 h-8 text-slate-300" /></div>
                                        <p className="text-slate-400 italic font-medium uppercase tracking-widest text-[12px]">Constructing Neural Dashboard for {activeTabs.find(t => t.id === activeTab)?.label}...</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {showPinModal && (
                    <EditPinnedItemsModal 
                        isOpen={showPinModal} 
                        onClose={() => setShowPinModal(false)} 
                        pinnedIds={pinnedIds} 
                        onSave={(ids) => {
                            savePinnedIds(ids);
                            setShowPinModal(false);
                        }} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalyticsPage;
