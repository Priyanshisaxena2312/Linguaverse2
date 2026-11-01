
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, User, Wand2, Loader2 } from 'lucide-react';
import { askJournalQuestion } from '@/app/journal/[id]/actions';
import type { JournalEntry, Profile } from '@/lib/types';
import { getAIErrorMessage } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type JournalChatProps = {
  entry: JournalEntry;
  profile: Profile;
};

export function JournalChat({ entry, profile }: JournalChatProps) {
  const [messages, setMessages] = useState<Message[]>(entry.conversation || []);
  const [inputValue, setInputValue] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Ref to prevent the initial AI greeting from firing more than once.
  const hasInitiatedConversation = useRef(false);

  const canAskQuestion = true; // All users can now ask questions

  useEffect(() => {
    // This effect runs once to check if the AI should initiate the conversation.
    async function initiateConversation() {
        if (!hasInitiatedConversation.current && (!entry.conversation || entry.conversation.length === 0)) {
            hasInitiatedConversation.current = true; // Mark as initiated
            setIsResponding(true);
            try {
                 // Call the action with an empty message array to get the initial greeting
                const result = await askJournalQuestion(entry.id, []);
                if (result.error) {
                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                } else if (result.newConversation) {
                    setMessages(result.newConversation);
                }
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(error) });
            } finally {
                setIsResponding(false);
            }
        }
    }
    initiateConversation();
    // This effect should only run once when the component mounts.
    // The dependency array is intentionally empty.
  }, []);


  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isResponding]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isResponding) return;

    const newUserMessage: Message = { role: 'user', content: inputValue };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsResponding(true);

    try {
      const result = await askJournalQuestion(entry.id, newMessages);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setMessages(messages); // Revert messages on error
      } else if (result.newConversation) {
        setMessages(result.newConversation);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(error) });
      setMessages(messages); // Revert messages on error
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Converse with this Entry</CardTitle>
        <CardDescription>
          Ask questions to explore the thoughts and feelings in this journal entry.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
        <ScrollArea className="flex-grow p-4 border rounded-md mb-4 bg-background/50" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && isResponding && (
               <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <p className="text-sm italic animate-pulse">Your diary is thinking...</p>
                </div>
              </div>
            )}
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
            {isResponding && messages.length > 0 && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <p className="text-sm italic animate-pulse">thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            disabled={isResponding || !canAskQuestion}
          />
          <Button type="submit" size="icon" disabled={isResponding || !canAskQuestion || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
