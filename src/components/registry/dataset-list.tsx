// src/components/registry/dataset-list.tsx

'use client';

import {Badge} from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {ArchiveDataset} from '@/generated/prisma/client';

interface DatasetListProps {
  datasets: ArchiveDataset[];
}

export function DatasetList({datasets}: DatasetListProps) {
  if (datasets.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Geen datasets gevonden.</p>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'harvesting':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Set Spec</TableHead>
          <TableHead>Naam</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Records</TableHead>
          <TableHead>Laatste Harvest</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {datasets.map((dataset) => (
          <TableRow key={dataset.id}>
            <TableCell className="font-mono text-sm">
              {dataset.setSpec}
            </TableCell>
            <TableCell>{dataset.setName || '-'}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(dataset.status)}>
                {dataset.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {dataset.recordCount?.toLocaleString('nl-NL') || '-'}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {dataset.lastHarvest
                ? new Date(dataset.lastHarvest).toLocaleDateString('nl-NL')
                : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
