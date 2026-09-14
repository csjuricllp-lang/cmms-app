import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';

export const RequireSystemAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const isSystemAdmin = useMemo(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user?.systemRole === 'SUPER_ADMIN') return true;
            }

            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payloadStr = atob(base64);
            const payload = JSON.parse(payloadStr);
            
            if (payload.systemRole === 'SUPER_ADMIN') return true;

        } catch (e) {
            console.error("Failed to parse token for system role", e);
        }
        return false;
    }, [token]);

    if (!isSystemAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
