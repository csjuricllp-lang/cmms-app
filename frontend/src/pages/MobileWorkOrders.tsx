import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useUsers } from '../hooks/useData';
import { 
  Search, Calendar, MapPin, Box, CircleCheck, AlertTriangle, RefreshCcw, Loader2, Plus,
  LayoutGrid, ChevronLeft, ChevronRight, ChevronDown, Timer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { MobileWorkOrderDetail } from './MobileWorkOrderDetail';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';

export const MobileWorkOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'Table' | 'Column' | 'Calendar'>('Table');

  // Calendar states
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Kanban collapsible groups
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  // Status filter state (capitalized to match API requirements)
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  const selectedId = searchParams.get('id');

  // Map user-friendly tab to API query statuses
  const getStatusQuery = () => {
    if (currentView !== 'Table') return undefined; // Fetch all for Kanban/Calendar view
    if (activeStatus === 'ALL') return 'OPEN,IN_PROGRESS,ON_HOLD';
    return activeStatus;
  };

  const { workOrders, isLoading, refetchWorkOrders } = useWorkOrders({
    search: debouncedSearchQuery || undefined,
    status: getStatusQuery(),
    sortBy: 'priority',
    sortOrder: 'desc',
  });

  const { data: usersData } = useUsers();

  const handleSelectWorkOrder = (id: string) => {
    setSearchParams({ id });
  };

  const handleCloseDetail = () => {
    searchParams.delete('id');
    setSearchParams(searchParams);
  };

  const handlePrevMonth = () => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() - 1);
    setCalendarDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() + 1);
    setCalendarDate(d);
  };

  // Helper to get calendar days (42 cells to represent a month)
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: 'prev', fullDate: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: 'current', fullDate: new Date(year, month, i) });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: 'next', fullDate: new Date(year, month + 1, i) });
    }
    return days;
  };

  // Filter work orders that start or are due on a specific calendar day
  const getWorkOrdersForDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    return workOrders.filter(wo => {
      const dateObj = wo.dueDate ? new Date(wo.dueDate) : wo.startDate ? new Date(wo.startDate) : null;
      if (!dateObj) return false;
      const woY = dateObj.getFullYear();
      const woM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const woD = String(dateObj.getDate()).padStart(2, '0');
      return `${woY}-${woM}-${woD}` === dateStr;
    });
  };

  const statuses = [
    { id: 'ALL', label: 'All Active' },
    { id: 'OPEN', label: 'Open' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'ON_HOLD', label: 'On Hold' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  if (selectedId) {
    return <MobileWorkOrderDetail id={selectedId} onClose={handleCloseDetail} />;
  }

  return (
    <>
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md px-4 py-3 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
            My Protocols
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-[12px] font-black shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
              Create WO
            </button>
            <button 
              onClick={() => refetchWorkOrders()}
              className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground active:scale-95 transition-all"
              title="Refresh List"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex bg-muted p-1 rounded-xl">
          {(['Table', 'Column', 'Calendar'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                currentView === view ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
              )}
            >
              {view === 'Table' && <Search className="w-3.5 h-3.5" />}
              {view === 'Column' && <LayoutGrid className="w-3.5 h-3.5" />}
              {view === 'Calendar' && <Calendar className="w-3.5 h-3.5" />}
              {view}
            </button>
          ))}
        </div>

        {/* Dynamic header options based on active view */}
        {currentView === 'Table' && (
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search work orders, assets..."
                className="w-full h-11 pl-10 pr-4 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:bg-background focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Status Quick Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => setActiveStatus(status.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-tight whitespace-nowrap border transition-all active:scale-95",
                    activeStatus === status.id
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted border-border text-muted-foreground hover:bg-muted/75"
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </>
        )}

        {currentView === 'Column' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignee work orders..."
              className="w-full h-11 pl-10 pr-4 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:bg-background focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
        )}

        {currentView === 'Calendar' && (
          <div className="flex items-center justify-between bg-muted px-4 py-1.5 rounded-xl border border-border/40">
            <button 
              onClick={handlePrevMonth} 
              className="p-1.5 hover:bg-card rounded-lg text-muted-foreground active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-black uppercase tracking-widest text-foreground">
              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={handleNextMonth} 
              className="p-1.5 hover:bg-card rounded-lg text-muted-foreground active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Hydrating Protocols...</span>
          </div>
        ) : (
          <>
            {/* ── TABLE VIEW ────────────────────────────── */}
            {currentView === 'Table' && (
              workOrders.length > 0 ? (
                <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-none">
                    <table className="w-full min-w-[1000px] text-left border-collapse">
                      <thead className="bg-muted/40 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 left-0 z-30 bg-muted/90 backdrop-blur-sm">WO #</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 left-[60px] z-30 bg-muted/90 backdrop-blur-sm border-r border-border/40">Title</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">Status</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">Priority</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">Due Date</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">Assigned To</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">Asset</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">Location</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {workOrders.map((order) => {
                          const isOverdue = order.dueDate && new Date(order.dueDate).getTime() < Date.now() && order.status !== 'Complete';
                          const initials = order.assignee ? order.assignee.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

                          return (
                            <tr 
                              key={order.id}
                              onClick={() => handleSelectWorkOrder(order.id)}
                              className="hover:bg-muted/30 transition-colors cursor-pointer group"
                            >
                              {/* WO # sticky */}
                              <td className="px-4 py-3 text-[12px] font-black text-primary sticky left-0 z-10 bg-card group-hover:bg-muted/30">
                                #{String(order.woNumber || '').padStart(3, '0')}
                              </td>
                              
                              {/* Title sticky */}
                              <td className="px-4 py-3 text-[12px] font-black text-foreground sticky left-[60px] z-10 bg-card group-hover:bg-muted/30 border-r border-border/40 max-w-[200px] truncate">
                                {order.title}
                              </td>

                              {/* Status */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                                  order.status === 'Complete' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                  order.status === 'In Progress' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                                  order.status === 'On Hold' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                  "bg-muted border-border text-muted-foreground"
                                )}>
                                  {order.status?.replace('_', ' ')}
                                </span>
                              </td>

                              {/* Priority */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                                  order.priority === 'High' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                                  order.priority === 'Medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                  "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                )}>
                                  {order.priority || 'Normal'}
                                </span>
                              </td>

                              {/* Due Date */}
                              <td className="px-4 py-3 whitespace-nowrap text-[12px] font-bold text-foreground">
                                <span className={cn(isOverdue && "text-rose-500 font-extrabold")}>
                                  {order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Flexible'}
                                </span>
                              </td>

                              {/* Assigned To */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-black text-muted-foreground">
                                    {initials}
                                  </div>
                                  <span className="text-[12px] font-bold text-foreground">
                                    {order.assignee || 'Unassigned'}
                                  </span>
                                </div>
                              </td>

                              {/* Asset */}
                              <td className="px-4 py-3 whitespace-nowrap text-[12px] font-bold text-muted-foreground truncate max-w-[150px]">
                                {order.assetName || '--'}
                              </td>

                              {/* Location */}
                              <td className="px-4 py-3 whitespace-nowrap text-[12px] font-bold text-muted-foreground truncate max-w-[150px]">
                                {order.locationName || '--'}
                              </td>

                              {/* Category */}
                              <td className="px-4 py-3 whitespace-nowrap text-[12px] font-bold text-muted-foreground">
                                {order.category || '--'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-border rounded-3xl">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground opacity-30" />
                  <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">No Active Work Orders</span>
                </div>
              )
            )}

            {/* ── COLUMN (KANBAN) VIEW ──────────────────────── */}
            {currentView === 'Column' && (
              <div className="space-y-4">
                {(() => {
                  const groupedByAssignee = workOrders.reduce((acc: Record<string, typeof workOrders>, wo) => {
                    const assignee = wo.assignee || 'No Assignee';
                    if (!acc[assignee]) acc[assignee] = [];
                    acc[assignee].push(wo);
                    return acc;
                  }, {});

                  const assignees = Object.keys(groupedByAssignee).sort();

                  if (assignees.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-border rounded-3xl">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground opacity-30" />
                        <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">No Active Work Orders</span>
                      </div>
                    );
                  }

                  return assignees.map(assignee => {
                    const isCollapsed = collapsedGroups.includes(assignee);
                    const userOrders = groupedByAssignee[assignee];
                    const totalHours = userOrders.reduce((sum: number, wo: any) => sum + (Number(wo.estimatedHours) || 0), 0);
                    const initials = assignee === 'No Assignee' ? 'N/A' : assignee.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                    return (
                      <div key={assignee} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <button
                          onClick={() => setCollapsedGroups(prev =>
                            isCollapsed ? prev.filter(a => a !== assignee) : [...prev, assignee]
                          )}
                          className="w-full flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary border border-primary/20">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-black text-foreground tracking-tight">{assignee}</span>
                              <span className="text-[11px] text-muted-foreground font-bold">{userOrders.length} WO • {totalHours}h workload</span>
                            </div>
                          </div>
                          <div>
                            {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-foreground rotate-180 transition-transform" />}
                          </div>
                        </button>

                        {!isCollapsed && (
                          <div className="p-3 flex gap-3 overflow-x-auto snap-x pb-4 scrollbar-none">
                            {['Open', 'PENDING_APPROVAL', 'In Progress', 'On Hold', 'Complete'].map(status => {
                              const statusOrders = userOrders.filter(o => {
                                const s = o.status;
                                return s === status || (status === 'Complete' && s === 'COMPLETED');
                              });
                              const userFriendlyStatus = status === 'PENDING_APPROVAL' ? 'Pending Approval' : status === 'Complete' ? 'Completed' : status;

                              return (
                                <div key={status} className="snap-center shrink-0 w-[260px] bg-muted/20 border border-border rounded-xl p-3 flex flex-col gap-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                      {userFriendlyStatus}
                                    </span>
                                    <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded-full text-foreground border border-border/40">
                                      {statusOrders.length}
                                    </span>
                                  </div>

                                  <div className="space-y-2 overflow-y-auto max-h-[300px]">
                                    {statusOrders.length > 0 ? (
                                      statusOrders.map(order => {
                                        const isOverdue = order.dueDate && new Date(order.dueDate).getTime() < Date.now() && order.status !== 'Complete';
                                        return (
                                          <div
                                            key={order.id}
                                            onClick={() => handleSelectWorkOrder(order.id)}
                                            className={cn(
                                              "bg-card rounded-xl border border-border p-3 shadow-sm hover:border-primary/20 active:scale-95 transition-all cursor-pointer",
                                              isOverdue || order.isEscalated ? "border-rose-500/20 bg-rose-500/5" : ""
                                            )}
                                          >
                                            <div className="flex justify-between items-start mb-1.5 flex-wrap gap-1">
                                              <div className="flex items-center gap-1">
                                                <span className="text-[9px] font-bold text-muted-foreground">
                                                  #{String(order.woNumber || order.id.slice(0, 3)).padStart(3, '0')}
                                                </span>
                                                {((order as any).request?.id || (order as any).requestId) && (
                                                  <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.5 bg-indigo-500/10 text-indigo-500 rounded">
                                                    From REQ-{((order as any).request?.id || (order as any).requestId).split('-')[0].toUpperCase()}
                                                  </span>
                                                )}
                                              </div>
                                              <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                                order.priority === 'High' ? "bg-rose-500/10 text-rose-500" :
                                                order.priority === 'Medium' ? "bg-amber-500/10 text-amber-500" :
                                                "bg-emerald-500/10 text-emerald-500"
                                              )}>
                                                {order.priority || 'Normal'}
                                              </span>
                                            </div>
                                            <h4 className="text-[12px] font-black leading-tight text-foreground mb-2 line-clamp-2">
                                              {order.title}
                                            </h4>
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                              <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 opacity-70" />
                                                <span className={isOverdue ? "text-rose-500 font-extrabold" : ""}>
                                                  {order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Flexible'}
                                                </span>
                                              </div>
                                              {order.estimatedHours && (
                                                <span className="font-bold">{order.estimatedHours}H</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="py-6 text-center border border-dashed border-border rounded-xl">
                                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">Empty Column</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* ── CALENDAR VIEW ─────────────────────────── */}
            {currentView === 'Calendar' && (
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                  {/* Days of Week headers */}
                  <div className="grid grid-cols-7 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <span key={idx} className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Calendar grid cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays(calendarDate).map((dayInfo, idx) => {
                      const { day, month, fullDate } = dayInfo;
                      const isSelected = fullDate.toDateString() === selectedDate.toDateString();
                      const isToday = fullDate.toDateString() === new Date().toDateString();
                      const isOutsideMonth = month !== 'current';
                      const dayWorkOrders = getWorkOrdersForDate(fullDate);

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDate(fullDate)}
                          className={cn(
                            "aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative active:scale-95",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "hover:bg-muted/50",
                            isToday && !isSelected && "border border-primary/50 text-primary font-black",
                            isOutsideMonth && "opacity-35"
                          )}
                        >
                          <span className={cn(
                            "text-[13px] font-black",
                            isSelected ? "text-primary-foreground" : "text-foreground"
                          )}>
                            {day}
                          </span>

                          {/* Indicator dots */}
                          {dayWorkOrders.length > 0 && (
                            <div className="absolute bottom-1.5 flex gap-0.5 justify-center">
                              <div className={cn(
                                "w-1 h-1 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-primary"
                              )} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed list for the selected day */}
                <div className="space-y-3">
                  <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">
                    Schedule for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>

                  {(() => {
                    const dayWorkOrders = getWorkOrdersForDate(selectedDate);

                    if (dayWorkOrders.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 border-2 border-dashed border-border rounded-2xl bg-card/40">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">No Protocols Scheduled</span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {dayWorkOrders.map(order => {
                          const checklistItems = order.checklist?.items || [];
                          const completedCount = checklistItems.filter((i: any) => i.isCompleted).length;
                          const totalCount = checklistItems.length;
                          const isOverdue = order.dueDate && new Date(order.dueDate).getTime() < Date.now() && order.status !== 'Complete';

                          return (
                            <div
                              key={order.id}
                              onClick={() => handleSelectWorkOrder(order.id)}
                              className={cn(
                                "bg-card rounded-2xl border p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex gap-4 items-start justify-between",
                                isOverdue || order.isEscalated ? "border-rose-500/30 bg-rose-500/5" : "border-border hover:border-primary/20"
                              )}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-bold text-muted-foreground border border-border uppercase tracking-wider">
                                    #{String(order.woNumber || order.id.slice(0, 3)).padStart(3, '0')}
                                  </span>
                                  {((order as any).request?.id || (order as any).requestId) && (
                                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[8px] font-black uppercase tracking-wider">
                                      From REQ-{((order as any).request?.id || (order as any).requestId).split('-')[0].toUpperCase()}
                                    </span>
                                  )}
                                  <div className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                    order.priority === 'High' ? "bg-rose-500/10 text-rose-500 border border-rose-500/10" :
                                    order.priority === 'Medium' ? "bg-amber-500/10 text-amber-500 border border-amber-500/10" :
                                    "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10"
                                  )}>
                                    {order.priority || 'Normal'}
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                    {order.status?.replace('_', ' ')}
                                  </span>
                                </div>

                                <h4 className="text-[14px] font-black leading-tight text-foreground line-clamp-1">
                                  {order.title}
                                </h4>

                                {order.assetName && (
                                  <span className="text-[11px] text-muted-foreground font-bold block truncate">
                                    Asset: {order.assetName}
                                  </span>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-black text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded uppercase block w-fit ml-auto">
                                  {order.dueDate
                                    ? new Date(order.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '00:00'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* Create Work Order Modal */}
    <CreateWorkOrderModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
    />
    </>
  );
};


