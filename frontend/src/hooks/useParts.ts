import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Part {
    id: string;
    name: string;
    description: string;
    partNumber: string;
    barcode: string;
    quantity: number;
    minQuantity: number;
    maxQuantity?: number;
    cost: number;
    status: string;
    binLocation?: string;
    location?: { id: string, name: string };
}

export const useParts = (search?: string) => {
    return useQuery<Part[]>({
        queryKey: ['parts', search],
        queryFn: async () => {
            const params = search ? { name: search } : {};
            const response = await api.get('/parts', { params });
            const data = response.data;
            return Array.isArray(data) ? data : data.items || [];
        }
    });
};

export const useUpdatePart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/parts/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts'] });
        },
    });
};

export const useDeletePart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/parts/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts'] });
        },
    });
};
