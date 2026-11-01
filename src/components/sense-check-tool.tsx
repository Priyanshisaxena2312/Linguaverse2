
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Sparkles, ArrowRightLeft, BookOpen, UserCheck, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSentenceContext } from '@/app/actions';
import type { AnalyzeSentenceContextOutput } from '@/lib/types';
import { Badge } from './ui/badge';

export function SenseCheckTool() {
  const [sentence1, setSentence1] = useState('');
  const [sentence2, setSentence2] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeSentenceContextOutput | null>(null);

  const handleAnalyze = async () => {
    if (!sentence1 || !sentence2) return;
    setIsAnalyzing(true);
    try {
      const analysis = await getSentenceContext({ sentence1, sentence2 });
      setResult(analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden border-2 border-primary/10 shadow-2xl bg-background/50 backdrop-blur-md">
      <CardHeader className="bg-primary/5 border-b border-primary/10 py-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-headline tracking-tighter flex items-center gap-3">
              <Sparkles className="text-amber-500 h-8 w-8" />
              Contextual Sense-Check
            </CardTitle>
            <CardDescription className="text-lg mt-2 italic">
              Compare two sentences to understand the subtle nuances of tone and usage.
            </CardDescription>
          </div>
          <div className="hidden md:block">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1">AI-Powered Analysis</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Sentence A</label>
            <Input 
              placeholder="e.g., I am sorry." 
              value={sentence1}
              onChange={(e) => setSentence1(e.target.value)}
              className="h-14 rounded-2xl border-2 focus-visible:ring-primary text-lg px-6 bg-background/80"
            />
          </div>
          
          <div className="absolute left-1/2 top-11 -translate-x-1/2 hidden md:flex h-10 w-10 rounded-full bg-background border-2 border-primary/20 items-center justify-center z-10 shadow-lg">
             <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Sentence B</label>
            <Input 
              placeholder="e.g., My apologies." 
              value={sentence2}
              onChange={(e) => setSentence2(e.target.value)}
              className="h-14 rounded-2xl border-2 focus-visible:ring-primary text-lg px-6 bg-background/80"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !sentence1 || !sentence2}
            className="h-14 px-12 rounded-full text-lg font-bold shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Nuances...
              </>
            ) : (
              "Compare Context"
            )}
          </Button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-secondary/30 border border-secondary/50 flex flex-col items-center text-center">
                  <UserCheck className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-bold uppercase tracking-widest text-xs text-muted-foreground mb-1">Context Class</h4>
                  <p className="text-xl font-headline font-bold text-primary">{result.contextClass}</p>
                </div>
                
                <div className="md:col-span-2 p-6 rounded-3xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h4 className="font-bold uppercase tracking-widest text-xs text-muted-foreground">Use Case & Scenarios</h4>
                  </div>
                  <p className="text-lg leading-relaxed">{result.useCase}</p>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-background border-2 border-dashed border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <MessageSquare className="h-24 w-24" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-headline font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Subtle Nuances
                  </h4>
                  <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                    {result.subtleDifferences}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
