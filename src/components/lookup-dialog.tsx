'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAIErrorMessage, sanitizeHtml } from '@/lib/utils';
import { Loader2, Search, Book, Sparkles, Mic, Square, Save, Volume2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { defineWord, type DefineWordOutput } from '@/ai/flows/define-word';
import { compareWords, type CompareWordsOutput, type CompareWordsInput } from '@/ai/flows/compare-words';
import { getSentenceContext } from '@/app/actions';
import type { ComparedSentence } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { addHardWord, addComparedWords, addComparedSentences } from '@/app/todo/actions';
import { Badge } from './ui/badge';
import { marked } from 'marked';

const WordDefinition = ({ result }: { result: DefineWordOutput }) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isPronouncing, setIsPronouncing] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const saveResult = await addHardWord(result);
        if (saveResult.error) {
            toast({ variant: 'destructive', title: 'Error', description: saveResult.error });
        } else {
            toast({ title: 'Saved!', description: `"${result.word}" has been added to your dictionary.`});
        }
        setIsSaving(false);
    };
    
    const handlePlayPronunciation = (text: string) => {
        if (!('speechSynthesis' in window) || isPronouncing) return;
        setIsPronouncing(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsPronouncing(false);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50 mt-4">
            <div>
                <h3 className="font-bold text-lg text-primary">{result.word}</h3>
                {result.pronunciation && (
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground font-mono">{result.pronunciation}</p>
                         <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handlePlayPronunciation(result.word)} disabled={isPronouncing}>
                            {isPronouncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                    </div>
                )}
                <p className="italic text-sm">{result.meaning}</p>
            </div>
            <div>
                <h4 className="font-semibold text-sm">Explanation</h4>
                <p className="text-sm text-muted-foreground">{result.explanation}</p>
            </div>
            <div>
                <h4 className="font-semibold text-sm">Example Usage</h4>
                <p className="text-sm text-muted-foreground italic">"{result.use_case}"</p>
            </div>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save to My Words
            </Button>
        </div>
    );
};

const WordComparison = ({ input, result }: { input: CompareWordsInput, result: CompareWordsOutput }) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const saveResult = await addComparedWords(input, result);
        if (saveResult.error) {
            toast({ variant: 'destructive', title: 'Error', description: saveResult.error });
        } else {
            toast({ title: 'Saved!', description: `Comparison has been saved.`});
        }
        setIsSaving(false);
    }
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50 mt-4">
        <div className="relative w-full overflow-auto border rounded-lg">
            <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-semibold w-[120px]">Feature</TableHead>
                        <TableHead className="font-bold text-primary">{input.word1}</TableHead>
                        <TableHead className="font-bold text-primary">{input.word2}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-semibold">Pronunciation</TableCell>
                        <TableCell className="font-mono whitespace-normal">{result.word1_details.pronunciation || 'N/A'}</TableCell>
                        <TableCell className="font-mono whitespace-normal">{result.word2_details.pronunciation || 'N/A'}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-semibold">Part of Speech</TableCell>
                        <TableCell className="whitespace-normal">{result.word1_details.partOfSpeech}</TableCell>
                        <TableCell className="whitespace-normal">{result.word2_details.partOfSpeech}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-semibold">Definition</TableCell>
                        <TableCell className="whitespace-normal">{result.word1_details.definition}</TableCell>
                        <TableCell className="whitespace-normal">{result.word2_details.definition}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-semibold">Example</TableCell>
                        <TableCell className="italic whitespace-normal">"{result.word1_details.example}"</TableCell>
                        <TableCell className="italic whitespace-normal">"{result.word2_details.example}"</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        {result.mnemonic && (
            <div className="pt-2">
                <h4 className="font-semibold text-sm">Tip to Remember</h4>
                <p className="text-sm text-muted-foreground italic whitespace-normal">{result.mnemonic}</p>
            </div>
        )}
         <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Comparison
        </Button>
      </div>
    );
};

const SentenceContextResult = ({ s1, s2, result }: { s1: string, s2: string, result: any }) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const saveResult = await addComparedSentences(s1, s2, result);
        if (saveResult.error) {
            toast({ variant: 'destructive', title: 'Error', description: saveResult.error });
        } else {
            toast({ title: 'Saved!', description: `Analysis saved to your Context Dictionary.`});
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-secondary/30 border border-secondary/50 flex flex-col items-center text-center">
                  <h4 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground mb-1">Context</h4>
                  <Badge variant="outline" className="text-sm font-bold text-primary">{result.contextClass}</Badge>
                </div>
                
                <div className="md:col-span-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Book className="h-4 w-4 text-primary" />
                    <h4 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Scenarios</h4>
                  </div>
                  <p className="text-sm leading-relaxed italic">"{result.useCase}"</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-background border-2 border-dashed border-primary/20">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Nuances & Grammar
                  </h4>
                  <div 
                    className="text-muted-foreground text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(result.subtleDifferences) as string) }}
                  />
              </div>

              <Button size="sm" onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save to Context Dictionary
              </Button>
        </div>
    );
};

export function LookupDialog({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [mode, setMode] = useState<'define' | 'compare' | 'context'>('define');
  const { toast } = useToast();

  const handleLookup = async () => {
    if (mode === 'define' && !word1) return;
    if ((mode === 'compare' || mode === 'context') && (!word1 || !word2)) return;

    setIsLoading(true);
    setResult(null);
    try {
      if (mode === 'define') {
        const res = await defineWord({ word: word1 });
        setResult({ type: 'definition', data: res });
      } else if (mode === 'compare') {
        const input = { word1, word2 };
        const res = await compareWords(input);
        setResult({ type: 'comparison', data: res, input: input });
      } else {
        const res = await getSentenceContext({ sentence1: word1, sentence2: word2 });
        setResult({ type: 'context', data: res, s1: word1, s2: word2 });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(e) });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setWord1('');
    setWord2('');
    setResult(null);
    setIsLoading(false);
  }

  if (!mounted) return <>{children}</>;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline tracking-tight">Language Lookup</DialogTitle>
          <DialogDescription>Define words or refine your understanding of context and nuance.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6 -mr-6 pl-6">
            <div className="pr-2 pb-6">
                <Tabs value={mode} onValueChange={(value) => { setMode(value as any); setResult(null); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-full h-12">
                        <TabsTrigger value="define" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Define</TabsTrigger>
                        <TabsTrigger value="compare" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Compare Words</TabsTrigger>
                        <TabsTrigger value="context" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Sentence Context</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="define" className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="word1-define" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Word to Define</Label>
                            <Input id="word1-define" className="h-12 rounded-2xl border-2" value={word1} onChange={(e) => setWord1(e.target.value)} placeholder="e.g., Ephemeral" />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="compare" className="space-y-4 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="word1-compare" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Word 1</Label>
                                <Input id="word1-compare" className="h-12 rounded-2xl border-2" value={word1} onChange={(e) => setWord1(e.target.value)} placeholder="e.g., Advice" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="word2-compare" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Word 2</Label>
                                <Input id="word2-compare" className="h-12 rounded-2xl border-2" value={word2} onChange={(e) => setWord2(e.target.value)} placeholder="e.g., Advise" />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="context" className="space-y-4 pt-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="s1-context" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Sentence A</Label>
                                <Input id="s1-context" className="h-12 rounded-2xl border-2" value={word1} onChange={(e) => setWord1(e.target.value)} placeholder="e.g., I'm sorry." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="s2-context" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Sentence B</Label>
                                <Input id="s2-context" className="h-12 rounded-2xl border-2" value={word2} onChange={(e) => setWord2(e.target.value)} placeholder="e.g., My apologies." />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                
                <div className="flex justify-end mt-6">
                    <Button onClick={handleLookup} disabled={isLoading || (mode === 'define' ? !word1 : (!word1 || !word2))} className="rounded-full px-8 shadow-lg h-11">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        {mode === 'context' ? 'Analyze Context' : 'Find Definition'}
                    </Button>
                </div>

                {isLoading && <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground italic animate-pulse">Our AI is analyzing the nuances...</p>
                </div>}

                {result && result.type === 'definition' && <WordDefinition result={result.data} />}
                {result && result.type === 'comparison' && <WordComparison input={result.input} result={result.data} />}
                {result && result.type === 'context' && <SentenceContextResult s1={result.s1} s2={result.s2} result={result.data} />}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
