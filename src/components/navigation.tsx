// src/components/navigation.tsx

'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {cn} from '@/lib/utils';
import {Archive, Database, Home} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    {href: '/', label: 'Home', icon: Home},
    {href: '/registry', label: 'Registry', icon: Archive},
    {href: '/stats', label: 'Statistieken', icon: Database},
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <span className="text-xl font-bold">Geneax</span>
          </div>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + '/');

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
