
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, User } from 'lucide-react';
import type { JournalEntry, GrammarCorrection, VocabularySuggestion } from '@/lib/types';
import { generatePracticeChatResponse } from '@/ai/flows/generate-practice-chat-response';
import { getAIErrorMessage, markdownToTiptapJson, tiptapJsonToHtml, sanitizeHtml } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { savePracticeSession } from '@/app/dictionary/practice/actions';
import { cn } from '@/lib/utils';

type Correction = (VocabularySuggestion | GrammarCorrection);

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatPracticeClientProps = {
  entry: JournalEntry;
  corrections: Correction[];
  quizScore: string | null;
};

export function ChatPracticeClient({ entry, corrections, quizScore }: ChatPracticeClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [isSessionOver, setIsSessionOver] = useState(false);
  const [performanceReport, setPerformanceReport] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const hasInitiatedConversation = useRef(false);

  const correctionsToPracticeString = useRef(
    corrections.map(corr => {
        const isGrammar = 'originalPhrase' in corr;
        const original = isGrammar ? corr.originalPhrase : corr.originalWord;
        const suggestion = isGrammar ? corr.correctedPhrase : ('suggestedWord' in corr ? corr.suggestedWord : '');
        return `- Mistake: "${original}", Correct version: "${suggestion}", Reason: ${corr.explanation}`;
    }).join('\n')
  );

  useEffect(() => {
    async function initiateConversation() {
      if (!hasInitiatedConversation.current && corrections.length > 0) {
        hasInitiatedConversation.current = true;
        setIsResponding(true);

        try {
          const result = await generatePracticeChatResponse({ 
            correctionsToPractice: correctionsToPracticeString.current, 
            chatHistory: [] 
          });

          if (result?.assistantResponse) {
            setMessages([{ role: 'assistant', content: result.assistantResponse }]);
          } else {
            throw new Error("AI did not return a valid initial response.");
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(error) });
        } finally {
          setIsResponding(false);
        }
      }
    }
    initiateConversation();
  }, [corrections, toast]);


  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isResponding, performanceReport]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isResponding || isSessionOver) return;

    const newUserMessage: Message = { role: 'user', content: inputValue };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsResponding(true);

    try {
      const result = await generatePracticeChatResponse({
        correctionsToPractice: correctionsToPracticeString.current,
        chatHistory: newMessages,
      });
      
      if (result?.assistantResponse) {
        const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: result.assistantResponse }];
        setMessages(finalMessages);
        
        if (result.isSessionOver) {
          setIsSessionOver(true);
          setPerformanceReport(result.performanceReport);
          // Save the session to the database
          await savePracticeSession({
            journal_entry_id: entry.id,
            quiz_score: quizScore,
            chat_history: finalMessages,
            performance_report: result.performanceReport || "No report generated."
          });
          toast({ title: "Practice Session Saved!", description: "You can review this session later." });
        }
      } else {
        throw new Error("AI did not return a valid response.");
      }

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(error) });
      setMessages(messages); // Revert messages on error
    } finally {
      setIsResponding(false);
    }
  };
  
  if (corrections.length === 0) {
      return (
        <Alert>
            <AlertTitle>No Mistakes Found!</AlertTitle>
            <AlertDescription>Great job! The AI didn't find any specific mistakes to practice in this entry.</AlertDescription>
        </Alert>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Practice Session</CardTitle>
        <CardDescription>
          {isSessionOver ? "Session complete. Review your performance report below." : "The AI will guide you through a conversation to practice your corrections."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
        <ScrollArea className="flex-grow p-4 border rounded-md mb-4 bg-background/50" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><User size={18} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isResponding && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <p className="text-sm italic animate-pulse">thinking...</p>
                </div>
              </div>
            )}
            {performanceReport && (
                <Card className="mt-4 bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Performance Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={cn('prose dark:prose-invert max-w-none journal-theme-default')}
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(tiptapJsonToHtml(markdownToTiptapJson(performanceReport))) }}
                        />
                    </CardContent>
                </Card>
            )}
          </div>
        </ScrollArea>
        {!isSessionOver && (
            <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your response..."
                disabled={isResponding}
            />
            <Button type="submit" size="icon" disabled={isResponding || !inputValue.trim()}>
                <Send className="h-4 w-4" />
            </Button>
            </form>
        )}
      </CardContent>
    </Card>
  );
}
