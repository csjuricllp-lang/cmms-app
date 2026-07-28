import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

export interface Category {
    id: string;
    name: string;
    color: string;
    type: 'ASSET' | 'WORK_ORDER' | 'PART' | 'INVENTORY';
}

export interface CustomStatus {
    id: string;
    label: string;
    color: string;
    systemStatus: string;
}

export const useWorkOrderSettings = () => {
    const queryClient = useQueryClient();

    // Settings (wo.*)
    const settings = useQuery<any[]>({
        queryKey: ['wo-settings'],
        queryFn: async () => {
            const response = await api.get('/settings');
            const data = Array.isArray(response.data) ? response.data : [];
            return data.filter((s: any) => s.key.startsWith('wo.'));
        },
    });

    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            return await api.post('/settings', { key, value });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-settings'] });
        },
    });

    // Categories
    const categories = useQuery<Category[]>({
        queryKey: ['wo-categories'],
        queryFn: async () => {
            const response = await api.get('/categories', { params: { type: 'WORK_ORDER' } });
            return response.data;
        },
    });

    const createCategory = useMutation({
        mutationFn: async (data: Partial<Category>) => {
            return await api.post('/categories', { ...data, type: 'WORK_ORDER' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-categories'] });
            toast.success('Category created');
        },
    });

    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-categories'] });
            toast.success('Category deleted');
        },
    });

    const updateCategory = useMutation({
        mutationFn: async ({ id, name, color }: { id: string; name?: string; color?: string }) => {
            return await api.patch(`/categories/${id}`, { name, color });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-categories'] });
            toast.success('Category updated');
        },
        onError: () => {
            toast.error('Failed to update category');
        },
    });

    // Custom Statuses
    const statuses = useQuery<CustomStatus[]>({
        queryKey: ['wo-statuses'],
        queryFn: async () => {
            const response = await api.get('/custom-statuses');
            return response.data;
        },
    });

    const createStatus = useMutation({
        mutationFn: async (data: Partial<CustomStatus>) => {
            return await api.post('/custom-statuses', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-statuses'] });
            toast.success('Status created');
        },
    });

    const deleteStatus = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/custom-statuses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-statuses'] });
            toast.success('Status deleted');
        },
    });

    // Timers (Labor Types)
    const timers = useQuery<any[]>({
        queryKey: ['wo-timers'],
        queryFn: async () => {
            const response = await api.get('/settings');
            const data = Array.isArray(response.data) ? response.data : [];
            const timersStr = data.find((s: any) => s.key === 'wo.timer.types')?.value || '[]';
            try {
                return JSON.parse(timersStr);
            } catch (e) {
                return [];
            }
        },
    });

    const createTimer = useMutation({
        mutationFn: async (name: string) => {
            const currentTimers = timers.data || [];
            const newTimer = { 
                id: Math.random().toString(36).substr(2, 9), 
                name, 
                createdAt: new Date().toISOString() 
            };
            const updated = [...currentTimers, newTimer];
            return await api.post('/settings', { 
                key: 'wo.timer.types', 
                value: JSON.stringify(updated) 
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-timers'] });
            toast.success('Timer type created');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Access Denied: You do not have settings.manage permission');
        }
    });

    const updateTimer = useMutation({
        mutationFn: async ({ id, name }: { id: string, name: string }) => {
            const currentTimers = timers.data || [];
            const updated = currentTimers.map((t: any) => 
                t.id === id ? { ...t, name } : t
            );
            return await api.post('/settings', { 
                key: 'wo.timer.types', 
                value: JSON.stringify(updated) 
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-timers'] });
            toast.success('Timer type updated');
        },
    });

    const deleteTimer = useMutation({
        mutationFn: async (id: string) => {
            const currentTimers = timers.data || [];
            const updated = currentTimers.filter((t: any) => t.id !== id);
            return await api.post('/settings', { 
                key: 'wo.timer.types', 
                value: JSON.stringify(updated) 
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-timers'] });
            toast.success('Timer type deleted');
        },
    });

    const provisionDefaultTimers = useMutation({
        mutationFn: async () => {
            const defaultTimers = [
                { id: 't1', name: 'Other Time', createdAt: new Date().toISOString() },
                { id: 't2', name: 'Drive Time', createdAt: new Date().toISOString() },
                { id: 't3', name: 'Vendor Time', createdAt: new Date().toISOString() },
                { id: 't4', name: 'Wrench Time', createdAt: new Date().toISOString() },
                { id: 't5', name: 'Inspection Time', createdAt: new Date().toISOString() },
            ];
            return await api.post('/settings', { 
                key: 'wo.timer.types', 
                value: JSON.stringify(defaultTimers) 
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wo-timers'] });
            toast.success('Standard timers initialized');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Access Denied: Standard timers could not be provisioned');
        }
    });

    return {
        settings,
        updateSetting,
        categories,
        createCategory,
        updateCategory,
        deleteCategory,
        statuses,
        createStatus,
        deleteStatus,
        timers,
        createTimer,
        updateTimer,
        deleteTimer,
        provisionDefaultTimers
    };
};
