// src/components/registry/archive-header.tsx

'use client';

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {ArchiveRegistry} from '@/generated/prisma/client';
import {ArrowLeft, ExternalLink, RefreshCw} from 'lucide-react';

import {StatusBadge} from './status-badge';

interface ArchiveHeaderProps {
  archive: ArchiveRegistry;
}

export function ArchiveHeader({archive}: ArchiveHeaderProps) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/registry">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{archive.name}</h1>
            <StatusBadge status={archive.overallStatus} />
          </div>
          <p className="text-muted-foreground mt-2">Code: {archive.code}</p>
          {archive.lastHealthCheck && (
            <p className="text-muted-foreground mt-1 text-sm">
              Laatst gecheckt:{' '}
              {new Date(archive.lastHealthCheck).toLocaleString('nl-NL')}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {archive.website && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={archive.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Website
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan
          </Button>
        </div>
      </div>
    </div>
  );
}
