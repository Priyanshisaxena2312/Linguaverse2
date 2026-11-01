

'use server';

import { createActionClient } from '@/lib/supabase/actions';
import type { TodoTask, TodoList, JournalEntry, HardWord, ComparedWord, ComparedSentence } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/encryption';
import { z } from 'zod';
import { generateTasks } from '@/ai/flows/generate-tasks';
import { getAIErrorMessage } from '@/lib/utils';
import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import type { CompareWordsOutput, CompareWordsInput } from '@/ai/flows/compare-words';
import { DEMO_USER_ID, DEMO_TODO_LISTS, DEMO_TODO_TASKS, DEMO_HARD_WORDS } from '@/lib/demo-mode';

export async function getTodoLists(): Promise<TodoList[] | { error: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }

  const { data: lists, error } = await supabase
    .from('todo_lists')
    .select('*, tasks:todo_tasks(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !lists || lists.length === 0) {
    if (user.id === DEMO_USER_ID) return DEMO_TODO_LISTS;
    if (error) console.error("Error fetching lists:", error);
    return { error: 'Failed to fetch to-do lists.' };
  }
  
  return lists.map(list => ({
    ...list,
    tasks: list.tasks.map((task: any) => ({...task, content: decrypt(task.content)}))
  }));
}

export async function getTodoListById(listId: string): Promise<TodoList | { error: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data, error } = await supabase
    .from('todo_lists')
    .select('*, tasks:todo_tasks(*)')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single();

  if (error) return { error: 'Failed to find to-do list.' };

  return {
    ...data,
    tasks: data.tasks.map((task: any) => ({...task, content: decrypt(task.content)}))
  };
}

export async function getIncompleteTasks(): Promise<TodoTask[] | { error: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data, error } = await supabase
    .from('todo_tasks')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'done')
    .order('created_at');
  
  if (error || !data || data.length === 0) {
    if (user.id === DEMO_USER_ID) return DEMO_TODO_TASKS;
    return { error: 'Failed to fetch incomplete tasks.' };
  }
  
  return data.map(task => ({...task, content: decrypt(task.content)}));
}

const AddListFromAiInputSchema = z.object({
    userInput: z.string(),
    listName: z.string(),
    goal: z.string().optional(),
});

export async function addTodoListFromAI(input: z.infer<typeof AddListFromAiInputSchema>): Promise<TodoList | { error: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };

    try {
        const aiResult = await generateTasks({ userInput: input.userInput, goal: input.goal });
        if (!aiResult.tasks || aiResult.tasks.length === 0) {
            return { error: 'The AI could not identify any tasks. Please try a different input.' };
        }

        const { data: newList, error: listError } = await supabase
            .from('todo_lists')
            .insert({ user_id: user.id, name: input.listName })
            .select()
            .single();
        
        if (listError) throw listError;

        const tasksToInsert = aiResult.tasks.map(task => ({
            list_id: newList.id,
            user_id: user.id,
            content: encrypt(task.content),
            priority: task.priority,
            status: 'todo' as const,
        }));

        const { data: newTasks, error: taskError } = await supabase
            .from('todo_tasks')
            .insert(tasksToInsert)
            .select();
        
        if (taskError) throw taskError;

        revalidatePath('/dashboard');
        revalidatePath('/journal');

        return {
            ...newList,
            tasks: newTasks.map(t => ({...t, content: decrypt(t.content)}))
        };
    } catch (e) {
        return { error: getAIErrorMessage(e) };
    }
}


export async function updateTaskStatus(taskId: string, newStatus: TodoTask['status']): Promise<TodoTask | { error: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }
  
  const { data, error } = await supabase
    .from('todo_tasks')
    .update({ status: newStatus })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { error: 'Failed to update task.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/journal');

  return { ...data, content: decrypt(data.content) };
}

export async function addTask(listId: string, content: string, priority: TodoTask['priority']): Promise<TodoTask | { error: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };

    const { data, error } = await supabase
        .from('todo_tasks')
        .insert({
            list_id: listId,
            user_id: user.id,
            content: encrypt(content),
            priority,
            status: 'todo'
        })
        .select()
        .single();
    
    if (error) {
        return { error: 'Failed to add task.' };
    }

    revalidatePath(`/journal/todos/${listId}`);
    revalidatePath('/dashboard');
    return { ...data, content: decrypt(data.content) };
}

export async function deleteTask(taskId: string): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };
    
    const { error } = await supabase
        .from('todo_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        return { error: 'Failed to delete task.' };
    }
    revalidatePath('/journal');
    return {};
}

export async function updateTask(taskId: string, content: string, priority: TodoTask['priority']): Promise<TodoTask | { error: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data, error } = await supabase
    .from('todo_tasks')
    .update({ content: encrypt(content), priority })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { error: 'Failed to update task.' };
  }

  revalidatePath('/journal');
  return { ...data, content: decrypt(data.content) };
}

export async function getEntriesWithCorrections(): Promise<JournalEntry[]> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Since this can be called from server components that might be rendered
        // during a static build, we should not redirect, but return empty.
        return [];
    }

    const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .not('language_analysis', 'is', null) // Only fetch entries that have language analysis
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Failed to fetch entries with corrections:", error);
        return [];
    }
    
    return entries;
}

export async function addHardWord(wordData: Omit<HardWord, 'id' | 'created_at' | 'user_id'>): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };

    const { error } = await supabase
        .from('hard_words')
        .insert({
            user_id: user.id,
            word: encrypt(wordData.word),
            meaning: encrypt(wordData.meaning),
            explanation: encrypt(wordData.explanation),
            use_case: encrypt(wordData.use_case),
        });

    if (error) {
        console.error('Error saving hard word:', error);
        return { error: 'Failed to save word to your dictionary.' };
    }

    revalidatePath('/journal?tab=dictionary&subTab=hard-words');
    return {};
}

export async function addComparedWords(input: CompareWordsInput, comparisonData: CompareWordsOutput): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };
    
    const { error } = await supabase.from('compared_words').insert({
        user_id: user.id,
        word1: encrypt(input.word1),
        word2: encrypt(input.word2),
        comparison_details: encrypt(JSON.stringify(comparisonData)),
    });

    if (error) {
        console.error('Error saving compared words:', error);
        return { error: 'Failed to save word comparison to your dictionary.' };
    }
    revalidatePath('/journal?tab=dictionary&subTab=compared-words');
    return {};
}

export async function getHardWords(): Promise<HardWord[]> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('hard_words')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
    if (error || !data || data.length === 0) {
        if (user.id === DEMO_USER_ID) return DEMO_HARD_WORDS;
        return [];
    }
    
    return data.map(w => ({
        ...w,
        word: decrypt(w.word),
        meaning: decrypt(w.meaning),
        explanation: decrypt(w.explanation),
        use_case: decrypt(w.use_case),
    }));
}

export async function getComparedWords(): Promise<ComparedWord[]> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('compared_words')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
    if (error) return [];

    return data.map(c => ({
        ...c,
        word1: decrypt(c.word1),
        word2: decrypt(c.word2),
        comparison_details: decrypt(c.comparison_details),
    }));
}

export async function addComparedSentences(s1: string, s2: string, analysis: any): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };

    const { error } = await supabase.from('compared_sentences').insert({
        user_id: user.id,
        sentence_1: encrypt(s1),
        sentence_2: encrypt(s2),
        context_class: encrypt(analysis.contextClass),
        use_case: encrypt(analysis.useCase),
        subtle_differences: encrypt(analysis.subtleDifferences),
    });

    if (error) {
        console.error('Error saving compared sentences:', error);
        return { error: 'Failed to save context analysis to your dictionary.' };
    }
    revalidatePath('/journal?tab=dictionary&subTab=context-dictionary');
    return {};
}

export async function getComparedSentences(): Promise<ComparedSentence[]> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('compared_sentences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
    if (error) return [];

    return data.map(s => ({
        ...s,
        sentence_1: decrypt(s.sentence_1),
        sentence_2: decrypt(s.sentence_2),
        context_class: decrypt(s.context_class),
        use_case: decrypt(s.use_case),
        subtle_differences: decrypt(s.subtle_differences),
    }));
}
