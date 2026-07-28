import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface User {
    id: string; // userId from the user object
    userOrgId: string;
    organizationId: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roleName?: string;
    assignedLocationIds?: string[];
    teams?: { teamId: string }[];
    activeWoCount?: number;
    compliance?: number;
}

export const useUsers = () => {
    return useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data;
        },
    });
};
