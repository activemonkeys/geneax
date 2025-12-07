// src/components/registry/archive-filter.tsx

'use client';

import {useState} from 'react';
import {Input} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Search} from 'lucide-react';

interface ArchiveFilterProps {
  onFilterChange: (filters: {
    search: string;
    status: string;
    region: string;
  }) => void;
}

export function ArchiveFilter({onFilterChange}: ArchiveFilterProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [region, setRegion] = useState('all');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({search: value, status, region});
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFilterChange({search, status: value, region});
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
    onFilterChange({search, status, region: value});
  };

  return (
    <div className="mb-6 flex gap-4">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Zoek archieven..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statussen</SelectItem>
          <SelectItem value="online">Online</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
          <SelectItem value="unknown">Onbekend</SelectItem>
        </SelectContent>
      </Select>

      <Select value={region} onValueChange={handleRegionChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Regio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle regio&apos;s</SelectItem>
          <SelectItem value="Noord-Holland">Noord-Holland</SelectItem>
          <SelectItem value="Zuid-Holland">Zuid-Holland</SelectItem>
          <SelectItem value="Noord-Brabant">Noord-Brabant</SelectItem>
          <SelectItem value="Gelderland">Gelderland</SelectItem>
          <SelectItem value="Friesland">Friesland</SelectItem>
          <SelectItem value="Zeeland">Zeeland</SelectItem>
          <SelectItem value="Drenthe">Drenthe</SelectItem>
          <SelectItem value="Groningen">Groningen</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
