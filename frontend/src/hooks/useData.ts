import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { db } from '../lib/db';
import toast from 'react-hot-toast';
import type { Location, Asset, Team, User, Vendor, Customer, Checklist, PurchaseOrder, Part, Category, PMSchedule, Meter, MeterReading, AuditLog, Request } from '../types';

export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/analytics/dashboard', {
                params: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            });
            return response.data;
        },
        refetchInterval: 30000,
    });
};

export const useAuditLogs = () => {
    return useQuery<AuditLog[]>({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const response = await api.get('/audit-logs');
            return response.data;
        },
        refetchInterval: 15000,
    });
};

export const useEntityAuditLogs = (model: string, id: string | undefined) => {
    return useQuery<AuditLog[]>({
        queryKey: ['entity-audit-logs', model, id],
        queryFn: async () => {
            if (!id) return [];
            const response = await api.get(`/audit-logs/entity`, {
                params: { model, id }
            });
            return response.data;
        },
        enabled: !!id
    });
};

export const useRequests = (params?: { 
    search?: string,
    status?: string,
    assetId?: string,
    assigneeId?: string,
    locationId?: string,
    sortBy?: string,
    sortOrder?: string,
    limit?: number
}) => {
    return useQuery<Request[]>({
        queryKey: ['requests', params],
        queryFn: async () => {
            const response = await api.get('/requests', { params });
            return response.data;
        }
    });
};

export const useRequestSettings = () => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ['request-settings'],
        queryFn: async () => {
            const response = await api.get('/requests/settings');
            return response.data;
        }
    });

    const updateSettings = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.patch('/requests/settings', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['request-settings'] });
        }
    });

    return {
        ...query,
        updateSettings
    };
};

export const useTags = () => {
    const queryClient = useQueryClient();
    const query = useQuery<any[]>({
        queryKey: ['org-tags'],
        queryFn: async () => {
            const response = await api.get('/tags');
            return response.data;
        }
    });

    const createTag = useMutation({
        mutationFn: async (data: { name: string, model: string }) => {
            return await api.post('/tags', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['org-tags'] });
        }
    });

    const updateTag = useMutation({
        mutationFn: async ({ id, name, model }: { id: string, name: string, model: string }) => {
            return await api.post(`/tags/${id}`, { name, model }); 
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['org-tags'] });
        }
    });

    const deleteTag = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/tags/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['org-tags'] });
        }
    });

    return {
        ...query,
        tags: query.data,
        createTag,
        updateTag,
        deleteTag
    };
};

export const useWebhooks = () => {
    const queryClient = useQueryClient();
    const query = useQuery<any[]>({
        queryKey: ['webhooks'],
        queryFn: async () => {
            const response = await api.get('/webhooks');
            return response.data;
        }
    });

    const createWebhook = useMutation({
        mutationFn: async (data: any) => {
            return await api.post('/webhooks', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        }
    });

    const deleteWebhook = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/webhooks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        }
    });

    const createMultipleWebhooks = useMutation({
        mutationFn: async (webhookData: { title: string, url: string, selectedEvents: string[], isActive: boolean }) => {
            const promises = webhookData.selectedEvents.map(event => 
                api.post('/webhooks', {
                    name: webhookData.title,
                    url: webhookData.url,
                    event,
                    isActive: webhookData.isActive
                })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        }
    });

    return {
        ...query,
        webhooks: query.data,
        createWebhook,
        deleteWebhook,
        createMultipleWebhooks
    };
};

export const useCategoriesByType = (type: string) => {
    const queryClient = useQueryClient();
    const query = useQuery<any[]>({
        queryKey: ['categories', type],
        queryFn: async () => {
            const response = await api.get('/categories', { params: { type } });
            return response.data;
        }
    });

    const createCategory = useMutation({
        mutationFn: async (name: string) => {
            return await api.post('/categories', { name, type });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories', type] });
        }
    });

    const updateCategory = useMutation({
        mutationFn: async ({ id, name }: { id: string, name: string }) => {
            return await api.patch(`/categories/${id}`, { name }); 
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories', type] });
        }
    });

    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories', type] });
        }
    });

    return {
        ...query,
        categories: query.data,
        createCategory,
        updateCategory,
        deleteCategory
    };
};

export const useAnalytics = (params?: any) => {
    const tzParams = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...params
    };
    return useQuery({
        queryKey: ['analytics-dashboard', tzParams],
        queryFn: async () => {
            const response = await api.get('/analytics/dashboard', {
                params: tzParams,
                paramsSerializer: (p: any) => {
                    const searchParams = new URLSearchParams();
                    Object.entries(p).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            // Send arrays as repeated keys: locations=a&locations=b
                            value.forEach((v: any) => {
                                if (v !== undefined && v !== null && v !== '') {
                                    searchParams.append(key, String(v));
                                }
                            });
                        } else if (value !== undefined && value !== null && value !== '') {
                            searchParams.append(key, String(value));
                        }
                    });
                    return searchParams.toString();
                }
            });
            return response.data.data;
        }
    });
};

export const useLocations = (params?: { 
    search?: string, 
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    workerIds?: string[],
    teamIds?: string[],
    statuses?: string[],
    priorities?: string[],
    types?: string[],
    customerId?: string,
    vendorIds?: string[]
}) => {
    return useQuery<Location[]>({
        queryKey: ['locations', params],
        queryFn: async () => {
            const response = await api.get('/locations', { 
                params,
                paramsSerializer: (p) => {
                    // Custom serializer to handle array params in query string (workerIds[]=1&workerIds[]=2)
                    const searchParams = new URLSearchParams();
                    Object.entries(p).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            value.forEach(v => searchParams.append(`${key}[]`, v));
                        } else if (value !== undefined && value !== null) {
                            searchParams.append(key, value as string);
                        }
                    });
                    return searchParams.toString();
                }
            });
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });
};

export const useLocationDetail = (id: string | undefined) => {
    return useQuery<Location>({
        queryKey: ['location', id],
        queryFn: async () => {
            if (!id) throw new Error('ID is required');
            const response = await api.get(`/locations/${id}`);
            return response.data;
        },
        enabled: !!id
    });
};

export const useAssets = () => {
    return useQuery<Asset[]>({
        queryKey: ['assets'],
        queryFn: async () => {
            const response = await api.get('/assets');
            // Support both direct array and paginated response { items, meta }
            return Array.isArray(response.data) ? response.data : response.data.items;
        }
    });
};

export const useTeams = () => {
    return useQuery<Team[]>({
        queryKey: ['teams'],
        queryFn: async () => {
            const response = await api.get('/teams');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });
};

export const useUsers = (params?: { status?: 'all' | 'active' | 'inactive' }) => {
    return useQuery<User[]>({
        queryKey: ['users', params],
        queryFn: async () => {
            const queryParams: Record<string, any> = {};
            if (params?.status && params.status !== 'all') {
                queryParams.status = params.status;
            }
            // By default, if no params provided, we only want active
            if (!params) {
                queryParams.status = 'active';
            }
            
            const response = await api.get('/users', { params: queryParams });
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });
};


export const useVendors = () => {
    return useQuery<Vendor[]>({
        queryKey: ['vendors'],
        queryFn: async () => {
            const response = await api.get('/vendors');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });
};


export const useCustomers = () => {
    return useQuery<Customer[]>({
        queryKey: ['customers'],
        queryFn: async () => {
            const response = await api.get('/customers');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });
};

export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/purchase-orders', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['parts'] }); // Because PO might restock
        }
    });
};

export const useCreateLocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newLocation: Partial<Location>) => {
            const response = await api.post('/locations', newLocation);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        }
    });
};

export const useUpdateLocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Location> }) => {
            const response = await api.patch(`/locations/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        }
    });
};

export const useDeleteLocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/locations/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        }
    });
};


export const useChecklists = () => {
    return useQuery<Checklist[]>({
        queryKey: ['checklists'],
        queryFn: async () => {
            const response = await api.get('/checklists');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });
};


export const usePurchaseOrders = (params?: { search?: string; tags?: string; status?: string }) => {
    return useQuery<PurchaseOrder[]>({
        queryKey: ['purchase-orders', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params?.search) queryParams.append('search', params.search);
            if (params?.tags) queryParams.append('tags', params.tags);
            if (params?.status) queryParams.append('status', params.status);
            const response = await api.get(`/purchase-orders?${queryParams.toString()}`);
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });
};

export const useLinkPoToWorkOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ poId, workOrderId }: { poId: string; workOrderId: string }) => {
            const response = await api.patch(`/purchase-orders/${poId}`, { workOrderId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }
    });
};

export const useParts = (params?: { 
    search?: string, 
    status?: string, 
    locationId?: string, 
    categoryId?: string,
    sortBy?: string, 
    sortOrder?: string,
    limit?: number 
}) => {
    return useQuery<Part[]>({
        queryKey: ['parts', params],
        queryFn: async () => {
            const response = await api.get('/parts', { params });
            const data = response.data;
            return Array.isArray(data) ? data : data.items || [];
        }
    });
};

export const useCategories = (type?: 'ASSET' | 'WORK_ORDER' | 'PART' | 'INVENTORY') => {
    return useQuery<Category[]>({
        queryKey: ['categories', type],
        queryFn: async () => {
            const response = await api.get('/categories');
            const categories = Array.isArray(response.data) ? response.data : response.data.items || [];
            if (type) {
                return categories.filter((c: Category) => c.type === type);
            }
            return categories;
        }
    });
};

export const usePreventiveMaintenance = () => {
    const queryClient = useQueryClient();

    const { data: schedules, isLoading } = useQuery<PMSchedule[]>({
        queryKey: ['pm-schedules'],
        queryFn: async () => {
            const response = await api.get('/preventive-maintenance');
            return response.data;
        },
    });

    const createPM = useMutation({
        mutationFn: async (data: Partial<PMSchedule>) => {
            const response = await api.post('/preventive-maintenance', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
        },
    });

    const updatePM = useMutation({
        mutationFn: async ({ id, ...data }: Partial<PMSchedule> & { id: string }) => {
            const response = await api.patch(`/preventive-maintenance/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
        },
    });

    const deletePM = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/preventive-maintenance/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
        },
    });

    const uploadAttachment = useMutation({
        mutationFn: async ({ id, file }: { id: string; file: File }) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await api.post(`/preventive-maintenance/${id}/attachments`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                return response.data;
            } catch (error) {
                console.warn("Offline: Staging PM attachment for later sync");
                
                await db.mediaQueue.add({
                    id: crypto.randomUUID(),
                    pmScheduleId: id,
                    file: file,
                    fileName: file.name,
                    fileType: file.type,
                    timestamp: Date.now()
                });

                toast.success('Offline: PM photo saved and queued for sync');
                return { offline: true };
            }
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['pm-schedule', id] });
        },
    });

    const removeAttachment = useMutation({
        mutationFn: async ({ id, fileId }: { id: string; fileId: string }) => {
            await api.delete(`/preventive-maintenance/${id}/attachments/${fileId}`);
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['pm-schedule', id] });
        },
    });

    return {
        schedules,
        isLoading,
        createPM,
        updatePM,
        deletePM,
        uploadAttachment,
        removeAttachment,
    };
};

export const usePreventiveMaintenanceDetail = (id: string | undefined) => {
    return useQuery<PMSchedule>({
        queryKey: ['pm-schedule', id],
        queryFn: async () => {
            if (!id) throw new Error('ID is required');
            const response = await api.get(`/preventive-maintenance/${id}`);
            return response.data;
        },
        enabled: !!id
    });
};

export const useAssetMetrics = (id?: string) => {
    return useQuery({
        queryKey: ['asset-metrics', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await api.get(`/assets/${id}/metrics`);
            return response.data;
        },
        enabled: !!id
    });
};

export const useMeters = (params?: { assetId?: string, sortBy?: string, sortOrder?: string, search?: string }) => {
    return useQuery<Meter[]>({
        queryKey: ['meters', params],
        queryFn: async () => {
            const { data } = await api.get('/meters', { 
                params 
            });
            return data;
        },
        enabled: true
    });
};

export const useMeterReadings = (meterId?: string) => {
    return useQuery<MeterReading[]>({
        queryKey: ['meter-readings', meterId],
        queryFn: async () => {
            if (!meterId) return [];
            const { data } = await api.get(`/meters/${meterId}/readings`);
            return data;
        },
        enabled: !!meterId
    });
};

export const useAddMeterReading = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ meterId, value }: { meterId: string, value: number }) => {
            const response = await api.post(`/meters/${meterId}/readings`, { value });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meter-readings', variables.meterId] });
            queryClient.invalidateQueries({ queryKey: ['meters'] });
            toast.success('Reading added successfully');
        }
    });
};

export const useGlobalSearch = (query: string) => {
    return useQuery({
        queryKey: ['global-search', query],
        queryFn: async () => {
            const { data } = await api.get('/search', { params: { q: query, limit: 5 } });
            return data as {
                workOrders: any[];
                assets: any[];
                parts: any[];
                locations: any[];
                people: any[];
            };
        },
        enabled: query.trim().length >= 2,
        staleTime: 10_000,
        placeholderData: { workOrders: [], assets: [], parts: [], locations: [], people: [] },
    });
};


export const useSavedViews = (entityType: string) => {
    const queryClient = useQueryClient();
    const query = useQuery<any[]>({
        queryKey: ['saved-views', entityType],
        queryFn: async () => {
            const response = await api.get('/saved-views', { params: { entityType } });
            return response.data;
        }
    });


    const createView = useMutation({
        mutationFn: async (data: { name: string, entityType: string, config: any }) => {
            const response = await api.post('/saved-views', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-views', entityType] });
            toast.success('View saved successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to save view');
        }
    });

    const deleteView = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/saved-views/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-views', entityType] });
            toast.success('View deleted');
        }
    });

    return {
        ...query,
        views: query.data || [],
        createView,
        deleteView
    };
};

export const useShifts = () => {
    const queryClient = useQueryClient();
    const query = useQuery<any[]>({
        queryKey: ['shifts'],
        queryFn: async () => {
            const response = await api.get('/shifts');
            return response.data;
        }
    });

    const createShift = useMutation({
        mutationFn: async (data: { name: string, startTime: string, endTime: string, workDays: number[] }) => {
            const response = await api.post('/shifts', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        }
    });

    const updateShift = useMutation({
        mutationFn: async ({ id, ...data }: { id: string, name?: string, startTime?: string, endTime?: string, workDays?: number[] }) => {
            const response = await api.patch(`/shifts/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        }
    });

    const deleteShift = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/shifts/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        }
    });

    return {
        ...query,
        shifts: query.data || [],
        createShift,
        updateShift,
        deleteShift
    };
};

export const useApprovalChains = () => {
    const queryClient = useQueryClient();
    const query = useQuery<any[]>({
        queryKey: ['approval-chains'],
        queryFn: async () => {
            const response = await api.get('/approval-chains');
            return response.data;
        }
    });

    const createApprovalChain = useMutation({
        mutationFn: async (data: { name: string, description?: string, module: 'WORK_ORDER' | 'PURCHASE_ORDER', triggerAmount?: number, steps: { role: string, order: number }[] }) => {
            const response = await api.post('/approval-chains', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approval-chains'] });
        }
    });

    const updateApprovalChain = useMutation({
        mutationFn: async ({ id, ...data }: { id: string, name?: string, description?: string, module?: 'WORK_ORDER' | 'PURCHASE_ORDER', triggerAmount?: number, steps?: { role: string, order: number }[] }) => {
            const response = await api.patch(`/approval-chains/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approval-chains'] });
        }
    });

    const deleteApprovalChain = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/approval-chains/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approval-chains'] });
        }
    });

    return {
        ...query,
        chains: query.data || [],
        createApprovalChain,
        updateApprovalChain,
        deleteApprovalChain
    };
};

export const useApiKeys = () => {
    const queryClient = useQueryClient();
    const query = useQuery<any[]>({
        queryKey: ['api-keys'],
        queryFn: async () => {
            const response = await api.get('/api-keys');
            return response.data;
        }
    });

    const createApiKey = useMutation({
        mutationFn: async (data: { name: string, scopes: string[] }) => {
            const response = await api.post('/api-keys', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        }
    });

    const revokeApiKey = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/api-keys/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        }
    });

    return {
        ...query,
        keys: query.data || [],
        createApiKey,
        revokeApiKey
    };
};
