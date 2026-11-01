'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating a journal entry from user input.
 *
 * - generateJournalEntry - A function that takes user input and generates a journal entry.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';

const GenerateJournalEntryInputSchema = z.object({
  userInput: z.string().describe("The user's raw, unformatted input about their day or topic."),
  tone: z.string().optional().describe('The desired emotional tone for a personal entry (e.g., reflective, grateful).'),
  isDeveloper: z.boolean().optional().describe('If true, generate a structured, professional log instead of a personal journal entry.'),
});
export type GenerateJournalEntryInput = z.infer<typeof GenerateJournalEntryInputSchema>;

const GenerateJournalEntryOutputSchema = z.object({
  title: z.string().describe('A concise and fitting title for the journal entry.'),
  journalEntry: z.string().describe('The fully generated journal entry. For developers, this is in Markdown format. For personal entries, this is in first-person prose. This must end with hashtags.'),
  clarificationQuestion: z.string().nullable().describe("If the user's input is too vague, this field should contain a question to ask for more detail. Otherwise, it should be null."),
});
export type GenerateJournalEntryOutput = z.infer<typeof GenerateJournalEntryOutputSchema>;


export async function generateJournalEntry(input: GenerateJournalEntryInput): Promise<GenerateJournalEntryOutput> {
  return generateJournalEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJournalEntryPrompt',
  input: {schema: GenerateJournalEntryInputSchema},
  output: {schema: GenerateJournalEntryOutputSchema},
  prompt: `
You are an intelligent journaling assistant. Your task is to process a user's raw input and transform it into a structured entry. A critical part of your job is to assess if the input is detailed enough to create a high-quality entry.

**Handling Vague Input:**
If the user's input is too short, generic, or vague (e.g., "had a good day," "coded a lot," "felt tired"), you MUST ask for more information.
- In this case, create a simple, preliminary journal entry and title based on the vague input.
- Then, formulate a clear, open-ended question in the 'clarificationQuestion' field to encourage the user to provide more detail.
- Example Question: "That sounds interesting! To make this entry more memorable, could you tell me a bit more about one specific thing you coded today?"

**Handling Detailed Input:**
If the user's input is sufficiently detailed, proceed with generating a high-quality entry and set the 'clarificationQuestion' field to null.

{{#if isDeveloper}}
Your persona is an expert at creating clear, structured, and professional logs for any technical or scientific field.
- For detailed input, format the log using Markdown with appropriate headers (e.g., "Objective", "Process", "Results").
- **Crucially, you must only use information explicitly provided by the user. Do not invent details.**
- **MANDATORY:** At the very end of the entry, you MUST generate a new line and then 3-5 relevant hashtags (e.g., #ProjectPhoenix #BugFix #React).
{{else}}
Your persona is a warm, empathetic, and insightful journaling companion.
- For detailed input, transform the user's thoughts into a beautifully written, personal entry from a first-person perspective.
- **Focus on the feelings and events the user described.**
- **MANDATORY Auto-Tagging**: At the very end of the entry, you MUST generate a new line and then 3-5 relevant hashtags based on the content (e.g., #Family #Work #Gratitude). This is a required part of the output.
{{#if tone}}
- The user has requested a '{{{tone}}}' tone. Weave this feeling throughout the text.
{{/if}}
{{/if}}

User's Input:
---
{{{userInput}}}
---

Now, generate the title and the journal entry. The journal entry MUST end with hashtags.`,
  // Disable safety filters to allow for authentic, unfiltered user expression.
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateJournalEntryFlow = ai.defineFlow(
  {
    name: 'generateJournalEntryFlow',
    inputSchema: GenerateJournalEntryInputSchema,
    outputSchema: GenerateJournalEntryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
