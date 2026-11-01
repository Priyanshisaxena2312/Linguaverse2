'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import type { JournalEntry } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { getPlainTextFromTiptapJson, getHashtagsFromTiptapJson } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tag, Briefcase } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

type EntryCardProps = {
  entry: JournalEntry;
  index: number;
  viewType?: 'journal' | 'dictionary';
  isSelected?: boolean;
  onSelect?: (entryId: string, isSelected: boolean) => void;
};

export function EntryCard({ entry, index, viewType = 'journal', isSelected = false, onSelect }: EntryCardProps) {
  // The content is now pre-decrypted and validated by the server component.
  const plainText = getPlainTextFromTiptapJson(entry.content);
  const tags = getHashtagsFromTiptapJson(entry.content);

  const href = viewType === 'dictionary'
    ? `/dictionary/view?initialSlide=${index}`
    : `/journal/view?initialSlide=${index}`;

  return (
    <div className="relative group h-full">
      <Card className="h-full flex flex-col transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/5 border border-border/50 bg-card/90 backdrop-blur-sm">
        <Link href={href} className="flex flex-col h-full">
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="font-headline text-xl truncate">{entry.title}</CardTitle>
                {entry.is_project_log && <Badge variant="secondary" className="flex-shrink-0"><Briefcase className="h-4 w-4" /></Badge>}
              </div>
              <CardDescription>
                {format(parseISO(entry.created_at), 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="line-clamp-3 text-sm text-muted-foreground">{plainText}</p>
            </CardContent>
            {tags.length > 0 && (
              <CardFooter className="flex flex-wrap items-center gap-2 pt-4">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="font-mono text-xs">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                    <Badge variant="outline" className="font-mono text-xs">+{tags.length - 3}</Badge>
                )}
              </CardFooter>
            )}
        </Link>
      </Card>
      {onSelect && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
            <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(entry.id, !!checked)}
                aria-label={`Select entry titled ${entry.title}`}
            />
        </div>
      )}
    </div>
  );
}
