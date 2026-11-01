

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookHeart, LayoutGrid, Notebook, BookMarked, CheckSquare, ListTodo, Upload, Milestone, Languages, Sparkles, FileDown } from 'lucide-react';
import { JournalGrid } from '@/components/journal-grid';
import { DictionaryGrid } from '@/components/dictionary-grid';
import { JournalSortControl } from '@/components/journal-sort-control';
import type { JournalEntry, TodoList, Submission, HardWord, ComparedWord } from '@/lib/types';
import { JournalSearch } from '@/components/journal-search';
import { JournalTagFilter } from '@/components/journal-tag-filter';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { decrypt } from '@/lib/encryption';
import { getPlainTextFromTiptapJson, ensureTiptapJson, tiptapJsonToHtml } from '@/lib/utils';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTodoLists, getHardWords, getComparedWords, getComparedSentences } from '@/app/todo/actions';
import { getEntriesWithCorrections } from '@/app/dictionary/actions';
import { marked } from 'marked';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HardWordsClient } from '@/components/hard-words-client';
import type { CompareWordsOutput } from '@/ai/flows/compare-words';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DEMO_USER_ID, DEMO_ENTRIES } from '@/lib/demo-mode';

type JournalPageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

function createTabUrl(baseParams: URLSearchParams, tab: string | null, subTab: string | null = null): string {
  const params = new URLSearchParams(baseParams.toString());
  if (tab) {
    params.set('tab', tab);
  } else {
    params.delete('tab');
  }
  if (subTab) {
      params.set('subTab', subTab);
  } else {
      params.delete('subTab');
  }
  return `/journal?${params.toString()}`;
}

async function EntryCorrectionsGrid() {
    const entries = await getEntriesWithCorrections();
    return <DictionaryGrid entries={entries} />
}

async function HardWordsGrid() {
    const words = await getHardWords();
    if (words.length === 0) {
        return (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="mt-4 text-xl font-semibold">No Saved Words</h2>
                <p className="mt-2 text-muted-foreground">Use the "Look up" tool on the dashboard to define and save new words.</p>
            </div>
        )
    }
    return <HardWordsClient words={words} />;
}

async function ComparedWordsGrid() {
    const [wordComparisons, sentenceComparisons] = await Promise.all([
        getComparedWords(),
        getComparedSentences()
    ]);

    const decryptedWordComparisons = wordComparisons.map(c => ({
        ...c,
        details: JSON.parse(decrypt(c.comparison_details)) as CompareWordsOutput
    }));

    return (
        <Tabs defaultValue="words" className="w-full">
            <div className="flex justify-center mb-6">
                <TabsList className="grid grid-cols-2 w-[300px] h-10 p-1 rounded-full bg-muted/50">
                    <TabsTrigger value="words" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-tighter">
                        Word Pairs
                    </TabsTrigger>
                    <TabsTrigger value="sentences" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-tighter">
                        Sentence Context
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="words" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {decryptedWordComparisons.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-[32px] bg-muted/5">
                        <Languages className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        <h2 className="mt-4 text-xl font-headline font-bold">No Word Comparisons</h2>
                        <p className="mt-2 text-muted-foreground">Compare similar words like "Affect" vs "Effect" to see them here.</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-3">
                        {decryptedWordComparisons.map(comp => (
                            <AccordionItem value={comp.id} key={comp.id} className="border-none">
                                <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all rounded-[24px]">
                                    <AccordionTrigger className="w-full p-5 hover:no-underline flex items-center justify-between group">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="font-headline text-xl text-primary">{comp.word1}</CardTitle>
                                                <span className="text-muted-foreground font-light">vs.</span>
                                                <CardTitle className="font-headline text-xl text-primary">{comp.word2}</CardTitle>
                                            </div>
                                            <CardDescription className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">{format(new Date(comp.created_at), 'PPP')}</CardDescription>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-5 pt-0">
                                        <div className="space-y-4 pt-4 border-t border-dashed">
                                            <div className="relative w-full overflow-auto border rounded-2xl">
                                                <Table className="min-w-[700px]">
                                                    <TableHeader className="bg-primary/5">
                                                        <TableRow>
                                                            <TableHead className="font-bold uppercase tracking-widest text-[10px] w-[120px]">Feature</TableHead>
                                                            <TableHead className="font-bold text-primary">{comp.word1}</TableHead>
                                                            <TableHead className="font-bold text-primary">{comp.word2}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody className="text-sm">
                                                        <TableRow>
                                                            <TableCell className="font-bold bg-muted/30">Grammar</TableCell>
                                                            <TableCell className="font-medium">{comp.details.word1_details.partOfSpeech}</TableCell>
                                                            <TableCell className="font-medium">{comp.details.word2_details.partOfSpeech}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-bold bg-muted/30">Meaning</TableCell>
                                                            <TableCell>{comp.details.word1_details.definition}</TableCell>
                                                            <TableCell>{comp.details.word2_details.definition}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-bold bg-muted/30">Usage</TableCell>
                                                            <TableCell className="italic text-muted-foreground">"{comp.details.word1_details.example}"</TableCell>
                                                            <TableCell className="italic text-muted-foreground">"{comp.details.word2_details.example}"</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                            {comp.details.mnemonic && (
                                                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
                                                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-bold text-[10px] uppercase tracking-widest text-primary/60 mb-1">Learning Tip</h4>
                                                        <p className="text-sm text-foreground leading-relaxed">{comp.details.mnemonic}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </Card>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </TabsContent>

            <TabsContent value="sentences" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {sentenceComparisons.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-[32px] bg-muted/5">
                        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        <h2 className="mt-4 text-xl font-headline font-bold">No Sentence Analysis</h2>
                        <p className="mt-2 text-muted-foreground">Use the "Sentence Context" tool in lookup to save deep analysis records.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {sentenceComparisons.map(s => (
                            <Card key={s.id} className="p-6 rounded-[32px] border-2 hover:border-primary/20 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest py-0">
                                            {s.context_class}
                                        </Badge>
                                        <p className="text-[10px] font-bold text-muted-foreground pl-1">{format(new Date(s.created_at), 'PPP')}</p>
                                    </div>
                                    <div className="p-2 bg-muted/50 rounded-full">
                                        <Milestone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="p-4 bg-background border rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40 mb-1">Variation A</p>
                                        <p className="font-medium text-sm leading-relaxed">{s.sentence_1}</p>
                                    </div>
                                    <div className="p-4 bg-background border rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40 mb-1">Variation B</p>
                                        <p className="font-medium text-sm leading-relaxed">{s.sentence_2}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                     <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookHeart className="h-4 w-4 text-primary" />
                                            <h4 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Scenario</h4>
                                        </div>
                                        <p className="text-sm leading-relaxed italic text-foreground">"{s.use_case}"</p>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-muted/30 border-2 border-dashed border-primary/10">
                                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-primary">
                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                            Deep Context & Nuance
                                        </h4>
                                        <div 
                                            className="text-muted-foreground text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: (marked.parse(s.subtle_differences) as string) }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}




export default async function JournalPage(props: JournalPageProps) {
  const searchParams = await props.searchParams;
  const sortBy = typeof searchParams?.sortBy === 'string' ? searchParams.sortBy : 'created_at';
  const order = (typeof searchParams?.order === 'string' ? searchParams.order : 'desc');
  const searchQuery = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const tagQuery = typeof searchParams?.tag === 'string' ? searchParams.tag : undefined;
  const selectedIdsParam = searchParams?.selectedIds;
  const initialSelectedIds = typeof selectedIdsParam === 'string' ? selectedIdsParam.split(',') : [];

  
  const mainTab = ['journal', 'dictionary'].includes(searchParams?.tab as string) ? searchParams.tab as string : 'journal';
  const subTab = ['corrections', 'hard-words', 'compared-words'].includes(searchParams?.subTab as string) ? searchParams.subTab as string : 'corrections';

  const baseParams = new URLSearchParams();
   if (sortBy) baseParams.set('sortBy', sortBy);
   if (order) baseParams.set('order', order);
   if (searchQuery) baseParams.set('q', searchQuery);
   if (tagQuery) baseParams.set('tag', tagQuery);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let entries: JournalEntry[] = [];
  let allTags: string[] = [];
  
  if (user) {
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id);
    
    const orderOptions = { ascending: order === 'asc' };
    query = query.order(sortBy, orderOptions);
    
    let { data: fetchedEntries, error: fetchError } = await query;
    if (fetchError || !fetchedEntries || fetchedEntries.length === 0) {
        if (user.id === DEMO_USER_ID) {
          fetchedEntries = DEMO_ENTRIES as any;
        } else {
          fetchedEntries = [];
        }
    }

    if (fetchedEntries) {
        let processedEntries = fetchedEntries.map(entry => {
            try {
                const decryptedContent = ensureTiptapJson(decrypt(entry.content));
                return {
                    ...entry,
                    content: decryptedContent,
                };
            } catch (e) {
                console.error(`Failed to decrypt or parse entry ${entry.id}`);
                return {
                    ...entry,
                    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Content could not be displayed]' }] }] },
                };
            }
        });

        if (searchQuery) {
            processedEntries = processedEntries.filter(entry => {
                const plainTextContent = getPlainTextFromTiptapJson(entry.content);
                const titleMatch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
                const contentMatch = plainTextContent.toLowerCase().includes(searchQuery.toLowerCase());
                return titleMatch || contentMatch;
            });
        }
        
        if (tagQuery) {
            processedEntries = processedEntries.filter(entry => {
                const plainTextContent = getPlainTextFromTiptapJson(entry.content);
                return plainTextContent.toLowerCase().includes(`#${tagQuery.toLowerCase()}`);
            });
        }
        
        entries = processedEntries;
    }
    
    const { data: allEntriesData } = await supabase.from('journal_entries').select('content').eq('user_id', user.id);
    if (allEntriesData) {
        const tagsSet = new Set<string>();
        allEntriesData.forEach(entry => {
            try {
                const plainTextContent = getPlainTextFromTiptapJson(ensureTiptapJson(decrypt(entry.content)));
                const matches = plainTextContent.match(/#([a-zA-Z0-9_.-]+)/g);
                if (matches) {
                    matches.forEach(tagMatch => tagsSet.add(tagMatch.substring(1)));
                }
            } catch(e) {
                console.error(`Could not parse tags for an entry.`);
            }
        });
        allTags = Array.from(tagsSet).sort();
    }
  }


  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
           <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary">My Collection</h1>
           <p className="mt-2 text-lg text-muted-foreground">Your thoughts, reflections, and tasks all in one place.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild className="w-full sm:w-auto">
                <Link href="/dashboard">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Entry
                </Link>
            </Button>
        </div>
      </header>
      
        <Tabs value={mainTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="journal" asChild>
                    <Link href={createTabUrl(baseParams, 'journal')}><BookHeart className="mr-2 h-4 w-4"/>Journal</Link>
                </TabsTrigger>
                <TabsTrigger value="dictionary" asChild>
                    <Link href={createTabUrl(baseParams, 'dictionary', 'corrections')}><BookMarked className="mr-2 h-4 w-4"/>Dictionary</Link>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="journal" className="mt-6">
                <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading entries...</div>}>
                    <JournalGrid 
                      entries={entries}
                      allTags={allTags}
                      initialSelectedIds={initialSelectedIds}
                    />
                </Suspense>
            </TabsContent>
            <TabsContent value="dictionary" className="mt-6">
                 <Tabs value={subTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="corrections" asChild><Link href={createTabUrl(baseParams, 'dictionary', 'corrections')}><Milestone className="mr-2 h-4 w-4" />Entry Corrections</Link></TabsTrigger>
                        <TabsTrigger value="hard-words" asChild><Link href={createTabUrl(baseParams, 'dictionary', 'hard-words')}><BookHeart className="mr-2 h-4 w-4" />My Hard Words</Link></TabsTrigger>
                        <TabsTrigger value="compared-words" asChild><Link href={createTabUrl(baseParams, 'dictionary', 'compared-words')}><Languages className="mr-2 h-4 w-4" />Compared Words</Link></TabsTrigger>
                    </TabsList>
                    <TabsContent value="corrections" className="mt-6">
                        <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading corrections...</div>}>
                            <EntryCorrectionsGrid />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="hard-words" className="mt-6">
                        <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading words...</div>}>
                            <HardWordsGrid />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="compared-words" className="mt-6">
                         <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading comparisons...</div>}>
                            <ComparedWordsGrid />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </TabsContent>

        </Tabs>
    </div>
  );
}
