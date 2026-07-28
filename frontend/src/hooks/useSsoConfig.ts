import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SsoConfig {
    id: string;
    organizationId: string;
    provider: string;
    isEnabled: boolean;
    entryPoint: string;
    issuer: string;
    cert: string;
    attributeMapping: {
        email?: string;
        firstName?: string;
        lastName?: string;
    };
}

export const useSsoConfig = () => {
    const queryClient = useQueryClient();

    const config = useQuery<SsoConfig | null>({
        queryKey: ['sso-config'],
        queryFn: async () => {
            try {
                const response = await api.get('/sso/config');
                return response.data;
            } catch (err: any) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        }
    });

    const saveConfig = useMutation({
        mutationFn: async (data: Partial<SsoConfig>) => {
            const response = await api.post('/sso/config', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sso-config'] });
        }
    });

    const deleteConfig = useMutation({
        mutationFn: async () => {
            const response = await api.delete('/sso/config');
            return response.data;
        },
        onSuccess: () => {
            queryClient.setQueryData(['sso-config'], null);
        }
    });

    return {
        config,
        saveConfig,
        deleteConfig
    };
};
