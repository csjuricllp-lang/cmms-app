import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { superAdminClient } from '../api/superAdminClient';

export const OverviewPage = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await superAdminClient.get('/metrics');
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch platform metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  if (loading) return <div className="text-gray-500">Loading metrics...</div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Organizations</span>
          <span className="text-4xl font-bold text-gray-900">{metrics?.totalOrganizations || 0}</span>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Users</span>
          <span className="text-4xl font-bold text-gray-900">{metrics?.totalUsers || 0}</span>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Monthly Recurring Rev</span>
          <span className="text-4xl font-bold text-gray-900">${(metrics?.monthlyRecurringRevenueCents / 100 || 0).toLocaleString()}</span>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">System Health</span>
          <div className="flex items-center gap-2 mt-auto">
            <div className={`w-3 h-3 rounded-full ${metrics?.systemHealth === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xl font-bold text-gray-900">{metrics?.systemHealth || 'Unknown'}</span>
          </div>
        </motion.div>
      </div>

      {/* Placeholder for Recent Platform Activity and Orgs Needing Attention */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Platform Activity</h3>
          {metrics?.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {metrics.recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                    {activity.action.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user?.name || 'System'} • {new Date(activity.createdAt).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 opacity-80">{activity.route}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity to show.</p>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orgs Needing Attention</h3>
          {metrics?.orgsNeedingAttention?.length > 0 ? (
            <div className="space-y-3">
              {metrics.orgsNeedingAttention.map((org: any) => (
                <div key={org.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex flex-col gap-1">
                  <span className="font-semibold text-amber-900 text-sm">{org.name}</span>
                  <span className="text-xs text-amber-700 font-medium tracking-wide uppercase">{org.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                <span className="text-emerald-500 font-bold">✓</span>
              </div>
              <p className="text-emerald-600 font-medium text-sm">All organizations are healthy.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
