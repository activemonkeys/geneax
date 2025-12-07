// src/app/registry/[code]/page.tsx

import {notFound} from 'next/navigation';
import {getArchiveAction, getDatasetsAction} from '@/actions/registry-actions';
import {ArchiveHeader} from '@/components/registry/archive-header';
import {DatasetList} from '@/components/registry/dataset-list';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';

export default async function ArchiveDetailPage({
  params,
}: {
  params: {code: string};
}) {
  const {code} = params;

  try {
    const archive = await getArchiveAction(code);
    const datasets = await getDatasetsAction(code);

    const metadata = archive.metadata as any;
    const parserConfig = archive.parserConfig as any;

    return (
      <div className="container mx-auto px-4 py-8">
        <ArchiveHeader archive={archive} />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Datasets</CardTitle>
                <CardDescription>
                  Beschikbare datasets in dit archief
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DatasetList datasets={datasets} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">OAI-PMH URL</p>
                  <p className="text-muted-foreground text-sm break-all">
                    {archive.oaiUrl}
                  </p>
                </div>

                {archive.website && (
                  <div>
                    <p className="text-sm font-medium">Website</p>
                    <a
                      href={archive.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm break-all hover:underline"
                    >
                      {archive.website}
                    </a>
                  </div>
                )}

                {metadata?.region && (
                  <div>
                    <p className="text-sm font-medium">Regio</p>
                    <p className="text-muted-foreground text-sm">
                      {metadata.region}
                    </p>
                  </div>
                )}

                {metadata?.city && (
                  <div>
                    <p className="text-sm font-medium">Plaats</p>
                    <p className="text-muted-foreground text-sm">
                      {metadata.city}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-sm font-medium">Parser Type</p>
                  <p className="text-muted-foreground font-mono text-sm">
                    {archive.parserType}
                  </p>
                </div>

                {parserConfig && (
                  <div>
                    <p className="text-sm font-medium">Parser Config</p>
                    <pre className="text-muted-foreground bg-muted mt-1 overflow-x-auto rounded p-2 text-xs">
                      {JSON.stringify(parserConfig, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {metadata?.coverage && (
              <Card>
                <CardHeader>
                  <CardTitle>Coverage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metadata.coverage.dtb && (
                    <div>
                      <p className="text-sm font-medium">
                        DTB (Doop-, Trouw-, Begraafboeken)
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {metadata.coverage.dtb.from} -{' '}
                        {metadata.coverage.dtb.to}
                      </p>
                    </div>
                  )}
                  {metadata.coverage.bs && (
                    <div>
                      <p className="text-sm font-medium">
                        BS (Burgerlijke Stand)
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {metadata.coverage.bs.from} - {metadata.coverage.bs.to}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
