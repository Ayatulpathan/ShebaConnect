import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.js';
import { Activity } from 'lucide-react';

export const HealthStatusBadge: React.FC = () => {
  const { t } = useLanguage();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['healthStatus'],
    queryFn: checkHealth,
    refetchInterval: 30000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>{t.systemStatus.wakingUp}</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        <span>{t.systemStatus.offline}</span>
      </div>
    );
  }

  return (
    <div
      className="tile-3d preserve-3d inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-3d-emerald"
      title={`Database: ${data.database?.state || 'connected'} | Uptime: ${data.uptimeSeconds || 0}s`}
    >
      <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      <span>{t.systemStatus.live}</span>
    </div>
  );
};
