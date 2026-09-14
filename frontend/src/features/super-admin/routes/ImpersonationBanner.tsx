import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { superAdminClient } from '../api/superAdminClient';

export const ImpersonationBanner = () => {
  const navigate = useNavigate();
  // Check if impersonation is active (e.g., from localStorage or auth context)
  const [impersonationId, setImpersonationId] = useState<string | null>(localStorage.getItem('impersonationSessionId'));

  useEffect(() => {
    // In a real implementation, this would listen to auth context changes
    const interval = setInterval(() => {
      const sessionId = localStorage.getItem('impersonationSessionId');
      if (sessionId !== impersonationId) {
        setImpersonationId(sessionId);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [impersonationId]);

  const endSession = async () => {
    if (!impersonationId) return;
    try {
      await superAdminClient.patch(`/impersonation/${impersonationId}/end`);
      localStorage.removeItem('impersonationSessionId');
      // Also swap the token back to the real user token here
      setImpersonationId(null);
      navigate('/super-admin');
    } catch (error) {
      console.error('Failed to end impersonation session', error);
      // Force end on client side anyway
      localStorage.removeItem('impersonationSessionId');
      setImpersonationId(null);
      navigate('/super-admin');
    }
  };

  if (!impersonationId) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-amber-500/90 backdrop-blur-md text-amber-950 px-4 py-2 flex items-center justify-between shadow-md border-b border-amber-600/20">
      <div className="flex items-center gap-3">
        <ShieldAlert size={20} className="animate-pulse" />
        <span className="font-semibold text-sm">
          Viewing as Tenant (Support Mode)
        </span>
        <span className="text-xs opacity-80 px-2 py-0.5 bg-amber-950/10 rounded-full font-mono">
          Session ID: {impersonationId.substring(0, 8)}...
        </span>
      </div>
      <button 
        onClick={endSession}
        className="flex items-center gap-2 bg-amber-950 text-amber-50 hover:bg-amber-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      >
        <LogOut size={16} />
        End Session
      </button>
    </div>
  );
};
