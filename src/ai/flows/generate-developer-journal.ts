'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating a structured developer journal entry.
 *
 * - generateDeveloperJournal - A function that takes a developer's input and creates a structured log.
 * - GenerateDeveloperJournalInput - The input type for the generateDeveloperJournal function.
 * - GenerateDeveloperJournalOutput - The return type for the generateDeveloperJournal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDeveloperJournalInputSchema = z.object({
  userInput: z.string().describe('The developer\'s description of their code, feature, or bug fix.'),
});
export type GenerateDeveloperJournalInput = z.infer<typeof GenerateDeveloperJournalInputSchema>;

const GenerateDeveloperJournalOutputSchema = z.object({
  title: z.string().describe('A suitable title for the developer journal entry.'),
  journalEntry: z.string().describe('The generated, well-structured developer journal entry in Markdown format.'),
});
export type GenerateDeveloperJournalOutput = z.infer<typeof GenerateDeveloperJournalOutputSchema>;

export async function generateDeveloperJournal(input: GenerateDeveloperJournalInput): Promise<GenerateDeveloperJournalOutput> {
  return generateDeveloperJournalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeveloperJournalPrompt',
  input: {schema: GenerateDeveloperJournalInputSchema},
  output: {schema: GenerateDeveloperJournalOutputSchema},
  prompt: `You are an expert software engineer and technical writer. Your task is to transform a developer's raw description of their code or feature into a well-structured, professional journal entry or documentation snippet.

The output should be clear, concise, and formatted using Markdown.

- **Create a Title:** Generate a fitting title for the journal entry.
- **Summary:** Start with a brief summary of the feature or code.
- **Function Breakdown:** If functions are mentioned, list them out with a short description of what each one does. Use bullet points.
- **Code Blocks:** If code snippets are provided or can be inferred, format them correctly within Markdown code blocks.
- **Logic/Flow:** Explain the overall logic or data flow of the program.
- **Future Improvements:** If applicable, add a section for potential next steps or improvements.

Developer's description:
---
{{{userInput}}}
---

Now, generate the title and the structured journal entry.`,
});

const generateDeveloperJournalFlow = ai.defineFlow(
  {
    name: 'generateDeveloperJournalFlow',
    inputSchema: GenerateDeveloperJournalInputSchema,
    outputSchema: GenerateDeveloperJournalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
