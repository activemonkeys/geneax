// src/components/registry/archive-list.tsx

'use client';

import {useMemo, useState} from 'react';
import {ArchiveRegistry} from '@/generated/prisma/client';

import {ArchiveCard} from './archive-card';
import {ArchiveFilter} from './archive-filter';

interface ArchiveListProps {
  archives: (ArchiveRegistry & {datasets: any[]})[];
}

export function ArchiveList({archives}: ArchiveListProps) {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    region: 'all',
  });

  const filteredArchives = useMemo(() => {
    return archives.filter((archive) => {
      const metadata = archive.metadata as any;

      const matchesSearch =
        filters.search === '' ||
        archive.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        archive.code.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === 'all' || archive.overallStatus === filters.status;

      const matchesRegion =
        filters.region === 'all' || metadata?.region === filters.region;

      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [archives, filters]);

  return (
    <div>
      <ArchiveFilter onFilterChange={setFilters} />

      {filteredArchives.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Geen archieven gevonden met de huidige filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArchives.map((archive) => (
            <ArchiveCard key={archive.code} archive={archive} />
          ))}
        </div>
      )}
    </div>
  );
}
