import { useCallback } from 'react';
import { api } from '../lib/api';

const VAPID_PUBLIC_KEY = 'BCjwXoREAzEENgv4vsuSJFN72BctEVvJv4lHa0_EGTWvSfueT7VjDYRD1w3waqCaUBjixm568rt1t-NDlFoq9vs';

export const usePushNotifications = () => {
    const subscribeToPush = useCallback(async () => {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            
            // Generate or retrieve persistent Device ID
            let deviceId = localStorage.getItem('juric_device_id');
            if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem('juric_device_id', deviceId);
            }

            // Check for existing subscription
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }

            // Always sync with backend to ensure token hasn't expired or been pruned
            const subscriptionJSON = subscription.toJSON();
            await api.post('/notifications/push-subscribe', subscriptionJSON, {
                headers: { 'x-device-id': deviceId }
            });
            
            console.log('Juric PWA: Push Subscription Synchronized');
        } catch (error) {
            console.error('Push Sync Failed:', error);
        }
    }, []);

    return { subscribeToPush };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
