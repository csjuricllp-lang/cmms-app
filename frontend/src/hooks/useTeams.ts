import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Team {
    id: string;
    name: string;
    description?: string;
}

export const useTeams = () => {
    return useQuery<Team[]>({
        queryKey: ['teams'],
        queryFn: async () => {
            const response = await api.get('/teams');
            return response.data;
        },
    });
};
