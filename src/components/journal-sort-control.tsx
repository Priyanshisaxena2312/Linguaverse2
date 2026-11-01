
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

export function JournalSortControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentValue, setCurrentValue] = useState('');

  useEffect(() => {
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    setCurrentValue(`${sortBy}-${order}`);
  }, [searchParams]);

  const handleSortChange = (value: string) => {
    if (!value) return;
    const [sortBy, order] = value.split('-');
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('sortBy', sortBy);
    current.set('order', order);
    
    const search = current.toString();
    const query = search ? `?${search}` : '';

    router.replace(`${pathname}${query}`);
  };
  
  if (!currentValue) {
    return <Skeleton className="h-10 w-full sm:w-[180px]" />;
  }

  return (
    <Select onValueChange={handleSortChange} value={currentValue}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="created_at-desc">Newest First</SelectItem>
        <SelectItem value="created_at-asc">Oldest First</SelectItem>
        <SelectItem value="title-asc">Title (A-Z)</SelectItem>
        <SelectItem value="title-desc">Title (Z-A)</SelectItem>
      </SelectContent>
    </Select>
  );
}
