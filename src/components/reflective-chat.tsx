
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, User, Bot, Loader2, Sparkles, CheckCircle2, Palette, FileText, Plus, Check, BrainCircuit } from 'lucide-react';
import type { Profile, JournalEntryForCreate, Theme, PageStyle } from '@/lib/types';
import { THEMES, PAGE_STYLES, ALL_THEMES } from '@/lib/types';
import { generateChatResponseAction, generateJournalFromChatAction } from '@/app/journal/actions';
import { getAIErrorMessage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ReflectiveChatProps = {
  profile: Profile;
  onEntryCreated: (entry: JournalEntryForCreate) => Promise<void>;
};

export function ReflectiveChat({ profile, onEntryCreated }: ReflectiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  // Settings state
  const [theme, setTheme] = useState<Theme>(profile.theme_preference || 'default');
  const [pageStyle, setPageStyle] = useState<PageStyle>('default');
  const [writingMode, setWritingMode] = useState<'manual' | 'ai-assisted'>('ai-assisted');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const hasInitiated = useRef(false);

  useEffect(() => {
    if (!hasInitiated.current) {
      hasInitiated.current = true;
      initiateChat();
    }
  }, []);

  const initiateChat = async () => {
    setIsResponding(true);
    try {
      const result = await generateChatResponseAction({
        chatHistory: [],
        isDeveloper: false,
      });

      if ('error' in result) {
        toast({ variant: 'destructive', title: 'AI Error', description: result.error });
      } else {
        setMessages([{ role: 'assistant', content: result.assistantResponse }]);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(error) });
    } finally {
      setIsResponding(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent | null, overrideValue?: string) => {
    if (e) e.preventDefault();
    const content = overrideValue || inputValue;
    if (!content.trim() || isResponding) return;

    const newUserMessage: Message = { role: 'user', content };
    const updatedMessages = [...messages, newUserMessage];
    
    setMessages(updatedMessages);
    setInputValue('');
    
    setIsResponding(true);

    try {
      const result = await generateChatResponseAction({
        chatHistory: updatedMessages,
        isDeveloper: false,
      });

      if ('error' in result) {
        toast({ variant: 'destructive', title: 'AI Error', description: result.error });
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: result.assistantResponse }]);
        if (result.isConversationDone) {
            setIsDone(true);
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(error) });
    } finally {
      setIsResponding(false);
    }
  };

  const handleFinalize = async () => {
    setIsFinishing(true);
    try {
      const result = await generateJournalFromChatAction({
        chatHistory: messages,
        isDeveloper: false,
      });

      if ('error' in result) {
        toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
      } else {
        const entry: JournalEntryForCreate = {
            title: result.title,
            content: result.journalEntry, 
            is_project_log: false,
            theme: theme,
            page_style: pageStyle,
            conversation: messages,
        };
        await onEntryCreated(entry);
        toast({ title: "Entry Created!", description: "Your chat has been distilled into a journal entry." });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(error) });
    } finally {
      setIsFinishing(true);
    }
  };

  const starterPrompts = [
    { title: "Today's Smile", text: "What's one thing that made you smile today?", icon: Sparkles, color: "text-amber-500" },
    { title: "Overcoming", text: "Tell me about a challenge you overcame.", icon: BrainCircuit, color: "text-blue-500" },
    { title: "Looking Forward", text: "What are you looking forward to tomorrow?", icon: Send, color: "text-green-500" },
    { title: "Goal Progress", text: "Reflect on a goal you're working towards.", icon: CheckCircle2, color: "text-purple-500" },
  ];

  return (
    <div className="flex flex-col h-[700px] bg-background/30 backdrop-blur-md rounded-3xl border border-primary/10 overflow-hidden shadow-2xl">
      {/* Settings Toolbar */}
      <div className="px-4 py-3 border-b border-primary/10 bg-muted/20 flex flex-wrap items-center gap-4 z-20">
        <div 
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer group",
                writingMode === 'ai-assisted' 
                    ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(var(--primary),0.05)]" 
                    : "bg-muted/30 border-transparent text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted/40"
            )}
            onClick={() => setWritingMode(writingMode === 'ai-assisted' ? 'manual' : 'ai-assisted')}
        >
            <Sparkles className={cn("h-3.5 w-3.5", writingMode === 'ai-assisted' && "text-amber-500 animate-pulse")} />
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {writingMode === 'ai-assisted' ? 'AI Assistance On' : 'AI Assistance Off'}
            </span>
        </div>

        <div className="flex-grow" />

        <div className="flex items-center gap-2 bg-background/40 px-3 py-1 rounded-2xl border border-primary/5">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={theme} onValueChange={(v: Theme) => setTheme(v)}>
                <SelectTrigger className="h-6 border-none bg-transparent text-[10px] font-bold uppercase tracking-wider w-[80px] focus:ring-0">
                    <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                    {ALL_THEMES.map(t => (
                        <SelectItem key={t} value={t} className="text-[10px] uppercase font-bold tracking-wider">
                            {THEMES[t].name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="flex items-center gap-2 bg-background/40 px-3 py-1 rounded-2xl border border-primary/5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={pageStyle} onValueChange={(v: PageStyle) => setPageStyle(v)}>
                <SelectTrigger className="h-6 border-none bg-transparent text-[10px] font-bold uppercase tracking-wider w-[100px] focus:ring-0">
                    <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(PAGE_STYLES).map(([id, s]) => (
                        <SelectItem key={id} value={id as PageStyle} className="text-[10px] uppercase font-bold tracking-wider">
                            {s.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="p-4 border-b border-primary/10 bg-primary/5 flex items-center justify-between z-10">
        <div>
            <h3 className="font-headline text-lg flex items-center gap-2 font-bold">
                <Bot className="h-5 w-5 text-primary" /> Reflective Chat
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Conversational Journaling</p>
        </div>
        <div className="flex items-center gap-2">
            {!isDone && messages.some(m => m.role === 'user') && (
                <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleFinalize} 
                    disabled={isFinishing || isResponding}
                    className="h-8 rounded-full border-green-600/30 text-green-600 hover:bg-green-50/50 hover:border-green-600/50 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm"
                >
                    {isFinishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Finish & Save
                </Button>
            )}
            {isDone && (
                <Button size="sm" onClick={handleFinalize} disabled={isFinishing} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 active:scale-95 transition-all text-[10px] uppercase font-bold tracking-wider">
                    {isFinishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Save Entry
                </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="h-8 rounded-full text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4 mr-1" /> New Chat
            </Button>
        </div>
      </div>

      <ScrollArea className="flex-grow p-4 bg-muted/5" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
          {messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                    <Bot className="h-16 w-16 text-primary relative z-10 opacity-80" />
                </div>
                <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold tracking-tight">How's your day going?</h4>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Click a starter below or start typing to begin your reflection.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    {starterPrompts.map((starter, i) => (
                        <button
                            key={i}
                            onClick={() => handleSendMessage(null, starter.text)}
                            className="group p-4 rounded-2xl border border-primary/5 bg-background/50 hover:bg-primary/5 hover:border-primary/20 transition-all text-left flex flex-col gap-2 relative overflow-hidden active:scale-95"
                        >
                            <starter.icon className={cn("h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity", starter.color)} />
                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{starter.title}</h5>
                            <p className="text-sm leading-snug text-muted-foreground/80 group-hover:text-foreground/90 transition-colors">{starter.text}</p>
                        </button>
                    ))}
                </div>
             </div>
          ) : messages.map((message, index) => (
            <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'flex-row-reverse' : '')}>
              <Avatar className={cn("w-8 h-8 border", message.role === 'user' ? 'border-primary/20' : 'border-primary/40 shadow-sm')}>
                <AvatarFallback className={message.role === 'user' ? 'bg-primary/10' : 'bg-primary/20 font-bold'}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-sm transition-all hover:shadow-md",
                message.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-background/80 backdrop-blur-sm border border-primary/5 rounded-tl-none text-foreground leading-relaxed'
              )}>
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isResponding && (
            <div className="flex items-start gap-3">
               <Avatar className="w-8 h-8 border border-primary/40 animate-pulse">
                <AvatarFallback className="bg-primary/20"><Bot className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-4 py-3 bg-muted/30 border border-primary/5 rounded-tl-none">
                <div className="flex gap-1.5 p-1">
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background/40 backdrop-blur-md border-t border-primary/10">
        <form onSubmit={(e) => handleSendMessage(e)} className="relative max-w-2xl mx-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isDone ? "Conversation complete. Click 'Save Entry' above!" : "Tell me about your day..."}
            disabled={isResponding || isFinishing || isDone}
            className="pr-12 h-14 rounded-2xl border-primary/20 focus-visible:ring-primary/30 text-base shadow-inner bg-background/50"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isResponding || isFinishing || isDone || !inputValue.trim()}
            className="absolute right-2 top-2 h-10 w-10 rounded-xl transition-all shadow-lg active:scale-95"
          >
            <Send className="h-4 w-4" />
          </Button>

          {/* New Finish Button Shortcut */}
          {!isDone && messages.some(m => m.role === 'user') && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleFinalize}
                disabled={isFinishing || isResponding}
                className="absolute right-14 top-2 h-10 w-10 rounded-xl text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-all"
              >
                <CheckCircle2 className="h-5 w-5" />
              </Button>
          )}
        </form>
        <div className="mt-3 flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Your companion is listening to distill your thoughts.</p>
        </div>
      </div>
    </div>
  );
}
