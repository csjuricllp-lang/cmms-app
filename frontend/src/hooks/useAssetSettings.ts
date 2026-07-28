import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

export interface AssetField {
    id: string;
    label: string;
    type: string;
    options: string[];
    precision?: number;
    createdAt: string;
}

export interface AssetSchedule {
    id: string;
    name: string;
    config: any;
    createdAt: string;
}

export const useAssetSettings = (entityType: string = 'ASSET') => {
    const queryClient = useQueryClient();

    const fields = useQuery<AssetField[]>({
        queryKey: ['asset-fields', entityType],
        queryFn: async () => {
            const response = await api.get('/asset-fields', { params: { entityType } });
            return response.data;
        },
    });

    const schedules = useQuery<AssetSchedule[]>({
        queryKey: ['asset-schedules'],
        queryFn: async () => {
            const response = await api.get('/asset-schedules');
            return response.data;
        },
    });

    const createField = useMutation({
        mutationFn: async (data: Partial<AssetField> & { entityType?: string }) => {
            const response = await api.post('/asset-fields', { ...data, entityType: data.entityType || entityType });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asset-fields', entityType] });
            toast.success('Field created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create field');
        },
    });

    const deleteField = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/asset-fields/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asset-fields', entityType] });
            toast.success('Field deleted successfully');
        },
    });

    const createSchedule = useMutation({
        mutationFn: async (data: Partial<AssetSchedule>) => {
            const response = await api.post('/asset-schedules', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asset-schedules'] });
            toast.success('Schedule created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create schedule');
        },
    });

    const deleteSchedule = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/asset-schedules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asset-schedules'] });
            toast.success('Schedule deleted successfully');
        },
    });

    const settingsQuery = useQuery<any[]>({
        queryKey: ['asset-settings', entityType],
        queryFn: async () => {
            const response = await api.get('/settings');
            const data = Array.isArray(response.data) ? response.data : [];
            const prefix = entityType.toLowerCase() === 'part' ? 'parts.' : 'asset.';
            return data.filter((s: any) => s.key.startsWith(prefix));
        },
        initialData: [],
    });

    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            return await api.post('/settings', { key, value });
        },
        onMutate: async (newSetting) => {
            await queryClient.cancelQueries({ queryKey: ['asset-settings', entityType] });
            const previousSettings = queryClient.getQueryData(['asset-settings', entityType]);
            queryClient.setQueryData(['asset-settings', entityType], (old: any[] = []) => {
                const index = old.findIndex(s => s.key === newSetting.key);
                if (index > -1) {
                    const updated = [...old];
                    updated[index] = { ...updated[index], value: newSetting.value };
                    return updated;
                }
                return [...old, newSetting];
            });
            return { previousSettings };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asset-settings', entityType] });
        },
        onError: (_, __, context: any) => {
            queryClient.setQueryData(['asset-settings', entityType], context.previousSettings);
            toast.error('Failed to update setting');
        },
    });

    return {
        fields,
        schedules,
        settings: settingsQuery,
        updateSetting,
        createField,
        deleteField,
        createSchedule,
        deleteSchedule,
    };
};
