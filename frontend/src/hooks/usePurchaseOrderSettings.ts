import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

export interface Category {
    id: string;
    name: string;
    color: string;
    type: string;
}

export const usePurchaseOrderSettings = () => {
    const queryClient = useQueryClient();

    // Settings (po.*)
    const settings = useQuery<any[]>({
        queryKey: ['po-settings'],
        queryFn: async () => {
            const response = await api.get('/settings');
            const data = Array.isArray(response.data) ? response.data : [];
            return data.filter((s: any) => s.key.startsWith('po.'));
        },
    });

    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            return await api.post('/settings', { key, value });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['po-settings'] });
        },
    });

    // Categories (using PURCHASE_ORDER type)
    const categories = useQuery<Category[]>({
        queryKey: ['po-categories'],
        queryFn: async () => {
            const response = await api.get('/categories', { params: { type: 'PURCHASE_ORDER' } });
            return response.data;
        },
    });

    const createCategory = useMutation({
        mutationFn: async (data: Partial<Category>) => {
            return await api.post('/categories', { ...data, type: 'PURCHASE_ORDER' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['po-categories'] });
            toast.success('Category created');
        },
    });

    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['po-categories'] });
            toast.success('Category deleted');
        },
    });

    return {
        settings,
        updateSetting,
        categories,
        createCategory,
        deleteCategory
    };
};
