import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface WorkflowRule {
    id: string;
    name: string;
    description?: string;
    entity: string;
    trigger: string;
    conditions: any;
    actions: any;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const useWorkflows = () => {
    const queryClient = useQueryClient();

    const workflowsQuery = useQuery<WorkflowRule[]>({
        queryKey: ['workflows'],
        queryFn: async () => {
            const response = await api.get('/workflow-rules');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        },
    });

    const createWorkflow = useMutation({
        mutationFn: async (data: Partial<WorkflowRule>) => {
            const response = await api.post('/workflow-rules', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });

    const updateWorkflow = useMutation({
        mutationFn: async ({ id, ...data }: Partial<WorkflowRule> & { id: string }) => {
            const response = await api.patch(`/workflow-rules/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });

    const deleteWorkflow = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/workflow-rules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });

    return {
        workflows: workflowsQuery.data || [],
        isLoading: workflowsQuery.isLoading,
        error: workflowsQuery.error,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
    };
};
