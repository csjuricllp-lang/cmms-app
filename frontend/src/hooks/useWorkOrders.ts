import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { db, type WorkOrderSync } from '../lib/db';
import toast from 'react-hot-toast';
import { mapWorkOrder } from '../utils/workOrderMapper';
import axios from 'axios';


export const useWorkOrders = (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    priority?: string;
    assetId?: string;
    locationId?: string;
    assignedToId?: string;
    assignedTeamId?: string;
    isBookmarked?: boolean;
    isRepeating?: boolean;
    pmScheduleId?: string;
    sortBy?: string;
    sortOrder?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
    /** 'true' = scheduled (has startDate+assignee), 'false' = unscheduled */
    isScheduled?: string;
    /** Filter WOs whose startDate >= this ISO string (timeline range start) */
    startDateStart?: string;
    /** Filter WOs whose startDate <= this ISO string (timeline range end) */
    startDateEnd?: string;
    /** Filter by exact category (case-insensitive) */
    category?: string;
}) => {
    const queryClient = useQueryClient();

    // Determine if we are doing a paginated server query or a full-sync fetch
    const isPaginated = !!(
        params?.page || params?.limit || params?.search ||
        params?.status || params?.priority || params?.assignedToId ||
        params?.assignedTeamId || params?.assetId || params?.locationId ||
        params?.isBookmarked || params?.isRepeating || params?.pmScheduleId ||
        params?.sortBy || params?.sortOrder ||
        params?.dueDateStart || params?.dueDateEnd ||
        params?.isScheduled || params?.startDateStart ||
        params?.startDateEnd || params?.category
    );


    // 1. FETCH & SYNC: Get from API, save to Local DB, return Data + Meta
    const { data, isLoading, refetch } = useQuery<{ items: WorkOrderSync[]; meta?: any }>({
        queryKey: ['work-orders', params],
        queryFn: async () => {
            try {
                // Try to get fresh data from server
                let fetchParams: any = { ...params };
                if (!isPaginated) {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    fetchParams.createdAtStart = thirtyDaysAgo.toISOString();
                }
                const response = await api.get('/work-orders', { params: fetchParams });
                
                let remoteData: any[] = [];
                let meta = undefined;

                if (response.data && Array.isArray(response.data)) {
                    remoteData = response.data;
                } else if (response.data && Array.isArray(response.data.items)) {
                    remoteData = response.data.items;
                    meta = response.data.meta;
                }

                const mappedData: WorkOrderSync[] = remoteData.map(mapWorkOrder);

                // In paginated mode, we just return the items for this page, we don't bulkPut (to avoid partial hydration state)
                if (isPaginated) {
                    return { items: mappedData, meta };
                }
                
                // Hydrate Local DB (non-blocking chunked sync)
                if (!isPaginated) {
                    // Chunk the writes to avoid blocking the main thread
                    const chunkSize = 100;
                    for (let i = 0; i < mappedData.length; i += chunkSize) {
                        const chunk = mappedData.slice(i, i + chunkSize);
                        await db.workOrders.bulkPut(chunk);
                        // Brief pause to allow UI to breathe
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                return { items: mappedData };
            } catch (error: any) {
                // If the error is a request cancellation (e.g. from rapid typing), do not trigger offline fallback.
                if (axios.isCancel(error)) {
                    throw error;
                }
                
                // Do not fallback to offline cache if the user is explicitly unauthorized/forbidden
                if (error.response?.status === 401 || error.response?.status === 403) {
                    throw error;
                }

                // Offline fallback
                console.warn("Offline: Fetching Work Orders from local storage", error);
                const localData = await db.workOrders.toArray();
                let mappedLocalData = localData.map(mapWorkOrder);

                // Apply search filter offline (same logic as backend search)
                if (params?.search) {
                    const searchLower = params.search.toLowerCase();
                    const cleanSearch = params.search.trim();
                    const matchNumber = cleanSearch.replace(/^(WO|wo|#|-)+/, '');

                    mappedLocalData = mappedLocalData.filter(wo => {
                        const matchesTitle = wo.title?.toLowerCase().includes(searchLower);
                        const matchesDesc = wo.description?.toLowerCase().includes(searchLower);
                        const matchesCategory = wo.category?.toLowerCase().includes(searchLower);
                        const matchesAsset = wo.assetName?.toLowerCase().includes(searchLower);
                        const matchesLocation = wo.locationName?.toLowerCase().includes(searchLower);
                        const matchesAssignee = wo.assignee?.toLowerCase().includes(searchLower);
                        
                        let matchesNumber = false;
                        if (matchNumber && !isNaN(Number(matchNumber))) {
                            matchesNumber = String(wo.woNumber) === matchNumber;
                        }

                        return matchesTitle || matchesDesc || matchesCategory || matchesAsset || matchesLocation || matchesAssignee || matchesNumber;
                    });
                }

                // Apply status filter offline
                if (params?.status) {
                    const statuses = params.status.split(',').map(s => {
                        if (s === 'OPEN') return 'Open';
                        if (s === 'IN_PROGRESS') return 'In Progress';
                        if (s === 'ON_HOLD') return 'On Hold';
                        if (s === 'COMPLETED') return 'Complete';
                        if (s === 'PENDING_APPROVAL') return 'PENDING_APPROVAL';
                        return s;
                    });
                    mappedLocalData = mappedLocalData.filter(wo => statuses.includes(wo.status));
                }

                // Apply priority filter offline
                if (params?.priority) {
                    const priorities = params.priority.split(',').map(p => p.toLowerCase());
                    mappedLocalData = mappedLocalData.filter(wo => wo.priority && priorities.includes(wo.priority.toLowerCase()));
                }

                // Apply asset filter offline
                if (params?.assetId) {
                    const assetIds = params.assetId.split(',');
                    mappedLocalData = mappedLocalData.filter(wo => wo.assetId && assetIds.includes(wo.assetId));
                }

                // Apply location filter offline
                if (params?.locationId) {
                    const locationIds = params.locationId.split(',');
                    mappedLocalData = mappedLocalData.filter(wo => wo.locationId && locationIds.includes(wo.locationId));
                }

                // Apply assigned worker filter offline
                if (params?.assignedToId) {
                    const ids = params.assignedToId.split(',');
                    mappedLocalData = mappedLocalData.filter(wo => {
                        if (ids.includes('unassigned') && !wo.assignedToId) return true;
                        return wo.assignedToId && ids.includes(wo.assignedToId);
                    });
                }

                // Apply bookmarked only filter offline
                if (params?.isBookmarked) {
                    mappedLocalData = mappedLocalData.filter(wo => !!wo.isBookmarked);
                }

                // Apply repeating only filter offline
                if (params?.isRepeating) {
                    mappedLocalData = mappedLocalData.filter(wo => !!wo.isRepeating);
                }

                // Apply date range filter offline
                if (params?.dueDateStart || params?.dueDateEnd) {
                    mappedLocalData = mappedLocalData.filter(wo => {
                        if (!wo.dueDate) return false;
                        const date = new Date(wo.dueDate);
                        if (params.dueDateStart) {
                            if (date < new Date(params.dueDateStart)) return false;
                        }
                        if (params.dueDateEnd) {
                            if (date > new Date(params.dueDateEnd)) return false;
                        }
                        return true;
                    });
                }

                // Apply assignedTeamId filter offline
                if (params?.assignedTeamId) {
                    mappedLocalData = mappedLocalData.filter(wo => wo.assignedTeamId === params.assignedTeamId);
                }

                // Apply isScheduled filter offline
                if (params?.isScheduled === 'true') {
                    mappedLocalData = mappedLocalData.filter(wo => !!wo.startDate && !!wo.assignedToId);
                } else if (params?.isScheduled === 'false') {
                    mappedLocalData = mappedLocalData.filter(wo => !wo.startDate || !wo.assignedToId);
                }

                // Apply startDate range filter offline (for timeline view)
                if (params?.startDateStart || params?.startDateEnd) {
                    mappedLocalData = mappedLocalData.filter(wo => {
                        if (!wo.startDate) return false;
                        const date = new Date(wo.startDate);
                        if (params.startDateStart && date < new Date(params.startDateStart)) return false;
                        if (params.startDateEnd && date > new Date(params.startDateEnd)) return false;
                        return true;
                    });
                }

                // Apply category filter offline
                if (params?.category) {
                    const cat = params.category.toLowerCase();
                    mappedLocalData = mappedLocalData.filter(wo => wo.category?.toLowerCase() === cat);
                }

                // Apply sorting offline
                if (params?.sortBy) {
                    const field = params.sortBy;
                    const isDesc = params.sortOrder !== 'asc';
                    mappedLocalData.sort((a: any, b: any) => {
                        let valA = a[field];
                        let valB = b[field];

                        if (field === 'woNumber') {
                            valA = Number(valA) || 0;
                            valB = Number(valB) || 0;
                        }

                        if (valA === undefined || valA === null) return isDesc ? 1 : -1;
                        if (valB === undefined || valB === null) return isDesc ? -1 : 1;

                        if (valA < valB) return isDesc ? 1 : -1;
                        if (valA > valB) return isDesc ? -1 : 1;
                        return 0;
                    });
                }

                return { items: mappedLocalData };
            }
        },
    });

    const workOrders = data?.items || [];
    const meta = data?.meta;

    // 2. UPDATE: Optimistic local update + queue for sync
    const updateStatus = useMutation({
        mutationFn: async ({ id, status, resolutionNotes, rcaCode, onHoldReason }: { id: string; status: string; resolutionNotes?: string; rcaCode?: string; onHoldReason?: string }) => {
            const updates: any = { status };
            if (resolutionNotes) updates.resolutionNotes = resolutionNotes;
            if (rcaCode) updates.rcaCode = rcaCode;
            if (onHoldReason) updates.onHoldReason = onHoldReason;

            await db.workOrders.update(id, { ...updates, isDirty: 1 });
            try {
                const response = await api.patch(`/work-orders/${id}`, updates);
                await db.workOrders.update(id, { isDirty: 0 });
                return response.data;
            } catch (error: any) {
                if (error.response) {
                    throw error;
                }
                console.log("Offline: Update saved locally and queued for sync.");
                return { id, ...updates, offline: true };
            }
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['work-orders'] });
            // Optimistically update the cache for instant UI feedback
            queryClient.setQueriesData({ queryKey: ['work-orders'] }, (oldData: any) => {
                if (!oldData) return oldData;
                if (oldData.items) {
                    return {
                        ...oldData,
                        items: oldData.items.map((wo: any) => wo.id === variables.id ? { ...wo, status: variables.status } : wo)
                    };
                }
                if (oldData.id === variables.id) return { ...oldData, status: variables.status };
                return oldData;
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to update status';
            toast.error(message);
        }
    });

    // 3. CREATE: Optimistic local add + queue for sync
    const createWorkOrder = useMutation({
        mutationFn: async (newWo: any) => {
            const id = crypto.randomUUID();
            const tempWo = {
                ...newWo,
                id,
                woNumber: 'PENDING',
                status: 'OPEN',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDirty: 1,
                isNew: 1
            };

            await db.workOrders.add(tempWo);

            try {
                const response = await api.post('/work-orders', newWo);
                const serverWo = response.data;
                const mappedWo = mapWorkOrder(serverWo);

                await db.workOrders.delete(id);
                await db.workOrders.put({
                    ...mappedWo,
                    isDirty: 0,
                    isNew: 0
                });
                return mappedWo;
            } catch (error: any) {
                // If it's a handled server error (like 400), don't go offline. Throw it.
                if (error.response) {
                    throw error;
                }
                console.log("Offline: Work Order created locally and queued for sync.");
                return tempWo;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        },
    });

    // 4. ASSIGN & SCHEDULE: Update worker and date
    const updateAssignment = useMutation({
        mutationFn: async ({ id, assigneeId, startDate }: { id: string; assigneeId?: string | null; startDate?: string | null }) => {
            const updates: any = {};
            if (assigneeId !== undefined) updates.assignedToId = assigneeId;
            if (startDate !== undefined) updates.startDate = startDate;

            await db.workOrders.update(id, { ...updates, isDirty: 1 });
            try {
                const response = await api.patch(`/work-orders/${id}`, updates);
                await db.workOrders.update(id, { isDirty: 0 });
                return response.data;
            } catch {
                console.log("Offline: Assignment saved locally.");
                return { id, ...updates, offline: true };
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        },
    });

    const completeLOTO = useMutation({
        mutationFn: async ({ workOrderId, data }: { workOrderId: string; data: any }) => {
            const updates = { 
                lotoAudit: data,
                lotoVerified: true 
            };
            
            await db.workOrders.update(workOrderId, { ...updates, isDirty: 1 });
            try {
                await api.post(`/work-orders/${workOrderId}/loto`, data);
                await db.workOrders.update(workOrderId, { isDirty: 0 });
            } catch {
                console.log("Offline: LOTO Audit saved locally.");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        },
    });

    const startTimer = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/work-orders/${id}/timer/start`);
            return response.data;
        },
        onSuccess: async (_, id) => {
            // Await the specific WO query invalidation to ensure UI doesn't re-enable before data is fresh
            await queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            toast.success('Timer started');
        },
        onError: () => {
            toast.error('Failed to start timer');
        }
    });

    const pauseTimer = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/work-orders/${id}/timer/pause`);
            return response.data;
        },
        onSuccess: async (_, id) => {
            await queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            toast.success('Timer paused');
        },
        onError: () => {
            toast.error('Failed to pause timer');
        }
    });

    const addTimeLog = useMutation({
        mutationFn: async ({ workOrderId, data }: { workOrderId: string; data: any }) => {
            const response = await api.post(`/work-orders/${workOrderId}/time-logs`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            toast.success('Labor hours logged successfully');
        },
    });

    const addExpense = useMutation({
        mutationFn: async ({ workOrderId, data }: { workOrderId: string; data: any }) => {
            const response = await api.post(`/work-orders/${workOrderId}/expenses`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            toast.success('Additional cost logged successfully');
        },
    });

    const approveWorkOrder = useMutation({
        mutationFn: async ({ workOrderId, status, notes }: { workOrderId: string; status: 'APPROVED' | 'REJECTED'; notes?: string }) => {
            const response = await api.post(`/work-orders/${workOrderId}/approve`, { status, notes });
            return response.data;
        },
        onMutate: async ({ workOrderId, status }) => {
            const newStatus = status === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS';
            await queryClient.cancelQueries({ queryKey: ['work-orders'] });
            queryClient.setQueriesData({ queryKey: ['work-orders'] }, (oldData: any) => {
                if (!oldData) return oldData;
                if (oldData.items) {
                    return {
                        ...oldData,
                        items: oldData.items.map((wo: any) => wo.id === workOrderId ? { ...wo, status: newStatus } : wo)
                    };
                }
                if (oldData.id === workOrderId) return { ...oldData, status: newStatus };
                return oldData;
            });
        },
        onSuccess: (_, { workOrderId }) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', workOrderId] });
            toast.success('Approval status updated successfully');
        },
        onError: () => {
            toast.error('Failed to update approval status');
        }
    });

    const reviewWorkOrder = useMutation({
        mutationFn: async ({ workOrderId, status, notes }: { workOrderId: string; status: 'CLOSED' | 'IN_PROGRESS'; notes?: string }) => {
            const response = await api.post(`/work-orders/${workOrderId}/review`, { status, notes });
            return response.data;
        },
        onMutate: async ({ workOrderId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['work-orders'] });
            queryClient.setQueriesData({ queryKey: ['work-orders'] }, (oldData: any) => {
                if (!oldData) return oldData;
                if (oldData.items) {
                    return {
                        ...oldData,
                        items: oldData.items.map((wo: any) => wo.id === workOrderId ? { ...wo, status } : wo)
                    };
                }
                if (oldData.id === workOrderId) return { ...oldData, status };
                return oldData;
            });
        },
        onSuccess: (_, { workOrderId, status }) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', workOrderId] });
            if (status === 'CLOSED') {
                toast.success('Work order successfully reviewed and closed');
            } else {
                toast.success('Work order returned to technician');
            }
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to review work order';
            toast.error(message);
        }
    });

    const consumePart = useMutation({
        mutationFn: async ({ workOrderId, partId, quantity }: { workOrderId: string; partId: string; quantity: number }) => {
            const response = await api.post(`/work-orders/${workOrderId}/parts`, { partId, quantity });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['parts'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        }
    });

    const consumeParts = useMutation({
        mutationFn: async ({ workOrderId, parts }: { workOrderId: string; parts: { partId: string; quantity: number }[] }) => {
            const response = await api.post(`/work-orders/${workOrderId}/batch-parts`, { parts });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['parts'] });
        },
    });

    const addComment = useMutation({
        mutationFn: async ({ workOrderId, text }: { workOrderId: string; text: string }) => {
            const response = await api.post(`/work-orders/${workOrderId}/comments`, { text });
            return response.data;
        },
        onSuccess: (_, { workOrderId }) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', workOrderId] });
        }
    });

    const addChecklistResponse = useMutation({
        mutationFn: async ({ 
            workOrderId, 
            checklistItemId, 
            passed, 
            responseValue,
            notes,
            photoUrl,
            url
        }: { 
            workOrderId: string; 
            checklistItemId: string; 
            passed: boolean; 
            responseValue: string;
            notes?: string;
            photoUrl?: string;
            url?: string;
        }) => {
            const response = await api.post(`/work-orders/${workOrderId}/checklist-responses`, { 
                checklistItemId, 
                passed, 
                responseValue,
                notes,
                photoUrl,
                url
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }
    });

    const bulkUpdate = useMutation({
        mutationFn: async (updates: { id: string; assignedToId?: string; startDate?: string }[]) => {
            const promise = api.post('/work-orders/bulk-update', updates);
            toast.promise(promise, {
                loading: 'Applying schedule changes...',
                success: 'Schedule synchronized successfully!',
                error: 'Bulk update failed.'
            });
            const response = await promise;
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }
    });

    const bulkUnassign = useMutation({
        mutationFn: async (workOrderIds: string[]) => {
            const promise = api.post('/work-orders/bulk-unassign', { workOrderIds });
            toast.promise(promise, {
                loading: 'Removing assignments...',
                success: 'Assignments removed successfully!',
                error: 'Failed to remove assignments.'
            });
            const response = await promise;
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }
    });

    const smartSchedule = useMutation({
        mutationFn: async (payload: string | {
            date?: string;
            startDate?: string;
            endDate?: string;
            shiftId?: string;
            technicianIds?: string[];
            workOrderIds?: string[];
        }) => {
            const body = typeof payload === 'string' ? { date: payload } : payload;
            const promise = api.post('/work-orders/smart-schedule', body);
            toast.promise(promise, {
                loading: 'Optimizing workload distribution...',
                success: (res: any) => {
                    const count = res.data?.length || 0;
                    return count > 0 
                        ? `Optimized ${count} assignments successfully!` 
                        : 'Schedule is already optimized.';
                },
                error: 'Optimization failed.'
            });
            const response = await promise;
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }
    });

    const uploadFile = useMutation({
        mutationFn: async ({ id, file }: { id: string; file: File }) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await api.post(`/work-orders/${id}/files`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return response.data;
            } catch (error) {
                console.warn("Offline: Staging file for later sync");
                
                // Save to IndexedDB mediaQueue
                await db.mediaQueue.add({
                    id: crypto.randomUUID(),
                    workOrderId: id,
                    file: file, // File is a Blob, Dexie handles it
                    fileName: file.name,
                    fileType: file.type,
                    timestamp: Date.now()
                });

                toast.success('Offline: Photo saved and queued for sync');
                return { offline: true };
            }
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
        }
    });

    const removeFile = useMutation({
        mutationFn: async ({ id, fileId }: { id: string; fileId: string }) => {
            await api.delete(`/work-orders/${id}/files/${fileId}`);
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
        }
    });

    const share = useMutation({
        mutationFn: async (id: string) => {
            return api.post(`/work-orders/${id}/share`);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
        }
    });

    const deferWorkOrder = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.post(`/work-orders/${id}/defer`, data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
            toast.success('Work order deferred');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to defer work order');
        }
    });

    const resumeWorkOrder = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/work-orders/${id}/resume`);
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
            toast.success('Work order resumed');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to resume work order');
        }
    });

    const unshare = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/work-orders/${id}/share`);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
        }
    });

    const addLink = useMutation({
        mutationFn: async ({ sourceId, targetId, type }: { sourceId: string; targetId: string; type: string }) => {
            return api.post(`/work-orders/${sourceId}/links`, { targetId, type });
        },
        onSuccess: (_, { sourceId, targetId }) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', sourceId] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', targetId] });
        }
    });

    const removeLink = useMutation({
        mutationFn: async (linkId: string) => {
            return api.delete(`/work-orders/links/${linkId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }
    });
    
    // 5. BOOKMARK: Persistent toggle
    const toggleBookmark = useMutation({
        mutationFn: async ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) => {
            const response = await api.patch(`/work-orders/${id}`, { isBookmarked });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }
    });

    // 6. GENERIC UPDATE: For Edit Modal
    const updateWorkOrder = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/work-orders/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders', null] }); // Clear details cache
        }
    });

    return {
        workOrders,
        meta,
        isLoading,
        updateStatus,
        createWorkOrder,
        updateWorkOrder,
        updateAssignment,
        completeLOTO,
        addTimeLog,
        startTimer,
        pauseTimer,
        addExpense,
        approveWorkOrder,
        reviewWorkOrder,
        consumePart,
        consumeParts,
        addComment,
        addChecklistResponse,
        bulkUpdate,
        bulkUnassign,
        smartSchedule,
        uploadFile,
        removeFile,
        share,
        unshare,
        addLink,
        removeLink,
        toggleBookmark,
        deferWorkOrder,
        resumeWorkOrder,
        refetchWorkOrders: refetch
    };
};

export const useWorkOrderDetail = (id: string | null) => {

    return useQuery({
        queryKey: ['work-orders', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await api.get(`/work-orders/${id}`);
            const data = response.data;
            const mapped = mapWorkOrder(data);
            // Sync to local DB
            await db.workOrders.put(mapped);
            return mapped as WorkOrderSync;
        },
        enabled: !!id
    });
};

export const usePublicWorkOrder = (token?: string) => {
    return useQuery({
        queryKey: ['public-work-order', token],
        queryFn: async () => {
            if (!token) return null;
            const response = await api.get(`/work-orders/public/${token}`);
            return response.data;
        },
        enabled: !!token,
        retry: false
    });
};

export const useSharedWorkOrders = () => {
    return useQuery<WorkOrderSync[]>({
        queryKey: ['shared-work-orders'],
        queryFn: async () => {
            const response = await api.get('/work-orders?isShared=true');
            const items = response.data.items || [];
            // We don't map these strictly for now as they are public views, but keeping it consistent
            return items;
        }
    });
};

export const useInfiniteWorkOrders = (params?: { 
    limit?: number; 
    search?: string; 
    status?: string; 
    priority?: string;
    assetId?: string;
    locationId?: string;
    assignedToId?: string;
    assignedTeamId?: string;
    isBookmarked?: boolean;
    isRepeating?: boolean;
    pmScheduleId?: string;
    sortBy?: string;
    sortOrder?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
    isScheduled?: string;
    startDateStart?: string;
    startDateEnd?: string;
    category?: string;
}) => {
    return useInfiniteQuery({
        queryKey: ['infinite-work-orders', params],
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1 }) => {
            const response = await api.get('/work-orders', { 
                params: { ...params, page: pageParam, limit: params?.limit || 20 } 
            });
            // Map the data using mapWorkOrder
            if (response.data && Array.isArray(response.data.items)) {
                response.data.items = response.data.items.map(mapWorkOrder);
            }
            return response.data; // { items: [...], meta: { ... } }
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.meta?.page < lastPage.meta?.totalPages) {
                return lastPage.meta.page + 1;
            }
            return undefined;
        }
    });
};
