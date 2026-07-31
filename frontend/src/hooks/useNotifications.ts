import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SystemAlert {
    id: string;
    name: string;
    location?: string;
    title?: string; // For work orders
    type?: 'BREAKDOWN' | 'ASSIGNMENT' | 'OVERDUE';
    timestamp: string;
}

export const useNotifications = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lastAlert, setLastAlert] = useState<SystemAlert | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Request Persistent Storage (Future Pain: Browser purging IndexedDB)
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then(persistent => {
                if (persistent) console.log("EliteCMMS: Storage marked as DURABLE");
                else console.warn("EliteCMMS: Storage marked as BEST EFFORT (Browser may purge)");
            });
        }

        const playSound = (isCritical = false) => {
            try {
                // Haptic Feedback for Mobile (Future Pain: Loud factory floors)
                if (isCritical && 'vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200, 100, 400]);
                } else if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }

                // Professional Chime vs. Emergency Siren
                const soundUrl = isCritical 
                    ? 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3' // Siren
                    : 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'; // Chime
                
                const audio = new Audio(soundUrl);
                audio.volume = isCritical ? 0.7 : 0.5;
                audio.play().catch(e => console.warn('Audio blocked:', e));
            } catch (err) {
                console.error('Sound error', err);
            }
        };

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 10,
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('Antigravity Secure WebSocket: Operational');
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userOrgId || payload.sub || payload.userId;
                if (userId) newSocket.emit('join_user', { userId });
            } catch (e) {}
        });

        // Listen for breakdowns (Global) - PLAY SIREN
        newSocket.on('asset_down', (alert: any) => {
            playSound(true);
            setLastAlert({
                ...alert,
                type: 'BREAKDOWN',
                timestamp: new Date().toISOString()
            });
            setTimeout(() => setLastAlert(null), 10000);
        });

        newSocket.on('critical_breakdown', (wo: any) => {
            playSound(true);
            setLastAlert({
                id: wo.id,
                name: wo.title,
                location: wo.locationName || wo.location?.name,
                type: 'BREAKDOWN',
                timestamp: new Date().toISOString()
            });
            setTimeout(() => setLastAlert(null), 10000);
        });

        // Listen for assignments (Private) - PLAY CHIME
        newSocket.on('work_order_assigned', (wo: any) => {
            playSound(false);
            setLastAlert({
                id: wo.id,
                name: wo.title,
                title: 'New Mission Assigned',
                location: wo.locationName || wo.location?.name,
                type: 'ASSIGNMENT',
                timestamp: new Date().toISOString()
            });
            // Auto-refresh the work orders table
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            
            setTimeout(() => setLastAlert(null), 10000);
        });

        newSocket.on('notification_created', (notification: any) => {
            playSound(false);
            if (notification?.type === 'WORK_ORDER_COMPLETED' || notification?.type === 'WORK_ORDER_STATUS_CHANGED') {
                queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            }
        });

        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, []);

    return { socket, lastAlert, clearAlert: () => setLastAlert(null) };
};
