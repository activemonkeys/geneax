// src/components/registry/archive-stats.tsx

'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {ArchiveRegistry} from '@/generated/prisma/client';

interface ArchiveStatsProps {
  archives: (ArchiveRegistry & {datasets: any[]})[];
}

export function ArchiveStats({archives}: ArchiveStatsProps) {
  const totalDatasets = archives.reduce(
    (acc, archive) => acc + archive.datasets.length,
    0,
  );
  const onlineCount = archives.filter(
    (a) => a.overallStatus === 'online',
  ).length;
  const offlineCount = archives.filter(
    (a) => a.overallStatus === 'offline',
  ).length;

  const stats = [
    {
      title: 'Totaal Archieven',
      value: archives.length,
      description: 'Geregistreerde archieven',
    },
    {
      title: 'Online',
      value: onlineCount,
      description: 'Beschikbare archieven',
      color: 'text-green-600',
    },
    {
      title: 'Offline',
      value: offlineCount,
      description: 'Niet beschikbaar',
      color: 'text-red-600',
    },
    {
      title: 'Totaal Datasets',
      value: totalDatasets,
      description: 'Beschikbare datasets',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stat.color || ''}`}>
              {stat.value}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
