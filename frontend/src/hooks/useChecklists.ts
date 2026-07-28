import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Checklist {
    id: string;
    title: string;
    description?: string;
}

export const useChecklists = () => {
    return useQuery<Checklist[]>({
        queryKey: ['checklists'],
        queryFn: async () => {
            const response = await api.get('/checklists');
            return response.data;
        },
    });
};
