import { useMemo } from 'react';

export const useUserRole = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    let role = (user?.roleName || '').toUpperCase();
    if (!role && user?.organizations?.[0]?.role) {
        role = user.organizations[0].role.toUpperCase();
    }

    let permissions: string[] = [];

    // 1. Try to get permissions from JWT (most reliable)
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payloadStr = atob(token.split('.')[1]);
            const payload = JSON.parse(payloadStr);
            permissions = payload.permissions || [];
            if (!role && payload.role) {
                role = payload.role.toUpperCase();
            }
        } catch (e) {
            // Fallback to user object if token parsing fails
        }
    }

    // 2. Fallback to user object in localStorage
    if (permissions.length === 0 && user?.permissions) {
        permissions = user.permissions;
    }

    const hasPermission = (permission: string) => {
        const normalizedRole = role.toUpperCase();
        if (permissions.includes('ALL') || normalizedRole === 'OWNER' || normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRATOR' || normalizedRole === 'MAINTENANCE MANAGER') {
            return true;
        }
        return permissions.includes(permission);
    };

    const isLimitedTechnician = role === 'LIMITED TECHNICIAN';
    const isTechnician = role === 'TECHNICIAN';
    
    // Use granular permission checks where possible
    const canManageData = hasPermission('assets.create') || hasPermission('locations.create'); 
    const canCreateWorkOrders = hasPermission('work-orders.create');
    const canManageUsers = hasPermission('users.manage');
    
    return {
        role,
        permissions,
        hasPermission,
        isLimitedTechnician,
        isTechnician,
        canManageData,
        canCreateWorkOrders,
        canManageUsers
    };
};
