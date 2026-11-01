
'use server';

/**
 * @fileOverview A Genkit flow to generate a structured to-do list from unstructured user input.
 */
import { conversationalAi } from '@/ai/genkit';
import { z } from 'zod';

const TaskSchema = z.object({
    content: z.string().describe("The specific, actionable content of the task."),
    priority: z.enum(['high', 'medium', 'low']).describe("The priority of the task. Use 'high' for urgent or critical items, 'medium' for standard tasks, and 'low' for things that can be done later."),
});

const GenerateTasksInputSchema = z.object({
  userInput: z.string().describe('The user\'s unstructured text or transcribed audio describing what they need to do.'),
  goal: z.string().optional().describe('An optional overarching goal for today. Use this to help determine task priorities.'),
});

const GenerateTasksOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe('An array of structured task objects derived from the user input.'),
});

export type GenerateTasksInput = z.infer<typeof GenerateTasksInputSchema>;
export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;

export async function generateTasks(input: GenerateTasksInput): Promise<GenerateTasksOutput> {
  return generateTasksFlow(input);
}

const prompt = conversationalAi.definePrompt({
  name: 'generateTasksPrompt',
  input: { schema: GenerateTasksInputSchema },
  output: { schema: GenerateTasksOutputSchema },
  prompt: `You are an expert at parsing unstructured text and turning it into a structured to-do list. Your task is to identify individual, actionable tasks from the user's input and assign a priority to each.

**Priority Guidelines:**
- **High:** Tasks that are urgent, critical, or foundational for other tasks. Look for keywords like "asap", "immediately", "must do", "critical", "bug fix".
- **Medium:** Standard tasks that form the bulk of the work. This is the default if no other priority is obvious.
- **Low:** Tasks that are non-urgent, nice-to-haves, or can be postponed. Look for keywords like "later", "eventually", "if there's time", "clean up".

{{#if goal}}
**The user's main goal for today is: "{{goal}}".** Use this goal as the primary context for determining task priority. Tasks directly related to achieving this goal should be prioritized higher.
{{/if}}

**User Input:**
---
{{{userInput}}}
---

Now, analyze the input and generate the list of tasks in the required JSON format.
`,
});

const generateTasksFlow = conversationalAi.defineFlow(
  {
    name: 'generateTasksFlow',
    inputSchema: GenerateTasksInputSchema,
    outputSchema: GenerateTasksOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
