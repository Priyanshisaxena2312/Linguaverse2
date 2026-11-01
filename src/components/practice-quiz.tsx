
'use client';

import { useState } from 'react';
import type { GeneratePracticeQuizOutput } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';

type PracticeQuizProps = {
  quiz: GeneratePracticeQuizOutput | null;
  corrections: any[];
  children?: React.ReactNode;
};

export function PracticeQuiz({ quiz, corrections, children }: PracticeQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const questions = quiz?.questions;

  // If there's no quiz or no corrections, just show the main content.
  if (!questions || questions.length === 0) {
    if (corrections.length > 0) {
      return <>{children}</>;
    }
    return (
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>No Corrections to Practice!</AlertTitle>
        <AlertDescription>That's great! There were no specific corrections in this entry for you to practice.</AlertDescription>
      </Alert>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  // Grading logic for multi-select vs single-select
  const checkCorrectness = (selected: string[]) => {
    const correctOnes = currentQuestion.correctAnswers;
    if (selected.length !== correctOnes.length) return false;
    return selected.every(val => correctOnes.includes(val));
  };

  const isCorrect = checkCorrectness(selectedAnswers);

  const handleToggleOption = (option: string) => {
    if (isAnswered) return;
    
    if (currentQuestion.isMultiSelect) {
      setSelectedAnswers(prev => 
        prev.includes(option) 
          ? prev.filter(a => a !== option) 
          : [...prev, option]
      );
    } else {
      setSelectedAnswers([option]);
      // For single select, we answer immediately
      const isRight = checkCorrectness([option]);
      setIsAnswered(true);
      if (isRight) setCorrectCount(prev => prev + 1);
    }
  };

  const handleSubmitMulti = () => {
    if (selectedAnswers.length === 0) return;
    setIsAnswered(true);
    if (isCorrect) setCorrectCount(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswers([]);
      setIsAnswered(false);
    } else {
      setIsQuizFinished(true);
    }
  };

  if (isQuizFinished) {
    return (
      <div className="space-y-6">
        <Card className="text-center animate-in fade-in zoom-in-95 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-headline tracking-tighter">Quiz Complete!</CardTitle>
            <CardDescription className="text-lg">You scored {correctCount} out of {questions.length}.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
               <Sparkles className="h-12 w-12 text-primary" />
            </div>
            {children ? (
              <p className="text-muted-foreground italic mb-6">Excellent work! Now, let's practice these improvements in a real conversation.</p>
            ) : (
                <p className="text-muted-foreground italic">You're making great progress in your language journey.</p>
            )}
          </CardContent>
        </Card>
        {children}
      </div>
    );
  }

  return (
    <Card className="mb-8 border-2 border-primary/10 shadow-xl">
      <CardHeader className="bg-primary/[0.02] border-b border-primary/5">
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Sparkles className="text-amber-500 animate-pulse" />
          Quick Quiz
        </CardTitle>
        <CardDescription>
          Question {currentQuestionIndex + 1} of {questions.length}. 
          {currentQuestion.isMultiSelect ? (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">Select All Correct</Badge>
          ) : (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 border-blue-200">Single Choice</Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <p className="text-xl font-semibold leading-relaxed">{currentQuestion.questionText}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswers.includes(option);
            const isActuallyCorrect = currentQuestion.correctAnswers.includes(option);
            
            return (
              <Button
                key={option}
                variant="outline"
                className={cn(
                  "h-auto py-4 px-6 justify-start text-left whitespace-normal text-base rounded-2xl transition-all duration-300",
                  isSelected && !isAnswered && "border-primary bg-primary/5 ring-1 ring-primary",
                  isAnswered && (
                    isActuallyCorrect
                      ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-100 ring-2 ring-green-400 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"
                      : isSelected ? "bg-red-100 border-red-300 text-red-800 hover:bg-red-100 ring-2 ring-red-400 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300" : "opacity-60"
                  )
                )}
                onClick={() => handleToggleOption(option)}
                disabled={isAnswered}
              >
                <div className="mr-3 flex-shrink-0">
                    {currentQuestion.isMultiSelect ? (
                        <div className={cn("h-5 w-5 rounded border flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                    ) : (
                        <div className={cn("h-5 w-5 rounded-full border flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                    )}
                </div>
                {option}
              </Button>
            );
          })}
        </div>

        {currentQuestion.isMultiSelect && !isAnswered && (
            <div className="flex justify-end pt-2">
                <Button 
                    onClick={handleSubmitMulti} 
                    disabled={selectedAnswers.length === 0}
                    className="rounded-full px-8"
                >
                    Submit Answer
                </Button>
            </div>
        )}

        {isAnswered && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
            <Alert variant={isCorrect ? "default" : "destructive"} className={cn("rounded-2xl border-2", isCorrect ? "border-green-300 bg-green-50/50 dark:border-green-700" : "border-red-300 bg-red-50/50 dark:border-red-700")}>
              {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
              <AlertTitle className="text-lg font-bold">{isCorrect ? "Perfect!" : "Not Quite"}</AlertTitle>
              <AlertDescription className="text-base italic">
                {currentQuestion.explanation}
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={handleNext} size="lg" className="rounded-full px-10 group shadow-lg">
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : (children ? "Start Chat Practice" : "Finish Quiz")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
