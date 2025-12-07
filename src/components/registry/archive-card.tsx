// src/components/registry/archive-card.tsx

'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {ArchiveRegistry} from '@/generated/prisma/client';
import {ExternalLink} from 'lucide-react';

import {StatusBadge} from './status-badge';

interface ArchiveCardProps {
  archive: ArchiveRegistry & {datasets: any[]};
}

export function ArchiveCard({archive}: ArchiveCardProps) {
  const metadata = archive.metadata as any;

  return (
    <Link href={`/registry/${archive.code}`}>
      <Card className="hover:border-primary h-full cursor-pointer transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{archive.name}</CardTitle>
              {metadata?.city && (
                <CardDescription>{metadata.city}</CardDescription>
              )}
            </div>
            <StatusBadge status={archive.overallStatus} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2 text-sm">
            {metadata?.region && (
              <p className="text-muted-foreground">
                <span className="font-medium">Regio:</span> {metadata.region}
              </p>
            )}

            <p className="text-muted-foreground">
              <span className="font-medium">Datasets:</span>{' '}
              {archive.datasets.length}
            </p>

            {archive.lastHealthCheck && (
              <p className="text-muted-foreground text-xs">
                Laatst gecheckt:{' '}
                {new Date(archive.lastHealthCheck).toLocaleDateString('nl-NL')}
              </p>
            )}

            {archive.website && (
              <a
                href={archive.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
              >
                Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
