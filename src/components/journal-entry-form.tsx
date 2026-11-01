
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateJournalEntryAction } from '@/app/journal/actions';
import { Sparkles, Palette, FileText, Wand2, Loader2, Pencil } from 'lucide-react';
import { THEMES, PAGE_STYLES, ALL_THEMES } from '@/lib/types';
import type { Theme, PageStyle, JournalEntryForCreate, Profile } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAIErrorMessage, getPlainTextFromTiptapJson, markdownToTiptapJson, cn } from '@/lib/utils';
import { TiptapEditor } from './rich-text-editor';

const formSchema = z.object({
  writingMode: z.enum(['ai', 'manual']).default('ai'),
  title: z.string().optional(),
  userInput: z.any(), // Tiptap content is a JSON object
}).refine((data) => {
  if (data.writingMode === 'manual' && !isIterationMode && (!data.title || data.title.trim().length < 3)) {
    return false;
  }
  return true;
}, {
  message: "Title must be at least 3 characters for manual entries.",
  path: ["title"],
}).refine((data) => {
    if (!data.userInput || getPlainTextFromTiptapJson(data.userInput).trim().length === 0) {
        return false;
    }
    return true;
}, {
    message: 'Please provide some content for your entry.',
    path: ['userInput']
});

// A global variable to track context for the form schema
let isIterationMode = false;


type JournalEntryFormProps = {
  onEntryGenerated: (entry: JournalEntryForCreate) => Promise<void>;
  profile: Profile;
  isIterationMode?: boolean;
  initialContent?: any;
  isEditing?: boolean;
  onEntryUpdated?: (entry: JournalEntryForCreate) => Promise<void>;
};

export function JournalEntryForm({ 
  onEntryGenerated, 
  profile, 
  isIterationMode: isIterationProp = false, 
  initialContent = '',
  isEditing = false,
  onEntryUpdated,
}: JournalEntryFormProps) {
  isIterationMode = isIterationProp;
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Settings state
  const [theme, setTheme] = useState<Theme>(profile.theme_preference || 'default');
  const [pageStyle, setPageStyle] = useState<PageStyle>('default');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      writingMode: 'ai',
      title: '',
      userInput: initialContent,
    },
  });

  useEffect(() => {
    form.reset({ ...form.getValues(), userInput: initialContent });
  }, [initialContent, form]);
  
  const isAiWritingEnabled = profile.ai_improvement_enabled !== false;

  // Effect to switch to manual mode if AI writing is disabled
  useEffect(() => {
    if (!isAiWritingEnabled) {
      form.setValue('writingMode', 'manual');
    }
  }, [isAiWritingEnabled, form]);


  const { toast } = useToast();

  const writingMode = form.watch('writingMode');
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    
    let entryToSave: JournalEntryForCreate;

    // This is the key logic change:
    // We determine what to save first, and then call the save function once at the end.
    if (values.writingMode === 'ai' && !isIterationMode && !isEditing) {
        try {
            const plainTextInput = getPlainTextFromTiptapJson(values.userInput);
            const aiResult = await generateJournalEntryAction({
                userInput: plainTextInput,
                isDeveloper: false,
            });
            
            if ('error' in aiResult) {
                throw new Error(aiResult.error);
            }
            entryToSave = {
                title: aiResult.title,
                content: markdownToTiptapJson(aiResult.journalEntry),
                is_project_log: false,
                theme: theme,
                page_style: pageStyle,
            };
        } catch (aiError) {
            // GRACEFUL FALLBACK: If AI fails, save the raw notes.
            console.error("AI Generation failed, saving manually as a fallback:", aiError);
            toast({
                title: "AI is unavailable",
                description: "Saving your raw notes as a manual entry instead.",
            });
            entryToSave = {
                title: 'Manual Fallback Entry',
                content: values.userInput,
                is_project_log: false,
                theme: theme,
                page_style: pageStyle,
            };
        }
    } else {
        // This path is for 'manual' mode, iterations, or edits. It doesn't use AI.
        entryToSave = {
            title: values.title || (isIterationMode ? 'Log Update' : 'Manual Entry'),
            content: values.userInput,
            is_project_log: isIterationMode,
            theme: theme,
            page_style: pageStyle,
        };
    }

    try {
        // This single save action runs for both the AI success case and the fallback case.
        if (isEditing && onEntryUpdated) {
            await onEntryUpdated(entryToSave);
        } else {
            await onEntryGenerated(entryToSave);
        }
    } catch (finalSaveError) {
        console.error("Final save action failed:", finalSaveError);
        toast({
            variant: 'destructive',
            title: 'Error Saving Entry',
            description: getAIErrorMessage(finalSaveError),
        });
    } finally {
        setIsGenerating(false);
    }
  }
  
  const placeholderText = writingMode === 'ai'
    ? "Write your raw thoughts here and let the AI craft a polished entry for you..."
    : "Write your entry here...";

  const Wrapper = isIterationMode ? 'div' : CardContent;
  const wrapperProps = isIterationMode ? {className: 'p-0'} : {className: "pt-6"};

  return (
    <Wrapper {...wrapperProps}>
       {!isIterationMode && (
         <div className="mb-6 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div 
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer group",
                writingMode === 'ai' 
                    ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(var(--primary),0.05)]" 
                    : "bg-muted/30 border-transparent text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted/40"
            )}
            onClick={() => form.setValue('writingMode', writingMode === 'ai' ? 'manual' : 'ai')}
        >
            <Sparkles className={cn("h-3.5 w-3.5", writingMode === 'ai' && "text-amber-500 animate-pulse")} />
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {writingMode === 'ai' ? 'AI Enhancement On' : 'AI Enhancement Off'}
            </span>
        </div>

        <div className="flex-grow" />

            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-2xl border border-primary/5">
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

            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-2xl border border-primary/5">
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
       )}
       <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            
            <div className="flex flex-col space-y-4">
                {(writingMode === 'manual' || isIterationMode) && !isEditing && (
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                           <Input placeholder={isIterationMode ? 'Update Title (e.g. Bug Fix)' : 'My great day'} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="userInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isIterationMode ? 'Update Details' : (writingMode === 'ai' ? 'Your Raw Notes' : 'Content')}</FormLabel>
                       <FormControl>
                          <TiptapEditor 
                            content={field.value}
                            onChange={field.onChange}
                            isEditable={true}
                            placeholder={placeholderText}
                          />
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {writingMode === 'ai' ? 'Generating...' : 'Saving...'}
                </>
              ) : (
                <>
                  {writingMode === 'ai' && !isIterationMode ? <Wand2 className="mr-2 h-5 w-5 opacity-80"/> : <Pencil className="mr-2 h-5 w-5 opacity-80"/>}
                  {isEditing ? 'Save Changes' : (isIterationMode ? 'Add Update' : (writingMode === 'ai' ? 'Generate & Save' : 'Save Entry'))}
                </>
              )}
            </Button>
          </form>
      </Form>
    </Wrapper>
  );
}
