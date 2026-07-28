import { api } from '../lib/api';

export interface RegisterPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string;
    teamSize: string;
    password?: string; // Included in actual form but might be handled by hook-form
}

export const authApi = {
    register: async (payload: RegisterPayload) => {
        const response = await api.post('/auth/register', payload);
        return response.data;
    },
    login: async (payload: any) => {
        const response = await api.post('/auth/login', payload);
        return response.data;
    }
};
