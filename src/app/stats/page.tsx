// src/app/stats/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {prisma} from '@/lib/prisma';

export default async function StatsPage() {
  const [sourceCount, recordCount, personCount, archiveCount, datasetCount] =
    await Promise.all([
      prisma.source.count(),
      prisma.record.count(),
      prisma.person.count(),
      prisma.archiveRegistry.count(),
      prisma.archiveDataset.count(),
    ]);

  const archives = await prisma.archiveRegistry.findMany({
    include: {
      datasets: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const stats = [
    {label: 'Archieven (Registry)', value: archiveCount},
    {label: 'Datasets', value: datasetCount},
    {label: 'Bronnen (Oud)', value: sourceCount},
    {label: 'Records', value: recordCount},
    {label: 'Personen', value: personCount},
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Database Statistieken</h1>
        <p className="text-muted-foreground mt-2">
          Overzicht van alle data in de database
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stat.value.toLocaleString('nl-NL')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archieven & Datasets</CardTitle>
          <CardDescription>
            Overzicht van alle geregistreerde archieven
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Datasets</TableHead>
                <TableHead>Parser Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archives.map((archive) => (
                <TableRow key={archive.code}>
                  <TableCell className="font-medium">{archive.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {archive.code}
                  </TableCell>
                  <TableCell>{archive.overallStatus}</TableCell>
                  <TableCell className="text-right">
                    {archive.datasets.length}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {archive.parserType}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
