
'use client';

import { useState } from 'react';
import type { HardWord, ComparedWord } from '@/lib/types';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generatePracticeQuiz } from '@/ai/flows/generate-practice-quiz';
import type { GeneratePracticeQuizOutput } from '@/lib/types';
import { PracticeQuiz } from './practice-quiz';
import { Loader2, Wand2 } from 'lucide-react';
import { getAIErrorMessage } from '@/lib/utils';
import { decrypt } from '@/lib/encryption';
import type { CompareWordsOutput } from '@/ai/flows/compare-words';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

type Item = HardWord | (ComparedWord & { comparison_details_obj: CompareWordsOutput });

type PracticeQuizGeneratorProps = {
  items: Item[];
  itemType: 'hard-word' | 'compared-word';
};

export function PracticeQuizGenerator({ items, itemType }: PracticeQuizGeneratorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quiz, setQuiz] = useState<GeneratePracticeQuizOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleGenerateQuiz = async () => {
    if (selectedIds.size === 0) {
      toast({ variant: 'destructive', title: 'No items selected.' });
      return;
    }
    
    setIsGenerating(true);
    setQuiz(null);

    const selectedItems = items.filter(item => selectedIds.has(item.id));
    const corrections = selectedItems.map(item => {
        if (itemType === 'hard-word') {
            const hardWord = item as HardWord;
            return {
                original: hardWord.word,
                suggestion: hardWord.word, // In this case, original and suggestion are the same
                explanation: `Definition: ${hardWord.meaning}\nExample: ${hardWord.use_case}`
            };
        } else {
            const comparedWord = item as (ComparedWord & { comparison_details_obj: CompareWordsOutput });
            return {
                original: comparedWord.word1,
                suggestion: comparedWord.word2,
                explanation: `What's the difference between ${comparedWord.word1} and ${comparedWord.word2}? Hint: ${comparedWord.comparison_details_obj.word1_details.definition} vs. ${comparedWord.comparison_details_obj.word2_details.definition}`
            };
        }
    });

    try {
        const result = await generatePracticeQuiz({ corrections });
        setQuiz(result);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to generate quiz', description: getAIErrorMessage(error) });
    } finally {
        setIsGenerating(false);
    }
  };
  
  if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2 p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Generating your custom quiz...</p>
        </div>
      );
  }

  if (quiz) {
      return (
         <div className="space-y-4">
            <PracticeQuiz quiz={quiz} corrections={[]}>
                <div className="text-center p-4">
                    <Button onClick={() => setQuiz(null)}>Start Over</Button>
                </div>
            </PracticeQuiz>
         </div>
      );
  }

  if (items.length === 0) {
    const message = itemType === 'hard-word' 
        ? "You haven't saved any hard words yet."
        : "You haven't saved any word comparisons yet.";
    return <div className="text-center text-muted-foreground py-10"><p>{message}</p></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Quiz</CardTitle>
        <CardDescription>Select items to include in your quiz, then click "Generate Quiz".</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-96 border rounded-md p-4">
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => handleSelect(item.id)}
              >
                <Checkbox
                  id={item.id}
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => handleSelect(item.id)}
                />
                <label htmlFor={item.id} className="text-sm font-medium leading-none cursor-pointer flex-grow">
                  {itemType === 'hard-word' ? (item as HardWord).word : `${(item as ComparedWord).word1} vs. ${(item as ComparedWord).word2}`}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
         <div className="flex justify-end">
            <Button onClick={handleGenerateQuiz} disabled={selectedIds.size === 0}>
                <Wand2 className="mr-2 h-4 w-4"/>
                Generate Quiz ({selectedIds.size} items)
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
