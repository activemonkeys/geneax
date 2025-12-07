// src/app/page.tsx

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Archive, Database, Search, TrendingUp} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Archive,
      title: 'Archief Registry',
      description:
        'Centraal overzicht van alle Nederlandse genealogische archieven met hun OAI-PMH endpoints.',
      href: '/registry',
    },
    {
      icon: Search,
      title: 'Discovery Tool',
      description:
        'Automatisch archieven scannen en configureren via OAI-PMH protocol.',
      href: '/registry',
    },
    {
      icon: Database,
      title: 'Gestructureerde Data',
      description:
        'A2A XML parsing naar gestructureerde PostgreSQL database met partitionering.',
      href: '/stats',
    },
    {
      icon: TrendingUp,
      title: 'Status Tracking',
      description:
        'Real-time monitoring van archief beschikbaarheid en harvest status.',
      href: '/registry',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-4 text-5xl font-bold">Geneax</h1>
        <p className="text-muted-foreground mb-8 text-xl">
          Centrale database van Nederlandse genealogische data met uniforme
          toegang tot alle archieven
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/registry">Bekijk Registry</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/stats">Statistieken</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.title} href={feature.href}>
              <Card className="hover:border-primary h-full cursor-pointer transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Sprint 2: Archive Discovery & Registry System</CardTitle>
            <CardDescription>Huidige ontwikkelingsfase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span className="text-sm">
                Database schema voor archive registry
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span className="text-sm">OAI-PMH discovery tool</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span className="text-sm">
                Registry populated met 11 archieven
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span className="text-sm">Web UI voor registry management</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
