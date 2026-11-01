

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import type { JournalEntry } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { getPlainTextFromTiptapJson, getHashtagsFromTiptapJson, ensureTiptapJson } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { decrypt } from '@/lib/encryption';

type EntryCardProps = {
  entry: JournalEntry;
};

export function EntryCard({ entry }: EntryCardProps) {
  // Decrypt the content, which might be a JSON string (new) or plaintext (old).
  const decryptedData = decrypt(entry.content);
  // Ensure the decrypted data is a valid Tiptap JSON object.
  // This function will convert old plaintext into the proper JSON structure.
  const tiptapJsonContent = ensureTiptapJson(decryptedData);

  const plainText = getPlainTextFromTiptapJson(tiptapJsonContent);
  const tags = getHashtagsFromTiptapJson(tiptapJsonContent);

  return (
    <Link href={`/journal/${entry.id}`} className="block group">
      <Card className="h-full flex flex-col transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/5 border border-border/50 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="font-headline text-xl truncate">{entry.title}</CardTitle>

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
      </Card>
    </Link>
  );
}
