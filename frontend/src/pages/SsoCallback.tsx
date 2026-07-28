import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { useThemeStore } from '../store/useThemeStore';

export const SsoCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            toast.error('SSO callback failed: No token received.');
            navigate('/login');
            return;
        }

        const handleSsoSuccess = async () => {
            try {
                // Set the token
                localStorage.setItem('token', token);
                
                // Fetch profile info using token to populate local storage user context
                const response = await api.get('/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                localStorage.setItem('user', JSON.stringify(response.data));
                useThemeStore.setState({ sidebarCollapsed: false });
                toast.success('Successfully signed in with SSO');
                navigate('/');
            } catch (err: any) {
                toast.error('Failed to populate SSO profile context.');
                navigate('/login');
            }
        };

        handleSsoSuccess();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground animate-pulse">
                Authorizing secure SSO session...
            </p>
        </div>
    );
};
