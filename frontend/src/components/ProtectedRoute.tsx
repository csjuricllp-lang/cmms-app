import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { toast } from 'react-hot-toast';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
    requiredRole?: string | string[];
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requiredPermission,
    requiredRole,
    allowedRoles
}) => {
    const { role, hasPermission } = useUserRole();
    const location = useLocation();

    // Not logged in? Redirect to login.
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const rolesList = allowedRoles || (Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : undefined);

    if (rolesList && rolesList.length > 0) {
        const normalizedUserRole = (role || '').toUpperCase();
        const hasRoleMatch = rolesList.some((r) => r.toUpperCase() === normalizedUserRole);
        if (!hasRoleMatch) {
            toast.error('Access Denied: Insufficient Role');
            return <Navigate to="/" replace />;
        }
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        toast.error('Access Denied: Missing Permission');
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
