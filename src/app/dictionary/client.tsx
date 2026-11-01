
'use client';

import { useState, useRef } from 'react';
import type { DictionaryWord } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PenLine, MicVocal, Volume2, Repeat, Lightbulb } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type DictionaryClientProps = {
    initialWords: DictionaryWord[];
};

const WordCard = ({ word }: { word: DictionaryWord }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    const playPronunciation = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-2xl text-primary">{word.word}</CardTitle>
                    {word.pronunciation_url && (
                        <>
                            <audio ref={audioRef} src={word.pronunciation_url} preload="none" />
                            <Button variant="outline" size="icon" onClick={playPronunciation}>
                                <Volume2 className="h-5 w-5" />
                                <span className="sr-only">Play pronunciation</span>
                            </Button>
                        </>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Original Usage:</h4>
                    <p className="text-sm italic pl-4 border-l-2 ml-2">"{word.original_context}"</p>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Suggested Usage:</h4>
                    <p className="text-sm font-medium pl-4 border-l-2 ml-2 text-green-700 dark:text-green-400">"{word.corrected_context}"</p>
                </div>
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{word.explanation}</span>
                </p>
            </CardFooter>
        </Card>
    );
};

export function DictionaryClient({ initialWords }: DictionaryClientProps) {
    const [words] = useState(initialWords);

    const writtenWords = words.filter(w => w.type === 'written');
    const audioWords = words.filter(w => w.type === 'audio');

    return (
        <Tabs defaultValue="written" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="written">
                    <PenLine className="mr-2 h-4 w-4" /> Written ({writtenWords.length})
                </TabsTrigger>
                <TabsTrigger value="audio">
                    <MicVocal className="mr-2 h-4 w-4" /> Spoken ({audioWords.length})
                </TabsTrigger>
            </TabsList>
            <TabsContent value="written" className="mt-4">
                {writtenWords.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {writtenWords.map(word => <WordCard key={word.id} word={word} />)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-12">No vocabulary from written entries saved yet.</p>
                )}
            </TabsContent>
            <TabsContent value="audio" className="mt-4">
                {audioWords.length > 0 ? (
                     <div className="grid gap-4 md:grid-cols-2">
                        {audioWords.map(word => <WordCard key={word.id} word={word} />)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-12">No vocabulary from spoken entries saved yet.</p>
                )}
            </TabsContent>
        </Tabs>
    );
}
