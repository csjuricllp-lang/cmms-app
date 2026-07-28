import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export interface FailureCode {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export function useFailureCodes() {
  const queryClient = useQueryClient();

  const failureCodes = useQuery({
    queryKey: ['failureCodes'],
    queryFn: async () => {
      const response = await api.get('/work-orders/failure-codes');
      return response.data as FailureCode[];
    },
  });

  const createFailureCode = useMutation({
    mutationFn: async (data: Partial<FailureCode>) => {
      const response = await api.post('/work-orders/failure-codes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['failureCodes'] });
      toast.success('Failure code created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create failure code');
    },
  });

  const updateFailureCode = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FailureCode> & { id: string }) => {
      const response = await api.patch(`/work-orders/failure-codes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['failureCodes'] });
      toast.success('Failure code updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update failure code');
    },
  });

  const deleteFailureCode = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/work-orders/failure-codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['failureCodes'] });
      toast.success('Failure code deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete failure code');
    },
  });

  return {
    failureCodes,
    createFailureCode,
    updateFailureCode,
    deleteFailureCode,
  };
}
