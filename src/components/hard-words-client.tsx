
'use client';

import { useState } from 'react';
import type { HardWord } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function HardWordsClient({ words }: { words: HardWord[] }) {
    if (!words || words.length === 0) {
        return null;
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-2">
            {words.map(word => (
                <AccordionItem value={word.id} key={word.id} className="border-b-0">
                    <Card>
                        <AccordionTrigger className="w-full p-4 hover:no-underline">
                            <div className="flex justify-between items-center w-full">
                                <CardTitle className="font-headline text-lg text-primary">{word.word}</CardTitle>
                                <CardDescription className="italic truncate pl-4">{word.meaning}</CardDescription>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                            <div className="space-y-4 pt-4 border-t">
                                <div>
                                    <h4 className="font-semibold text-sm">Explanation</h4>
                                    <p className="text-sm text-muted-foreground">{word.explanation}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Example Usage</h4>
                                    <p className="text-sm text-muted-foreground italic">"{word.use_case}"</p>
                                </div>
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
