import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Permission {
    id: string;
    key: string;
    name: string;
    description?: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    isSystem: boolean;
    permissions: Permission[];
    organizationId?: string;
}

export const useRoles = () => {
    const queryClient = useQueryClient();

    const rolesQuery = useQuery<Role[]>({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await api.get('/roles');
            return response.data;
        },
    });

    const permissionsQuery = useQuery<Permission[]>({
        queryKey: ['permissions'],
        queryFn: async () => {
            const response = await api.get('/roles/permissions');
            return response.data;
        },
    });

    const createRole = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/roles', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });

    const updateRole = useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const response = await api.patch(`/roles/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });

    const deleteRole = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/roles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });

    return {
        roles: rolesQuery.data || [],
        isLoadingRoles: rolesQuery.isLoading,
        permissions: permissionsQuery.data || [],
        isLoadingPermissions: permissionsQuery.isLoading,
        createRole,
        updateRole,
        deleteRole,
    };
};
