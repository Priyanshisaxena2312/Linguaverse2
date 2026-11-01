'use server';

/**
 * @fileOverview A Genkit flow to refine a journal entry based on a clarifying question and answer.
 *
 * - refineJournalEntry - A function that handles the journal refinement process.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';

const RefineJournalEntryInputSchema = z.object({
  originalTitle: z.string().describe('The title of the initial, vague journal entry.'),
  originalContent: z.string().describe("The content of the initial, vague journal entry."),
  question: z.string().describe('The clarification question that was asked to the user.'),
  answer: z.string().describe("The user's answer to the clarification question."),
  tone: z.string().optional().describe('The desired emotional tone for a personal entry (e.g., reflective, grateful).'),
  outputLanguage: z.string().describe('The desired output language for the final entry (e.g., "English", "Spanish").'),
  isDeveloper: z.boolean().optional().describe('If true, generate a structured, professional log instead of a personal journal entry.'),
});
export type RefineJournalEntryInput = z.infer<typeof RefineJournalEntryInputSchema>;

const RefineJournalEntryOutputSchema = z.object({
  title: z.string().describe('The new, refined title for the journal entry.'),
  journalEntry: z.string().describe('The new, complete journal entry that integrates the user\'s answer. This must end with hashtags.'),
});
export type RefineJournalEntryOutput = z.infer<typeof RefineJournalEntryOutputSchema>;


export async function refineJournalEntry(input: RefineJournalEntryInput): Promise<RefineJournalEntryOutput> {
  return refineJournalEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineJournalEntryPrompt',
  input: {schema: RefineJournalEntryInputSchema},
  output: {schema: RefineJournalEntryOutputSchema},
  prompt: `You previously created a draft journal entry but needed more information. The user has now provided an answer to your question.

Your task is to thoughtfully integrate the user's new information into the original entry to create a more complete and accurate reflection.

{{#if isDeveloper}}
Your persona is an expert in creating professional logs for any technical or scientific field. The final entry should be a well-structured professional document in Markdown, using appropriate headers based on the combined information. **Do not invent any information not present in the original draft or the user's new answer.**
- **MANDATORY:** At the very end of the entry, you MUST generate a new line and then 3-5 relevant hashtags (e.g., #ProjectPhoenix #BugFix #React).
{{else}}
Your persona is a warm, empathetic journaling companion. The final entry must maintain a personal, human tone, written from a first-person perspective. It should feel seamless, not like a patched-together document.
- **MANDATORY Auto-Tagging**: At the very end of the entry, you MUST generate a new line and then 3-5 relevant hashtags based on the content (e.g., #Family #Work #Gratitude). This is a required part of the output.
{{#if tone}}
The user has requested a '{{{tone}}}' tone. Please ensure the final, refined entry reflects this.
{{/if}}
{{/if}}

---
Original Title: {{{originalTitle}}}
Original Draft:
{{{originalContent}}}
---
Your Question to the User: {{{question}}}
User's Answer: {{{answer}}}
---

The final output (title and entry) must be in {{{outputLanguage}}}.

Now, generate the new, refined title and the complete journal entry. The journal entry MUST end with hashtags.`,
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

const refineJournalEntryFlow = ai.defineFlow(
  {
    name: 'refineJournalEntryFlow',
    inputSchema: RefineJournalEntryInputSchema,
    outputSchema: RefineJournalEntryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
