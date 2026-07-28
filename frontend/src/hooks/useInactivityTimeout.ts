import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useInactivityTimeout = (timeoutMs: number = 15 * 60 * 1000) => {
    const navigate = useNavigate();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
        toast.error('You have been logged out due to inactivity.');
        navigate('/login');
    };

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(logout, timeoutMs);
    };

    useEffect(() => {
        // Only run if user is logged in
        if (!localStorage.getItem('token')) return;

        // Events that indicate activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            resetTimer();
        };

        // Attach listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // Initialize timer
        resetTimer();

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
        };
    }, [navigate, timeoutMs]);
};
