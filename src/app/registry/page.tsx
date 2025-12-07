// src/app/registry/page.tsx

import Link from 'next/link';
import {getArchivesAction} from '@/actions/registry-actions';
import {ArchiveList} from '@/components/registry/archive-list';
import {ArchiveStats} from '@/components/registry/archive-stats';
import {Button} from '@/components/ui/button';
import {Plus} from 'lucide-react';

export default async function RegistryPage() {
  const archives = await getArchivesAction();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Archief Registry</h1>
          <p className="text-muted-foreground mt-2">
            Overzicht van alle Nederlandse genealogische archieven
          </p>
        </div>
        <Button asChild>
          <Link href="/registry/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuw Archief
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <ArchiveStats archives={archives} />
      </div>

      <ArchiveList archives={archives} />
    </div>
  );
}
