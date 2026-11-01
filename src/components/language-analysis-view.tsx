
'use client';

import React, { useState } from 'react';
import type { AnalyzeTextForLanguageOutput, VocabularySuggestion, GrammarCorrection } from '@/lib/types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Volume2, Lightbulb, Loader2, Sparkles, BookOpenCheck, BookmarkPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, getAIErrorMessage } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/dompurify';
import { addDictionaryWord } from '@/app/journal/[id]/actions';
import { marked } from 'marked';
import { ScrollArea } from '@/components/ui/scroll-area';

type Correction = (VocabularySuggestion | GrammarCorrection) & { type: 'vocab' | 'grammar'; severity?: 'error' | 'warning' | 'info' };

type LanguageAnalysisViewProps = {
  originalContent: string;
  analysis: AnalyzeTextForLanguageOutput;
};

export function LanguageAnalysisView({ originalContent, analysis }: LanguageAnalysisViewProps) {
  const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null);
  const [isPronouncing, setIsPronouncing] = useState(false);
  const [isSpeakingExplanation, setIsSpeakingExplanation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleCorrectionClick = (correction: Correction) => {
    setSelectedCorrection(correction);
  };

  const handlePlayPronunciation = (text: string) => {
    if (!('speechSynthesis' in window)) {
        toast({ variant: 'destructive', title: 'TTS Not Supported', description: 'Your browser does not support text-to-speech.' });
        return;
    }
    if (isPronouncing) return;

    setIsPronouncing(true);
    try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsPronouncing(false);
        utterance.onerror = () => {
            toast({ variant: 'destructive', title: 'Pronunciation Error', description: 'Could not play audio.' });
            setIsPronouncing(false);
        }
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Pronunciation Error', description: getAIErrorMessage(e) });
        setIsPronouncing(false);
    }
  };

  const handleAddToDictionary = async (correction: Correction) => {
    setIsSaving(true);
    try {
        const isGrammar = correction.type === 'grammar';
        await addDictionaryWord({
            word: isGrammar ? (correction as GrammarCorrection).originalPhrase : (correction as VocabularySuggestion).originalWord,
            original_context: originalContent.substring(0, 500),
            corrected_context: isGrammar ? (correction as GrammarCorrection).correctedPhrase : (correction as VocabularySuggestion).suggestedWord,
            explanation: correction.explanation,
            type: 'written',
            pronunciation_url: null,
        });
        toast({
            title: "Added to Dictionary",
            description: `"${isGrammar ? (correction as GrammarCorrection).originalPhrase : (correction as VocabularySuggestion).originalWord}" has been saved.`
        })
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add word to dictionary.' });
    }
    setIsSaving(false);
  };
 
  const handlePlayExplanation = (text: string) => {
    if (!('speechSynthesis' in window)) {
        toast({ variant: 'destructive', title: 'TTS Not Supported', description: 'Your browser does not support text-to-speech.' });
        return;
    }
    if (isSpeakingExplanation) {
        window.speechSynthesis.cancel();
        setIsSpeakingExplanation(false);
        return;
    }
 
    setIsSpeakingExplanation(true);
    try {
        // Strip HTML/Markdown tags for cleaner speech
        const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[*_~`#\-]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setIsSpeakingExplanation(false);
        utterance.onerror = () => {
            toast({ variant: 'destructive', title: 'TTS Error', description: 'Could not play explanation.' });
            setIsSpeakingExplanation(false);
        }
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        toast({ variant: 'destructive', title: 'TTS Error', description: getAIErrorMessage(e) });
        setIsSpeakingExplanation(false);
    }
  };


  const renderContent = () => {
    const corrections: Correction[] = [
        ...(analysis.vocabularyEnhancements || []).map(v => ({ ...v, type: 'vocab' as const })),
        ...(analysis.grammarCorrections || []).map(g => ({ ...g, type: 'grammar' as const })),
    ];
    
    // Sort corrections by their appearance in the text to handle nesting and overlaps correctly.
    corrections.sort((a, b) => {
        const aText = a.type === 'vocab' ? (a as VocabularySuggestion).originalWord : (a as GrammarCorrection).originalPhrase;
        const bText = b.type === 'vocab' ? (b as VocabularySuggestion).originalWord : (b as GrammarCorrection).originalPhrase;
        return originalContent.indexOf(aText) - originalContent.indexOf(bText);
    });

    let lastIndex = 0;
    const parts: React.ReactNode[] = [];

    corrections.forEach((correction, i) => {
        const originalText = correction.type === 'vocab' ? (correction as VocabularySuggestion).originalWord : (correction as GrammarCorrection).originalPhrase;
        const index = originalContent.indexOf(originalText, lastIndex);

        if (index === -1) return;

        // Add the plain text part before the highlighted section.
        if (index > lastIndex) {
            parts.push(originalContent.substring(lastIndex, index));
        }

        const severity = correction.severity || (correction.type === 'grammar' ? 'error' : 'warning');
        
        const getHighlightStyles = (sev: string) => {
            switch (sev) {
                case 'error':
                    return "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 underline decoration-red-500/50 decoration-wavy";
                case 'warning':
                    return "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 underline decoration-blue-500/50 decoration-wavy";
                case 'info':
                    return "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 underline decoration-indigo-500/50 decoration-dotted";
                default:
                    return "bg-red-500/10 text-red-700 underline decoration-red-500/50";
            }
        };

    // Add the highlighted (clickable) section.
        parts.push(
            <span
                key={i}
                className={cn(
                    "p-0.5 rounded-sm cursor-pointer transition-all font-medium",
                    getHighlightStyles(severity),
                    severity === 'error' ? "hover:bg-red-500/20" : 
                    severity === 'warning' ? "hover:bg-blue-500/20" : "hover:bg-indigo-500/20"
                )}
                onClick={() => handleCorrectionClick(correction)}
            >
                {originalText}
            </span>
        );
        lastIndex = index + originalText.length;
    });

    // Add any remaining plain text after the last correction.
    if (lastIndex < originalContent.length) {
        parts.push(originalContent.substring(lastIndex));
    }

    return parts;
  };
 
  const renderMarkdown = (content: string) => {
    const rawHtml = marked.parse(content) as string;
    const cleanHtml = sanitizeHtml(rawHtml);
    return { __html: cleanHtml };
  };


  return (
    <>
      <div className="flex flex-wrap items-center gap-4 mb-6 p-3 bg-muted/30 rounded-lg border border-border/50 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-red-500/40 border border-red-500/20" /> Grammar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-blue-500/40 border border-blue-500/20" /> Vocabulary
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-indigo-500/40 border border-indigo-500/20" /> Information
        </span>
      </div>
      <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{renderContent()}</div>
      
      <Dialog open={!!selectedCorrection} onOpenChange={(isOpen) => !isOpen && setSelectedCorrection(null)}>
        <DialogContent className="max-w-md h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                {selectedCorrection?.type === 'vocab' ? <Sparkles className="text-amber-500" /> : <BookOpenCheck className="text-blue-500" />}
                {selectedCorrection?.type === 'vocab' ? 'Vocabulary Suggestion' : 'Grammar Correction'}
            </DialogTitle>
          </DialogHeader>
          {selectedCorrection && (
            <div className="flex-grow overflow-hidden -mr-6 pr-6">
                <ScrollArea className="h-full pr-2">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground">Original Text:</p>
                            <p className="text-lg p-2 bg-muted/50 rounded-md line-through text-red-500">
                            {selectedCorrection.type === 'vocab' 
                                ? (selectedCorrection as VocabularySuggestion).originalWord 
                                : (selectedCorrection as GrammarCorrection).originalPhrase}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground">Suggestion:</p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-semibold p-2 bg-green-100 dark:bg-green-900/50 rounded-md text-green-700 dark:text-green-400 flex-grow">
                                    {selectedCorrection.type === 'vocab' 
                                    ? (selectedCorrection as VocabularySuggestion).suggestedWord 
                                    : (selectedCorrection as GrammarCorrection).correctedPhrase}
                                </p>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handlePlayPronunciation(selectedCorrection.type === 'vocab' ? (selectedCorrection as VocabularySuggestion).suggestedWord : (selectedCorrection as GrammarCorrection).correctedPhrase)}
                                    disabled={isPronouncing}
                                >
                                    {isPronouncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                                    <span className="sr-only">Play pronunciation</span>
                                </Button>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-muted-foreground">Explanation:</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-xs gap-1.5"
                                    onClick={() => handlePlayExplanation(selectedCorrection.explanation)}
                                    disabled={isPronouncing}
                                >
                                    {isSpeakingExplanation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5" />}
                                    {isSpeakingExplanation ? 'Stop Reading' : 'Read Aloud'}
                                </Button>
                            </div>
                            <div 
                                className="prose prose-sm dark:prose-invert max-w-none p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-900/30"
                                dangerouslySetInnerHTML={renderMarkdown(selectedCorrection.explanation)}
                            />
                        </div>
                        <Button onClick={() => handleAddToDictionary(selectedCorrection)} disabled={isSaving}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookmarkPlus className="mr-2 h-4 w-4" />}
                            Add to my Dictionary
                        </Button>
                    </div>
                </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
