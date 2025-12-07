// src/components/registry/status-badge.tsx

'use client';

import {Badge} from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({status}: StatusBadgeProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'online':
        return 'default';
      case 'offline':
        return 'destructive';
      case 'degraded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'degraded':
        return 'Degraded';
      default:
        return 'Onbekend';
    }
  };

  return (
    <Badge variant={getStatusVariant(status)}>{getStatusLabel(status)}</Badge>
  );
}
