'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X, PlusCircle, MinusCircle } from 'lucide-react';

type JournalTagFilterProps = {
    tags: string[];
};

const INITIAL_TAG_LIMIT = 8;

export function JournalTagFilter({ tags }: JournalTagFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTag = searchParams.get('tag');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleTagClick = (tag: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (tag) {
            if (activeTag === tag) {
                // If the clicked tag is already active, deactivate it.
                 params.delete('tag');
            } else {
                 params.set('tag', tag);
            }
        } else {
            params.delete('tag');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };
    
    const visibleTags = isExpanded ? tags : tags.slice(0, INITIAL_TAG_LIMIT);

    if (tags.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 items-center">
            <p className="text-sm font-medium text-muted-foreground">Filter by tag:</p>
            {visibleTags.map((tag) => (
                <Badge
                    key={tag}
                    variant={activeTag === tag ? 'default' : 'secondary'}
                    onClick={() => handleTagClick(tag)}
                    className="cursor-pointer transition-transform hover:scale-105"
                >
                    {tag}
                </Badge>
            ))}
            {tags.length > INITIAL_TAG_LIMIT && (
                 <Badge
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="cursor-pointer transition-transform hover:scale-105 flex items-center gap-1"
                >
                    {isExpanded ? <MinusCircle className="h-3 w-3" /> : <PlusCircle className="h-3 w-3" />}
                    {isExpanded ? 'Show less' : `Show ${tags.length - INITIAL_TAG_LIMIT} more`}
                </Badge>
            )}
            {activeTag && (
                 <Badge
                    variant="outline"
                    onClick={() => handleTagClick(null)}
                    className="cursor-pointer transition-transform hover:scale-105 flex items-center gap-1"
                >
                    <X className="h-3 w-3" />
                    Clear filter
                </Badge>
            )}
        </div>
    );
}
